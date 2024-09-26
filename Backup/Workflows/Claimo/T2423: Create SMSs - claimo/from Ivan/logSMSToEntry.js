async function logSmsToEntry(
    entryId,
    recordId,
    recipientMobile,
    messageReceived,
    messageId,
    ) {
    return await C.addRelationship({
        messageData: {
            to: recipientMobile,
            body: messageReceived,
            messageId,
        },
        type: "sms",
        linkedEntries: [{
            recordId,
            entryId,
        }],
    });
}