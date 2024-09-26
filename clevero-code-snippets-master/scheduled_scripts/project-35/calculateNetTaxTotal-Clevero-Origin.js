async function handler(C) {
    const safeJSONParse = (jsonStr, defaultVal = []) => {
        try {
            return JSON.parse(jsonStr);
        } catch (err) {
            return defaultVal;
        }
    };

    const event = C.getEventPayload();

    const index = event.indices ? event.indices[0] : event.index;

    const line = C.getSubValueBasedOnIndex(
        "general-consultants-order-items",
        index
    );

    if (C.event.eventType === C.EVENTS["SUB_LINE_REMOVE"]) {
        const lines = C.state.subValues["general-consultants-order-items"];
        const newNet = lines
            .map((v) => +v.amount || 0)
            .reduce((agg, v) => agg + v, 0);
        const newTax = lines
            .map((v) => +v.tax || 0)
            .reduce((agg, v) => agg + v, 0);
        const newTotal = lines
            .map((v) => +v["gross-amount"] || 0)
            .reduce((agg, v) => agg + v, 0);

        return C.mergeAll(
            C.setValue("subtotal", newNet),
            C.setValue("tax-total", newTax),
            C.setValue("total", newTotal)
        );
    }

    if (!line) return;

    let fieldsToBeMapped = {};

    function calculation({ rate = 0, quantity = 1, tax = 0 }) {
        const net = rate * quantity;
        const total = net + (tax / 100) * net;
        const taxTotal = net * (tax / 100);
        return { amount: net, "gross-amount": total, tax: taxTotal };
    }

    if (line.item[0]) {
        const item = await C.api.getEntry({
            id: line.item,
            responseType: "iov",
            recordId: 6642,
        });

        // if (!item) return;
        const rate =
            C.event.payload.field === "item"
                ? +item["sales-details-unit-price"] || 0
                : +line.rate
                ? +line.rate
                : +item["sales-details-unit-price"] || 0;

        const accountId =
            C.event.payload.field === "item"
                ? safeJSONParse(item["sales-details-account"])[0]
                : line.account.length
                ? line.account[0]
                : safeJSONParse(item["sales-details-account"])[0];

        let taxType = {};

        const taxTypeId =
            C.event.payload.field === "item"
                ? safeJSONParse(item["sales-details-tax-type"])[0]
                : line["tax-rate"].length
                ? line["tax-rate"][0]
                : safeJSONParse(item["sales-details-tax-type"])[0];

        if (taxTypeId) {
            taxType = await C.api.getEntry({
                id: [taxTypeId],
                responseType: "iov",
                recordId: 34148,
            });
        }

        const effectiveTaxRate = +taxType["effective-tax-rate"] || 0;

        const calcuatedAmounts = calculation({
            rate,
            quantity: +line.quantity,
            tax: effectiveTaxRate,
        });

        fieldsToBeMapped = {
            ...fieldsToBeMapped,
            description: item.description,
            rate,
            account: accountId ? ["" + accountId] : [],
            "tax-rate": taxTypeId ? ["" + taxTypeId] : [],
            ...calcuatedAmounts,
        };
    } else {
        if (C.event.eventType === C.EVENTS["SUB_LINES_ADD"]) {
            fieldsToBeMapped = {};
        } else {
            if (C.event.eventType === C.EVENTS["SUB_CHANGE"]) {
                if (C.event.payload.field === "item") {
                    const calcuatedAmounts = calculation({
                        rate: 0,
                        quantity: +line.quantity,
                        tax: 0,
                    });
                    fieldsToBeMapped = {
                        ...fieldsToBeMapped,
                        description: "",
                        rate: 0,
                        account: [],
                        "tax-rate": [],
                        ...calcuatedAmounts,
                    };
                } else {
                    let taxType = {};
                    if (line["tax-rate"].length) {
                        taxType = await C.api.getEntry({
                            id: [line["tax-rate"][0]],
                            responseType: "iov",
                            recordId: 34148,
                        });
                    }

                    const effectiveTaxRate =
                        +taxType["effective-tax-rate"] || 0;
                    const calcuatedAmounts = calculation({
                        rate: +line.rate || 0,
                        quantity: +line.quantity,
                        tax: effectiveTaxRate || 0,
                    });
                    fieldsToBeMapped = {
                        ...fieldsToBeMapped,
                        ...calcuatedAmounts,
                    };
                }
            } else {
                const calcuatedAmounts = calculation({
                    rate: 0,
                    quantity: +line.quantity,
                    tax: 0,
                });
                fieldsToBeMapped = {
                    ...fieldsToBeMapped,
                    description: "",
                    rate: 0,
                    account: [],
                    "tax-rate": [],
                    ...calcuatedAmounts,
                };
            }
        }
    }

    const updatedLine = C.updateSubValueBasedOnIndex(
        "general-consultants-order-items",
        index,
        fieldsToBeMapped
    );

    const lineValues = C.state.subValues["general-consultants-order-items"];

    const updatedLineId = Object.keys(
        updatedLine.subValues["general-consultants-order-items"]["update"]
    )[0];

    const actualLineValues = lineValues.filter((lv) => lv.id !== updatedLineId);

    const lineValuesToBeUsed = [
        ...actualLineValues,
        updatedLine.subValues["general-consultants-order-items"]["update"][
            updatedLineId
        ],
    ];

    const newNet = lineValuesToBeUsed
        .map((v) => +v.amount || 0)
        .reduce((agg, v) => agg + v, 0);
    const newTax = lineValuesToBeUsed
        .map((v) => +v.tax || 0)
        .reduce((agg, v) => agg + v, 0);
    const newTotal = lineValuesToBeUsed
        .map((v) => +v["gross-amount"] || 0)
        .reduce((agg, v) => agg + v, 0);

    return C.mergeAll(
        updatedLine,
        C.setValue("subtotal", newNet),
        C.setValue("tax-total", newTax),
        C.setValue("total", newTotal)
    );
}
