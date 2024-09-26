async function script(C) {
    const currentEntry = await C.getCurrentEntry();
    let onCharge = currentEntry["1662670-on-charge-to-client"];
    let totalAmount;
    if (onCharge[0] === 1142 || onCharge[0] === "1142") {
        let markUp = currentEntry["1662670-mark-up"]
            ? +currentEntry["1662670-mark-up"]
            : 0;
        let amount = currentEntry["1662670-amount"]
            ? +currentEntry["1662670-amount"]
            : 0;

        totalAmount = (markUp / 100) * amount + amount; // Adjusted to calculate the percentage
    } else {
        totalAmount = 0;
    }
    
    const response = await C.updateEntries({
        updates: [
            {
                value: {
                    "1662670-total-amount": totalAmount,
                },
                entryId: currentEntry.recordValueId,
                recordInternalId: "admedia--expenses",
            },
        ],
    });

    return {response};
}

