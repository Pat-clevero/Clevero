async function handler(C) {
    let actions = [];

    const safeJSONParse = (jsonStr, defaultVal = []) => {
        try {
            return JSON.parse(jsonStr);
        } catch (err) {
            return defaultVal;
        }
    };

    const index = C.getEventPayload().index;

    const line = C.getSubValueBasedOnIndex("bacs-income", index);
    if (!line) return;

    const frequency = line.frequency;
    let frequencyId = "";

    if (frequency && frequency.length > 0 && line.amount && line.amount > 0) {
        frequencyId = line.frequency[0];
    } else {
        return;
    }

    const amount = +line.amount;

    let annualTotal = 0;

    if (frequencyId === "108899") {
        // Weekly
        annualTotal = amount * 52;
    } else if (frequencyId === "108898") {
        // Fortnightly
        annualTotal = amount * 26;
    } else if (frequencyId === "108900") {
        // Monthly
        annualTotal = amount * 12;
    } else if (frequencyId === "108901") {
        // Quarterly
        annualTotal = amount * 4;
    } else if (frequencyId === "108902") {
        // Yearly
        annualTotal = amount * 1;
    }


    //There's a delay on reflecting the Asset Total and Income Total values
    const assetlineValues = C.state.subValues["bacs-assets"];

    const fieldsToBeMapped = { "annual-total": annualTotal, };
    const updatedLineItem = C.updateSubValueBasedOnIndex(
        "bacs-income",
        index,
        fieldsToBeMapped
    );
    console.log({ updatedLineItem });

    const lineValues = C.state.subValues["bacs-income"];
    const updatedLineItemId = Object.keys(
        updatedLineItem.subValues["bacs-income"].update
    )[0];
    const actualLineValues = lineValues.filter((lv) => lv.id.toString() !== updatedLineItemId);
    const lineValuesToBeUsed = [
        ...actualLineValues,
        updatedLineItem.subValues["bacs-income"].update[updatedLineItemId]
    ];

    console.log({ lineValuesToBeUsed });

    const assetAmountTotal = assetlineValues
        .map((v) => +v.amount)
        .reduce((agg, v) => agg + v, 0);
    const incomeAnnualTotal = lineValuesToBeUsed
        .map((v) => +v["annual-total"])
        .reduce((agg, v) => agg + v, 0);

    // console.log("Asset values: ", assetlineValues);
    // console.log("Income values: ", incomelineValues);

    actions.push(C.setValue("asset-total", assetAmountTotal));
    actions.push(C.setValue("income-total", incomeAnnualTotal));

    return C.mergeAll(
        updatedLineItem,
        C.setValue("asset-total", assetAmountTotal),
        C.setValue("income-total", incomeAnnualTotal)
    );
}
