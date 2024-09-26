async function script(C) {
    const {
        timezone: companyTimeZone = "Australia/Brisbane",
    } = await C.getCompanySettings();

    const [job, jobAsIV] = await Promise.all([
        C.getCurrentEntry({
            loadSubrecords: true,
            subrecords: [
                {
                    internalId: "xero-order-items",
                },
            ],
            loadAssociations: true,
            associations: [
                {
                    internalId: "street-science-services",
                    linkedFieldInternalId: "2708638-job",
                },
            ],
        }),
        C.getCurrentEntry({
            responseType: "iv",
        }),
    ]);

    const loggedInUserId = C.getUser().id;

    let sessions = job.associations["street-science-services"];
    sessions = _.filter(sessions, function (session) {
        return (
            session["2708638-service-type"] == 300021099 ||
            session["2708638-service-type"] == 300021100
        );
    });
    const classroomKitsIds = job.subrecords["xero-order-items"]
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

    const quoteToBeGenerated = {
        title: `${job.autoId}-${jobAsIV["2708638-organisation"]}-${moment(
            job["2708638-start-time"]
        )
            .tz(companyTimeZone)
            .format("YYYY-MM-DD")}`,
        status: [464232],
        organisation:
            job["2708638-organisation"] && job["2708638-organisation"].length
                ? [job["2708638-organisation"][0]]
                : [],
        recipient:
            job["2708638-main-contact"] && job["2708638-main-contact"].length
                ? [job["2708638-main-contact"][0]]
                : [],
        "2708638-job-type":
            job["2708638-primary-job-type"] &&
                job["2708638-primary-job-type"].length
                ? [job["2708638-primary-job-type"][0]]
                : [],

        "2708638-secondary-type":
            job["2708638-secondary-job-type"] &&
                job["2708638-secondary-job-type"].length
                ? [job["2708638-secondary-job-type"][0]]
                : [],
        "2708638-placeholder-job": [job.recordValueId],
        "expiry-date": moment().tz("Australia/Brisbane").add(7, "days").format("YYYY-MM-DD"),
        "2708638-job-date": moment(job["2708638-start-time"]).tz("Australia/Brisbane").format("YYYY-MM-DD"),
        "date-created": moment().tz("Australia/Brisbane").format("YYYY-MM-DD"),
        "sales-rep": loggedInUserId ? [loggedInUserId] : [],
        "2708638-session-outline": job["2708638-session-outline"],
    };

    const createdQuoteResponse = await C.createEntries({
        values: [quoteToBeGenerated],
        recordInternalId: "standard-quotes",
    });

    const quoteId = createdQuoteResponse.success[0].id;

    const serviceLineItems = [];
    /**
     * IF same item with same discount and same rate ==> group them as one item, add the quantities together and just display one item (representing all sessions with same item)
     */
    const groupedSessions = _.groupBy(sessions, session =>
        `${session["2708638-xero-item"]}-${session["2708638-rate-per-head"]}-${session["2708638-apply-discount"] ? true : false}`);
    C.addJsonToSummary({ groupedSessions });

    let index = 1;
    for (let key in groupedSessions) {
        if (groupedSessions.hasOwnProperty(key)) {
            // add quantities together
            // push one item to serviceLineItems
            const group = groupedSessions[key];
            const totalQuantity = group.reduce((acc, curr) => {
                const q = curr["2708638-no-of-kids"] || 1;
                return acc + q;
            }, 0);

            const quantity = totalQuantity
            const rate = group[0]["2708638-rate-per-head"] || 0;
            const applyDiscount = group[0]["2708638-apply-discount"] || false;
            const netAmount = quantity * rate;
            const taxAmount = 0.1 * netAmount;
            const totalAmount = netAmount + taxAmount;

            let startTime;
            let endTime;
            if (group[0]["2708638-start-time"]) {
                startTime = moment(group[0]["2708638-start-time"])
                    .tz(companyTimeZone)
                    .format("YYYY-MM-DD hh:mm a");
            }
            if (group[0]["2708638-end-time"]) {
                endTime = moment(group[0]["2708638-end-time"])
                    .tz(companyTimeZone)
                    .format("YYYY-MM-DD hh:mm a");
            }
            const description =`${group[0]["2708638-invoice-line-description"]}`;

            serviceLineItems.push({
                parent: quoteId,
                index: index++,
                item:
                    group[0]["2708638-xero-item"] &&
                        group[0]["2708638-xero-item"].length
                        ? [group[0]["2708638-xero-item"][0]]
                        : [],
                description,
                quantity,
                rate,
                "tax-rate": [300101130], // GST on income,
                net: netAmount,
                tax: taxAmount,
                total: totalAmount,
            });

            if (applyDiscount) {
                const discountNetAmount = quantity * -6;
                const discountTaxAmount = 0.1 * discountNetAmount;
                const discountTotalAmount = discountNetAmount + discountTaxAmount;
                serviceLineItems.push({
                    parent: quoteId,
                    index: serviceLineItems.length + 1,
                    item:
                        group[0]["2708638-xero-item"] &&
                            group[0]["2708638-xero-item"].length
                            ? [group[0]["2708638-xero-item"][0]]
                            : [],
                    description: "Discount Applied",
                    quantity,
                    rate: -6,
                    "tax-rate": [300101130], // GST on income,
                    net: discountNetAmount,
                    tax: discountTaxAmount,
                    total: discountTotalAmount,
                });
            }
        }
    }

    for (const kit of job.subrecords["xero-order-items"]) {
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

        serviceLineItems.push({
            parent: quoteId,
            index: serviceLineItems.length + 1,
            item: [item.recordValueId],
            description: item.description,
            quantity,
            rate,
            "tax-rate": taxRateId ? [taxRateId] : [],
            net: netAmount,
            tax: taxAmount,
            total: totalAmount,
        });
    }

    if (+job["2708638-travel-fee"] > 0) {
        const rate = +job["2708638-travel-fee"];
        const netAmount = rate;
        const taxAmount = 0.1 * netAmount;
        const totalAmount = netAmount + taxAmount;
        serviceLineItems.push({
            parent: quoteId,
            index: serviceLineItems.length + 1,
            item: [300289358], // Travel Surcharge,
            description:
                "Travel Surcharge - an additional travel fee applies as your location is outside of our central Brisbane travel zone.",
            quantity: 1,
            rate,
            "tax-rate": [300101130], //GST on income
            net: netAmount,
            tax: taxAmount,
            total: totalAmount,
        });
    }

    const { subtotal, netTotal, taxTotal } = serviceLineItems.reduce(
        (agg, value) => {
            const subtotal = +agg.subtotal + +value.total;
            const netTotal = +agg.netTotal + +value.net;
            const taxTotal = +agg.taxTotal + +value.tax;

            return {
                subtotal,
                netTotal,
                taxTotal,
            };
        },
        {
            subtotal: 0,
            netTotal: 0,
            taxTotal: 0,
        }
    );

    C.addJsonToSummary({ serviceLineItems });
    // return;

    await Promise.all([
        C.createEntries({
            values: serviceLineItems,
            recordInternalId: "xero-order-items",
        }),
        C.updateEntries({
            updates: [
                {
                    value: {
                        "net-total": netTotal,
                        "tax-total": taxTotal,
                        total: subtotal,
                    },
                    entryId: quoteId,
                    recordInternalId: "standard-quotes",
                },
            ],
        }),
    ]);

    return C.addRedirect(`/app/records/2627680/view/${quoteId}/edit`);
}
