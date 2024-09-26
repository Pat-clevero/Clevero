async function handler(C) {
    const internalId = C.event.payload.recordInternalId;
    let netSum = 0;
    let taxSum = 0;
    let totalSum = 0;
    let actions = [];

    const subValues = await C.getAllSubValues(internalId);

    subValues.forEach(item => {
        if (typeof item.net === 'number') {
            netSum += item.net;
        }
        if (typeof item.tax === 'number') {
            taxSum += item.tax;
        }
        if (typeof item.total === 'number') {
            totalSum += item.total;
        }
    });

    actions = actions.concat([
        C.setValue("net-total", netSum),
        C.setValue("tax-total", taxSum),
        C.setValue("total", totalSum),
    ]);

    console.log({ netSum, taxSum, totalSum });

    const result = await Promise.all(actions);

    console.log(result);

    return C.mergeAll(result);
}
