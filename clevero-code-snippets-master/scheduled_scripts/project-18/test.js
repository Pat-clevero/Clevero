async function script(C) {
    const tourEntry = await C.getEntry({
        recordInternalId: "life-tours",
        entryId: 307568,
    });

    C.log(tourEntry);
}