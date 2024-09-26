async function script(C) {
    const currentEntry = await C.getCurrentEntry();
    const refundAmount = +currentEntry["1614495-payment-amount"];
    const itemId = currentEntry["1614495-zai-transaction-id"];

    try {
        if(refundAmount <= 0)
            throw new Error(`Refund amount must be greater than 0. Value: ${refundAmount}`);
        if(Number.isNaN(refundAmount))
            throw new Error(`Refund amount must be a number. Value: ${refundAmount}`);
        if(!itemId)
            throw new Error(`Item Id is null or empty. Value: ${itemId}`);

        const refundResponse = await C.refundZaiCharge({
            itemId,
            params: {
                refundAmount: refundAmount * 100, // x100 because refundAmount is expressed in cents for the API
                refundMessage: `You have been refunded an amount of \$${refundAmount.toFixed(2)} for your order: ${currentEntry.autoId}`
            },
        });

        if (refundResponse.success) {
            C.addListsToSummary(
                [
                    {
                        value: "Refund successful.",
                        valueColor: "#079100",
                        iconColor: "#0dff00",
                        icon: "fa-duotone fa-check",
                    },
                ]
            );
        } else {
            C.addListsToSummary(
                [
                    {
                        value: "Refund could not be fulfilled.",
                        valueColor: "#ff1e00",
                        iconColor: "#4f0011",
                        icon: "fa-duotone fa-xmark-large",
                    }
                ]
            );
        }

        return refundResponse;
    } catch(errorMessage) {
        throw new Error(errorMessage);
    }
}