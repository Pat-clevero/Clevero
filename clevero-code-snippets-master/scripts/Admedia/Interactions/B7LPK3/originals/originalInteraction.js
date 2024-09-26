async function handler(C) {
    let actions = [];
    let onCharge = C.getValue("1662670-on-charge-to-client");

    if (onCharge[0] === "1142") {
        //Yes
        let markUp = C.getValue("1662670-mark-up")
            ? C.getValue("1662670-mark-up")
            : 0;
        let amount = C.getValue("1662670-amount")
            ? C.getValue("1662670-amount")
            : 0;

        let totalAmount = (markUp / 100) * amount + amount; // Adjusted to calculate the percentage

        actions.push(C.setValue("1662670-total-amount", totalAmount));
    } else {
        actions.push(C.setValue("1662670-total-amount", 0));
    }
    return C.mergeAll(actions);
}
