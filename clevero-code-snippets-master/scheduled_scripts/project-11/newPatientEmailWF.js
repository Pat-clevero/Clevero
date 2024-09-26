/**
 * if clinic is not empty AND
 * if specialist is not empty AND
 * if date entered is AFTER 1/8/2023 AND
 * if Client Liaison Manager is not empty
 *      Send an email to the Patient's email (email field)
 *      Log Email
 * Tick "New Patient Email Sent" checkbox
 */

async function script(C) {
    const sendEmail = async (config) => {
        if (!config.patientEmail)
            throw new Error("Patient Email not provided");

        const recordInternalId = config.recordInternalId;
        const entryId = config.entryId;
        const templateId = 2361920; // Test template till template id is provided by the client
        const subject = "Welcome new patient";

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
            options: {
                logEmailToCurrentEntry: true,
            },
        });

        return { response, emailResponse };
    };

    const currentEntry = await C.getCurrentEntry();
    const clinic = currentEntry.clinic;
    const specialist = currentEntry.surgeon;
    const clientLiaisonManager = currentEntry["client-liaison-manager"];

    const clinicIsNotEmpty = clinic && clinic.length > 0;
    const specialistIsNotEmpty = specialist && specialist.length > 0;
    const isAfter1stAugust2023 = moment(
        currentEntry["date-entered"],
        "YYYY-MM-DD"
    ).isAfter(moment("August 1, 2023", "MMMM D, YYYY"));
    const clientLiaisonManagerIsNotEmpty =
        clientLiaisonManager && clientLiaisonManager.length > 0;
    const patientAlreadyEmailed = currentEntry["72241-new-patient-email-sent"];

    if (
        clinicIsNotEmpty &&
        specialistIsNotEmpty &&
        isAfter1stAugust2023 &&
        clientLiaisonManagerIsNotEmpty &&
        !patientAlreadyEmailed
    ) {
        const config = {
            entryId: currentEntry.recordValueId,
            recordInternalId: "super-health-team-crs-claims",
            patientEmail: currentEntry.email,
        };

        // Send an email and tick the "New Patient Email Sent" checkbox field
        const sendEmailResponse = await sendEmail(config)
            .then(async (emailResponse) => {
                const updateResult = await C.updateEntries({
                    updates: [
                        {
                            value: {
                                "72241-new-patient-email-sent": true,
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
                clinicIsNotEmpty,
                specialistIsNotEmpty,
                isAfter1stAugust2023,
                clientLiaisonManagerIsNotEmpty,
                patientNotAlreadyEmailed: !patientAlreadyEmailed,
            }
        });
        return { message: "Not all conditions are met. Email not sent to the patient." };
    }
}