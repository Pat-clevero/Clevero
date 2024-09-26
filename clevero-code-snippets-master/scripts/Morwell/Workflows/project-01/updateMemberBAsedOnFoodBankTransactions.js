async function script(C) {
    const currentEntry = await C.getCurrentEntry();
    const eventType = C.utilityInputs.task.event.event;
    let member = eventType === "AFTER_DELETE"
        ? C.utilityInputs
            .task
            .event
            .eventMetadata
            .data
            .oldValues
            .value.member
        : currentEntry.member;

    C.addJsonToSummary({ member });
    
    if (!member || !member[0])
        return { message: "No member is assigned to the current Food Bank Transaction entry." };

    const filteredResult = await C.filterEntries({
        filter: [
            {
                requestType: "i",
                subject: "member",
                type: "array",
                operator: "any_of",
                ignoreCase: true,
                value: member,
            },
        ],
        recordInternalId: "neighbourhood-house-food-bank",
    });

    const totalFoodBankTransactions = filteredResult.entries.length;

    const totalNumberOfPortions = filteredResult.entries
        .map(transaction => transaction["pre-prepared-portions"] || 0)
        .reduce((agg, v) => agg + v, 0);

    const totalWeightOfFood = filteredResult.entries
        .map(transaction => transaction["total-weight"] || 0)
        .reduce((agg, v) => agg + v, 0);

    const value = {
        "151707-total-food-bank-transactions": totalFoodBankTransactions,
        "151707-total-number-of-portions": totalNumberOfPortions,
        "151707-total-weight-of-food": totalWeightOfFood,
    };
    C.addJsonToSummary({ value });

    const result = await C.updateEntries({
        updates: [
            {
                value,
                entryId: member[0],
                recordInternalId: "neighbourhood-house-members",
            },
        ],
    });

    return { result };
}