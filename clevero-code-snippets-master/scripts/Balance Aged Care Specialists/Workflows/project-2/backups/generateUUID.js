async function script(C) {
    const currentEntry = await C.getCurrentEntry();

    const uuidValue = nanoid();
    C.log("uuidValue-->", uuidValue);

    //let uuidFieldFound = currentEntry.hasOwnProperty("uuid");
    
    const response = await C.updateEntries({
            updates: [
                {
                    recordInternalId: "bacs-appointments",
                    entryId: currentEntry.recordValueId,
                    value: { uuid: uuidValue },
                },
            ],
        });

    // if (
    //     uuidFieldFound == false

    //     ||
    //     (uuidFieldFound == true && !currentEntry.uuid.length > 0)
    // ) {
    //     const response = await C.updateEntries({
    //         updates: [
    //             {
    //                 recordInternalId: "bacs-appointments",
    //                 entryId: currentEntry.recordValueId,
    //                 value: { uuid: uuidValue },
    //             },
    //         ],
    //     });
    // }
}
