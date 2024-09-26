async function script(C) {
    const currentEntry = await C.getCurrentEntry();
    C.addJsonToSummary(currentEntry);
    let rawData = JSON.parse(currentEntry["1614495-raw-data"]);
    C.log(rawData["5"]);
    C.log(rawData.id);
    let patientValuesObject = {};
    const email = rawData["5"];
    let matchedPatientEntryId = "";
    let patientUpdateData = {};
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
        let medirecordsGender = 1;
        let alcoholGlassesResponse = rawData["94"];
        let smokesPerDayResponse = rawData["95"];
        if (filteredEntries.entries.length == 0) {
            // Create Patient
            let gender = [];

            if (rawData["138"]) {
                if (rawData["138"] == "Male") {
                    gender = [1154];
                    medirecordsGender = 2;
                } else if (rawData["138"] == "Female") {
                    gender = [1153];
                    medirecordsGender = 1;
                } else {
                    medirecordsGender = 3;
                }
            }

            let alcoholGlasses = [];

            if (alcoholGlassesResponse) {
                if (alcoholGlassesResponse == "0") {
                    alcoholGlasses = [2064826];
                } else if (alcoholGlassesResponse == "1-3") {
                    alcoholGlasses = [2064829];
                } else if (alcoholGlassesResponse == "4-7") {
                    alcoholGlasses = [2064833];
                } else if (alcoholGlassesResponse == "8+") {
                    alcoholGlasses = [2064834];
                }
            }

            let smokesPerDay = [];

            if (smokesPerDayResponse) {
                if (smokesPerDayResponse == "0") {
                    smokesPerDay = [2064845];
                } else if (smokesPerDayResponse == "1-3") {
                    smokesPerDay = [2064846];
                } else if (smokesPerDayResponse == "4-7") {
                    smokesPerDay = [2064847];
                } else if (smokesPerDayResponse == "8+") {
                    smokesPerDay = [2064849];
                }
            }

            let previousUsage = [];
            let medirecordsPreviousUsage = [];
            if (rawData["162.1"]) {
                previousUsage.push(2064797);
                medirecordsPreviousUsage.push(rawData["162.1"]);
            }
            if (rawData["162.2"]) {
                previousUsage.push(2064799);
                medirecordsPreviousUsage.push(rawData["162.2"]);
            }
            if (rawData["162.3"]) {
                previousUsage.push(2064800);
                medirecordsPreviousUsage.push(rawData["162.3"]);
            }
            if (rawData["162.4"]) {
                previousUsage.push(2064801);
                medirecordsPreviousUsage.push(rawData["162.4"]);
            }
            if (rawData["162.5"]) {
                previousUsage.push(2064804);
                medirecordsPreviousUsage.push(rawData["162.5"]);
            }

            const uuidValue = C.nanoid();
            const orderingLink =
                "https://orders.hellomello.com.au/patient/" + uuidValue;

            patientValuesObject = {
                "1614495-ordering-link": orderingLink,
                "1614495-order-link-new": {
                    name: "Order Page",
                    url: orderingLink,
                },
                "1614495-uuid": uuidValue,
                "1614495-email": rawData["5"],
                "1614495-first-name": rawData["34.3"],
                "1614495-last-name": rawData["34.4"],
                "1614495-full-name": rawData["34.3"] + " " + rawData["34.4"],
                "1614495-date-of-birth": rawData["35"],
                "1614495-reason-for-assistance":
                    rawData["73.1"] ||
                    "" + " " + rawData["73.2"] ||
                    "" + rawData["73.3"] ||
                    "",
                "1614495-sex-gender": gender,
                "1614495-weight": rawData["36"],
                "1614495-height": rawData["37"],
                "1614495-phone": rawData["43"],
                "1614495-landline": rawData["44"] || "",
                "1614495-medicare-number": rawData["45"],
                "1614495-medicare-irn": rawData["46"],
                "1614495-medicare-expiry-date": rawData["47"],
                "1614495-address-1": rawData["48.1"],
                "1614495-suburb": rawData["48.2"],
                "1614495-postcode": rawData["48.5"],
                "1614495-state": rawData["48.4"],
                "1614495-address-2": rawData["48.6"], // Country
                "1614495-presenting-complaints": rawData["139"],
                "1614495-other-presenting-complaints": rawData["72.22"] || "",
                "1614495-patient-problem": rawData["79"],
                "1614495-patient-family-medical-issues": rawData["80"],
                "1614495-current-medications": rawData["188"],
                "1614495-past-medications": rawData["190"],
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
                "1614495-alternate-therapies":
                    rawData["161.1"] ||
                    "" + " " + rawData["161.2"] ||
                    "" + rawData["161.3"] ||
                    "" + rawData["161.4"] ||
                    "" + rawData["161.5"] ||
                    "" + rawData["161.6"] ||
                    "" + rawData["161.7"] ||
                    "" + rawData["161.8"] ||
                    "" + rawData["161.9"] ||
                    "" + rawData["161.10"] ||
                    "" + rawData["161.9"] ||
                    "" + rawData["161.12"] ||
                    "" + rawData["161.13"] ||
                    "" + rawData["161.10"] ||
                    "" + rawData["161.15"] ||
                    "" + rawData["161.16"] ||
                    "" + rawData["161.17"] ||
                    "" + rawData["161.18"] ||
                    "" + rawData["161.19"] ||
                    "" + rawData["161.20"] ||
                    "",

                "1614495-date-created": moment().toISOString(),
                "1614495-status": [1678828],
            };

            const patientResponse = await C.createEntries({
                values: [patientValuesObject],
                recordInternalId: "hello-mello-patients",
                options: {
                    returnRecordInfo: true,
                    makeAutoId: true,
                },
            });

            C.addJsonToSummary(patientResponse);

            if (patientResponse.success.length > 0) {
                matchedPatientEntryId = patientResponse.success[0].id;

                const pdf = await C.getPdfFromGoogleDocsTemplate({
                    entryId: matchedPatientEntryId,
                    recordInternalId: "hello-mello-patients",
                    templateId: 10001777,
                    generatedFileDestinationField:
                        "1614495-medirecords-patient-correspondence",
                });

                const emailInput = {
                    entryId: matchedPatientEntryId,
                    recordInternalId: "hello-mello-patients",
                    from: {
                        email: "support@hellomello.com.au",
                        name: "Support Hellomello™",
                    },
                    to: [email],
                    logEmail: [
                        { recordId: 1634790, entryId: matchedPatientEntryId },
                    ],
                    templateId: 1711144,
                    options: {
                        logEmailToCurrentEntry: true,
                    },
                };
                const sendEmailResponse = await C.sendEmail(emailInput);

                let currentEntry = patientValuesObject;

                let endPoint = "https://api.medirecords.com/v1/patients";

                const headers = {
                    Authorization: "Bearer 35ftLsAfKZbQisnBqgzfATxsqmQ",
                    "Content-Type": "application/json",
                };

                function removeSpecialCharactersAndSpaces(inputString) {
                    // Use regular expressions to remove the specified characters and spaces
                    const cleanedString = inputString.replace(
                        /[\[\]{}()\s-]/g,
                        ""
                    );
                    return cleanedString;
                }

                let rawData = {
                    defaultPracticeId: "4ab77a0a-3217-44bc-9de5-f127c21a5d54",
                    usualDoctorId: null,
                    titleCode: 315890000,
                    firstName: currentEntry["1614495-first-name"],
                    lastName: currentEntry["1614495-last-name"],

                    fullName: currentEntry["1614495-full-name"],
                    gender: medirecordsGender,
                    dob: currentEntry["1614495-date-of-birth"],
                    patientStatusCode: 2,
                    homePhone:
                        removeSpecialCharactersAndSpaces(
                            currentEntry["1614495-landline"]
                        ) || "",
                    mobilePhone: removeSpecialCharactersAndSpaces(
                        currentEntry["1614495-phone"]
                    ),
                    email: "support+m@hellomello.com.au",
                    contactMethod: 1,
                };

                let patientMedicareDetails = {
                    medicareNo: currentEntry["1614495-medicare-number"],
                    medicareIRN: currentEntry["1614495-medicare-irn"],
                    medicareExpiry: moment(
                        currentEntry["1614495-medicare-expiry-date"]
                    ).format("YYYY-MM"),
                    eprescribing: true,
                };

                try {
                    //patientObject / rawData
                    let response = await axios.post(endPoint, rawData, {
                        headers: headers,
                    });

                    C.addJsonToSummary(response.data);

                    if (response.data && response.data.id) {
                        patientUpdateData["1614495-medirecords-id"] =
                            response.data.id;
                        patientUpdateData["1614495-medirecords-link"] =
                            "https://app.medirecords.com/index.html?pr=4ab77a0a-3217-44bc-9de5-f127c21a5d54#/patients/" +
                            response.data.id;

                        patientMedicareDetails.patientId = response.data.id;

                        const patientUpdateResponse = await C.updateEntries({
                            updates: [
                                {
                                    value: patientUpdateData,
                                    entryId: matchedPatientEntryId,
                                    recordInternalId: "hello-mello-patients",
                                },
                            ],
                            options: {
                                // throwOnUpdateError: true,
                                returnRecordInfo: true,
                            },
                        });

                        const patientId = response.data.id;
                        const practiceId =
                            "4ab77a0a-3217-44bc-9de5-f127c21a5d54";
                        const recepientId =
                            "bde5dcdc-bc80-4790-a47e-0b770004e860";
                        const form = new FormData();
                        form.append("subject", "Intake Information");
                        form.append("practiceId", practiceId);
                        form.append("patientId", patientId);
                        form.append(
                            "importDate",
                            moment().format("YYYY-MM-DD")
                        );
                        form.append("category", "1");
                        form.append("subject", " ");
                        form.append("senderType", "2");
                        form.append("senderId", practiceId);
                        form.append("recipientId", recepientId);

                        const updatedPatientEntry = await C.getEntry({
                            entryId: matchedPatientEntryId,
                            recordInternalId: "hello-mello-patients", // if not passed, current record's internal will be taken
                        });

                        const correspondenceFileKey = _.get(
                            updatedPatientEntry,
                            [
                                "1614495-medirecords-patient-correspondence",
                                0,
                                "key",
                            ]
                        );

                        if (correspondenceFileKey) {
                            const [fileResponse, correspondenceFileResponse] =
                                await Promise.allSettled([
                                    C.attachFileToFormData({
                                        formData: form,
                                        formDataKey: "attachment",
                                        fileKey: correspondenceFileKey,
                                    }),
                                ]);

                            const endPoint =
                                "https://api.medirecords.com/v1/upload/patients/" +
                                patientId +
                                "/correspondences/inbounds";
                            //C.addTextToSummary(C.log(endPoint));

                            const correspondanceResponse = await axios.post(
                                endPoint,
                                form,
                                {
                                    headers: {
                                        ...form.getHeaders(),
                                        Authorization:
                                            "Bearer 35ftLsAfKZbQisnBqgzfATxsqmQ",
                                    },
                                }
                            );
                        }

                        let res2 = await axios.post(
                            "https://api.medirecords.com/v1/patients/" +
                            response.data.id +
                            "/settings",
                            patientMedicareDetails,
                            {
                                headers: headers,
                            }
                        );
                        C.addJsonToSummary(res2.data);
                        let currentEntry = patientValuesObject;
                        let addressObject = {
                            addressType: 1,
                            addressLine1: currentEntry["1614495-address-1"],
                            cityCode: currentEntry["1614495-suburb"],
                            postcode: currentEntry["1614495-postcode"],
                            stateCode: currentEntry["1614495-state"],
                            countryCode: "AU",
                        };
                        // Add Address
                        let res3 = await axios.post(
                            "https://api.medirecords.com/v1/patients/" +
                            response.data.id +
                            "/addresses",
                            addressObject,
                            {
                                headers: headers,
                            }
                        );
                        C.addJsonToSummary(res3.data);
                    }
                } catch (e) {
                    C.addJsonToSummary({ ERROR: e });
                    C.log(e);
                }
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
