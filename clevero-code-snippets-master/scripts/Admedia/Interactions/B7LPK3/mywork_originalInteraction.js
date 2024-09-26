async function handler(C) {
    const yesValue = "1142";
    const percentOptionValue = "2334943";
    const fixedOptionValue = "2334944";

    const isChargedToClient = +C.getValue("1662670-on-charge-to-client")[0];
    const markupType = +C.getValue("1662670-markup-type")[0];
    const markUp = +C.getValue("1662670-mark-up") || 0;
    const markUpAmount = +C.getValue("1662670-markup-amount") || 0;
    const amount = +C.getValue("1662670-amount") || 0;

    let actions = [];
    switch (C.event.payload.field) {
        case "1662670-on-charge-to-client":
            actions.push(C.setValue("1662670-markup-type", []));
        case "1662670-markup-type":
            actions.push(C.setValue("1662670-mark-up", 0));
            actions.push(C.setValue("1662670-markup-amount", 0));
            actions.push(C.setValue("1662670-total-amount", amount));
            break;
    }

    let totalAmount = 0;
    if (isChargedToClient == yesValue) {
        if (markupType == percentOptionValue) {
            totalAmount = (markUp / 100) * amount + amount;
            const mAmount = (markUp / 100) * amount;

            actions.push(
                C.setValue("1662670-markup-amount", mAmount.toFixed(2)));
        } else if (markupType == fixedOptionValue) {
            totalAmount = markUpAmount + amount;
            const mrkUp = (markUpAmount / amount) * 100;

            actions.push(
                C.setValue("1662670-mark-up", mrkUp.toFixed(2)));
        } else
            totalAmount = amount;
    }
    // console.log({markUp, markUpAmount, amount, totalAmount});
    actions.push(
        C.setValue("1662670-total-amount", totalAmount.toFixed(2)));
    return C.mergeAll(actions);
}
