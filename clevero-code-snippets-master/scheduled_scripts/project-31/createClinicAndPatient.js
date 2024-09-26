async function script(C) {
    let currentEntry = await C.getCurrentEntry();
    //Existing==2055582
    //New ==2055581
    // If New is selected we always create a new clinic, then we go populate that created entry into our entry layout (matched clinic)
    let clinicValue = currentEntry["1918262-new-or-existing-clinic"][0];
    let emailOfClinic = currentEntry["1918262-email"];
    let clinicEmail = emailOfClinic.toLowerCase();
    let entriesToBeCreated = [];

    if (clinicValue == 2055581) {

        const createClinicResponse = await C.createEntry({
            recordInternalId: "standard-organisations",
            value: {
                name: currentEntry["1918262-clinic-name"],
                email: clinicEmail
            },
        });

        const createdClinicId = createClinicResponse.success[0].id;

        let filteredClinicEntries = await C.filterEntries({
            filter: [
                {
                    subject: "1918262-general-email",
                    requestType: "i",
                    type: "text",
                    operator: "equals",
                    value: `${clinicEmail}`,
                },
            ],
            limit: 100,
            recordInternalId: "standard-organisations",
        });
        if (
            filteredClinicEntries.entries &&
            filteredClinicEntries.entries.length > 0
        ) {
            let matchedClinic = filteredClinicEntries.entries[0].recordValueId;
            const updateResponse = await C.updateEntries({
                updates: [
                    {
                        recordInternalId:
                            "insight-mobile-veterinary-diagnostics-online-booking",
                        entryId: currentEntry.recordValueId,
                        value: {
                            "1918262-matched-clinic": [matchedClinic],
                        },
                    },
                ],
            })
        }
    }
    else {
        let filteredClinicEntries = await C.filterEntries({
            filter: [
                {
                    subject: "1918262-general-email",
                    requestType: "i",
                    type: "text",
                    operator: "equals",
                    value: `${clinicEmail}`,
                },
            ],
            limit: 100,
            recordInternalId: "standard-organisations",
        });
        C.log("filteredClinicEntries-->", filteredClinicEntries);

        if (
            filteredClinicEntries.entries &&
            filteredClinicEntries.entries.length > 0
        ) {
            let matchedClinic = filteredClinicEntries.entries[0].recordValueId;
            const updateResponse = await C.updateEntries({
                updates: [
                    {
                        recordInternalId:
                            "insight-mobile-veterinary-diagnostics-online-booking",
                        entryId: currentEntry.recordValueId,
                        value: {
                            "1918262-matched-clinic": [matchedClinic],
                        },
                    },
                ],
            });
        } else {
            const updateResponse = await C.updateEntries({
                updates: [
                    {
                        recordInternalId:
                            "insight-mobile-veterinary-diagnostics-online-booking",
                        entryId: currentEntry.recordValueId,
                        value: {
                            "1918262-no-matched-clinic": true,
                        },
                    },
                ],
            });
        }
    }


    let clinicId = [];
    let filteredClinicEntries = await C.filterEntries({
        filter: [
            {
                subject: "1918262-general-email",
                requestType: "i",
                type: "text",
                operator: "equals",
                value: `${clinicEmail}`,
            },
        ],
        limit: 100,
        recordInternalId: "standard-organisations",
    });
    if (
        filteredClinicEntries.entries &&
        filteredClinicEntries.entries.length > 0
    ) {
        clinicId.push(filteredClinicEntries.entries[0].recordValueId);
    }

    // For Patient 1 ############################################################
    if (
        currentEntry["1918262-newexisting-patient-1"] &&
        currentEntry["1918262-newexisting-patient-1"].length > 0
    ) {
        let patientValue1 = currentEntry["1918262-newexisting-patient-1"][0];
        let patientFirstName = currentEntry["1918262-patient-first-name-1"];
        let patientLastName = currentEntry["1918262-patient-last-name-1"];
        let patientId = [];
        let fullName = `${patientFirstName} ${patientLastName}`;


        if (patientValue1 == 2055581) {
            const createPatientResponse = await C.createEntry({
                recordInternalId:
                    "insight-mobile-veterinary-diagnostics-patients",
                value: {
                    "1918262-patient-name":
                        currentEntry["1918262-patient-first-name-1"],
                    "1918262-surname":
                        currentEntry["1918262-patient-last-name-1"],
                    "1918262-email": currentEntry["1918262-patient-email-1"],
                    "1918262-date-of-birth":
                        currentEntry["1918262-date-of-birth-1"],
                    "1918262-pet-type": currentEntry["1918262-species-1"],
                    "1918262-breed": currentEntry["1918262-breed-1"],
                    "1918262-sex": currentEntry["1918262-sex-1"],
                    "1918262-clinic": clinicId,
                    "1918262-full-name": fullName,
                },
            });

            let filteredPatientEntries = await C.filterEntries({
                filter: [
                    {
                        subject: "1918262-patient-name",
                        requestType: "i",
                        type: "text",
                        operator: "equals",
                        value: `${patientFirstName}`,
                    }, "and", {
                        subject: "1918262-surname",
                        requestType: "i",
                        type: "text",
                        operator: "equals",
                        value: `${patientLastName}`,
                    }
                ],
                limit: 100,
                recordInternalId:
                    "insight-mobile-veterinary-diagnostics-patients",
            });

            if (
                filteredPatientEntries.entries &&
                filteredPatientEntries.entries.length > 0
            ) {
                let matchedPatient =
                    filteredPatientEntries.entries[0].recordValueId;
                patientId.push(matchedPatient)
                const updateResponse = await C.updateEntries({
                    updates: [
                        {
                            recordInternalId:
                                "insight-mobile-veterinary-diagnostics-online-booking",
                            entryId: currentEntry.recordValueId,
                            value: {
                                "1918262-matched-patient-1": [matchedPatient],
                            },
                        },
                    ],
                });
            }
        }
        else {
            let filteredPatientEntries = await C.filterEntries({
                filter: [
                    {
                        subject: "1918262-patient-name",
                        requestType: "i",
                        type: "text",
                        operator: "equals",
                        value: `${patientFirstName}`,
                    }, "and", {
                        subject: "1918262-surname",
                        requestType: "i",
                        type: "text",
                        operator: "equals",
                        value: `${patientLastName}`,
                    }
                ],
                limit: 100,
                recordInternalId:
                    "insight-mobile-veterinary-diagnostics-patients",
            });
            C.log("filteredPatientEntries1-->", filteredPatientEntries);

            if (
                filteredPatientEntries.entries &&
                filteredPatientEntries.entries.length > 0
            ) {
                let matchedPatient =
                    filteredPatientEntries.entries[0].recordValueId;
                patientId.push(matchedPatient)
                const updateResponse = await C.updateEntries({
                    updates: [
                        {
                            recordInternalId:
                                "insight-mobile-veterinary-diagnostics-online-booking",
                            entryId: currentEntry.recordValueId,
                            value: {
                                "1918262-matched-patient-1": [matchedPatient],
                            },
                        },
                    ],
                });
            }
        }

        const dateOfBirthPatient1 = currentEntry["1918262-date-of-birth-1"];
        const todayDate = moment().format("YYYY-MM-DD");
        const age = moment(todayDate).diff(dateOfBirthPatient1, 'months');
        // For creating appointments
        entriesToBeCreated.push([{
            "1918262-newexisting-patient": [patientValue1],
            "1918262-duration": 60,
            "1918262-patient": patientId ? patientId : [],
            "1918262-clinic": clinicId ? clinicId : [],
            "1918262-procedure": currentEntry["1918262-primary-procedure-1"] ? currentEntry["1918262-primary-procedure-1"] : [],
            "1918262-subsequent-procedures": currentEntry["1918262-secondary-procedure-1"] ? currentEntry["1918262-secondary-procedure-1"] : [],
            "1918262-weight": currentEntry["1918262-bodyweight-1"] ? currentEntry["1918262-bodyweight-1"] : 0,
            "1918262-stage": [1968579],
            "1918262-current-age": +age
        }, { 'patientNumber': 1 }])
        // End

    }

    // For patient 2 ############################################################
    if (
        currentEntry["1918262-newexisting-patient-2"] &&
        currentEntry["1918262-newexisting-patient-2"].length > 0
    ) {
        let patientValue2 = currentEntry["1918262-newexisting-patient-2"][0];
        let patientFirstName = currentEntry["1918262--patient-first-name-2"];
        let patientLastName = currentEntry["1918262-patient-last-name-2"];
        let patientId = [];
        let fullName = `${patientFirstName} ${patientLastName}`;
        if (patientValue2 == 2055581) {
            // Create new patient entry
            C.log("Creating new patient 2");
            const createPatientResponse = await C.createEntry({
                recordInternalId:
                    "insight-mobile-veterinary-diagnostics-patients",
                value: {
                    "1918262-patient-name":
                        currentEntry["1918262--patient-first-name-2"],
                    "1918262-surname":
                        currentEntry["1918262-patient-last-name-2"],
                    "1918262-email": currentEntry["1918262-patient-email-2"],
                    "1918262-date-of-birth":
                        currentEntry["1918262-date-of-birth-2"],
                    "1918262-pet-type": currentEntry["1918262-species-2"],
                    "1918262-breed": currentEntry["1918262-breed-2"],
                    "1918262-sex": currentEntry["1918262-sex-2"],
                    "1918262-clinic": clinicId,
                    "1918262-full-name": fullName,
                },
            });

            let filteredPatientEntries = await C.filterEntries({
                filter: [
                    {
                        subject: "1918262-patient-name",
                        requestType: "i",
                        type: "text",
                        operator: "equals",
                        value: `${patientFirstName}`,
                    }, "and", {
                        subject: "1918262-surname",
                        requestType: "i",
                        type: "text",
                        operator: "equals",
                        value: `${patientLastName}`,
                    }
                ],
                limit: 100,
                recordInternalId:
                    "insight-mobile-veterinary-diagnostics-patients",
            });
            if (
                filteredPatientEntries.entries &&
                filteredPatientEntries.entries.length > 0
            ) {
                let matchedPatient =
                    filteredPatientEntries.entries[0].recordValueId;
                patientId.push(matchedPatient)
                const updateResponse = await C.updateEntries({
                    updates: [
                        {
                            recordInternalId:
                                "insight-mobile-veterinary-diagnostics-online-booking",
                            entryId: currentEntry.recordValueId,
                            value: {
                                "1918262-matched-patient-2": [matchedPatient],
                            },
                        },
                    ],
                });
            }
        }
        else {
            let filteredPatientEntries = await C.filterEntries({
                filter: [
                    {
                        subject: "1918262-patient-name",
                        requestType: "i",
                        type: "text",
                        operator: "equals",
                        value: `${patientFirstName}`,
                    }, "and", {
                        subject: "1918262-surname",
                        requestType: "i",
                        type: "text",
                        operator: "equals",
                        value: `${patientLastName}`,
                    }
                ],
                limit: 100,
                recordInternalId:
                    "insight-mobile-veterinary-diagnostics-patients",
            });
            if (
                filteredPatientEntries.entries &&
                filteredPatientEntries.entries.length > 0
            ) {
                let matchedPatient =
                    filteredPatientEntries.entries[0].recordValueId;
                patientId.push(matchedPatient)
                const updateResponse = await C.updateEntries({
                    updates: [
                        {
                            recordInternalId:
                                "insight-mobile-veterinary-diagnostics-online-booking",
                            entryId: currentEntry.recordValueId,
                            value: {
                                "1918262-matched-patient-2": [matchedPatient],
                            },
                        },
                    ],
                });
            }
        }

        const dateOfBirthPatient2 = currentEntry["1918262-date-of-birth-2"];
        const todayDate = moment().format("YYYY-MM-DD");
        const age = moment(todayDate).diff(dateOfBirthPatient2, 'months');

        // For creating appointments
        entriesToBeCreated.push([{
            "1918262-newexisting-patient": [patientValue2],
            "1918262-patient": patientId ? patientId : [],
            "1918262-clinic": clinicId ? clinicId : [],
            "1918262-procedure": currentEntry["1918262-primary-procedure-2"] ? currentEntry["1918262-primary-procedure-2"] : [],
            "1918262-subsequent-procedures": currentEntry["1918262-secondary-procedure-2"] ? currentEntry["1918262-secondary-procedure-2"] : [],
            "1918262-weight": currentEntry["1918262-bodyweight-2"] ? currentEntry["1918262-bodyweight-2"] : 0,
            "1918262-stage": [1968579],
            "1918262-current-age": +age

        }, { "patientNumber": 2 }])



    }

    //For patient 3 #############################################################
    if (
        currentEntry["1918262-newexisting-patient-3"] &&
        currentEntry["1918262-newexisting-patient-3"].length > 0
    ) {
        let patientValue3 = currentEntry["1918262-newexisting-patient-3"][0];
        let patientFirstName = currentEntry["1918262-patient-first-name-3"];
        let patientLastName = currentEntry["1918262-patient-last-name-3"];
        let patientId = [];
        let fullName = `${patientFirstName} ${patientLastName}`;

        if (patientValue3 == 2055581) {
            // Create new patient entry
            const createPatientResponse = await C.createEntry({
                recordInternalId:
                    "insight-mobile-veterinary-diagnostics-patients",
                value: {
                    "1918262-patient-name":
                        currentEntry["1918262-patient-first-name-3"],
                    "1918262-surname":
                        currentEntry["1918262-patient-last-name-3"],
                    "1918262-email": currentEntry["1918262-patient-email-3"],
                    "1918262-date-of-birth":
                        currentEntry["1918262-date-of-birth-3"],
                    "1918262-pet-type": currentEntry["1918262-species-3"],
                    "1918262-breed": currentEntry["1918262-breed-3"],
                    "1918262-sex": currentEntry["1918262-sex-3"],
                    "1918262-clinic": clinicId,
                    "1918262-full-name": fullName,
                },
            });

            let filteredPatientEntries = await C.filterEntries({
                filter: [
                    {
                        subject: "1918262-patient-name",
                        requestType: "i",
                        type: "text",
                        operator: "equals",
                        value: `${patientFirstName}`,
                    }, "and", {
                        subject: "1918262-surname",
                        requestType: "i",
                        type: "text",
                        operator: "equals",
                        value: `${patientLastName}`,
                    }
                ],
                limit: 100,
                recordInternalId:
                    "insight-mobile-veterinary-diagnostics-patients",
            });
            if (
                filteredPatientEntries.entries &&
                filteredPatientEntries.entries.length > 0
            ) {
                let matchedPatient =
                    filteredPatientEntries.entries[0].recordValueId;
                patientId.push(matchedPatient)
                const updateResponse = await C.updateEntries({
                    updates: [
                        {
                            recordInternalId:
                                "insight-mobile-veterinary-diagnostics-online-booking",
                            entryId: currentEntry.recordValueId,
                            value: {
                                "1918262-matched-patient-3": [matchedPatient],
                            },
                        },
                    ],
                });
            }
        }
        else {
            let filteredPatientEntries = await C.filterEntries({
                filter: [
                    {
                        subject: "1918262-patient-name",
                        requestType: "i",
                        type: "text",
                        operator: "equals",
                        value: `${patientFirstName}`,
                    }, "and", {
                        subject: "1918262-surname",
                        requestType: "i",
                        type: "text",
                        operator: "equals",
                        value: `${patientLastName}`,
                    }
                ],
                limit: 100,
                recordInternalId:
                    "insight-mobile-veterinary-diagnostics-patients",
            });

            if (
                filteredPatientEntries.entries &&
                filteredPatientEntries.entries.length > 0
            ) {
                let matchedPatient =
                    filteredPatientEntries.entries[0].recordValueId;
                patientId.push(matchedPatient)
                const updateResponse = await C.updateEntries({
                    updates: [
                        {
                            recordInternalId:
                                "insight-mobile-veterinary-diagnostics-online-booking",
                            entryId: currentEntry.recordValueId,
                            value: {
                                "1918262-matched-patient-3": [matchedPatient],
                            },
                        },
                    ],
                });
            }
        }

        const dateOfBirthPatient3 = currentEntry["1918262-date-of-birth-3"];
        const todayDate = moment().format("YYYY-MM-DD");
        const age = moment(todayDate).diff(dateOfBirthPatient3, 'months');

        // For creating appointments
        entriesToBeCreated.push([{
            "1918262-newexisting-patient": [patientValue3],
            "1918262-patient": patientId ? patientId : [],
            "1918262-clinic": clinicId ? clinicId : [],
            "1918262-procedure": currentEntry["1918262-primary-procedure-3"] ? currentEntry["1918262-primary-procedure-3"] : [],
            "1918262-subsequent-procedures": currentEntry["1918262-secondary-procedure-3"] ? currentEntry["1918262-secondary-procedure-3"] : [],
            "1918262-weight": currentEntry["1918262-bodyweight-3"] ? currentEntry["1918262-bodyweight-3"] : 0,
            "1918262-stage": [1968579],
            "1918262-current-age": +age

        }, { "patientNumber": 3 }])
    }


    for (let i = 0; i < entriesToBeCreated.length; i++) {
        let values = [];
        let patientIdNumber = entriesToBeCreated[i][1].patientNumber;
        console.log("patientNumber-->", patientIdNumber)

        let createAppointment = await C.createEntry({
            value: entriesToBeCreated[i][0],
            recordInternalId: 'insight-mobile-veterinary-diagnostics-appointments',
            options: {
                makeAutoId: true
            },

        });


        let id = createAppointment.success[0].id;

        let appointmentCreatedDetails = await C.getEntry({
            recordInternalId: 'insight-mobile-veterinary-diagnostics-appointments',
            entryId: +id,
            responseType: "iv"
        });

        const clinicName = appointmentCreatedDetails["1918262-clinic"] ? appointmentCreatedDetails["1918262-clinic"] : ""
        const patientName = appointmentCreatedDetails["1918262-patient"] ? appointmentCreatedDetails["1918262-patient"] : ""
        const appointmentName = `${patientName} - ${clinicName}`;

        const updateAppointmentEntry = await C.updateEntries({
            updates: [
                {
                    recordInternalId:
                        'insight-mobile-veterinary-diagnostics-appointments',
                    entryId: +id,
                    value: { "1918262-name": appointmentName ? appointmentName : "" },
                },
            ],
        });

        if (+patientIdNumber == 1) {
            values.push({ "1918262-appointment-1": [+id] })
        }
        else if (+patientIdNumber == 2) {
            values.push({ "1918262-appointment-2": [+id] })
        }
        else if (+patientIdNumber == 3) {
            values.push({ "1918262-appointment-3": [+id] })
        }
        let onlineBookingEntry = await C.getEntry({
            recordInternalId: "insight-mobile-veterinary-diagnostics-online-booking",
            entryId: currentEntry.recordValueId
        })
        const updateBooking = await C.updateEntries({
            updates: [
                {
                    recordInternalId:
                        "insight-mobile-veterinary-diagnostics-online-booking",
                    entryId: onlineBookingEntry.recordValueId,
                    value: values[0],
                },
            ],
        });

    }


}



