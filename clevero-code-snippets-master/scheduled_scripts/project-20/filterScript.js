async function script(C) {
    let casesWithEmptyStartDate = await C.filterEntries({
        recordInternalId: "claimo-cases",
        ignoreLimits: false,
        filter: getEmptyAndDeclinedFilter(),
        // filter: getEmptyAndIDROutcomeNotDeclinedAndNotEmpty(),

        /**
         * STATUS OPTIONS
         */
        // Awaiting Submission
        // filter: getEmptyAndIDROutcomeEmptyAndSTatusIsX("814530"),

        // IDR
        // filter: getEmptyAndIDROutcomeEmptyAndSTatusIsX("814706"),

        // Awaiting AFCA Authority
        // filter: getEmptyAndIDROutcomeEmptyAndSTatusIsX("814707"),

        // Pending EDR
        // filter: getEmptyAndIDROutcomeEmptyAndSTatusIsX("829271"),

        // EDR
        // filter: getEmptyAndIDROutcomeEmptyAndSTatusIsX("814708"),

        // Closed Lost
        // filter: getEmptyAndIDROutcomeEmptyAndSTatusIsX("829273"),

        // Empty
        // filter:  getEmptyAndIDROutcomeEmptyAndSTatusIsEmpty(),

        limit: 500,
    });
    C.log("Total matched entries: ", casesWithEmptyStartDate.totalMatchedEntries);

    const promises = await Promise.all(
        casesWithEmptyStartDate.entries.map(async (claimoCase) => {
            const associatedOffers = await C.getAssociations(
                claimoCase.recordValueId,
                "claimo-cases",
                ["claimo-offers"]
            );

            return {
                id: claimoCase.recordValueId,
                associatedOffers
            };
        })
    );
    const mappedCaseIDsWithAssociatedOffers = promises.filter(pItem =>
        pItem.associatedOffers[pItem.id]["claimo-offers"].length > 0);
    // C.log(mappedCaseIDsWithAssociatedOffers);

    let updates = [];
    mappedCaseIDsWithAssociatedOffers.forEach((caseItem) => {
        const datesArray = caseItem.associatedOffers[caseItem.id]["claimo-offers"]
            .map(offerItem => offerItem["date-received"])
            .filter(date => date);
        const latestDateReceived = datesArray.length > 0
            ? getLatestDateValue(datesArray)
            : null;

        updates.push({
            value: {
                "date-of-offer": latestDateReceived
            },
            entryId: caseItem.id,
            recordInternalId: "claimo-cases",
        });
    });
    C.log("Updates: ", updates);

    const updateResponse = await C.updateEntries({ updates });
    return updateResponse;
}

function getLatestDateValue(arrayOfDateStrings) {
    const arrayOfDateObjects = arrayOfDateStrings
        .map(dateString => new Date(dateString));
    return moment(Math.max(...arrayOfDateObjects))
        .format("YYYY-MM-DD");
}

function getEmptyAndIDROutcomeNotDeclinedAndNotEmpty() {
    return [
        {
            subject: "16708", // Date of Offer
            type: "date",
            operator: "is_empty",
            ignoreCase: true
        },
        "and",
        {
            subject: "15302", // IDR Outcome
            type: "array",
            operator: "none_of",
            ignoreCase: true,
            value: [
                "834334" // Declined
            ]
        },
        "and",
        {
            subject: "15302", // IDR Outcome
            type: "array",
            operator: "not_empty",
            ignoreCase: true
        }
    ];
}

function getEmptyAndDeclinedFilter() {
    return [
        {
            subject: "16708",
            type: "date",
            operator: "is_empty",
            ignoreCase: true,
        },
        "and",
        {
            subject: "15302", // IDR Outcome
            type: "array",
            operator: "any_of",
            ignoreCase: true,
            value: ["834334"], // Declined
        },
    ];
}

function getEmptyAndIDROutcomeEmptyAndSTatusIsX(status) {
    return [
        {
            subject: "16708",
            type: "date",
            operator: "is_empty",
            ignoreCase: true,
        },
        "and",
        {
            subject: "15302",
            type: "array",
            operator: "is_empty",
            ignoreCase: true,
        },
        "and",
        {
            subject: "15130",
            type: "array",
            operator: "any_of",
            ignoreCase: true,
            value: [status],
        },
    ];
}

function getEmptyAndIDROutcomeEmptyAndSTatusIsEmpty() {
    return [
        {
            subject: "16708",
            type: "date",
            operator: "is_empty",
            ignoreCase: true,
        },
        "and",
        {
            subject: "15302",
            type: "array",
            operator: "is_empty",
            ignoreCase: true,
        },
        "and",
        {
            subject: "15130",
            type: "array",
            operator: "is_empty",
            ignoreCase: true,
        },
    ];
}