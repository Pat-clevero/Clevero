async function script(C) {
    const { entryId, recordInternalId, recordId } = C.getEvent();
    const currentEntry = await C.getCurrentEntry();

    // Check if client exists
    if (!currentEntry.client[0] || currentEntry.client.length === 0) {
        return C.log("Client does not exist.");
    }

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

    // SMS Variables
    let baseUrl = "https://api.tallbob.com/v2/sms/send";
    let from = "Claimo"; //Claimo
    let to = formatPhoneNumber(client["phone"]); // Client's phone number
    // let to = ""; // Please enter number inside the "" for Testing 
    let templateId = 10011533;
    
    // SMS Inputs
    let smsInput = {
        entryId,
        recordInternalId,
        templateId,
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
                    from,
                    to,
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

        // Log SMS to entry
        const relationshipResponse = await C.addRelationship({
            messageData: {
                to: res.to,
                body: res.message,
                messageId: res.sms_id,
            },
            type: "sms",
            linkedEntries: [
                {
                    recordId,
                    entryId,
                },
            ],
        });

        C.addJsonToSummary({
            currentEntry,
            smsInput,
            res,
        });
    } catch (error) {
        C.addJsonToSummary({
            error: error.toString(), // Log the error as a string for better readability
        });
        C.log("Error sending SMS:", error);
    }

    return;
}


