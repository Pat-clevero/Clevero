async function script(C) {
    const session = await C.getCurrentEntry();

    const jobId = session["2708638-job"][0];
    
    if (!jobId) {
        C.addJsonToSummary({ mssg: "No job associated with this session" });
        return;
    }
    
    const jobResponse = await C.getEntry({
        entryId: jobId,
        recordInternalId: "jobs", // if not passed, current record's internal will be taken
    });
    let eventCategoryId = jobResponse["2708638-secondary-job-type"][0];
    C.addJsonToSummary(jobResponse);
    
    const eventCategoryResponse = await C.getEntry({
        entryId: eventCategoryId,
        recordInternalId: "street-science-secondary-job-types", // if not passed, current record's internal will be taken
    });
    
    const categoryMinimumCharge = eventCategoryResponse["2708638-minimum-charge"] || 1200;

    const { entries: allAssociatedSessions } = await C.getEntries({
        recordInternalId: "street-science-services",
        filter: [
            [
                {
                    subject: "2708638-job",
                    requestType: "i",
                    type: "array",
                    operator: "any_of",
                    value: [jobId],
                },
            ],
        ],
    });

    const { totalNumberOfKids, minimumCharge } = allAssociatedSessions.reduce(
        (agg, value) => {
            const totalNumberOfKids =
                +agg.totalNumberOfKids + (+value["2708638-final-number-of-kids"] || 0);
            const minimumCharge =
                +agg.minimumCharge +
                (+value["2708638-final-number-of-kids"] || 0) *
                    (+value["2708638-rate-per-head"] || 0);
            return {
                totalNumberOfKids,
                minimumCharge,
            };
        },
        {
            totalNumberOfKids: 0,
            minimumCharge: 0,
        }
    );

    const deposit = 0.3 * Math.max(categoryMinimumCharge,minimumCharge);

    await C.updateEntries({
        updates: [
            {
                value: {
                    "2708638-stem-interactions": totalNumberOfKids,
                    "2708638-minimum-amount": (Math.max(categoryMinimumCharge,minimumCharge)).toFixed(2),
                    "2708638-deposit-amount": deposit.toFixed(2),
                },
                entryId: jobId,
                recordInternalId: "jobs",
            },
        ],
    });

    return {
        mssg:
            "Updated stem interactions field with total kid count from associated sessions",
    };
}
