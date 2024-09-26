async function script(C){
    const currentEntry = await C.getCurrentEntry();
    const membershipExpiryDate = currentEntry["membership-expiry"];
    const isExpired = C.moment().tz('Australia/Sydney').isAfter(membershipExpiryDate , 'day');

    if (isExpired) {
        const response = await C.updateEntries({
            updates: [
                {
                    value: {
                        "member-status": [ 132987 ]
                    },
                    entryId: currentEntry.recordValueId,
                    recordInternalId: "neighbourhood-house-members",
                },
            ],
        });

        return response;
    }
}