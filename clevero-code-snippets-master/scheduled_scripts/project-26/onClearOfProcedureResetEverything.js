async function handler(C) {
    const actions = [];
    const internalId = C.event.payload.recordInternalId;
    const index = C.event.payload.index;

    const subRecordValue = C.getSubValueBasedOnIndex(internalId, index);

    if (!subRecordValue.hasOwnProperty("1918262-procedure") || subRecordValue["1918262-procedure"].length === 0) {
        const dataToChange = {
            description: "",
            quantity: 1,
            rate: 0,
            discount: 0,
            "tax-rate": [
                "2058501"
            ],
            tax: 0,
            net: 0,
            total: 0,
        };
        actions.push(C.updateSubValueBasedOnIndex(internalId, index, dataToChange));
    }

    return C.mergeAll(actions);
}