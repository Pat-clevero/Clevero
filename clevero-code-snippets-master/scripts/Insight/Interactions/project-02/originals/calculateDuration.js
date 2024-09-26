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
    
    // console.log('test');
    
    const clinician = C.getValue("1918262-clinician");
    const startTime = C.getValue("1918262-start-time");
    const mainProcedure = C.getValue("1918262-procedure");
    const subsequentValues = C.getValue("1918262-subsequent-procedures");
    const machineRequired = C.getValue("1918262-machine-required");
    const clinic = C.getValue("1918262-clinic");
    const patient = C.getValue("1918262-patient");
    const currentDuration = +C.getValue("1918262-duration");
    
    if(!patient){
        return;
    }
    // let patientObject = await C.api.getEntry({
    //     internalId: "insight-mobile-veterinary-diagnostics-patients",
    //     responseType: "iov",
    //     id: patient,
    // });
    
    // let patientType = patientObject["1918262-pet-type"];
    // console.log(patientObject);

    
    const allProcedures = [...mainProcedure, ...subsequentValues];
    console.log(allProcedures);
    let guidelineFilterConfig = {};
    if (
        clinician && clinician.length>0 &&
        mainProcedure && mainProcedure.length>0
    ) {
        guidelineFilterConfig = {
            internalId: "insight-mobile-veterinary-diagnostics-guidelines",
            filter: [
                [
                    {
                        requestType: "i",
                        subject: "1918262-procedure",
                        type: "array",
                        operator: "any_of",
                        value: allProcedures,
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
        
        const guidelines = await C.api.listEntries(guidelineFilterConfig);
        
        console.log(guidelines);
        let totalDuration = 0;
        if(guidelines && guidelines.entries.length>0){
            myGuidelines = guidelines.entries;
            totalDuration = _.sum(_.map(myGuidelines, function(o){
                return parseInt(o["1918262-duration"]);
            }));
        }
        // console.log(totalDuration);
        actions.push(C.setValue("1918262-duration", totalDuration));
        //let totalDuration = _.sum()
        
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