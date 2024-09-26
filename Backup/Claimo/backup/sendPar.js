async function script(C) {
    const currentEntry = await C.getCurrentEntry();
    
    if (currentEntry["par-email-sent"] || !currentEntry["signed-loa"] || currentEntry["signed-loa"].length<1) {
        return true;
    }
    currentProduct = currentEntry.product[0];
    if (
        currentProduct == 831910 || // Lenders Mortgage Insurance (LMI)
        currentProduct == 831909 || // Income Protection
        currentProduct == 831908 // Life Insurance
    ) {
        return true;
    }

    let templateId = 853066;
    if (currentProduct == "831907") {
        // Funeral
        type = "funeral";
        templateId = 853072;
    } else if (currentProduct == "831906") {
        //Super
        type = "super";
        templateId = 853071;
    }
    

    // Check Client, else create a new Client
    let linkedClient = currentEntry["clients"];
    let clientResponse = {};

    let opportunityResponses = [];
    let emailResponse = [];

    const currentFinancialFirmObject = await C.getEntry({
        entryIds: [currentEntry["financial-firm"][0]],
        recordInternalId: "claimo-financial-firms",
    });
    
    
    
    attachmentFields = ["signed-loa"];
    let parEmail = "";
    let parEmails = [];
    if (currentFinancialFirmObject.length>0) {
        parEmail = currentFinancialFirmObject[0]["par-email"];
        parEmail2 = currentFinancialFirmObject[0]["par-email2"];
        if (parEmail) {
            parEmails.push(parEmail);
        }
        if (parEmail2) {
            parEmails.push(parEmail2);
        }
        if(currentFinancialFirmObject[0]["send-ids-in-par"]){
            attachmentFields =  ["id-front", "id-back", "signed-loa"];
        }
    }
    if (parEmails.length > 0) {
        // Send Email
        let emailInput = {
            entryId: currentEntry.recordValueId,
            recordInternalId: "claimo-opportunities",
            from: {
                email: "hello@claimo.com.au",
                name: "Claimo",
            },
            to: parEmails,
            logEmail: [
                {
                    recordId: 812232,
                    entryId: currentEntry.recordValueId,
                },
                {
                    recordId: 25250,
                    entryId: linkedClient[0],
                },
            ],
            //cc: ["lez@lezyeoh.com"],
            //bcc: ["lez.yeoh@suitescale.com"],
            attachmentFields: attachmentFields,
            templateId: templateId,
        };
        emailResponse = await C.sendEmail(emailInput);
    }
    if (emailResponse["message-id"]) {
        const response = await C.updateEntries({
            updates: [
                {
                    value: {
                        "par-email-sent": true,
                    },
                    entryId: currentEntry.recordValueId,
                    recordInternalId: "claimo-opportunities"
                },
            ],
        });
    }

    return {currentEntry, currentFinancialFirmObject, parEmails,
        emailResponse
    };

    // Send PAR Notification to Client
}
