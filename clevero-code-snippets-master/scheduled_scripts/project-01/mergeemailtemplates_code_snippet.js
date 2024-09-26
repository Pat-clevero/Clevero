async function script(C) {
    const entryId = 232;
    const recordInternalId = "kalysys-timesheets";

    const emailInput = {
        entryId,
        recordInternalId,
        templateId: 2122315,
        subject: "test subject",
    };
    const response = await C.mergeEmailTemplate(emailInput);
    // let replacements = {
    //     "{employee_name}": "Ronnie Valdez",
    //     "{timesheet_duration}": "7.5",
    // };

    // let body = response.body.replace(
    //     /{employee_name}|{timesheet_duration}/g,
    //     (match) => replacements[match]
    // );

    let body = response.body;

    const sendEmailResponse = await C.sendEmail({
        entryId,
        recordInternalId,
        from: {
            email: "notifications@mailvero.com",
            name: "Clevero Notifications",
        },
        to: ["ivan@clevero.co"],
        subject: "test subject",
        body,
    });

    C.addJsonToSummary({
        response
    });
    
    return { response, sendEmailResponse };
}

