async function script(C){
    const currentEntry = await C.getCurrentEntry();
    const client = currentEntry["1662670-organisation"];

    const clientEntry = await C.getEntry({
        recordInternalId: "admedia-organisations",
        entryId: +client[0],
        responseType: "iv",
    });

    const clientCOD = clientEntry["1662670-cod"] || false;

    const updateEntryResponse = await C.updateEntries({
        updates: [
            {
                value: {
                    "1662670-cod": Boolean(clientCOD),
                },
                entryId: currentEntry.recordValueId,
                recordInternalId: "admedia-projects",
            },
        ],
    });

    return { updateEntryResponse };
}