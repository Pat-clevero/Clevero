async function script(C) {
    const sendEmail = async (config) => {
        if (!config.patientEmail)
            throw new Error("Patient Email not provided");

        const recordInternalId = config.recordInternalId;
        const entryId = config.entryId;
        const templateId = 2361920; // Test template till template id is provided by the client
        const subject = "Welcome new patient. This is a test after Compassionate template is set.";

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
                email: "hello@sheaustralia.org",
                name: "Super Health Ensemble Notification",
            },
            to: [config.patientEmail],
            subject,
            body,
            attachments: config.attachments,
            options: {
                logEmailToCurrentEntry: true,
            },
        });

        return emailResponse;
    };

    const currentEntry = C.getCurrentEntry();
    const isAtoMeetingEmailSent = currentEntry["72241-ato-meeting-email-sent"];
    const patientEmail = currentEntry.email;

    const compassionateReleaseResponse = currentEntry["super-form-response"];
    const esrbSpecialistLetter = currentEntry["ersb-specialist-letter"];
    const treatmentQuote = currentEntry["treatment-quotes"];

    const config = {
        entryId: currentEntry.recordValueId,
        recordInternalId: "super-health-team-crs-claims",
        patientEmail,
        attachments: [
            compassionateReleaseResponse,
            esrbSpecialistLetter,
            treatmentQuote,
        ],
    };

    if (!isAtoMeetingEmailSent) {
        const response = sendEmail(config)
            .then(async response => {
                const updateResult = await C.updateEntries({
                    updates: [
                        {
                            value: {
                                "72241-ato-meeting-email-sent": true,
                                "72241-ato-meeting-email-sent-date": C.moment(),
                            },
                            entryId: config.entryId,
                            recordInternalId: config.recordInternalId,
                        },
                    ],
                });

                return { updateResult, emailResponse };
            });

        return { response };
    } else {
        C.addJsonToSummary({
            conditions: {
                isAtoMeetingEmailNotSent: !isAtoMeetingEmailSent,
            }
        });
        return {
            message: "Not all conditions are met. Email not sent to the patient.",
        };
    }
}