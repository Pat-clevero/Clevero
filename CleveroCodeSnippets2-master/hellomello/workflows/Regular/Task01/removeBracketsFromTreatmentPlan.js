async function script(C) {
    const filteredTreatmentPlans = await C.filterEntries({
        filter: [
            {
                subject: "1614495-name",
                requestType: "i",
                type: "text",
                operator: "starts_with",
                ignoreCase: true,
                value: "[",
            },
        ],
        limit: 600,
        recordInternalId: "hello-mello-treatment-plans",
    });
    C.addJsonToSummary(
        filteredTreatmentPlans.entries.map((entry) => entry.recordValueId)
    );

    const patientIds = filteredTreatmentPlans.entries.map(
        (entry) => entry["1614495-patient"][0]
    );
    const patientEntries = await C.getEntries({
        entryIds: patientIds,
        recordInternalId: "hello-mello-patients",
    });
    // C.addJsonToSummary(patientEntries);
    let patientEntriesMap = {};
    patientEntries.forEach((entry) => {
        patientEntriesMap[entry.recordValueId] = entry["1614495-full-name"];
    });
    let updates = [];
    // C.addJsonToSummary(patientEntriesMap);

    filteredTreatmentPlans.entries.forEach((entry) => {
        const patientName = patientEntriesMap[entry["1614495-patient"][0]];
        updates.push({
            value: {
                "1614495-name": patientName,
            },
            entryId: entry.recordValueId,
            recordInternalId: "hello-mello-treatment-plans",
        });
    });

    C.log(updates);

    //     let nameResponse = await C.updateEntries({
    //     updates,
    // });

    return;
}
