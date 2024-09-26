// Async function named "script" that takes a parameter "C"
async function script(C) {
    // Await the result of filtering entries using "C.filterEntries"
    let filteredEntries = await C.filterEntries({
        filter: [
            // First filter condition: Entries with a non-empty "1795685-law-firm" array
            {
                subject: "1795685-law-firm",
                requestType: "i",
                type: "array",
                operator: "not_empty",
                ignoreCase: true,
            },
            // Second filter condition: Entries with All Materials Received unticked or not set
            "and",
            [
                {
                    subject: "1795685-all-materials-received",
                    requestType: "i",
                    type: "checkbox",
                    operator: "is_false",
                    ignoreCase: true
                },
                "or",
                {
                    subject: "1795685-all-materials-received",
                    requestType: "i",
                    type: "checkbox",
                    operator: "is_empty",
                    ignoreCase: true
                },
            ],
            "and",
            // Third filter condition: Entries with a "1795685-start-time" within the next 3 days
            {
                subject: "1795685-start-time",
                requestType: "i",
                type: "datetime",
                operator: "within",
                ignoreCase: true,
                value: {
                    from: {
                        relative: true,
                        value: 3,
                        type: {
                            type: "START_OF",
                            ref: "next_x_days",
                        },
                    },
                    to: {
                        relative: true,
                        value: 3,
                        type: {
                            type: "END_OF",
                            ref: "next_x_days",
                        },
                    },
                },
            },
        ],
        limit: 100,
        recordInternalId: "ferrari-consulting-group-appointments",
    });

    // Check if there are entries in the filtered result
    if (filteredEntries.entries && filteredEntries.entries.length) {
        // Extract the entries from the filtered result
        const entries = filteredEntries.entries;

        // Iterate over entries without materials
        for (const currentEntry of filteredEntries.entries) {
            // Get the law firm ID from the current entry
            // const lawFirm = currentEntry["1795685-law-firm"][0];

            // // Fetch details of the law firm entry from "standard-organisations"
            // const lawFirmDetail = await C.getEntry({
            //     recordInternalId: "standard-organisations",
            //     entryId: lawFirm,
            // });

            // Get the email of the law firm
            // const email = lawFirmDetail.email;
            const email = currentEntry["1795685-referrer-email"] || "";

            if (email) {
                // Send an email using "C.sendEmail"
                const sendEmail = await C.sendEmail({
                    entryId: currentEntry.recordValueId,
                    recordInternalId: "ferrari-consulting-group-appointments",
                    from: {
                        email: "reports@ferrariconsultinggroup.com",
                        name: "Ferrari Consulting Group",
                    },
                    to: [email],
                    templateId: 2525139,
                    logEmail: [
                        {
                            recordId: 1821782,
                            entryId: currentEntry.recordValueId,
                        },
                    ],
                });

                // Log the response of email sending
                C.log("Email sending response:", sendEmail);
            } else {
                C.log({
                    mssg: `No referral email found for appointment id: ${currentEntry.recordValueId}`,
                });
            }
        }
    }
}

