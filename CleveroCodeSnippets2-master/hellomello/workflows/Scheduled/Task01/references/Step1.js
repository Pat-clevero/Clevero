async function script(C) {
    // Mock async function that takes approximately 5 seconds to resolve
    async function generateCorrespondence(page = 0) {
        try {
            const { entries: patients } = await C.getEntries({
                filter: [
                    {
                        subject: "1614495-correspondence-file-created",
                        requestType: "i",
                        type: "checkbox",
                        operator: "is_empty",
                        ignoreCase: true,
                    },
                    "or",
                    {
                        subject: "1614495-correspondence-file-created",
                        requestType: "i",
                        type: "checkbox",
                        operator: "is_false",
                        ignoreCase: true,
                    },
                ],
                limit: 25,
                sortBy: "-1",
                sortOrder: -1,
                page: 0,
                recordInternalId: "hello-mello-patients",
            });

            if (!patients.length) {
                return;
            }

            const correspondencePromises = [];

            for (entry of patients) {
                correspondencePromises.push({
                    entryId: entry.recordValueId,
                    recordInternalId: "hello-mello-patients",
                    templateId: 10001777,
                    generatedFileDestinationField:
                        "1614495-medirecords-patient-correspondence",
                });
            }

            C.log("Generating PDF files...");
            C.log("----------------------------------------------------");
            await Promise.all(
                correspondencePromises.map((filePayload) => {
                    C.getPdfFromGoogleDocsTemplate(filePayload);
                })
            ).catch((err) => {
                throw err;
            });

            await C.updateEntries({
                updates: patients.map((p) => {
                    return {
                        value: { "1614495-correspondence-file-created": true },
                        recordInternalId: "hello-mello-patients",
                        entryId: p.recordValueId,
                    };
                }),
            }).catch((err) => {
                throw err;
            });

            C.log(`Updated page -> ${page} `);
            C.log(
                "Pdf fn time",
                " ",
                moment().tz("Australia/Sydney").format("HH:mm:ss a")
            );
            C.log("----------------------------------------------------");
            return;
        } catch (err) {
            throw err;
        }
    }

    // Utility function to wait for a specified amount of time
    function wait(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // Function to repeatedly call the async function until a condition is met
    async function callAsyncFunctionUntilConditionMet() {
        let page = 674;
        let limit = 675; // calculate according to how many total entries there is

        const coolDownTimeInMs = 60000; // 1 min

        const startTime = moment().tz("Australia/Sydney");

        while (page < limit) {
            C.log("Initiated Call Time", " ", startTime.format("HH:mm:ss a"));
            C.log("Current Page->", page);
            C.log("----------------------------------------------------");
            const executionTime = moment().tz("Australia/Sydney");
            const elapsedTime = executionTime.diff(startTime, "minutes");
            C.log(
                `Time elapsed until page -> ${page} execution`,
                " ",
                elapsedTime,
                " ",
                "minutes"
            );
            if (elapsedTime >= 30) { //15s
                C.log(
                    "Exiting.. Time elapsed",
                    " ",
                    elapsedTime,
                    " ",
                    "minutes"
                );
                return;
            }
            // Call the async function
            try {
                await generateCorrespondence(page);
                page++;
            } catch (err) {
                C.log("exiting.. err occured");
                return;
            }
            C.log(
                "now waiting for 1min before executing another call for cooldown"
            );
            C.log("----------------------------------------------------");

            // Wait for 1 minute before calling the async function again
            await wait(coolDownTimeInMs); // Wait for 1 minute
        }

        C.log("Completed batch operation!");
    }

    // Call the function to start the process
    return await callAsyncFunctionUntilConditionMet();
}