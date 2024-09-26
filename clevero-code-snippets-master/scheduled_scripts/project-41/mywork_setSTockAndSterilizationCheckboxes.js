async function handler(C) {
    let actions = [];
    
    let isMainStockCheckRequired = false;
    let isMainSterilizationRequired = false;
    
    let mainProcedure = C.getValue("1918262-procedure");
    if(mainProcedure && mainProcedure.length > 0) {
        let mainProceduretObject = await C.api.getEntry({
            recordId: "1974197",
            responseType: "iov",
            id: mainProcedure[0],
        });

        isMainStockCheckRequired =
            mainProceduretObject["1918262-requires-stock-check"] === "true";
        isMainSterilizationRequired =
            mainProceduretObject["1918262-requires-sterilisation"] === "true";
    }

    let subsequentProcedures = C.getValue("1918262-subsequent-procedures");
    if (subsequentProcedures && subsequentProcedures.length > 0) {
        const promiseArray = subsequentProcedures.map(async (procedure) => {
            const result = await C.api.getEntry({
                recordId: "1974197",
                responseType: "iov",
                id: procedure,
            });
            return {
                requiresStockCheck:
                    result["1918262-requires-stock-check"] === "true",
                requiresSterilization:
                    result["1918262-requires-sterilisation"] === "true",
            };
        });

        const resultActions = await Promise.all(promiseArray).then((data) => {
            const isSubStockCheckRequired = data.reduce(
                (accumulator, currentObject) => {
                    return accumulator || currentObject.requiresStockCheck;
                },
                false
            );
            const isSubSterilizationRequired = data.reduce(
                (accumulator, currentObject) => {
                    return accumulator || currentObject.requiresSterilization;
                },
                false
            );

            let isStockCheckRequired = isMainStockCheckRequired
                ? isMainStockCheckRequired
                : isSubStockCheckRequired;
            let isSterilizationRequired = isMainSterilizationRequired
                ? isMainSterilizationRequired
                : isSubSterilizationRequired;
            actions.push(
                C.setValue("1918262-requires-stock-check", isStockCheckRequired)
            );
            actions.push(
                C.setValue(
                    "1918262-requires-sterilisation",
                    isSterilizationRequired
                )
            );
            return actions;
        });

        actions = actions.concat(resultActions);
    } else {
        actions.push(
            C.setValue("1918262-requires-stock-check", isMainStockCheckRequired)
        );
        actions.push(
            C.setValue(
                "1918262-requires-sterilisation",
                isMainSterilizationRequired
            )
        );
    }
    
    return C.mergeAll(actions);
}