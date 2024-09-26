async function handler(C) {
    let actions = [];
    let mainProcedure = C.getValue("1918262-procedure");
    let startTime = C.getValue("1918262-start-time");
    let secondaryProcedures = [];
    if (C.getValue("1918262-subsequent-procedures").length > 0) {
        const subsequentValues = C.getValue("1918262-subsequent-procedures");
        secondaryProcedures.push(subsequentValues);
    }

    const clinician = C.getValue("1918262-clinician");

    if (C.getValue("1918262-subsequent-procedures").length > 0) {
        const guidelineEntries = await C.api.listEntries({
            internalId: "insight-mobile-veterinary-diagnostics-guidelines",
            filter: [
                [
                    {
                        requestType: "i",
                        subject: "1918262-procedure",
                        type: "array",
                        operator: "any_of",
                        value: mainProcedure,
                    },
                    "or",
                    {
                        requestType: "i",
                        subject: "1918262-procedure",
                        type: "array",
                        operator: "any_of",
                        value: secondaryProcedures[0],
                    },
                ],
                "and",
                {
                    requestType: "i",
                    subject: "1918262-clinician",
                    type: "array",
                    operator: "any_of",
                    value: clinician,
                },
                "and",
                {
                    requestType: "i",
                    subject: "1918262-guideline-type",
                    type: "array",
                    operator: "any_of",
                    value: [2157241],
                },
            ],
        });

        if (guidelineEntries.entries && guidelineEntries.entries.length > 0) {
            let duration = [];
            _.forEach(guidelineEntries.entries, function (o) {
                let fieldFound = o.hasOwnProperty("1918262-duration");
                let val = o["1918262-duration"] ? o["1918262-duration"] : 0;
                duration.push(+val);
            });
            let finalDurationValue = duration.reduce((acc, val) => acc + val);
            const result = C.moment(startTime).add(finalDurationValue, 'minutes').toISOString();
            actions.push(C.setValue("1918262-duration", +finalDurationValue));
            actions.push(C.setValue("1918262-end-time", result));
            return C.mergeAll(actions)
        }
    }
    else {

        const guidelineEntries = await C.api.listEntries({
            internalId: "insight-mobile-veterinary-diagnostics-guidelines",
            filter: [

                {
                    requestType: "i",
                    subject: "1918262-procedure",
                    type: "array",
                    operator: "any_of",
                    value: mainProcedure,
                },
                "and",
                {
                    requestType: "i",
                    subject: "1918262-clinician",
                    type: "array",
                    operator: "any_of",
                    value: clinician,
                },
                "and",
                {
                    requestType: "i",
                    subject: "1918262-guideline-type",
                    type: "array",
                    operator: "any_of",
                    value: [2157241],
                },
            ],
        });

        if (guidelineEntries.entries && guidelineEntries.entries.length > 0) {
            let duration = [];
            _.forEach(guidelineEntries.entries, function (o) {
                let fieldFound = o.hasOwnProperty("1918262-duration");
                let val = o["1918262-duration"] ? o["1918262-duration"] : 0;
                duration.push(+val);
            });
            let finalDurationValue = duration.reduce((acc, val) => acc + val);
            const result = C.moment(startTime).add(finalDurationValue, 'minutes').toISOString();
            actions.push(C.setValue("1918262-duration", +finalDurationValue));
            actions.push(C.setValue("1918262-end-time", result));
            return C.mergeAll(actions)
        }
    }

}
