async function script(C) {
    const config = {
        testingMode: false, // if false, sends actual data to medirecord API and update clevero entries
        filterLimit: 50,
        page: 26,
        entryIdToFilter: [],
        saveErrorsAsNotes: true,
        storageEntryId: 200407790,
    };

    const patientsWithNotes = await C.getEntry({
        entryId: config.storageEntryId,
        recordInternalId: "hello-mello-temporary-storage-of-ids",
    });
    const patientsWitNotesList = JSON.parse(patientsWithNotes["1614495-list"]);
    let skipList = patientsWitNotesList["skipList"];

    // ONLY FOR INITIALISATION
    // return await C.createEntry({
    //     value: {
    //         "1614495-list": JSON.stringify({ skipList: config.skipList }),
    //         "1614495-text-field": JSON.stringify({ skipList: config.skipList }),
    //     },
    //     recordInternalId: "hello-mello-temporary-storage-of-ids",
    // });

    async function crossCheckSuburbNamesByPostcode(keyword, postcode) {
        const threshold = 5;
        const data = await axios
            .get(`http://v0.postcodeapi.com.au/suburbs/${postcode}.json`)
            .then((res) => res.data);
        if (config.testingMode) C.addJsonToSummary({ data });
        const names = data.map((location) => location.name);
        const closestMatch = findClosestMatch(names, keyword, threshold);

        return closestMatch;
    }

    // Levenshtein Distance Algorithm
    function getLevenshteinDistance(a, b) {
        const matrix = [];

        // Increment along the first column of each row
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        // Increment each column in the first row
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        // Fill in the rest of the matrix
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    function findClosestMatch(arr, keyword, threshold) {
        let closestMatch = null;
        let minDistance = Infinity;

        arr.forEach((name) => {
            const distance = getLevenshteinDistance(
                name.toLowerCase(),
                keyword.toLowerCase()
            );
            if (distance < minDistance) {
                minDistance = distance;
                closestMatch = name;
            }
        });

        return minDistance <= threshold ? closestMatch : null;
    }

    const patientsWithAlreadyPushedAddresses = [];
    const patientsWithNewlyPushedAddresses = [];

    const headers = {
        Authorization: "Bearer 35ftLsAfKZbQisnBqgzfATxsqmQ",
        "Content-Type": "application/json",
    };

    function wait(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function createAddressObject(patient) {
        const suburb = patient["1614495-suburb"];
        const postcode = patient["1614495-postcode"];
        const cityCode = await crossCheckSuburbNamesByPostcode(
            suburb,
            postcode
        );

        return cityCode
            ? {
                addressType: 1,
                addressLine1: patient["1614495-address-1"],
                cityCode,
                postcode,
                stateCode: patient["1614495-state"],
                countryCode: "AU",
            }
            : null;
    }

    async function tickAddressUpdatedCheckboxes(entryIds) {
        const updates = entryIds.map((entryId) => ({
            value: {
                "1614495-address-updated": true,
            },
            entryId,
            recordInternalId: "hello-mello-patients",
        }));
        if (!config.testingMode) return await C.updateEntries({ updates });
        else return { updates }; // mock response
    }

    async function createNoteEntry(value) {
        return await C.createEntry({
            value,
            recordInternalId: "hello-mello-notes",
        });
    }

    const patientsWithCreatedNotesArray = [];
    async function checkAndPushPatientAddressesOnMedirecords(patient) {
        if (skipList.includes(patient.recordValueId))
            return `Skipping ${patient.recordValueId}`;

        try {
            const addressObject = await createAddressObject(patient);
            const endpoint =
                "https://api.medirecords.com/v1/patients/" +
                patient["1614495-medirecords-id"] +
                "/addresses";

            if (!addressObject) {
                throw new Error(
                    `The suburb "${patient["1614495-suburb"]}" doesn't match the postcode "${patient["1614495-postcode"]}".
                    Please double-check and ensure the POSTCODE or SUBURB field values are correct. Thanks for your help!`
                );
            }
            let apiPostResponse;
            const apiGetResponse = await axios
                .get(endpoint, {
                    headers: headers,
                })
                .then((res) => res.data);

            if (apiGetResponse && apiGetResponse.length > 0) {
                patientsWithAlreadyPushedAddresses.push(patient.recordValueId);
            } else if (apiGetResponse && apiGetResponse.length === 0) {
                if (!config.testingMode) {
                    apiPostResponse = await axios
                        .post(endpoint, addressObject, {
                            headers: headers,
                        })
                        .then((res) => res.data);
                    if (apiPostResponse)
                        patientsWithNewlyPushedAddresses.push(
                            patient.recordValueId
                        );
                } else {
                    apiPostResponse = { pushed_address: { ...addressObject } }; // mock response
                    patientsWithNewlyPushedAddresses.push(
                        patient.recordValueId
                    );
                }
            }

            return { apiGetResponse, apiPostResponse };
        } catch (error) {
            let message = "";
            if (axios.isAxiosError(error) && error.response && error.response.status === 400) {
                // C.log({ stat: error.response.data });
                if (error.response.data.errors) {
                    const apiError = error.response.data.errors[0];
                    const fieldName =
                        apiError.parameter === "addressLine1"
                            ? "ADDRESS 1"
                            : apiError.parameter;
                    const valueWithError = apiError.value;
                    const errorMessage =
                        apiError.message === "size must be between 0 and 50"
                            ? "value exceeds the 50 character limit implemented by MediRecords. Please try again with a shorter address to make sync with Medirecords possible."
                            : apiError.message;

                    message = `${fieldName}: "${valueWithError}" - ${errorMessage} `;
                } else if (error.response.data.message) {
                    const apiMessage = error.response.data.message;
                    const messagePattern = /^No Patient for id: [a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
                    const extractPattern = /^No Patient for id: ([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/;
                    const extractedId = apiMessage.match(extractPattern)[1];
                    message = messagePattern.test(apiMessage)
                        ? `The provided MediRecords ID (${extractedId}) does not match any patients in the MediRecords database. Please ensure that the ID is correct and up-to-date. Thank you!`
                        : apiMessage;
                }
            }
            else if (axios.isAxiosError(error) && error.response && error.response.status === 404) {
                message = "Please ensure that complete patient address information is provided.";
            } else {
                message = error.message;
            }

            const displayMessage = `Automated message from Clevero Workflow! 👋 We've detected an issue with syncing address info to MediRecords for this entry.
                ${message}`;
            if (config.saveErrorsAsNotes) {
                try {
                    const res = await createNoteEntry({
                        "1614495-date-entered": moment().toISOString(),
                        "1614495-patient": [patient.recordValueId],
                        "1614495-note": displayMessage,
                    });
                    if (res.success.length > 0) {
                        // C.log(
                        //     `Note (${res.success[0].id}) created for patient >>>>>>>> ${patient.recordValueId}`
                        // );
                        patientsWithCreatedNotesArray.push(
                            patient.recordValueId
                        );
                    }
                } catch (error) {
                    C.log(`Note creation error: ${error.message}`);
                }
            }

            return `${displayMessage} - PATIENT ENTRY ID => ${patient.recordValueId}`;
        }

        // TODO: maybe implement a cooldown, idk yet
    }

    const filter = [
        [
            {
                subject: "1614495-address-updated",
                requestType: "i",
                type: "checkbox",
                operator: "is_empty",
                ignoreCase: true,
            },
            "or",
            {
                subject: "1614495-address-updated",
                requestType: "i",
                type: "checkbox",
                operator: "is_false",
                ignoreCase: true,
            },
        ],
    ];

    if (config.filterLimit === 1 && config.entryIdToFilter.length === 1) {
        filter.push("and");
        filter.push({
            subject: "id",
            type: "number:recordValue",
            operator: "any_of",
            value: config.entryIdToFilter,
        });
    }

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

    if (!patients.length) return { message: "No patients found." };

    const medirecordsApiResults = await Promise.all(
        patients.map(checkAndPushPatientAddressesOnMedirecords)
    );
    C.addJsonToSummary({
        patientsWithAlreadyPushedAddresses,
        patientsWithNewlyPushedAddresses,
    });

    const cleveroUpdateResults = await tickAddressUpdatedCheckboxes([
        ...patientsWithAlreadyPushedAddresses,
        ...patientsWithNewlyPushedAddresses,
    ]);

    C.log({ patientsWithCreatedNotesArray });
    if (patientsWithCreatedNotesArray.length > 0) {
        skipList = [...skipList, ...patientsWithCreatedNotesArray]
        await C.updateEntries({
            updates: [
                {
                    value: {
                        "1614495-list": JSON.stringify({ "skipList": skipList }),
                    },
                    entryId: config.storageEntryId,
                    recordInternalId: "hello-mello-temporary-storage-of-ids",
                },
            ],
        });
    }

    return {
        medirecordsApiResults,
        cleveroUpdateResults,
    };
}