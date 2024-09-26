async function handler(C) {
    const quoted_fixed_price = "200028953";
    const billingType = C.getValue("132-billing-type")[0];

    let isHidden = true;
    if (billingType === quoted_fixed_price)
        isHidden = false;

    return C.mergeAll(
        C.setFieldHidden("132-quote-amount-to-charge", isHidden)
    );
}