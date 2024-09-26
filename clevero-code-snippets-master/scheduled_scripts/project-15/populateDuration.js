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

    let filterConfig = {
        internalId: "insight-mobile-veterinary-diagnostics-guidelines",
        filter: [
            [
                {
                    requestType: "i",
                    subject: "1918262-procedure",
                    type: "array",
                    operator: "any_of",
                    value: mainProcedure,
                }
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
            }
        ]
    };

    if (C.getValue("1918262-subsequent-procedures").length > 0) {
        filterConfig.filter[0].push("or");
        filterConfig.filter[0].push({
            requestType: "i",
            subject: "1918262-procedure",
            type: "array",
            operator: "any_of",
            value: secondaryProcedures[0],
        });
    }

    let startOfAppointment;
    let startOfDay;
    if (startTime) {
        startOfAppointment = C.moment.tz(startTime, "Australia/Sydney");
        startOfDay = C.moment(startOfAppointment).startOf("day");
    }

    const appointmentSearchConfig = {
        fromDateString: startOfDay,
        toDateString: startOfAppointment,
        clinicValueId: C.getValue("1918262-clinic"),
        machineValueId: C.getValue("1918262-machine-required"),
        clinician 
    };

    const guidelineEntries = await C.api.listEntries(filterConfig);
    const appointments = await getPrecedingAppointmentsWithinTheDay(C, appointmentSearchConfig);

    if (guidelineEntries.entries && guidelineEntries.entries.length > 0) {
        const guidelineDurationFieldToUse = appointments && appointments.entries.length > 0 
            ? "1918262-subsequent-duration"
            : "1918262-duration";

        let durations = [];
        _.forEach(guidelineEntries.entries, function (o) {
            let val = o[guidelineDurationFieldToUse] ? o[guidelineDurationFieldToUse] : 1;
            durations.push(+val);
        });
        let finalDurationValue = durations.reduce((acc, val) => acc + val);
        const result = C.moment(startTime).add(finalDurationValue, 'minutes').toISOString();

        actions.push(C.setValue("1918262-duration", +finalDurationValue));

        if(startTime)
            actions.push(C.setValue("1918262-end-time", result));
        else 
            actions.push(C.setValue("1918262-end-time", ""));
    } else actions.push(C.setValue("1918262-duration", ""));

    return C.mergeAll(actions);
}

async function getPrecedingAppointmentsWithinTheDay(C, config) {
    return await C.api.listEntries({
        internalId: "insight-mobile-veterinary-diagnostics-appointments",
        filter: [
            [
                {
                    requestType: "i",
                    "subject": "1918262-start-time",
                    "type": "datetime",
                    "operator": "within",
                    "ignoreCase": true,
                    "value": {
                        "from": {
                            "relative": false,
                            "value": config.fromDateString
                        },
                        "to": {
                            "relative": false,
                            "value": config.toDateString
                        }
                    }
                },
                "and",
                {
                    requestType: "i",
                    "subject": "1918262-clinic",
                    "type": "array",
                    "operator": "any_of",
                    "ignoreCase": true,
                    "value": config.clinicValueId
                },
                "and",
                {
                    requestType: "i",
                    "subject": "1918262-machine-required",
                    "type": "array",
                    "operator": "any_of",
                    "ignoreCase": true,
                    "value": config.machineValueId
                },
                "and",
                {
                    requestType: "i",
                    "subject": "1918262-clinician",
                    "type": "array",
                    "operator": "any_of",
                    "ignoreCase": true,
                    "value": config.clinician
                }
            ]
        ]
    });
}