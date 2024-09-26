async function handler(C) {
    const actions = [];
    const internalId = C.event.payload.recordInternalId;
    const index = C.event.payload.index;

    const procedureSelected = C.getSubValueBasedOnIndex(internalId, index)[
        "1918262-procedure"
    ][0];

    const procedureSelectedDetails = await C.api.getEntry({
        id: [procedureSelected],
        //responseType: "fov",
        responseType: "iov",
        recordId: 1974197,
    });

    const dataToChange = {
        //description: procedureSelectedDetails[19229] || "",
        description:
            procedureSelectedDetails["1918262-default-invoice-description"] ||
            "",
        //rate: procedureSelectedDetails[19097],
        rate: procedureSelectedDetails["1918262-default-rate"],
        //  tax: JSON.parse(procedureSelectedDetails[7009])
    };
    actions.push(C.updateSubValueBasedOnIndex(internalId, index, dataToChange));
    return C.mergeAll(actions);
}

