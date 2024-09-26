async function script(C) {
    const currentEntry = await C.getCurrentEntry();
    const entryId = currentEntry.recordValueId;
    C.addJsonToSummary({ currentEntry });

    const updateEntryResponse = await C.updateEntries({
        updates: [
            {
                value: {
                    "90858-status": [102570],
                },
                entryId,
                recordInternalId: "bacs-appointments",
            },
        ],
    });

    if (!currentEntry["assigned-to"])
        return { message: "Assigned To is not set. No SMS message sent." };

    const assignedToObject = await C.getEntry({
        recordInternalId: "employees",
        entryId: currentEntry["assigned-to"][0],
    });
    C.addJsonToSummary({ assignedToObject });

    if (!assignedToObject.phone)
        return { message: "Assigned To person's phone is not set. No SMS message sent." };

    const sendSmsResponse = await C.sendSms({
        entryId: entryId,
        to: [assignedToObject.phone],
        templateId: 102574,
        recordInternalId: "bacs-appointments",
    }).then((response) => {
        if (response.success.length > 0) {
            const messageSentStatus = response.success[0].messageSentStatus;
            return C.createEntries({
                values: [
                    {
                        "message-id": "",
                        "phone": messageSentStatus.to,
                        "message": messageSentStatus.body,
                        "date": messageSentStatus.dateCreated,
                    }
                ],
                recordInternalId: "sms",
                options: {
                    returnRecordInfo: true,
                    makeAutoId: true,
                },
            });
        };

        C.addJsonToSummary(response);
        return { message: `SMS send failed.` };
    });

    return { updateEntryResponse, sendSmsResponse };
}