async function script(C) {
    const currentEntry = await C.getCurrentEntry();
    const mainContactId = currentEntry["main-contact-person"];
    const secondaryContactId = currentEntry["90858-secondary-contact-person"];

    const [mainContactObject, secondaryContactObject] = await Promise.all([
        mainContactId.length > 0
            ? C.getEntry({
                recordInternalId: "bacs-contacts",
                entryId: mainContactId[0],
            })
            : null,
        secondaryContactId.length > 0
            ? C.getEntry({
                recordInternalId: "bacs-contacts",
                entryId: secondaryContactId[0],
            })
            : null
    ]);

    const associations = await C.getAssociations(
        currentEntry.recordValueId,
        "bacs-clients",
        [
            "bacs-opportunities",
            "bacs-appointments",
        ]
    );
    C.addJsonToSummary({ associations });

    const key = Object.keys(associations)[0];
    const associatedOpportunities = associations[key]["bacs-opportunities"];
    const updateOpportunitiesResult = await Promise.all(
        associatedOpportunities.map(async (opportunity) =>
            await C.updateEntries({
                updates: [{
                    entryId: +opportunity.recordValueId,
                    recordInternalId: "bacs-opportunities",
                    value: {
                        "main-contact": mainContactObject
                            ? [mainContactObject.recordValueId]
                            : [],
                        "contact-phone": mainContactObject
                            ? mainContactObject.phone
                            : null,
                        "contact-email": mainContactObject
                            ? mainContactObject.email
                            : null,
                        "90858-secondary-contact": secondaryContactObject
                            ? [secondaryContactObject.recordValueId]
                            : [],
                        "90858-secondary-contact-phone": secondaryContactObject
                            ? secondaryContactObject.phone
                            : null,
                        "90858-secondary-contact-email": secondaryContactObject
                            ? secondaryContactObject.email
                            : null,
                    },
                }]
            })
        ));

    const associatedAppointments = associations[key]["bacs-appointments"];
    const updateAppointmentsResult = await Promise.all(
        associatedAppointments.map(async (appointment) =>
            await C.updateEntries({
                updates: [{
                    entryId: +appointment.recordValueId,
                    recordInternalId: "bacs-appointments",
                    value: {
                        "main-contact": mainContactObject
                            ? [mainContactObject.recordValueId]
                            : [],
                        "main-phone": mainContactObject
                            ? mainContactObject.phone
                            : null,
                        "main-email": mainContactObject
                            ? mainContactObject.email
                            : null,
                        "90858-secondary-contact": secondaryContactObject
                            ? [secondaryContactObject.recordValueId]
                            : [],
                        "90858-secondary-contact-phone": secondaryContactObject
                            ? secondaryContactObject.phone
                            : null,
                        "90858-secondary-contact-email": secondaryContactObject
                            ? secondaryContactObject.email
                            : null,
                    },
                }]
            })
        ));

    return {
        updateOpportunitiesResult,
        updateAppointmentsResult,
    };
}