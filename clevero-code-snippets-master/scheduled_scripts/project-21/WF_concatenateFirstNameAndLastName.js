async function script(C) {
    const updateCRSClaim = async (id, fullname) => {
        return await C.updateEntries({
            updates: [
                {
                    value: {
                        "name": fullname,
                        "crs-claim-name": fullname,
                    },
                    entryId: id,
                    recordInternalId: "super-health-team-crs-claims",
                },
            ],
        });
    };

    const currentEntry = await C.getCurrentEntry();
    const result = await C.getEntry({
        entryId: currentEntry["crs-claim"][0],
        recordInternalId: "super-health-team-crs-claims",
    }).then((response) => {
        if(response)
            return updateCRSClaim(
                response.recordValueId,
                `${response["first-name"]} ${response["last-name"]}`);
        else
            throw new Error("No CRS Claim entry found.");
    }).catch(error => error);

    return result;
}