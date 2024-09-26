async function script(C) {
    const { entryId, recordInternalId } = C.getEvent();
    const currentEntry = await C.getCurrentEntry();
    // const currentEntryAsIV = await C.getCurrentEntry({ responseType: "iov" });

    const res = await C.filterEntries({
        filter: [
            {
                subject: "16163", // medicare number
                type: "text",
                operator: "equals",
                ignoreCase: true,
                value: currentEntry["medicare-number"],
            },
            "and",
            {
                subject: "16164", // IRN
                type: "number",
                operator: "equals",
                ignoreCase: true,
                value: currentEntry["medicare-reference"],
            },
            "and",
            {
                subject: "16048",
                type: "date",
                operator: "equals",
                ignoreCase: true,
                value: {
                    relative: false,
                    value: currentEntry["date-of-birth"],
                },
            },
        ],
        recordInternalId: "dental2you-patients",
    });

    const patients = res.entries;

    if (patients.length > 1) {
        for (const patient of patients) {
            C.log(patient);
            await C.updateEntries({
                updates: [
                    {
                        value: {
                            "1188947-potential-duplicate": true, // Replace with the actual key of the checkbox field
                        },
                        recordInternalId,
                        entryId: patient.recordValueId,
                    },
                ],
            });
        }
    }

    C.addJsonToSummary({
        currentEntry,
        res,
        patients,
    });

    return;
}
