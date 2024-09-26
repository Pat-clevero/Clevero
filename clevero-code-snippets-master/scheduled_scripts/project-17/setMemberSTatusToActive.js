async function script(C) {
    const currentEntry = await C.getCurrentEntry();
    const response = await C.updateEntries({
        updates: [
            {
                value: {
                    "member-status": [ 132986 ]
                },
                entryId: currentEntry.recordValueId,
                recordInternalId: "neighbourhood-house-members",
            },
        ],
    });

    return response;
}