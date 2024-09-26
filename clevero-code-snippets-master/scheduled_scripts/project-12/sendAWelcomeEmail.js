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

        return { response, emailResponse };
    };

    const currentEntry = await C.getCurrentEntry();
    const isCompassionateTemplateSet = currentEntry.hasOwnProperty("compassionate-release");
    const isAgreementTemplateSet = currentEntry.hasOwnProperty("super-health-agreement");
    const isAfter1stAugust2023 = moment(
        currentEntry["date-entered"],
        "YYYY-MM-DD"
    ).isAfter(moment("August 1, 2023", "MMMM D, YYYY"));
    const patientAlreadyEmailed = currentEntry["72241-welcome-email-sent"];

    if (
        isCompassionateTemplateSet &&
        isAgreementTemplateSet &&
        isAfter1stAugust2023 &&
        !patientAlreadyEmailed
    ) {
        const config = {
            entryId: currentEntry.recordValueId,
            recordInternalId: "super-health-team-crs-claims",
            patientEmail: currentEntry.email,
            attachments: [
                currentEntry["compassionate-release"][0],
                currentEntry["super-health-agreement"][0]
            ],
        };

        const sendEmailResponse = await sendEmail(config)
            .then(async (emailResponse) => {
                const updateResult = await C.updateEntries({
                    updates: [
                        {
                            value: {
                                "72241-welcome-email-sent": true,
                            },
                            entryId: config.entryId,
                            recordInternalId: config.recordInternalId,
                        },
                    ],
                });

                return { updateResult, emailResponse };
            })
            .catch((error) => {
                return `Email failed so send. ${error}`;
            });

        return sendEmailResponse;
    } else {
        C.addJsonToSummary({
            conditions: {
                isCompassionateTemplateSet,
                isAgreementTemplateSet,
                isAfter1stAugust2023,
                patientNotAlreadyEmailed: patientAlreadyEmailed,
            }
        });
        return {
            message: "Not all conditions are met. Email not sent to the patient.",
        };
    }
}
