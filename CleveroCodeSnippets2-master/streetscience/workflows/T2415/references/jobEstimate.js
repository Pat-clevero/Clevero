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

    let { totalNumberOfKids, minimumCharge, totalDiscountAmount } = allAssociatedSessions.reduce(
        (agg, value) => {
            const currentNumberOfKids = (+value["2708638-final-number-of-kids"] || +value["2708638-no-of-kids"] || 0);
            const currentRatePerHead = (+value["2708638-rate-per-head"] || 0);
            const totalNumberOfKids = +agg.totalNumberOfKids + currentNumberOfKids;
            const currentNetAmount = currentNumberOfKids * currentRatePerHead;
            const currentTaxAmount = 0.1 * currentNetAmount;
            
            // const minimumCharge = +agg.minimumCharge + currentNetAmount + currentTaxAmount;

            const minimumCharge = +agg.minimumCharge + currentNetAmount;


            const applyDiscount = value["2708638-apply-discount"] || false;
            let totalDiscountAmount = 0;
            if (applyDiscount) {
                const discountNetAmount = currentNumberOfKids * -6;
                const discountTaxAmount = 0.1 * discountNetAmount;
                const currentDiscount = discountNetAmount + discountTaxAmount;
                totalDiscountAmount = +agg.totalDiscountAmount + currentDiscount;
            }
            return {
                totalNumberOfKids,
                minimumCharge,
                totalDiscountAmount,
            };
        },
        {
            totalNumberOfKids: 0,
            minimumCharge: 0,
            totalDiscountAmount: 0,
        }
    );

    let logString = "";
    logString = `Sessions charge before discount: ${minimumCharge};`;

    minimumCharge += totalDiscountAmount;
    logString += ` Total Discount => ${totalDiscountAmount};`;

    let travelFee = 0;
    if (+jobResponse["2708638-travel-fee"] > 0) {
        travelFee = (+jobResponse["2708638-travel-fee"] * 1.1);
        minimumCharge += travelFee;
    }
    logString += ` Travel => ${travelFee.toFixed(2)};`;

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

        minimumCharge += totalAmount;
        logString += ` Item ${counter} => ${totalAmount};`;
    }
    logString += ` Overall Job Estimate => ${minimumCharge};`;
    C.log(logString);

    let deposit = 0.3 * Math.max(categoryMinimumCharge, minimumCharge);

    await C.updateEntries({
        updates: [
            {
                value: {
                    "2708638-stem-interactions": totalNumberOfKids,
                    "2708638-minimum-amount": (Math.max(categoryMinimumCharge, minimumCharge)).toFixed(2),
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