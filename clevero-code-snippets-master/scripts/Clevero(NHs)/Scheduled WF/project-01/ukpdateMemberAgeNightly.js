async function script(C) {
    /**
     * NOTE: this filters only the first 1000 members, will have to update once
     * member count surpasses 1000 in the future
     */
    const filteredResult = await C.filterEntries({
        filter: [],
        limit: 1000,
        recordInternalId: "neighbourhood-house-members",
    });
    let memberEntries = filteredResult
        ? filteredResult.entries
        : [];
    memberEntries = memberEntries
        .filter(member => member["date-of-birth"]);

    if (memberEntries.length === 0) return;

    C.addJsonToSummary({ numOfMembers: memberEntries.length });

    const updates = memberEntries.map(member => {
        const dateOfBirth = member["date-of-birth"];
        var currentAge = moment().diff(dateOfBirth, "years");

        return {
            value: {
                "age": currentAge,
            },
            entryId: member.recordValueId,
            recordInternalId: "neighbourhood-house-members",
        };
    });

    const response = await C.updateEntries({ updates });
    return { response };
}
