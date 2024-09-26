async function script(C) {
    const currentEntry = await C.getCurrentEntry();
    C.log("currentEntry-->", currentEntry);
    C.log("metaData-->", C.getEventMetadata())
    let updateEntry = false;
    let values = {};

    let reference = currentEntry["1614495-meeting-reference"];
    if (reference) {
        const filteredEntries = await C.filterEntries({
            filter: [
                {
                    subject: "1614495-submitted-id",
                    requestType: "i",
                    type: "text",
                    operator: "equals",
                    value: reference,
                },
            ],
            recordInternalId: "hello-mello-registrations",
        });
        C.addJsonToSummary(filteredEntries);
        const matchedPatientEntryId = filteredEntries.entries.length > 0
            ? [filteredEntries.entries[0]["1614495-matched-patient"]]
            : [];
        
        values["1614495-patient"] = matchedPatientEntryId;
        updateEntry = true;
    }

    if (!currentEntry["1614495-practitioner"] && currentEntry["1614495-allocated-member-id"]) {
        values["1614495-practitioner"] = [currentEntry["1614495-allocated-member-id"]];
        updateEntry = true;
    }

    if (!currentEntry["1614495-date-created"]) {
        values["1614495-date-created"] = moment().toISOString();
        updateEntry = true;
    }
    if (!currentEntry["1614495-status"]) {
        values["1614495-status"] = [1780709]
        updateEntry = true;
    };
    let eventValue = currentEntry["1614495-event"][0];
    let eventValueDetails = await C.getEntry({
        recordInternalId: "round-robin-events",
        entryId: eventValue
    });

    let typeValue = eventValueDetails["1614495-type"];

    if (!currentEntry["1614495-type"]) {
        values["1614495-type"] = typeValue
        updateEntry = true;
    }

    if (updateEntry) {
        const response = await C.updateEntries({
            updates: [
                {
                    value: values,
                    entryId: currentEntry.recordValueId,
                    recordInternalId: "hello-mello-consultations",
                },
            ],
        });
        return { response };
    }

    return { message: "No changes made." };
}
