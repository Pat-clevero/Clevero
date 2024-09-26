async function script(C) {
    const currentEntry = await C.getCurrentEntry();
    C.addJsonToSummary({ currentEntry });

    const duration = +currentEntry["1614495-duration"];
    const practitioner = currentEntry["1614495-allocated-member-id"] || [];
    const response = await C.updateEntries({
        updates: [
            {
                value: {
                    "1614495-practitioner": practitioner,
                    "1614495-type": duration === 15 ? ["1706287"] : [],
                    "1614495-status": ["1780709"],
                    "1614495-date-created": C.moment().tz('Australia/Sydney'),
                },
                entryId: currentEntry.recordValueId,
                recordInternalId: "hello-mello-consultations",
            }
        ],
    });

    return { response };
}