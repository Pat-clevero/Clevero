async function script(C) {
    const expiredMembers = await C.filterEntries({
        recordInternalId: "neighbourhood-house-members",
        filter: [
            {
                requestType: "i",
                subject: "membership-expiry",
                type: "date",
                operator: "before",
                ignoreCase: true,
                value: {
                    relative: true,
                    value: null,
                    type: "TODAY",
                },
            },
            "and",
            {
                requestType: "i",
                subject: "member-status",
                type: "array",
                operator: "none_of",
                ignoreCase: true,
                value: ["132987"],
            },
        ],
    });
    C.addJsonToSummary({ expiredMembers });
    if (expiredMembers.entries.length === 0)
        return { message: "No expired member entries to deactivate. No changes have been made." };

    const result = await Promise.all(expiredMembers.entries.map(async (member) =>
        await C.updateEntries({
            updates: [
                {
                    value: {
                        "member-status": [132987],
                    },
                    entryId: member.recordValueId,
                    recordInternalId: "neighbourhood-house-members",
                },
            ]
        })
    ));

    return { result };
}
