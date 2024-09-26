async function handler(C) {
    // await new Promise(resolve => setTimeout(resolve, 1000)); 
    
    let actions = [];
    let mainProcedure = C.getValue("1918262-procedure");
    let mainProceduretObject = await C.api.getEntry({
        recordId: "1974197",
        responseType: "iov",
        id: mainProcedure[0],
    });

    let mainProcedureStock =
        mainProceduretObject["1918262-requires-stock-check"];
    let mainProcedureSterilisation =
        mainProceduretObject["1918262-requires-sterilisation"];

    console.log(mainProcedureStock);
    console.log(mainProcedureSterilisation);

    // let subsequentProcedure = C.getValue("1918262-subsequent-procedures");

    // let subsequentProcedureObject = await C.api.getEntry({
    //     recordId: "1974197",
    //     responseType: "iov",
    //     id: subsequentProcedure,
    // });

    // let subsequentProcedureStock =
    //     subsequentProcedureObject["1918262-requires-stock-check"];
    // let subsequentProcedureSterilisation =
    //     subsequentProcedureObject["1918262-requires-sterilisation"];

    // let requiresStockCheck = mainProcedureStock
    //     ? mainProcedureStock
    //     : subsequentProcedureStock;
    // let requiresSterilisation = mainProcedureSterilisation
    //     ? mainProcedureSterilisation
    //     : subsequentProcedureSterilisation;

    actions.push(
        C.setValue("1918262-requires-stock-check", mainProcedureStock)
    );
    actions.push(
        C.setValue("1918262-requires-sterilisation", mainProcedureSterilisation)
    );

    return C.mergeAll(actions);
}
