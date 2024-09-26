async function script(C) {
    // 1. Check if the address was created and updated before May 23, 2024
    //      - If so, get the current patient entry address data
    //      - Send a PUT request to update the address with the new patient address data
    //      - Also make sure that the State code are all uppercase
    // 1. If the address was created and updated after May 23, 2024
    //      - Do nothing

    const config = {
        testingMode: false,
        filterLimit: 50,
        page: 3,
        // entryIdToFilter: [],
        // saveErrorsAsNotes: true,
        storageEntryId: 200407791,
    };

    const updatedMediRecordEntries = []; // update requests was sent
    const modifiedMediRecordEntries = []; // update requests was sent with new data

    const updatedPatients = await C.getEntry({
        entryId: config.storageEntryId,
        recordInternalId: "hello-mello-temporary-storage-of-ids",
    });
    const updatedPatientsList = JSON.parse(updatedPatients["1614495-list"]);
    let doneList = updatedPatientsList.doneList;

    const createAddressObject = (patient) => {
        const suburb = patient["1614495-suburb"];
        const postcode = patient["1614495-postcode"];

        return {
            addressType: 1,
            addressLine1: patient["1614495-address-1"],
            cityCode: suburb,
            postcode,
            stateCode: patient["1614495-state"].toUpperCase(),
            countryCode: "AU",
        };
    };

    const headers = {
        Authorization: "Bearer 35ftLsAfKZbQisnBqgzfATxsqmQ",
        "Content-Type": "application/json",
    };

    const checkAndUpdatePatientAddressOnMedirecords = async (patient) => {
        if (doneList.includes(patient.recordValueId))
            return `Skipping (done) => ${patient.recordValueId}`;

        const medirecordId = patient["1614495-medirecords-id"];

        // GET address[0].id
        const getEndpoint =
            "https://api.medirecords.com/v1/patients/" +
            medirecordId +
            "/addresses";
        const apiGetResponse = await axios
            .get(getEndpoint, {
                headers: headers,
            })
            .then((res) => res.data);

        if (config.testingMode)
            C.addJsonToSummary({
                getEndpoint,
                apiGetResponse,
            });

        if (apiGetResponse && apiGetResponse.length > 0) {
            const may23 = moment("2024-05-23T00:00:00.000Z");
            const { id, createdDateTime, updatedDateTime } = apiGetResponse[0];
            if (
                moment(createdDateTime).isBefore(may23) &&
                moment(updatedDateTime).isBefore(may23)
            ) {
                // then do a PUT call to update the address
                const putEndpoint =
                    "https://api.medirecords.com/v1/patients/" +
                    medirecordId +
                    "/addresses/" +
                    id;

                const payload = createAddressObject(patient);
                if (!config.testingMode) {
                    try {
                        const apiPutResponse = await axios
                            .put(putEndpoint, payload, {
                                headers: headers,
                            })
                            .then((res) => {
                                const response = res.data;
                                updatedMediRecordEntries.push(
                                    patient.recordValueId
                                );

                                return response;
                            });

                        const updateDate = moment(
                            apiPutResponse.updatedDateTime
                        ).format("YYYY, MM DD");
                        const todayDate = moment().format("YYYY, MM DD");
                        if (updateDate == todayDate) {
                            modifiedMediRecordEntries.push({
                                entryId: patient.recordValueId,
                                medirecordId,
                            });
                            // modifiedMediRecordEntries.push(apiPutResponse);
                        }

                        // return { apiPutResponse };
                        return {
                            id: apiPutResponse.id,
                            medirecordId: apiPutResponse.patientId,
                            entryId: patient.recordValueId,
                        };
                    } catch (error) {
                        const apiError = error.response.data.errors[0];
                        // const errorMessage = apiError.message;
                        return `Skipping: ${apiError.message} => ${patient.recordValueId}`;
                    }
                } else {
                    return {
                        putEndpoint,
                        payload,
                    };
                }
            } else if (
                moment(createdDateTime).isAfter(may23) ||
                moment(updatedDateTime).isAfter(may23)
            ) {
                return config.testingMode
                    ? {
                          message:
                              `Skipping: The address was updated after May 23, 2024) => ${patient.recordValueId}`,
                          patient: patient.recordValueId,
                          medirecordId,
                          addressId: id,
                          createdDateTime,
                          updatedDateTime,
                      }
                    : `Skipping: The address was updated after May 23, 2024 => ${patient.recordValueId})`;
            }
        } else if (apiGetResponse && apiGetResponse.length === 0) {
            return {
                message: `This entry hasn't been synced yet.`,
                entryId: patient.recordValueId,
            };
        } else {
            return {
                message: "Nothing happened",
                entryId: patient.recordValueId,
            };
        }
    };

    const filter = [
        [
            {
                subject: "1614495-address-updated",
                requestType: "i",
                type: "checkbox",
                operator: "not_empty",
                ignoreCase: true,
            },
            "or",
            {
                subject: "1614495-address-updated",
                requestType: "i",
                type: "checkbox",
                operator: "is_true",
                ignoreCase: true,
            },
        ],
    ];

    const { entries: patients } = await C.filterEntries({
        filter,
        limit: config.filterLimit,
        recordInternalId: "hello-mello-patients",
        page: config.page,
        // sortOrder: -1,
    });

    C.addJsonToSummary({
        patients: patients.map((patient) => patient.recordValueId),
    });

    const medirecordsApiPutResults = await Promise.all(
        patients.map(checkAndUpdatePatientAddressOnMedirecords)
    );

    doneList = [...doneList, ...updatedMediRecordEntries];
    if (updatedMediRecordEntries) {
        await C.updateEntries({
            updates: [
                {
                    value: {
                        "1614495-list": JSON.stringify({ doneList }),
                    },
                    entryId: config.storageEntryId,
                    recordInternalId: "hello-mello-temporary-storage-of-ids",
                },
            ],
        });
    }

    return {
        modifiedMediRecordEntries,
        medirecordsApiPutResults,
    };
}
