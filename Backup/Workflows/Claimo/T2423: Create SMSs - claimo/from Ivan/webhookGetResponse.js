async function script(C) {
    const isTesting = false;

    const eventMetadata = C.getEventMetadata();
    C.addJsonToSummary({ eventMetadata });

    const smsId = isTesting
        ? "094e6e62-329b-11ef-8fab-dd95105ab077"
        : eventMetadata.body.campaignID;
    const message = isTesting ? "test message" : eventMetadata.body.messageText;
    const recordInternalId = "ferrari-consulting-group-sms";

    const results = await C.filterEntries({
        filter: [
            {
                subject: "1795685-message-id",
                requestType: "i",
                type: "text",
                operator: "equals",
                ignoreCase: true,
                value: smsId,
            },
        ],
        recordInternalId,
    })
        .then(async (result_Filter) => {
            C.addJsonToSummary({ result_Filter });
            const parentSms = result_Filter.entries[0];
            const result_CreateNewSmsEntry = await C.createEntry({
                recordInternalId,
                value: {
                    "1795685-parent-sms": [parentSms.recordValueId],
                    "1795685-appointment": parentSms["1795685-appointment"],
                    "1795685-message-received": message,
                    "1795685-date-time": moment(),
                    "1795685-type": [10009091], // receive
                },
            });

            return result_CreateNewSmsEntry;
        })
        .then(async (result_CreateNewSmsEntry) => {
            const result_SendEmail = await C.sendEmail({
                entryId: result_CreateNewSmsEntry.success[0].id,
                recordInternalId,
                from: {
                    email: "notifications@mailvero.com",
                    name: "Clevero Notification",
                },
                to: [
                    "reports@ferrariconsultinggroup.com",
                    "lez.yeoh@clevero.co",
                ],
                templateId: 10009294,
                subject: "A new SMS message has been received!",
                //body: "",
            });

            return {
                result_CreateNewSmsEntry,
                result_SendEmail,
            };
        })
        .then(async (results) => {
            const eventMetadata = C.getEventMetadata();
            const user = eventMetadata.body.reference;
            C.addJsonToSummary({ user });

            const newSmsEntryId =
                results.result_CreateNewSmsEntry.success[0].id;
            try {
                C.sendNotification({
                    payload: {
                        message: "A new SMS message has been received.",
                        metadata: {
                            redirectUrl: `/app/records/3000168/view/${newSmsEntryId}`,
                        },
                        topic: "COMMUNICATIONS",
                        subTopic: "EMAIL_REPLY",
                    },
                    audience: "USER",
                    employeeId: user,
                });
                C.log("Notification sent");
            } catch (error) {
                C.addJsonToSummary(error);
            }
        });

    return results;
}

