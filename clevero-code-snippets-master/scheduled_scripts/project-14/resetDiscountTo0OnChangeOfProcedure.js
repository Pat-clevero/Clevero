async function handler(C) {
    const internalId = C.event.payload.recordInternalId;
    const index = C.getEventPayload().index;
    const dataToChange = {
        discount: 0,
    };
    return C.mergeAll(
        C.updateSubValueBasedOnIndex(internalId, index, dataToChange)
    );
}

