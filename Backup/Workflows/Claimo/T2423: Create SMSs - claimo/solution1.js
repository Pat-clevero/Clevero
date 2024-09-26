async function script(C) {
    const { entryId, recordInternalId, recordId } = C.getEvent();
    const currentEntry = await C.getCurrentEntry();

    // Check if client exists
    if (!currentEntry.client[0] || currentEntry.client.length === 0) {
        return C.log("Client does not exist.");
    }

    // Get Client data
    const client = await C.getEntry({
        entryId: currentEntry.client[0],
        recordInternalId: "claimo-clients",
    });
    // Get Respondent data
    const respondent = await C.getEntry({
        entryId: currentEntry.respondent[0],
        recordInternalId: "claimo-respondents",
    });
    // SMS Variables
    let baseUrl = "https://api.tallbob.com/v2/sms/send";
    let from = "61437023076"; //Claimo
    let to = "639175446351"; // Number for testing
    // let to = formatPhoneNumber(client["phone"]); // Client's phone number
    let firstName = client["first-name"];
    let respondentName = respondent["name"];
    let message = `Hi ${firstName}. We have tried to reach you regarding your ${respondentName} case. Please call us back on 1300 879 071 to discuss. Thank you. - Claimo.`;

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
        from: from, // Claimo
        to: to,
        message: message,
        // templateId: 10001489,
    };

    try {
        let sendSmsResponse = await axios
            .post(baseUrl, smsInput, {
                auth: {
                    username: "d01d9a68-0203-11ef-b45e-e51fac1bf524",
                    password:
                        "7a911ce4036018a20a3350e585d1fd2ae6465101bdbad2dca1aeee60f4867082",
                },
            })
            .then((sendSmsResponse) => sendSmsResponse.data);

        C.log("SMS sent successfully");
        // C.log(sendSmsResponse);
        
        // Create a relationship and store against the relevant record/entry.  
        // const relationshipResponse = await C.addRelationship({
        //     messageData: {
        //         to: sendSmsResponse.to,
        //         body: sendSmsResponse.message,
        //         messageId: sendSmsResponse.sms_id,
        //     },
        //     type: "sms",
        //     linkedEntries: [
        //         {
        //             recordId: 812235,
        //             entryId: 1061175,
        //         },
        //     ],
        //     options: {
        //         logMessageToCurrentEntry: true, // Optional. True by default. If you want to disable logging the message to current entry, make this option false
        //     },
        // });

        C.addJsonToSummary({
            // currentEntry,
            smsInput,
            // res,
            // client,
            // respondent,
            // to
        });
        
        // return { relationshipResponse };
        
    } catch (error) {
        C.addJsonToSummary({
            error: error.toString(), // Log the error as a string for better readability
        });
        C.log("Error sending SMS:", error);
    }

    return  
}
