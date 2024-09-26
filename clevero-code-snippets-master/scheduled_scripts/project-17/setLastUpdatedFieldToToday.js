async function script(C){
    const currentDate = C.moment().tz('Australia/Sydney').format('YYYY-MM-DD');
    const currentEntry = await C.getCurrentEntry();
    const response = await C.updateEntries({
        updates: [
            {
                value: {
                    "last-updated": currentDate
                },
                entryId: currentEntry.recordValueId,
                recordInternalId: "neighbourhood-house-members",
            },
        ],
    });

    return response;
}