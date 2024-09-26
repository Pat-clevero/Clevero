async function handler(C) {
    const calculation = ({
        rate = 0,
        quantity = 1,
        effectiveTaxRate = 0,
        discount = 0,
    }) => {
        let net = (rate - (discount / 100) * rate) * quantity;
        let total = net + (effectiveTaxRate / 100) * net;
        let tax = net * (effectiveTaxRate / 100);
        net = net.toFixed(2);
        total = total.toFixed(2);
        tax = tax.toFixed(2);

        return { net, total, tax };
    };

    const eventPayload = C.getEventPayload();
    const index = eventPayload.indices
        ? eventPayload.indices[0]
        : eventPayload.index;

    const eventLineItem = C.getSubValueBasedOnIndex("xero-order-items", index);
    console.log(eventLineItem);

    // Just update the Financials field when a line item is removed
    if (C.event.eventType === C.EVENTS.SUB_LINE_REMOVE) {
        const allLineItems = C.state.subValues["xero-order-items"];
        const newNet = allLineItems
            .map((v) => +v.net || 0)
            .reduce((agg, v) => agg + v, 0);
        const newTax = allLineItems
            .map((v) => +v.tax || 0)
            .reduce((agg, v) => agg + v, 0);
        const newTotal = allLineItems
            .map((v) => +v.total || 0)
            .reduce((agg, v) => agg + v, 0);
        return C.mergeAll(
            C.setValue("net-total", newNet),
            C.setValue("tax-total", newTax),
            C.setValue("total", newTotal)
        );
    }

    if (!eventLineItem) return;

    let fieldsToBeMapped = {};

    if (C.event.eventType === C.EVENTS.SUB_LINES_ADD) {
        fieldsToBeMapped = {};
    } else {
        if (C.event.eventType === C.EVENTS.SUB_CHANGE) {
            if (C.event.payload.field === "1918262-appointment" && eventLineItem["1918262-appointment"].length === 0) {
                // if Item field is cleared then reset every other fields
                const calculatedAmounts = calculation({
                    rate: 0,
                    quantity: +eventLineItem.quantity,
                    effectiveTaxRate: 0,
                    discount: 0,
                });
                fieldsToBeMapped = {
                    ...fieldsToBeMapped,
                    description: "",
                    rate: 0,
                    account: [],
                    ...calculatedAmounts,
                    discount: 0,
                    quantity: 1,
                    "1918262-clinician": "",
                    "tax-rate": [ "2058501" ],
                };
            } else {
                const effectiveTaxRate = 10; // 10% - hard-coded because some roles/portal users doesn't have access to Xero Tax Rates record
                const calculatedAmounts = calculation({
                    rate: +eventLineItem.rate || 0,
                    quantity: +eventLineItem.quantity,
                    effectiveTaxRate: effectiveTaxRate || 0,
                    discount: +eventLineItem.discount || 0,
                });
                fieldsToBeMapped = {
                    ...fieldsToBeMapped,
                    ...calculatedAmounts,
                };
            }
        } else {
            // for any other event that is not SUB_CHANGE and Item field is empty, reset every other fields
            calculatedAmounts = calculation({
                rate: 0,
                quantity: +eventLineItem.quantity,
                effectiveTaxRate: 0,
                discount: 0,
            });
            fieldsToBeMapped = {
                ...fieldsToBeMapped,
                description: "",
                rate: 0,
                account: [],
                ...calculatedAmounts,
                discount: 0,
                quantity: 1,
                "1918262-clinician": "",
                "tax-rate": [ "2058501" ],
            };
        }
    }

    // Update the event line item
    const updatedLineItem = C.updateSubValueBasedOnIndex(
        "xero-order-items",
        index,
        fieldsToBeMapped
    );
    const updatedLineItemId = Object.keys(
        updatedLineItem.subValues["xero-order-items"].update
    )[0];

    const lineValues = C.state.subValues["xero-order-items"];
    const actualLineValues = lineValues.filter(
        (lv) => lv.id.toString() !== updatedLineItemId
    );
    const lineValuesToBeUsed = [
        ...actualLineValues,
        updatedLineItem.subValues["xero-order-items"].update[updatedLineItemId],
    ];

    const newNet = lineValuesToBeUsed
        .map((v) => +v.net || 0)
        .reduce((agg, v) => agg + v, 0);
    const newTax = lineValuesToBeUsed
        .map((v) => +v.tax || 0)
        .reduce((agg, v) => agg + v, 0);
    const newTotal = lineValuesToBeUsed
        .map((v) => +v.total || 0)
        .reduce((agg, v) => agg + v, 0);

    return C.mergeAll(
        updatedLineItem,
        C.setValue("net-total", newNet),
        C.setValue("tax-total", newTax),
        C.setValue("total", newTotal)
    );
}