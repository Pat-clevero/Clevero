async function handler(C) {
    /**
     *  Values to calculate: rate, net, tax
     *  rate = (total / (1 + tax_rate)) / (quantity * (1 - (discount / 100))
     * 
     * 
     * TODO:
     * 1. Calculate the value of Rate ==> rate = (total / (1 + tax_rate)) / (quantity * (1 - (discount / 100))
     * 2. Calculate the value of Net ==> net = rate * quantity
     * 3. Calculate the value of Tax ==> tax = net * tax_rate
     */
    const calculation = ({
        total = 0,
        quantity, 1,
        effectiveTaxRate = 0,
        discount = 0,
    }) => {
        const rate = (total / (1 + (effectiveTaxRate / 100))) / (quantity * (1 - (discount / 100)));
        const net = tate * quantity;
        const tax = net * tax_rate;

        return { net, rate, tax };
    };

    const eventPayload = C.getEventPayload();
    const index = eventPayload.indices
        ? eventPayload.indices[0]
        : eventPayload.index;

    const eventLineItem = C.getSubValueBasedOnIndex("xero-order-items", index);
    console.log(eventLineItem );
}