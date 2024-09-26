async function script(C) {
    const recordInternalId = "esap-australia-buildings";

    const sendEmail = async (entryId, buildingName) => {
        const recepientEmail = "john@esap.com.au";
        const recordId = 2221642;
        const templateId = 2315274;
        const subject = `Building due for completion ${buildingName}`;
        const emailInput = {
            entryId,
            recordInternalId,
            templateId,
            subject,
        };
        const mergeResponse = await C.mergeEmailTemplate(emailInput);
        const replacements = {
            "{{[2181892-building-name]}}": buildingName,
        };
        const body = mergeResponse.body.replace(
            /{{\[([\d-]+)\]}}/g,
            (match) => replacements[match] || match
        );

        const emailResponse = await C.sendEmail({
            entryId,
            recordInternalId,
            from: {
                email: "notifications@mailvero.com",
                name: "Clevero Notification Service",
            },
            to: [recepientEmail],
            subject,
            body,
            logEmail: [{ recordId, entryId }],
        });

        return { mergeResponse, emailResponse };
    };

    const filteredResult = await C.filterEntries({
        filter: [
            [
                {
                    requestType: "i",
                    subject: "2181892-expected-building-completion-date",
                    type: "date",
                    operator: "equals",
                    ignoreCase: true,
                    value: {
                        relative: true,
                        value: "30",
                        type: "PLUS_DAYS",
                    },
                },
                "and",
                {
                    requestType: "i",
                    subject: "2181892-status",
                    type: "array",
                    operator: "any_of",
                    ignoreCase: true,
                    value: ["2239344"],
                },
                "and",
                [
                    {
                        requestType: "i",
                        subject: "2181892-install-reminder-sent",
                        type: "checkbox",
                        operator: "is_false",
                        ignoreCase: true,
                    },
                    "or",
                    {
                        requestType: "i",
                        subject: "2181892-install-reminder-sent",
                        type: "checkbox",
                        operator: "is_empty",
                        ignoreCase: true,
                    },
                ],
            ],
        ],
        recordInternalId,
    });

    const buildingEntries = filteredResult.entries;
    const filteredEntriesData = buildingEntries.map((building) => ({
        recordValueId: building.recordValueId,
        "2181892-expected-building-completion-date":
            building["2181892-expected-building-completion-date"],
    }));
    C.addJsonToSummary(filteredEntriesData);

    const result = await Promise.all(
        buildingEntries.map(async (building) => {
            const entryId = building.recordValueId;
            const buildingName = building["2181892-building-name"];

            return await sendEmail(entryId, buildingName)
                .then(async (emailResult) => {
                    const updateResult = await C.updateEntries({
                        updates: [
                            {
                                value: {
                                    "2181892-install-reminder-sent": true,
                                },
                                entryId: entryId,
                                recordInternalId,
                            },
                        ],
                    });

                    return { emailResult, updateResult };
                })
                .catch((error) => error);
        })
    );

    return { result };
}
