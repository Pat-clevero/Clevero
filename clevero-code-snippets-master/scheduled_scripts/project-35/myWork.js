async function handler(C) {
    const defaultTaxRateIdOnEmpty = "91232"; // TODO: investigate why empty array is not the default empty value 
    const safeJSONParse = (jsonStr, defaultVal = []) => {
        try {
            return JSON.parse(jsonStr);
        } catch (err) {
            return defaultVal;
        }
    };

    const calculation = ({
        rate = 0,
        quantity = 1,
        effectiveTaxRate = 0,
        discount = 0
    }) => {
        const net = (rate - discount / 100 * rate) * quantity;
        const total = (net + (effectiveTaxRate / 100) * net);
        const tax = net * (effectiveTaxRate / 100);

        return { net, total, tax };
    };

    const eventPayload = C.getEventPayload();
    const index = eventPayload.indices ? eventPayload.indices[0] : eventPayload.index;

    const eventLineItem = C.getSubValueBasedOnIndex(
        "xero-order-items",
        index
    );

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
            C.setValue("1795685-net", newNet),
            C.setValue("1795685-tax", newTax),
            C.setValue("1795685-total", newTotal)
        );
    }

    if (!eventLineItem) return;

    let fieldsToBeMapped = {};

    const itemRecordId = 463908;
    if (eventLineItem.item[0]) {
        const item = await C.api.getEntry({
            id: eventLineItem.item,
            responseType: "iov",
            recordId: itemRecordId,
        });

        const rate = C.event.payload.field === "item"
            ? +item["sales-details-unit-price"] || 0
            : +eventLineItem.rate
                ? eventLineItem.rate
                : +item["sales-details-unit-price"] || 0;

        const accountId =
            C.event.payload.field === "item"
                ? safeJSONParse(item["sales-details-account"])[0]
                : eventLineItem.account.length
                    ? eventLineItem.account[0]
                    : safeJSONParse(item["sales-details-account"])[0];

        let taxType = {};
        const taxTypeId =
            C.event.payload.field === "item"
                ? safeJSONParse(item["sales-details-tax-type"])[0]
                : eventLineItem["tax-rate"].length
                    ? eventLineItem["tax-rate"][0]
                    : safeJSONParse(item["sales-details-tax-type"])[0];
        const taxRatesRecordId = 34148;
        if (taxTypeId) {
            taxType = await C.api.getEntry({
                id: [taxTypeId],
                responseType: "iov",
                recordId: taxRatesRecordId,
            });
        }
        const effectiveTaxRate = +taxType["effective-tax-rate"] || 0;

        const calculatedAmounts = calculation({
            rate,
            quantity: +eventLineItem.quantity,
            discount: +eventLineItem.discount,
            effectiveTaxRate,
        });

        fieldsToBeMapped = {
            ...fieldsToBeMapped,
            description: item.description,
            rate,
            account: accountId ? [accountId.toString()] : [],
            "tax-rate": taxTypeId ? ["" + taxTypeId] : [],
            ...calculatedAmounts,
        };
    } else {
        if (C.event.eventType === C.EVENTS.SUB_LINES_ADD) {
            fieldsToBeMapped = {};
        } else {
            if (C.event.eventType === C.EVENTS.SUB_CHANGE) {
                if (C.event.payload.field === "item") { // if Item field is cleared then reset every other fields 
                    const calculatedAmounts = calculation({
                        rate: 0,
                        quantity: +eventLineItem.quantity,
                        effectiveTaxRate: 0
                    });
                    fieldsToBeMapped = {
                        ...fieldsToBeMapped,
                        description: "",
                        rate: 0,
                        account: [],
                        "tax-rate": [],
                        ...calculatedAmounts,
                    }
                } else { // if Item field is empty, sub item was changed, and the changed field is not the item field
                    let taxType = {};
                    if (eventLineItem["tax-rate"].length && eventLineItem["tax-rate"][0] !== defaultTaxRateIdOnEmpty) {
                        const taxRatesRecordId = 34148;
                        taxType = await C.api.getEntry({
                            id: [eventLineItem["tax-rate"][0]],
                            responseType: "iov",
                            recordId: taxRatesRecordId,
                        });
                    }
                    const effectiveTaxRate = +taxType["effective-tax-rate"] || 0;
                    const calculatedAmounts = calculation({
                        rate: +eventLineItem.rate || 0,
                        quantity: +eventLineItem.quantity,
                        effectiveTaxRate: effectiveTaxRate || 0
                    });
                    fieldsToBeMapped = {
                        ...fieldsToBeMapped,
                        ...calculatedAmounts
                    };
                }
            } else { // for any other event that is not SUB_CHANGE and Item field is empty, reset every other fields
                calculatedAmounts = calculation({
                    rate: 0,
                    quantity: +eventLineItem.quantity,
                    effectiveTaxRate: 0,
                });
                fieldsToBeMapped = {
                    ...fieldsToBeMapped,
                    description: "",
                    rate: 0,
                    account: [],
                    "tax-rate": [],
                    ...calculatedAmounts,
                };
            }
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
    const actualLineValues = lineValues.filter((lv) => lv.id.toString() !== updatedLineItemId);
    const lineValuesToBeUsed = [
        ...actualLineValues,
        updatedLineItem.subValues["xero-order-items"].update[updatedLineItemId]
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
        C.setValue("1795685-net", newNet),
        C.setValue("1795685-tax", newTax),
        C.setValue("1795685-total", newTotal)
    );
}