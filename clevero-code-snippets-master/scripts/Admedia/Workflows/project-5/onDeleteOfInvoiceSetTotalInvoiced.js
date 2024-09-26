async function script(C) {
    let projectId = C.utilityInputs
        .task
        .event
        .eventMetadata
        .data
        .oldValues
        .value["1662670-project"][0];

    const sum = await C.sumAssociations(
        [projectId],
        "admedia-projects",
        ["invoices"],
        "net-total"
    );
    const totalInvoiced = Object.values(sum)[0].invoices;

    let projectObject = await C.getEntry({
        recordInternalId: "admedia-projects",
        entryId: projectId,
    });
    const quotedCampaignBudget = +projectObject["1662670-quoted-campaign-budget"] || 0;
    const amountRemaining = quotedCampaignBudget - totalInvoiced;

    const updatedProjectResponse = await C.updateEntries({
        updates: [
            {
                value: {
                    "1662670-total-invoiced": +totalInvoiced,
                    "1662670-amount-remaining": +amountRemaining,
                },
                recordInternalId: "admedia-projects",
                entryId: projectId,
            },
        ],
    });

    return { updatedProjectResponse };
}