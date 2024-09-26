async function handler(C) {
    // console.log("updating entire line item from clevero")
    const calculation = ({
        rate = 0,
        quantity = 1,
        effectiveTaxRate = 0,
        markup = 0,
    }) => {
        let net = (rate * quantity);
        net += (markup / 100) * net;
        const total = (net + (effectiveTaxRate / 100) * net);
        const tax = net * (effectiveTaxRate / 100);

        return {
            net: net.toFixed(2),
            total: total.toFixed(2),
            tax: tax.toFixed(2),
        };
    };

    const eventPayload = C.getEventPayload();

    const index = eventPayload.indices ? eventPayload.indices[0] : eventPayload.index;

    const eventLineItem = C.getSubValueBasedOnIndex(
        "forklift-parts-used",
        index
    );
    if (!eventLineItem) console.error("No line item found");

    let fieldsToBeMapped = {};

    if (C.event.eventType === C.EVENTS.SUB_LINES_ADD) {
        fieldsToBeMapped = {};
    } else {
        if (C.event.eventType === C.EVENTS.SUB_CHANGE) {
            let taxType = {};
            if (eventLineItem["tax-rate"].length) {
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
                effectiveTaxRate: effectiveTaxRate || 0,
                markup: +eventLineItem["mark-up"] || 0
            });
            fieldsToBeMapped = {
                ...fieldsToBeMapped,
                ...calculatedAmounts
            };
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

    // Update the event line item
    const updatedLineItem = C.updateSubValueBasedOnIndex(
        "forklift-parts-used",
        index,
        fieldsToBeMapped
    );

    return C.mergeAll(updatedLineItem);
}
