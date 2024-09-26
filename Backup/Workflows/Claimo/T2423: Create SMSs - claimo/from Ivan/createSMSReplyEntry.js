async function createSmsReplyEntry({
    recordInternalId,    // required
    parentId,
    message,
    timeStamp,
    customFields = {},
}) {
    if (!recordInternalId) throw new Error("recordInternalId is required.");
    const value = {
        "2580357-parent-sms": [parentId],
        "2580357-message-received": message,
        "2580357-datetime": timeStamp,
        "2580357-type": [10010111], // receive,
        ...customFields,
    };
    C.log({ value });

    return await C.createEntry({
        recordInternalId,
        value,
    });
}