async function script(C) {
    let casesWithEmptyStartDate = await C.filterEntries({
        recordInternalId: "claimo-cases",
        ignoreLimits: false,
        filter: [
            {
                subject: "date-of-offer",
                requestType: "i",
                type: "datetime",
                operator: "is_empty",
                ignoreCase: true
            }
        ],
        limit: 10,
    });

    const updates = await Promise.all(
        casesWithEmptyStartDate.entries.map(async (claimoCase) => {
            const associations = await C.getAssociations(
                claimoCase.recordValueId,
                "claimo-cases",
                ["claimo-offers"]
            );
            C.log(associations);

            const filterResult = await filterOffers(C, claimoCase.recordValueId);
            const offers = filterResult.entries;
            C.log(offers);

            let dateReceived = "";
            offers.forEach((offer) => {
                if (!offer.hasOwnProperty("date-received")) return;

                if (dateReceived === "" && offer["date-received"])
                    dateReceived = offer["date-received"];

                else if (offer["date-received"] && (moment(offer["date-received"]) > moment(dateReceived)))
                    dateReceived = offer["date-received"];

                if(!offer["date-received"])
                    C.log("offer with null or empty", offer);
            });

            return {
                value: {
                    "date-of-offer": dateReceived
                },
                entryId: claimoCase.recordValueId,
                recordInternalId: "claimo-cases",
            };
        })
    );
    C.log(updates);

    const updateResponse = await C.updateEntries({ updates });
    return updateResponse;
}

async function filterOffers(C, caseId) {
    return await C.filterEntries({
        recordInternalId: "claimo-offers",
        ignorelimits: true,
        filter: [
            {
                subject: "case",
                requestType: "i",
                type: "array",
                operator: "any_of",
                ignoreCase: true,
                value: [caseId]
            }
        ],
    })
}