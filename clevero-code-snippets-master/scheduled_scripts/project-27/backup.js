async function handler(C) {
    const internalId = C.event.payload.recordInternalId;

    const subValues = await C.getAllSubValues(internalId);

    console.log(subValues);
}
