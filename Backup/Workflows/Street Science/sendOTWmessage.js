async function script(C) {
    const currentEntry = await C.getCurrentEntry();
    if (!currentEntry) throw new Error("Failed to get current entry.");

    const event = C.getEvent();
    if (!event) throw new Error("Failed to get event.");

    const { entryId, recordInternalId, recordId } = event;

    // Get Main Contact data
    const mainContact = await C.getEntry({
        entryId: currentEntry["2708638-main-contact"][0],
        recordInternalId: "standard-contacts",
    });
    
    // Get travel time
    const travelTime = currentEntry["2708638-travel-time"];
    let templateId = null;
    let baseUrl = "https://api.tallbob.com/v2/sms/send";
    let to = formatPhoneNumber(mainContact.mobile);
    let from = "61437034055"; // Street Science 61437034055

    // Set template ID depending on travel time
    if (travelTime) {
        templateId = 10001543; // with travelTime
    } else {
        templateId = 10001544; //without travelTime
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

    // SMS Inputs
    let smsInput = {
        entryId,
        recordInternalId,
        templateId,
    };

    const response = await C.mergeSmsTemplate(smsInput);
    const body = response.body;

    // C.log(body);

    try {
        // Send SMS Tallbob
        let res = await axios
            .post(
                baseUrl,
                {
                    entryId,
                    recordInternalId,
                    from,
                    to, // For Testing 61403340909-lez 639175446351
                    message: body,
                },
                {
                    auth: {
                        username: "0f18dc02-4325-11ef-a462-edb010fed08f",
                        password:
                            "9b4985d2e514984ffe3902ac4584ee6d05f19c39bbef212c32143c37aca134e9",
                    },
                }
            )
            .then((res) => res.data);

        C.log("SMS sent.");

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

        // Tick checkbox once SMS is sent
        await C.updateEntries({
            updates: [
                {
                    value: {
                        "2708638-on-the-way": true,
                    },
                    recordInternalId,
                    entryId,
                },
            ],
        });

        C.addJsonToSummary({
            currentEntry,
            res,
        });
    } catch (error) {
        C.addJsonToSummary({
            error,
        });
    }
}
