async function script(C) {
    const response = await C.createZaiCharge({
        data: {
            name: "Test charge from workflow",
            account_id: "e1bc7120-2928-013c-03cf-0a58a9feac03",
            amount: 6000,
            email: "ivan@clevero.co",
            zip: 3000,
            country: "AUS",
            currency: "AUD",
            user_id: "d8DIN8yGuSKaXJ-yTyPxX",
            // custom_descriptor: "229",
        },
    });
    C.addJsonToSummary(response, {enableCopy: true})
    C.log(response);
}