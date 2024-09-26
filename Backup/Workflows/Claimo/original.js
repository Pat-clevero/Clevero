async function script(C) {
    const { entryId, recordInternalId } = C.getEvent();
    const currentEntry = await C.getCurrentEntry();

    // Check if customer exists
    if (!currentEntry.customer[0] || currentEntry.customer.length === 0) {
        return;
    }
    const customer = await C.getEntry({
        entryId: currentEntry.customer[0],
        recordInternalId: "standard-organisations",
    });

    // FOR SMS
    let baseUrl = "https://api.tallbob.com/v2/sms/send";
    // let from = "61437023076"; //Claimo
    // let from = 61403340909; // Lez

    // Tallbob
    let smsInput = {
        from: "61437023076", // Claimo
        to: "639175446351", // Renz
        message: `Hi ${customer.name}. We have tried to reach you regarding your ${currentEntry.title}[Respondent] case. Please call us back on 1300 879 071 to discuss. Thank you. - Claimo.`,
    };
    // C.log("data-->", smsInput);

    try {
        let res = await axios
            .post(baseUrl, smsInput, {
                auth: {
                    username: "d01d9a68-0203-11ef-b45e-e51fac1bf524",
                    password:
                        "7a911ce4036018a20a3350e585d1fd2ae6465101bdbad2dca1aeee60f4867082",
                },
            })
            .then((res) => res.data);

        C.log("SMS sent successfully");
        C.addJsonToSummary({
            smsInput,
            res,
        });
    } catch (error) {
        C.addJsonToSummary({
            error,
        });
    }

    return;
}

// FOR SMS
// let baseUrl = "https://api.tallbob.com/v2/sms/send";
// let from = "61437023076"; //Claimo

// Tallbob
// let data = {
//     from: from,
//     to: "61403340909",
//     message: "TEST MESSAGE",
// };
// C.log("data-->", data);

// // return;

// let res = await axios.post(baseUrl, data, {
//     auth: {
//         username: "d01d9a68-0203-11ef-b45e-e51fac1bf524",
//         password:
//             "7a911ce4036018a20a3350e585d1fd2ae6465101bdbad2dca1aeee60f4867082",
//     },
// });
// C.log("SMS sent successfully");

// return;
