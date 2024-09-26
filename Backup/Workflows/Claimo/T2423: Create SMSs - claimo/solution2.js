async function script(C) {
    const { entryId, recordInternalId } = C.getEvent();
    const currentEntry = await C.getCurrentEntry();

    // Check if client exists
    if (!currentEntry.clients[0] || currentEntry.clients.length === 0) {
        return C.log("Client does not exist.");
    }

    // Get Client data
    const client = await C.getEntry({
        entryId: currentEntry.clients[0],
        recordInternalId: "claimo-clients",
    });

    // Get Financial Firm data
    const financialFirm = await C.getEntry({
        entryId: currentEntry["financial-firm"][0],
        recordInternalId: "claimo-financial-firms",
    });

    // FOR SMS
    let baseUrl = "https://api.tallbob.com/v2/sms/send";
    let from = "61437023076"; //Claimo
    let to = formatPhoneNumber(client.phone); // Client's phone number
    let firstName = client["first-name"];
    let firmName = financialFirm.name;
    let message = `Hi ${firstName}. We have tried to reach you regarding your ${firmName} case. Kindly provide us with your valid IDs. Please call us back on 1300 879 071 to discuss. Thank you. - Claimo.`;

    // Function to check if number starts with "04" or "4"
    function formatPhoneNumber(phoneNumber) {
        // Check if the phone number starts with "04"
        if (phoneNumber.startsWith("04")) {
            // Replace "04" with "+614"
            return phoneNumber.replace(/^04/, "+614");
        }
        // Check if the phone number starts with "4"
        else if (phoneNumber.startsWith("4")) {
            // Replace "4" with "+614"
            return phoneNumber.replace(/^4/, "+614");
        }
        // Return the original phone number if no changes are needed
        return phoneNumber;
    }

    // Tallbob
    let smsInput = {
        entryId,
        recordInternalId,
        templateId: 10001494,
        // to: to, // For Production
        // message: message,
    };

    const response = await C.mergeSmsTemplate(smsInput);
    const body = response.body;
    
    C.log(body);

    try {
        let res = await axios
            .post(
                baseUrl,
                {
                    entryId,
                    recordInternalId,
                    from: "61437023076", // Claimo
                    to: "639175446351", // For Testing
                    message: body,
                },
                {
                    auth: {
                        username: "d01d9a68-0203-11ef-b45e-e51fac1bf524",
                        password:
                            "7a911ce4036018a20a3350e585d1fd2ae6465101bdbad2dca1aeee60f4867082",
                    },
                }
            )
            .then((res) => res.data);

        C.log("SMS sent successfully");
        C.log(res.data);

        C.addJsonToSummary({
            currentEntry,
            smsInput,
            body,
            response,
            // res,
            // client,
            // financialFirm,
        });
        
    } catch (error) {
        C.addJsonToSummary({
            error,
        });
    }

    return;
}
