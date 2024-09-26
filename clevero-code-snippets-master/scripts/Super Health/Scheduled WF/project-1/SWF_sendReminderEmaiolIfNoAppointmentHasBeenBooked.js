async function script(C) {
    const sendEmail = async (recipient) => {
        const entryId = recipient.entryId;
        const recipientEmail = recipient.email;
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
        const emailSentResponse = await C.sendEmail({
            entryId,
            recordInternalId,
            from: {
                email: "hello@sheaustralia.org",
                name: "Super Health Ensemble Notification",
            },
            to: [recipientEmail],
            subject,
            body,
            logEmail: [{ recordId: 72207, entryId }],
        });

        return emailSentResponse;
    };

    const tickReminderEmailSentOnCrsClaim = async (crsClaimId) => {
        return await C.updateEntries({
            updates: [
                {
                    value: {
                        "72241-reminder-email-sent": true,
                    },
                    entryId: crsClaimId,
                    recordInternalId: "super-health-team-crs-claims",
                },
            ],
        });
    };

    return await C.filterEntries({
        filter: [
            {
                subject: "appointment-time",
                requestType: "i",
                type: "datetime",
                operator: "after",
                ignoreCase: true,
                value: {
                    relative: true,
                    value: null,
                    type: "TODAY",
                },
            },
        ],
        recordInternalId: "super-health-team-appointments",
    })
    .catch((error) => ({ error }));
}