async function script(C) {
    let currentEntry = await C.getCurrentEntry();
    let payload = currentEntry["1614495-json-field"];

    C.addJsonToSummary(JSON.parse(payload));
    let jsonPayload = JSON.parse(payload).payload.event.context[0];
    C.addJsonToSummary(jsonPayload);

    let treatmentPlanEntry = {
        "1614495-patient": [],
        "1614495-name": "",
        "1614495-status": [1670221],
        "1614495-patient-approved": false,
        "1614495-date": moment.tz("Australia/Sydney").format("YYYY-MM-DD"),
        "1614495-tga-approval-status": [1678994],
        "1614495-practitioner": [],
        "1614495-pharmacy": [],
        "1614495-authorised-prescriber": false,
        "1614495-item-type": [],
        "1614495-item": [],
        "1614495-item-category": [],
        "1614495-repeats": 0,
        "1614495-orders": 0,
        "1614495-orders-remaining": 0,
        "1614495-minimum-interval": 0,
        "1614495-dosage-instructions": "",
    };

    // Find an map patient
    const patientEntryId = jsonPayload.resource.entry.filter(
        (entry) => entry.resource.resourceType === "Patient"
    )[0].resource.id;
    C.addTextToSummary(patientEntryId);

    const patientEntries = await C.filterEntries({
        filter: [
            {
                subject: "1614495-medirecords-id",
                requestType: "i",
                type: "text",
                operator: "equals",
                ignoreCase: true,
                value: patientEntryId,
            },
        ],
        recordInternalId: "hello-mello-patients",
    });

    C.addJsonToSummary({ patientId: patientEntries });

    treatmentPlanEntry["1614495-patient"] = [
        patientEntries.entries[0].recordValueId,
    ];

    treatmentPlanEntry["1614495-name"] = patientEntries.entries[0]["1614495-full-name"];

    // Find an map Practitioner
    const practitionerEntryId = jsonPayload.resource.entry.filter(
        (entry) => entry.resource.resourceType === "Practitioner"
    )[0].resource.id;
    C.addTextToSummary(practitionerEntryId);

    const practitionerEntries = await C.filterEntries({
        filter: [
            {
                subject: "1614495-medirecords-id",
                requestType: "i",
                type: "text",
                operator: "equals",
                value: practitionerEntryId,
            },
        ],
        recordInternalId: "hello-mello-practitioners",
    });

    C.addJsonToSummary({
        practitionerEntries: practitionerEntries.entries[0].recordValueId,
    });

    treatmentPlanEntry["1614495-practitioner"] = [
        practitionerEntries.entries[0].recordValueId,
    ];

    treatmentPlanEntry["1614495-authorised-prescriber"] = [
        practitionerEntries.entries[0]["1614495-is-authorised-prescriber"],
    ];

    if (practitionerEntries.entries[0]["1614495-is-authorised-prescriber"]) {
        treatmentPlanEntry["1614495-tga-approval-status"] = [1678995];
    }

    // Find an map meta data
    const metaData = jsonPayload.resource.entry.filter(
        (entry) => entry.resource.resourceType === "MedicationRequest"
    )[0].resource;

    if (metaData.status != "active") {
        const cancelledResponse = await C.updateEntries({
            updates: [
                {
                    value: {
                        "1614495-status": metaData.status,
                    },
                    entryId: currentEntry.recordValueId,
                    recordInternalId: "hello-mello-medications",
                },
            ],
            options: {
                // throwOnUpdateError: true,
                returnRecordInfo: true,
            },
        });
        return;
    }
    C.addJsonToSummary(metaData);

    treatmentPlanEntry["1614495-minimum-interval"] =
        (metaData.dispenseRequest &&
            metaData.dispenseRequest.dispenseInterval &&
            metaData.dispenseRequest.dispenseInterval.value) ||
        "";
    treatmentPlanEntry["1614495-repeats"] =
        metaData.dispenseRequest.numberOfRepeatsAllowed;
    treatmentPlanEntry["1614495-orders-remaining"] =
        +metaData.dispenseRequest.numberOfRepeatsAllowed + 1;
    treatmentPlanEntry["1614495-dosage-instructions"] =
        (metaData.dosageInstruction && metaData.dosageInstruction[0].text) ||
        "";

    C.addJsonToSummary(metaData);

    let medicationId = metaData.id;
    C.addJsonToSummary({ medicationId });

    let endPoint =
        "https://api.medirecords.com/fhir/v1/MedicationRequest/" + medicationId;

    C.addJsonToSummary({ endPoint });
    // const headers = {
    //     Authorization: "Bearer M0K4lRVFCnB9N1jp_zcU__FK72M",
    //     "Content-Type": "application/json",
    // };
    // let getMedicationResponse = null
    // try{
    //     getMedicationResponse = await axios.get(endPoint, {
    //         headers: headers,
    //     });

    //     C.addJsonToSummary(getMedicationResponse.data);
    //     }
    // catch(e){

    // }

    let itemCode = "";
    let medicationText = metaData.contained[0].code.text;
    const medicationNote = medicationText.split(" ");

    if (medicationNote.length >= 2) {
        itemCode = medicationNote[1];
    }

    C.addJsonToSummary({ itemCode });
    let itemEntries = null;
    if (itemCode && itemCode.length > 0) {
        itemEntries = await C.filterEntries({
            filter: [
                {
                    subject: "code",
                    requestType: "i",
                    type: "text",
                    operator: "equals",
                    value: itemCode,
                },
            ],
            recordInternalId: "xero-items",
        });
        C.addJsonToSummary(itemEntries);
        if (
            itemEntries &&
            itemEntries.entries &&
            itemEntries.entries.length > 0
        ) {
            treatmentPlanEntry["1614495-item"] = [
                itemEntries.entries[0].recordValueId,
            ];
            treatmentPlanEntry["1614495-item-type"] =
                itemEntries.entries[0]["1614495-type"];
            treatmentPlanEntry["1614495-item-category"] =
                itemEntries.entries[0]["1614495-category"];
            treatmentPlanEntry["1614495-pharmacy"] = [
                itemEntries.entries[0]["1614495-default-pharmacy"],
            ];

            const tgaDocuments = await C.filterEntries({
                filter: [
                    {
                        subject: "1614495-patient",
                        requestType: "i",
                        type: "array",
                        operator: "any_of",
                        ignoreCase: true,
                        value: [patientEntries.entries[0].recordValueId],
                    },
                    "and",
                    {
                        subject: "1614495-practitioner",
                        requestType: "i",
                        type: "array",
                        operator: "any_of",
                        ignoreCase: true,
                        value: [practitionerEntries.entries[0].recordValueId],
                    },
                    "and",
                    {
                        subject: "1614495-tga-category",
                        requestType: "i",
                        type: "array",
                        operator: "any_of",
                        ignoreCase: true,
                        value: itemEntries.entries[0]["1614495-category"],
                    },
                    "and",
                    {
                        subject: "1614495-item-type",
                        requestType: "i",
                        type: "array",
                        operator: "any_of",
                        ignoreCase: true,
                        value: itemEntries.entries[0]["1614495-type"],
                    },
                    "and",
                    {
                        subject: "1614495-status",
                        requestType: "i",
                        type: "array",
                        operator: "any_of",
                        ignoreCase: true,
                        value: [200227167],
                    },
                ],
                recordInternalId: "hello-mello-tga-documents",
            });

            C.addJsonToSummary({ tgaDocuments });
            
            if(tgaDocuments.entries && tgaDocuments.entries.length>0){
                treatmentPlanEntry["1614495-tga-approval-status"] = [1678997];
                treatmentPlanEntry["1614495-tga-reference-id"] = tgaDocuments.entries[0]["1614495-tga-reference-id"];
                treatmentPlanEntry["1614495-tga-document"] = [tgaDocuments.entries[0].recordValueId];
            }
        }
    }

    const treatmentPlanResponse = await C.createEntry({
        value: treatmentPlanEntry,
        recordInternalId: "hello-mello-treatment-plans",
        options: {
            returnRecordInfo: true,
            makeAutoId: true,
        },
    });

    if (
        treatmentPlanResponse &&
        treatmentPlanResponse.success &&
        treatmentPlanResponse.success.length > 0
    ) {
        const treatmentPlanEntry = await C.getEntry({
            entryId: +treatmentPlanResponse.success[0].id,
            recordInternalId: "hello-mello-treatment-plans",
        });

        const patientId = treatmentPlanEntry["1614495-patient"][0];

        if (patientId) {
            const patient = await C.getEntry({
                entryId: +patientId,
                recordInternalId: "hello-mello-patients",
                loadAssociations: true,
                associations: [
                    {
                        internalId: "hello-mello-treatment-plans",
                        linkedFieldInternalId: "1614495-patient",
                        responseType: "iov",
                    },
                ],
            });
            const patientEmail = patient["1614495-email"];
            const patientTreatmentPlans =
                patient.associations["hello-mello-treatment-plans"];

            if (
                patientTreatmentPlans.length === 1 &&
                !patient["1614495-new-approved-user-email-sent"]
            ) {
                const emailObj = {
                    entryId: patient.recordValueId,
                    recordInternalId: "hello-mello-treatment-plans",
                    from: {
                        email: "notifications@hellomello.com.au",
                        name: "Hello Mello Notification",
                    },
                    to: ["support@hellomello.com.au"],
                    logEmail: [
                        {
                            recordId: patient.recordId,
                            entryId: patient.recordValueId,
                        },
                    ],
                    //to: ["support@hellomello.com.au"],
                    templateId: 10000153,
                };

                await C.sendEmail(emailObj);
                await C.updateEntries({
                    updates: [
                        {
                            value: {
                                "1614495-new-approved-user-email-sent": true,
                            },
                            entryId: patient.recordValueId,
                            recordInternalId: "hello-mello-patients",
                        },
                    ],
                });
            }

            if (
                patientEmail &&
                itemEntries &&
                itemEntries.entries &&
                itemEntries.entries.length > 0
            ) {
                const emailInput = {
                    entryId: treatmentPlanEntry.recordValueId,
                    recordInternalId: "hello-mello-treatment-plans",
                    from: {
                        email: "support@hellomello.com.au",
                        name: "Support Hellomello™",
                    },
                    to: [patientEmail],
                    logEmail: [
                        {
                            recordId: treatmentPlanEntry.recordId,
                            entryId: treatmentPlanEntry.recordValueId,
                        },
                    ],
                    //to: ["support@hellomello.com.au"],
                    templateId: 1706066,
                };

                await C.sendEmail(emailInput);

                await C.updateEntries({
                    updates: [
                        {
                            value: {
                                "1614495-preview-and-pay-email-sent": true,
                            },
                            entryId: treatmentPlanEntry.recordValueId,
                            recordInternalId: "hello-mello-treatment-plans",
                        },
                    ],
                });

                //Give Access To Portal
                const portalPayload = {
                    email: patientEmail,
                    portalContactId: patient.recordValueId,
                    portalRoleId: 1670159,
                    dataScopeEntryId: patient.recordValueId,
                    portalIdentifier: "patients",
                };

                try {
                    const response = await C.createPortalUser(portalPayload);
                    C.addJsonToSummary({
                        response,
                        mssg: "Portal access provided successfully",
                    });
                } catch (err) {
                    C.log(err);
                }
            }
        }
        const response = await C.updateEntries({
            updates: [
                {
                    value: {
                        "1614495-matched-treatment-plan": [
                            treatmentPlanResponse.success[0].id,
                        ],
                        "1614495-status": metaData.status,
                    },
                    entryId: currentEntry.recordValueId,
                    recordInternalId: "hello-mello-medications",
                },
            ],
            options: {
                // throwOnUpdateError: true,
                returnRecordInfo: true,
            },
        });
    }

    C.addJsonToSummary(treatmentPlanResponse);

    return treatmentPlanResponse;
}
