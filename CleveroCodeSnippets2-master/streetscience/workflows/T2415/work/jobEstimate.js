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
        loadSubrecords: true,
        subrecords: [
            {
                internalId: "xero-order-items",
                responseType: "iov",
            },
        ],
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

    let { totalNumberOfKids, totalCharge, totalDiscountAmount, totalTaxAmount } = allAssociatedSessions.reduce(
        (agg, value) => {
            const currentNumberOfKids = (+value["2708638-final-number-of-kids"] || +value["2708638-no-of-kids"] || 0);
            const currentRatePerHead = (+value["2708638-rate-per-head"] || 0);
            const currentNetAmount = currentNumberOfKids * currentRatePerHead;
            const currentTaxAmount = 0.1 * currentNetAmount;

            const totalNumberOfKids = +agg.totalNumberOfKids + currentNumberOfKids;
            const totalCharge = +agg.totalCharge + currentNetAmount;
            let totalTaxAmount = +agg.totalTaxAmount + currentTaxAmount;

            const applyDiscount = value["2708638-apply-discount"] || false;
            let totalDiscountAmount = agg.totalDiscountAmount;
            if (applyDiscount) {
                const currentDiscountNetAmount = currentNumberOfKids * -6;
                totalDiscountAmount += currentDiscountNetAmount;
                totalTaxAmount += 0.1 * currentDiscountNetAmount;
            }
            return {
                totalNumberOfKids,
                totalCharge,
                totalDiscountAmount,
                totalTaxAmount,
            };
        },
        {
            totalNumberOfKids: 0,
            totalCharge: 0,
            totalDiscountAmount: 0,
            totalTaxAmount: 0,
        }
    );

    let logString = `
        Total Sessions charge before discount: ${totalCharge.toFixed(2)};
        Total Discount => ${totalDiscountAmount.toFixed(2)};
        `;
    totalCharge += totalDiscountAmount + totalTaxAmount;

    const classroomKitsIds = jobResponse.subrecords["xero-order-items"]
        .map((kit) => kit["item"] && kit["item"][0])
        .filter((id) => id);
    let classroomKits = [];
    if (classroomKitsIds && classroomKitsIds.length) {
        classroomKits =
            (await C.getEntries({
                entryIds: classroomKitsIds,
                recordInternalId: "xero-items",
            })) || [];
    }
    let counter = 1;
    for (const kit of jobResponse.subrecords["xero-order-items"]) {
        const quantity = +kit["quantity"] || 1;
        const rate = +kit["rate"] || 0;

        const item =
            classroomKits.find(
                (ckit) => +ckit.recordValueId === kit["item"][0]
            ) || {};

        const taxRateId =
            item["sales-details-tax-type"] && item["sales-details-tax-type"][0];
        let taxRate = {};
        if (taxRateId) {
            taxRate =
                (await C.getEntry({
                    entryId: taxRateId,
                    recordInternalId: "xero-tax-rates",
                })) || {};
        }

        const taxRatePercent = (+taxRate["effective-tax-rate"] || 0) / 100;

        const netAmount = quantity * rate;
        const taxAmount = taxRatePercent * netAmount;
        const totalAmount = netAmount + taxAmount;

        totalCharge += totalAmount;
        logString += ` Item ${counter} => ${totalAmount.toFixed(2)};`;
    }
    logString += ` Overall Job Estimate => ${totalCharge.toFixed(2)};`;

    let jobEstimate = 0;
    let minimumCharge = 0;
    if(totalCharge < categoryMinimumCharge)
        minimumCharge = categoryMinimumCharge * 1.1;
    else
        minimumCharge = totalCharge;

    logString += ` Minimum Charge => ${minimumCharge.toFixed(2)};`;
    let travelFee = +jobResponse["2708638-travel-fee"] || 0;
    travelFee *= 1.1;
    jobEstimate = minimumCharge + travelFee;
    const deposit = 0.3 * jobEstimate;
    logString += ` Travel => ${travelFee.toFixed(2)};`;

    C.log(logString);
    await C.updateEntries({
        updates: [
            {
                value: {
                    "2708638-stem-interactions": totalNumberOfKids,
                    "2708638-minimum-amount": jobEstimate.toFixed(2),
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