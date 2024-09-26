async function script(C) {
    const currentEntry = await C.getCurrentEntry();
    C.addJsonToSummary({ currentEntry });
    let onCharge = currentEntry["1662670-on-charge-to-client"];
    let updateValue;
    if (onCharge[0] === 1142 || onCharge[0] === "1142") {
        const percentOptionValue = "2334943";
        const fixedOptionValue = "2334944";
        const markUpType = currentEntry["1662670-markup-type"];
        let markUp = 0;
        let amount = 0;
        if (markUpType == percentOptionValue) {
            markUp = currentEntry["1662670-mark-up"]
                ? +currentEntry["1662670-mark-up"]
                : 0;
            amount = currentEntry["1662670-amount"]
                ? +currentEntry["1662670-amount"]
                : 0;
            const totalAmount = (markUp / 100) * amount + amount;
            const markupAmount = (markUp / 100) * amount;
            updateValue = {
                "1662670-total-amount": totalAmount.toFixed(2),
                "1662670-markup-amount": markupAmount.toFixed(2),
            };
            C.log("Markup Type: Percent");
        } else if (markUpType == fixedOptionValue) {
            markUp = currentEntry["1662670-markup-amount"]
                ? +currentEntry["1662670-markup-amount"]
                : 0;
            amount = currentEntry["1662670-amount"]
                ? +currentEntry["1662670-amount"]
                : 0;
            const totalAmount = markUp + amount;
            const markupPercent = (markUp / amount) * 100;
            updateValue = {
                "1662670-total-amount": totalAmount.toFixed(2),
                "1662670-mark-up": markupPercent.toFixed(2),
            };
            C.log("Markup Type: Fixed Amount");
        } else {
            totalAmount = currentEntry["1662670-amount"];
        }
    } else {
        updateValue = {
            "1662670-total-amount": 0,
        };
    }

    const response = await C.updateEntries({
        updates: [
            {
                value: updateValue,
                entryId: currentEntry.recordValueId,
                recordInternalId: "admedia--expenses",
            },
        ],
    });

    return { response };
}
