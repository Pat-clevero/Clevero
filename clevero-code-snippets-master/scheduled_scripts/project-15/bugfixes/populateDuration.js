async function handler(C) {
    let actions = [];
    
    const getStartDates = (startTime) => {
        if (!startTime) return {};
        
        let startOfAppointment, startOfDay;
        if (startTime) {
            startOfAppointment = C.moment.tz(startTime, "Australia/Sydney");
            startOfDay = C.moment(startOfAppointment).startOf("day");
        }
        return { startOfAppointment, startOfDay };
    }
    
    const clinician = C.getValue("1918262-clinician");
    const startTime = C.getValue("1918262-start-time");
    const mainProcedure = C.getValue("1918262-procedure");
    const subsequentValues = C.getValue("1918262-subsequent-procedures");
    const secondaryProcedures = subsequentValues.length > 0 ? [subsequentValues] : [];
    const machineRequired = C.getValue("1918262-machine-required");
    const clinic = C.getValue("1918262-clinic");

    const isClinicianSet = clinician && clinician.length > 0;
    const isStartTimeSet =startTime !== null && startTime !== "" && startTime !== undefined;
    const isMainProcedureSet = mainProcedure && mainProcedure.length > 0;
    const areSecondaryProceduresSet = secondaryProcedures.length > 0;
    const isClinicSet = clinic && clinic.length > 0;
    const isMachineRequiredSet = machineRequired && machineRequired.length > 0;

    if (
        isClinicianSet &&
        isStartTimeSet &&
        (isMainProcedureSet || areSecondaryProceduresSet) &&
        isMachineRequiredSet &&
        isClinicSet
    ) {
        let guidelineFilterConfig = {
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
                    value: [2157241], // duration guideline type
                },
            ],
        };
        if (secondaryProcedures.length > 0) {
            guidelineFilterConfig.filter[0].push("or");
            guidelineFilterConfig.filter[0].push({
                requestType: "i",
                subject: "1918262-procedure",
                type: "array",
                operator: "any_of",
                value: secondaryProcedures[0],
            });
        }
        const guidelines = await C.api.listEntries(guidelineFilterConfig);

        const { startOfAppointment, startOfDay } = getStartDates(startTime);
        const appointmentSearchConfig = {
            fromDateString: startOfDay,
            toDateString: startOfAppointment,
            clinicValueId: clinic,
            machineValueId: machineRequired,
            clinician,
        };
        const precedingAppointments = await getPrecedingAppointmentsWithinTheDay(
            C,
            appointmentSearchConfig
        );
        
        if (guidelines.entries && guidelines.entries.length > 0) {
            const guidelineDurationFieldToUse =
                precedingAppointments && precedingAppointments.length > 0
                    ? "1918262-subsequent-duration"
                    : "1918262-duration";

            let durations = [];
            _.forEach(guidelines.entries, function (o) {
                let val = o[guidelineDurationFieldToUse]
                    ? o[guidelineDurationFieldToUse]
                    : 1;
                durations.push(+val);
            });
            
            let finalDurationValue = durations.reduce((acc, val) => acc + val);
            const endTime = Date.parse(startTime) + finalDurationValue * 60000;
            
            actions.push(C.setValue("1918262-duration", +finalDurationValue));
            actions.push(C.setValue("1918262-end-time", new Date(endTime).toISOString()));
        } else actions.push(C.setValue("1918262-duration", ""));
    } else {
        actions.push(C.setValue("1918262-duration", ""));
        actions.push(C.setValue("1918262-end-time", ""));
    }

    return C.mergeAll(actions);
}

async function getPrecedingAppointmentsWithinTheDay(C, config) {
    const filterResult = await C.api.listEntries({
        internalId: "insight-mobile-veterinary-diagnostics-appointments",
        filter: [
            [
                {
                    requestType: "i",
                    subject: "1918262-start-time",
                    type: "datetime",
                    operator: "within",
                    ignoreCase: true,
                    value: {
                        from: {
                            relative: false,
                            value: config.fromDateString,
                        },
                        to: {
                            relative: false,
                            value: config.toDateString,
                        },
                    },
                },
                "and",
                {
                    requestType: "i",
                    subject: "1918262-clinic",
                    type: "array",
                    operator: "any_of",
                    ignoreCase: true,
                    value: config.clinicValueId,
                },
                "and",
                {
                    requestType: "i",
                    subject: "1918262-machine-required",
                    type: "array",
                    operator: "any_of",
                    ignoreCase: true,
                    value: config.machineValueId,
                },
                "and",
                {
                    requestType: "i",
                    subject: "1918262-clinician",
                    type: "array",
                    operator: "any_of",
                    ignoreCase: true,
                    value: config.clinician,
                },
            ],
        ],
    });
    const currentEntryId = C.state.entry.id;
    let appointments = C.isEditMode()
        ? filterResult.entries.filter(
              (o) => o.recordValueId !== currentEntryId
          )
        : filterResult.entries;
        
    return appointments;
}