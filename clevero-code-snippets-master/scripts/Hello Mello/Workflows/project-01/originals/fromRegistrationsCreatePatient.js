async function script(C) {
    const currentEntry = await C.getCurrentEntry();
    C.addJsonToSummary(currentEntry);
    let rawData = JSON.parse(currentEntry["1614495-raw-data"]);
    C.log(rawData["5"]);
    C.log(rawData.id);

    const email = rawData["5"];
    let matchedPatientEntryId = '';
    if (email) {
        const filteredEntries = await C.filterEntries({
            filter: [
                {
                    subject: "1614495-email",
                    requestType: "i",
                    type: "text",
                    operator: "equals",
                    value: email,
                },
            ],
            recordInternalId: "hello-mello-patients",
        });
        C.addJsonToSummary(filteredEntries);

        if (filteredEntries.entries.length == 0) {
            // Create Patient
            let gender = [];
            if(rawData["138"]){
                if(rawData["138"] == "Male"){
                    gender = [1154];
                }
                else {
                    gender = [1153];
                }
            }
            
            let alcoholGlasses = [];
            let alcoholGlassesResponse = rawData["94"];
            if(alcoholGlassesResponse){
                if(alcoholGlassesResponse == "0"){
                    alcoholGlasses = [2064826];
                }
                else if(alcoholGlassesResponse == "1-3"){
                    alcoholGlasses = [2064829];
                }
                else if(alcoholGlassesResponse == "4-7"){
                    alcoholGlasses = [2064833];
                }
                else if(alcoholGlassesResponse == "8+"){
                    alcoholGlasses = [2064834];
                }
            }
            
            let smokesPerDay = [];
            let smokesPerDayResponse = rawData["95"];
            if(smokesPerDayResponse){
                if(smokesPerDayResponse == "0"){
                    smokesPerDay = [2064845];
                }
                else if(smokesPerDayResponse == "1-3"){
                    smokesPerDay = [2064846];
                }
                else if(smokesPerDayResponse == "4-7"){
                    smokesPerDay = [2064847];
                }
                else if(smokesPerDayResponse == "8+"){
                    smokesPerDay = [2064849];
                }
            }
            
            let previousUsage = [];
            if(rawData["162.1"]){
                previousUsage.push(2064797);
            }
            if(rawData["162.2"]){
                previousUsage.push(2064799);
            }
            if(rawData["162.3"]){
                previousUsage.push(2064800);
            }
            if(rawData["162.4"]){
                previousUsage.push(2064801);
            }
            if(rawData["162.5"]){
                previousUsage.push(2064804);
            }
            
            const uuidValue=C.nanoid();
            const patientResponse = await C.createEntries({
                values: [
                    {
                        "1614495-uuid": uuidValue,
                        "1614495-email": rawData["5"],
                        "1614495-first-name": rawData["34.3"],
                        "1614495-last-name": rawData["34.4"],
                        "1614495-full-name": rawData["34.3"] + " " + rawData["34.4"],
                        "1614495-date-of-birth": rawData["35"],
                        "1614495-reason-for-assistance": rawData["73.1"]||"" + " " + rawData["73.2"] || "" + rawData["73.3"] || "",
                        "1614495-sex-gender": gender,
                        "1614495-weight": rawData["36"],
                        "1614495-height": rawData["37"],
                        "1614495-phone": rawData["43"],
                        "1614495-landline": rawData["44"],
                        "1614495-medicare-number": rawData["45"],
                        "1614495-medicare-irn": rawData["46"],
                        "1614495-medicare-expiry-date": rawData["47"],
                        "1614495-address-1": rawData["48.1"],
                        "1614495-suburb": rawData["48.2"],
                        "1614495-postcode": rawData["48.5"],
                        "1614495-state": rawData["48.4"],
                        "1614495-address-2": rawData["35"], // Country
                        "1614495-presenting-complaints": rawData["139"],
                        "1614495-patient-problem": rawData["79"],
                        "1614495-patient-family-medical-issues": rawData["80"],
                        "1614495-current-medications": rawData["188"],
                        "1614495-allergies": rawData["89"],
                        "1614495-patient-weekly-alcohol-glasses": alcoholGlasses,
                        "1614495-patient-daily-smokes": smokesPerDay,
                        "1614495-patient-gp-name": rawData["83"],
                        "1614495-patient-gp-clinic-email": rawData["157"],
                        "1614495-patient-gp-clinic-phone": rawData["85"],
                        "1614495-patient-previous-usage": previousUsage,
                        "1614495-patient-cannabis-clinic": rawData["152"],
                        "1614495-patient-clinic-email": rawData["159"],
                        "1614495-patient-clinic-medication": rawData["154"],
                        "1614495-alternate-therapies": rawData["161.1"]||"" + " " + rawData["161.2"] || "" + rawData["161.3"] || ""+ rawData["161.4"] || ""+ rawData["161.5"] || ""+ rawData["161.6"] || ""+ rawData["161.7"] || ""+ rawData["161.8"] || ""+ rawData["161.9"] || ""+ rawData["161.10"] || ""+ rawData["161.9"] || ""+ rawData["161.12"] || ""+ rawData["161.13"] || ""+ rawData["161.10"] || ""+ rawData["161.15"] || ""+ rawData["161.16"] || ""+ rawData["161.17"] || ""+ rawData["161.18"] || ""+ rawData["161.19"] || ""+ rawData["161.20"] || "",
                        
                        "1614495-date-created": moment().toISOString(),
                        "1614495-1614495-status": [1678828]
                    },
                ],
                recordInternalId: "hello-mello-patients",
                options: {
                    returnRecordInfo: true,
                },
            });

            C.addJsonToSummary(patientResponse);

            if (patientResponse.success.length > 0) {
                matchedPatientEntryId = patientResponse.success[0].id;
            }
        } else {
            matchedPatientEntryId = filteredEntries.entries[0].recordValueId;
        }

        const response = await C.updateEntries({
            updates: [
                {
                    value: {
                        "1614495-matched-patient": [matchedPatientEntryId],
                        "1614495-submitted-id": rawData.id,
                    },
                    entryId: currentEntry.recordValueId,
                    recordInternalId: "hello-mello-registrations",
                },
            ],
            options: {
                // throwOnUpdateError: true,
                returnRecordInfo: true,
            },
        });
    }
    return;
}
