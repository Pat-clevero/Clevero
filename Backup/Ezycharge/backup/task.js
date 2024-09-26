async function script(C) {
    const currentTask = await C.getCurrentEntry();
    const dealId = currentTask["1530347-deal"][0];
    
    if (!dealId) {
        return;
    }
    
    const { entries: allTasks } = await C.getEntries({
        recordInternalId: "ezycharge-tasks",
        filter: [
            [
                {
                    subject: "1530347-deal",
                    requestType: "i",
                    type: "array",
                    operator: "any_of",
                    value: [dealId],
                },
                "and",
                {
                    subject: "1530347-status",
                    requestType: "i",
                    type: "array",
                    operator: "any_of",
                    value: [1758163],
                },
            ],
        ],
    });

    const mostRecentTask = _.orderBy(allTasks, "1530347-due-date", "desc")[0];
    
    C.addJsonToSummary({mostRecentTask})

   return await C.updateEntries({
        updates: [
            {
                value: {
                    "1530347-last-contacted":
                        mostRecentTask["1530347-due-date"],
                },
                entryId: +dealId,
                recordInternalId: "ezycharge-deals",
            },
        ],
    });
}
