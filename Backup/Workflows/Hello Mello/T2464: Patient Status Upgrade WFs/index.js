async function sendEmailFunction(C) {
    const { entryId, recordInternalId } = C.getEvent();
    const currentEntry = await C.getCurrentEntry();
    const currentRecordId = "hello-mello-consultations";
    const emailTemplateId = 2402563;

    // const patientObject = await C.getEntry({
    //     entryId: currentEntry["1614495-patient"][0],
    //     recordInternalId: "hello-mello-patients",
    // });
    // const patientEmail = patientObject["1614495-email"];

    const emailInput = {
        entryId: currentEntry.recordValueId,
        recordInternalId: currentRecordId,
        templateId: emailTemplateId,
    };

    const response = await C.mergeEmailTemplate(emailInput);
    let body = response.body;


    const emailResponse = await C.sendEmail({
        entryId,
        recordInternalId,
        from: {
            email: "renz@clevero.co",
            name: "Support Hellomello™",
        },
        to: ["renz@clevero.co"],
        subject: "Test subject",
        body,
        options: {
            logEmailToCurrentEntry: true, // Optional. True by default. If you want to disable logging the email to current entry, make this option false
        },
    });
    
    C.addJsonToSummary({
        response
    });

    // const entryResponse = await C.updateEntries({
    //     updates: [
    //         {
    //             value: {
    //                 "1614495-processing-email-sent": true, // Replace 'checkbox-key' with the actual key of the checkbox field
    //             },
    //             recordInternalId: currentRecordId,
    //             entryId: currentEntry.recordValueId, // Replace 123 with the actual entry ID of the record
    //         },
    //     ],
    // });

    return { response, emailResponse };
}
