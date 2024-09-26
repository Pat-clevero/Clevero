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
    const defaultInvoiceDescription = procedureSelectedDetails && procedureSelectedDetails.hasOwnProperty("1918262-default-invoice-description")
        ? procedureSelectedDetails["1918262-default-invoice-description"]
        : "";

    const patientSelected = C.getValue("1918262-patient");
    let patientObject = await C.api.getEntry({
        recordId: "1987160",
        responseType: "iov",
        id: patientSelected,
    });

    const patientName =  patientObject && patientObject.hasOwnProperty("1918262-full-name")
        ?  patientObject["1918262-full-name"]
        : "";

    const dataToChange = {
        //description: procedureSelectedDetails[19229] || "",
        description: `${patientName} - ${defaultInvoiceDescription}`,
        //rate: procedureSelectedDetails[19097],
        rate: procedureSelectedDetails["1918262-default-rate"],
        //  tax: JSON.parse(procedureSelectedDetails[7009])
    };
    actions.push(C.updateSubValueBasedOnIndex(internalId, index, dataToChange));
    return C.mergeAll(actions);
}
