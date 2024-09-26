async function script(C) {
    const currentEntry = await C.getCurrentEntry();
    const currentEntryId = currentEntry.recordValueId;
    const familyId = currentEntry["family-client"][0];
    const mobile = currentEntry.phone;
    const email = currentEntry.email;
    C.log({ currentEntry: { mobile, email } });

    const family = await C.getEntry({
        recordInternalId: "bacs-clients",
        entryId: familyId,
    });
    const isMainContact = family["main-contact-person"][0] === currentEntry.recordValueId;
    const isSecondaryContact = family["90858-secondary-contact-person"][0] === currentEntry.recordValueId;

    const generateUpdateValues = (
        isForOpportunities = true
    ) => {
        let value = {};
        if (isMainContact) {
            C.log("is main");
            value["main-contact"] = [currentEntryId];
            value[isForOpportunities ? "contact-email" : "main-email"] = email;
            value[isForOpportunities ? "contact-phone" : "main-phone"] = mobile;
        };
        if (isSecondaryContact) {
            C.log("is secondary");
            value["90858-secondary-contact"] = [currentEntryId];
            value["90858-secondary-contact-email"] = email;
            value["90858-secondary-contact-phone"] = mobile;
        };
        if (!isMainContact && !isSecondaryContact)
            C.log("is neither main nor secondary");

        return value;
    };

    const associations = await C.getAssociations(
        familyId,
        "bacs-clients",
        [
            "bacs-opportunities",
            "bacs-appointments",
        ]
    );
    C.addJsonToSummary(associations);

    const key = Object.keys(associations)[0];
    let opportunitiesUpdateResults = await Promise.all(
        associations[key]["bacs-opportunities"].map(
            async (opportunity) =>
                await C.updateEntries({
                    updates: [{
                        entryId: +opportunity.recordValueId,
                        recordInternalId: "bacs-opportunities",
                        value: generateUpdateValues(),
                    }]
                })
        )
    );

    let appointmentsUpdateResults = await Promise.all(
        associations[key]["bacs-appointments"].map(
            async (appointment) =>
                await C.updateEntries({
                    updates: [{
                        entryId: +appointment.recordValueId,
                        recordInternalId: "bacs-appointments",
                        value: generateUpdateValues(false),
                    }]
                })
        )
    );

    return {
        opportunitiesUpdateResults,
        appointmentsUpdateResults,
    };
}
