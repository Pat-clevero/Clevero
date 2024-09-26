async function handler(C) {
    const actions = [];
    const internalId = C.event.payload.recordInternalId;
    const index = C.event.payload.index;

    const rate = C.getSubValueBasedOnIndex(internalId, index).rate || 0;
    const quantity = C.getSubValueBasedOnIndex(internalId, index).quantity || 1;
    const taxRate = C.getSubValueBasedOnIndex(internalId, index)["tax-rate"];
    const percentageDiscount = C.getSubValueBasedOnIndex(internalId, index).discount;

    function getDiscountedRate(rate, percentDiscount) {
        const discount = rate * (percentDiscount / 100);
        return rate - discount;
    }

    const rateAfterDiscount = getDiscountedRate(+rate, +percentageDiscount);

    let netAmount = +quantity * rateAfterDiscount;
    let taxRateAmount = 0;
    let taxAmount = 0;
    if (taxRate.length != 0) {
        // const taxRateObject = await C.api.getEntry({
        //     recordId: '34148', id: taxRate[0], responseType: 'iov'
        // });
        // taxRateAmount = taxRateObject['effective-tax-rate'];
        taxAmount = (+netAmount * 0.1);
    }

    const totalAmount = netAmount + taxAmount;
    const dataToChange = {
        net: +(netAmount.toFixed(2)),
        tax: +(taxAmount.toFixed(2)),
        total: +(totalAmount.toFixed(2))
    };
    actions.push(C.updateSubValueBasedOnIndex(internalId, index, dataToChange));

    return C.mergeAll(actions);
}