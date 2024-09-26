async function script(C) {
    const sendSuperHealthEmail = async (entryId) => {
        // const recipientEmail = "hello@sheaustralia.org";
        const recipientEmail = "ivan@clevero.co"; // for testing
        const recordInternalId = "super-health-team-appointments";
        const templateId = 2361920; // Test template till template id is provided by the client
        const subject = "No CRS Claim found for the booked appointment";

        const emailInput = {
            entryId,
            recordInternalId,
            templateId,
            subject,
        };

        const response = await C.mergeEmailTemplate(emailInput);
        const replacements = {
            "{placeholder}": "value",
        };
        const body = response.body.replace(
            /{placeholder}/g,
            (match) => replacements[match]
        );
        const emailResponse = await C.sendEmail({
            entryId,
            recordInternalId,
            from: {
                email: "notifications@mailvero.com",
                name: "Clevero Notification Service",
            },
            to: [recipientEmail],
            subject,
            body,
            options: {
                logEmailToCurrentEntry: true,
            },
        });

        return { response, emailResponse };
    };

    const updateCRSClaim = async (id) => {
        return await C.updateEntries({
            updates: [
                {
                    value: {
                        "72241-ato-meeting-booked": true,
                    },
                    entryId: id,
                    recordInternalId: "super-health-team-crs-claims",
                },
            ],
        });
    };

    const currentEntry = await C.getCurrentEntry();
    const result = await C.getEntry({
        entryId: currentEntry["crs-claim"][0],
        recordInternalId: "super-health-team-crs-claims",
    }).then(async (response) => {
        // delay for 1 second to make sure changes won't get overriden by other workflows
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (response.success.length > 0)
            return await updateCRSClaim(response.recordValueId);
        else
            return await sendSuperHealthEmail(response.recordValueId);
    }).catch(error => ({ error }));

    return { result };
}