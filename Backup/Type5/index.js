async function handler(C) {
    console.log("Handler started");

    const safeJSONParse = (jsonStr, defaultVal = []) => {
        try {
            return JSON.parse(jsonStr);
        } catch (err) {
            console.error("JSON parsing error:", err, jsonStr);
            return defaultVal;
        }
    };

    const calculation = ({
        rate = 0,
        quantity = 1,
        effectiveTaxRate = 0,
    }) => {
        const net = rate * quantity;
        const total = net + (effectiveTaxRate / 100) * net;
        const tax = net * (effectiveTaxRate / 100);

        return { net, total, tax };
    };

    try {
        const eventPayload = C.getEventPayload();
        console.log("Event Payload:", eventPayload);

        const index = eventPayload.indices ? eventPayload.indices[0] : eventPayload.index;
        console.log("Index:", index);

        const eventLineItem = C.getSubValueBasedOnIndex(
            "type-5--working-order-items",
            index
        );
        console.log("Event Line Item:", eventLineItem);

        if (!eventLineItem) {
            console.warn("No event line item found, exiting handler");
            return;
        }

        if (C.event.eventType === C.EVENTS.SUB_LINE_REMOVE) {
            console.log("Line item removed, updating financials");
            const allLineItems = C.state.subValues["type-5--working-order-items"];
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
                C.setValue("2316658-net", newNet),
                C.setValue("2316658-tax", newTax),
                C.setValue("2316658-total", newTotal)
            );
        }

        let fieldsToBeMapped = {};
        const itemRecordId = 2316697; // type-5--order-items

        if (eventLineItem.item) {
            console.log("Item field is populated, fetching item details");
            try {
                // Get order item
                const item = await C.api.getEntry({
                    id: eventLineItem.item,
                    responseType: "iov",
                    recordId: itemRecordId,
                });
                console.log("Item details fetched:", item);
                
                // Get working item
                const workingItem = await C.api.getEntry({
                    id: eventLineItem["316658-item-sub"][0],
                    responseType: "iov",
                    recordId: 2316683,
                });
                console.log("Working Item details fetched:", item);

                const description = C.event.payload.field === "item"
                    ? item["2316658-description-sub"] || ""
                    : eventLineItem.description
                        ? eventLineItem.description
                        : item["2316658-description-sub"] || "";
                
                const rate = C.event.payload.field === "item"
                    ? +item["2316658-unit-price"] || 0
                    : +eventLineItem.rate
                        ? eventLineItem.rate
                        : +item["2316658-unit-price"] || 0;

                const accountId =
                    C.event.payload.field === "item"
                        ? safeJSONParse(item["sales-details-account"])[0]
                        : eventLineItem.account.length
                            ? eventLineItem.account[0]
                            : safeJSONParse(item["sales-details-account"])[0];

                // let taxType = {};
                // const taxTypeId =
                //     C.event.payload.field === "item"
                //         ? safeJSONParse(item["sales-details-tax-type"])[0]
                //         : eventLineItem["tax-rate"].length
                //             ? eventLineItem["tax-rate"][0]
                //             : safeJSONParse(item["sales-details-tax-type"])[0];

                // const taxRatesRecordId = 34148;
                // if (taxTypeId) {
                //     console.log("Fetching tax type details");
                //     taxType = await C.api.getEntry({
                //         id: [taxTypeId],
                //         responseType: "iov",
                //         recordId: taxRatesRecordId,
                //     });
                //     console.log("Tax type details fetched:", taxType);
                // }
                // const effectiveTaxRate = +taxType["effective-tax-rate"] || 0;

                const calculatedAmounts = calculation({
                    rate,
                    quantity: +eventLineItem.quantity,
                    effectiveTaxRate 
                });

                fieldsToBeMapped = {
                    ...fieldsToBeMapped,
                    description,
                    rate,
                    account: accountId ? [accountId.toString()] : [],
                    "tax-rate": taxTypeId ? ["" + taxTypeId] : [],
                    ...calculatedAmounts,
                };
                
                if(C.event.eventType === C.EVENTS.SUB_CHANGE 
                    && C.event.payload.field === "item")
                    fieldsToBeMapped.quantity = 1;
            } catch (err) {
                console.error("Error fetching item or tax type details:", err);
            }
        } else {
            if (C.event.eventType === C.EVENTS.SUB_LINES_ADD) {
                console.log("New line added");
                fieldsToBeMapped = {};
            } else {
                if (C.event.eventType === C.EVENTS.SUB_CHANGE) {
                    if (C.event.payload.field === "item") {
                        console.log("Item field cleared, resetting fields");
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
                    } else {
                        console.log("Sub item changed, recalculating based on current values");
                        try {
                            // let taxType = {};
                            // if (eventLineItem["tax-rate"].length) {
                            //     const taxRatesRecordId = 34148;
                            //     taxType = await C.api.getEntry({
                            //         id: [eventLineItem["tax-rate"][0]],
                            //         responseType: "iov",
                            //         recordId: taxRatesRecordId,
                            //     });
                            //     console.log("Tax type details fetched:", taxType);
                            // }
                            // const effectiveTaxRate = +taxType["effective-tax-rate"] || 0;
                            const calculatedAmounts = calculation({
                                rate: +eventLineItem.rate || 0,
                                quantity: +eventLineItem.quantity,
                                // effectiveTaxRate: effectiveTaxRate || 0
                            });
                            fieldsToBeMapped = {
                                ...fieldsToBeMapped,
                                ...calculatedAmounts
                            };
                        } catch (err) {
                            console.error("Error fetching tax type details:", err);
                        }
                    }
                } else {
                    console.log("Other event type, resetting fields");
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

        console.log("Fields to be mapped:", fieldsToBeMapped);
        const updatedLineItem = C.updateSubValueBasedOnIndex(
            "type-5--working-order-items",
            index,
            fieldsToBeMapped
        );
        console.log("Updated Line Item:", updatedLineItem);
        
        const updatedLineItemId = Object.keys(
            updatedLineItem.subValues["type-5--working-order-items"].update
        )[0];

        const lineValues = C.state.subValues["type-5--working-order-items"];
        const actualLineValues = lineValues.filter((lv) => lv.id.toString() !== updatedLineItemId);
        const lineValuesToBeUsed = [
            ...actualLineValues,
            updatedLineItem.subValues["type-5--working-order-items"].update[updatedLineItemId]
        ];

        const newNet = lineValuesToBeUsed.map((v) => +v.net || 0).reduce((agg, v) => agg + v, 0);
        const newTax = lineValuesToBeUsed.map((v) => +v.tax || 0).reduce((agg, v) => agg + v, 0);
        const newTotal = lineValuesToBeUsed.map((v) => +v.total || 0).reduce((agg, v) => agg + v, 0);
        
        // const newNet = lineValues.map((v) => +v.amount).reduce((agg, v) => agg + v, 0);
        // const newTax = lineValues.map((v) => +v.tax).reduce((agg, v) => agg + v, 0);
        // const newTotal = lineValues
        //     .map((v) => +v["gross-amount"])
        //     .reduce((agg, v) => agg + v, 0);

        console.log("New Net:", newNet);
        console.log("New Tax:", newTax);
        console.log("New Total:", newTotal);

        return C.mergeAll(
            updatedLineItem,
            C.setValue("2316658-net", newNet),
            C.setValue("2316658-tax", newTax),
            C.setValue("2316658-total", newTotal)
        );

    } catch (err) {
        console.error("Error in handler:", err);
    }

    console.log("Handler finished");
}
