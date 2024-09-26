async function script(C) {
    let patientEntries = await C.filterEntries({
        filter: [
            {
                subject: "1614495-medirecords-id",
                requestType: "i",
                type: "checkbox",
                operator: "not_empty",
                ignoreCase: true,
            },
            "and",
            [
                /* {
                    subject: "id",
                    type: "number:recordValue",
                    operator: "any_of",
                    value: [200189153, 200189152, 200189151],
                }*/
                {
                    subject: "1614495-correspondence-sent-to-medirecords",
                    requestType: "i",
                    type: "checkbox",
                    operator: "is_empty",
                    ignoreCase: true,
                },
                "or",
                {
                    subject: "1614495-correspondence-sent-to-medirecords",
                    requestType: "i",
                    type: "checkbox",
                    operator: "is_false",
                    ignoreCase: true,
                },
                ,
            ],
        ],
        limit: 100,
        recordInternalId: "hello-mello-patients",
    });

     return {patientEntries}

    const filteredPatientEntries = patientEntries.entries;

    if (filteredPatientEntries && !filteredPatientEntries.length > 0)
        return { message: "No patient entry filtered" };

    C.addJsonToSummary({
        filteredPatientEntries: filteredPatientEntries,
    });

    //let endPoint = "https://api.medirecords.com/v1/patients";

    const headers = {
        Authorization: "Bearer 35ftLsAfKZbQisnBqgzfATxsqmQ",
        "Content-Type": "application/json",
    };

    // Use this

    let updateEntries = [];
    let overallResponse = [];

    for (entry of filteredPatientEntries) {
        let currentEntry = entry;
        // C.log("currentEntry->", currentEntry.recordValueId);
        const patientId = currentEntry["1614495-medirecords-id"];
        const practiceId = "4ab77a0a-3217-44bc-9de5-f127c21a5d54";
        const recepientId = "bde5dcdc-bc80-4790-a47e-0b770004e860";

        const form = new FormData();
        form.append("subject", "Intake Information");
        form.append("practiceId", practiceId);
        form.append("patientId", patientId);
        form.append("importDate", moment().format("YYYY-MM-DD"));
        form.append("category", "1");
        form.append("subject", " ");
        form.append("senderType", "2");
        form.append("senderId", practiceId);
        form.append("recipientId", recepientId);
        //form.append("letterStatus", 1);
        //form.append("checkedDate", "2024-03-05");
        //form.append("checkedById", "fd0d34db-28af-4792-a3de-6781d0ce67a7");
        // form.append("notes", "hello world");

        const fileKey = _.get(currentEntry, ["1614495-tga-approval", 0, "key"]);

        const correspondenceFileKey = _.get(currentEntry, [
            "1614495-medirecords-patient-correspondence",
            0,
            "key",
        ]);

        if (fileKey || correspondenceFileKey) {
            const [
                fileResponse,
                correspondenceFileResponse,
            ] = await Promise.allSettled([
                C.attachFileToFormData({
                    formData: form,
                    formDataKey: "attachment",
                    fileKey: fileKey,
                }),
                C.attachFileToFormData({
                    formData: form,
                    formDataKey: "attachment",
                    fileKey: correspondenceFileKey,
                }),
            ]);

            /* C.addJsonToSummary({
                fileResponse,
                correspondenceFileResponse,
            });*/

            const endPoint =
                "https://api.medirecords.com/v1/upload/patients/" +
                patientId +
                "/correspondences/inbounds";
            // C.log("form-->", form);

            try {
                const response = await axios.post(endPoint, form, {
                    headers: {
                        ...form.getHeaders(),
                        Authorization: "Bearer 35ftLsAfKZbQisnBqgzfATxsqmQ",
                    },
                });
                // C.log("response-->", response.data);
                // C.addJsonToSummary({ response: response.data });
                if (response) {
                    updateEntries.push({
                        recordInternalId: "hello-mello-patients",
                        entryId: currentEntry.recordValueId,
                        value: {
                            "1614495-correspondence-sent-to-medirecords": true,
                        },
                    });
                    overallResponse.push(response.data);
                }
            } catch (e) {
                C.log("error-->", e);
                C.log(`Error on entry Id: ${currentEntry.recordValueId}`);
            }
        }
    }

    C.addJsonToSummary({
        overallResponse: overallResponse,
        updateEntries: updateEntries,
    });

    const updateResponse = await C.updateEntries({
        updates: updateEntries,
    });
}
