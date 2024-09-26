async function script(C) {
    const recordInternalId = "esap-australia-buildings";

    const sendEmail = async (entryId, buildingName) => {
        const recepientEmails = [
            "admin@esap.com.au",
            "john@esap.com.au",
        ];

        const recordId = 2221642;
        const templateId = 2313827;
        const subject = `${buildingName} is due for billing`;
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
            to: recepientEmails,
            subject,
            body,
            logEmail: [{ recordId, entryId }],
        });

        return { mergeResponse, emailResponse };
    };
    const activeStatusValue = "2221806";
    const filteredResult = await C.filterEntries({
        filter: [
            {
                requestType: "i",
                subject: "2181892-next-bill-date",
                type: "date",
                operator: "on_or_before",
                ignoreCase: true,
                value: {
                    relative: true,
                    value: "7",
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
                value: [activeStatusValue],
            },
        ],
        recordInternalId,
    });

    const buildingEntries = filteredResult.entries;
    const filteredEntriesData = buildingEntries.map((building) => ({
        recordValueId: building.recordValueId,
        "2181892-next-bill-date":
            building["2181892-next-bill-date"],
    }));
    C.addJsonToSummary(filteredEntriesData);

    const result = await Promise.all(
        buildingEntries.map(async (building) => {
            const entryId = building.recordValueId;
            const buildingName = building["2181892-building-name"];

            return await sendEmail(entryId, buildingName)
                .catch((error) => error);
        })
    );

    return { result };
}
