async function script(C) {
    const {
        timezone: companyTimeZone = "Australia/Sydney",
    } = await C.getCompanySettings();

    let currentEntry = await C.getCurrentEntry({
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
                responseType: "iov",
            },
        ],
    });

    C.addJsonToSummary(currentEntry);
    const xeroStatuses = {
        DRAFT: [34126],
        SUBMITTED: [34127],
        DELETED: [34128],
        AUTHORISED: [34129],
        PAID: [34130],
        VOIDED: [34131],
    };

    let tenantId = (await C.getCompanySettings()).xeroOrganisation.xeroId;
    if (!tenantId) {
        throw "Default xero organisation is not set in company settings";
    }
    let [
        secondaryJobTypes,
        sessionTemplates,
        xeroItems,
        xeroAccounts,
    ] = await Promise.all([
        C.getEntries({
            recordInternalId: "street-science-secondary-job-types",
            ignoreLimits: true,
            filter: [],
        }),
        C.getEntries({
            recordInternalId: "street-science-sessions-templates",
            ignoreLimits: true,
            filter: [],
        }),
        C.getEntries({
            recordInternalId: "xero-items",
            ignoreLimits: true,
            filter: [],
        }),
        C.getEntries({
            recordInternalId: "accounts",
            ignoreLimits: true,
            filter: [],
        }),
    ]);
    let = secondaryJobTypeOjbect = null;
    if (currentEntry["2708638-secondary-job-type"]) {
        secondaryJobTypeOjbect =
            secondaryJobTypes.entries.filter(
                (o) =>
                    o.recordValueId ==
                    currentEntry["2708638-secondary-job-type"][0]
            ) || null;
    }

    C.addJsonToSummary(secondaryJobTypeOjbect);

    let linkedInvoiceFieldFound =
        currentEntry["2708638-final-invoice-generated"];

    if (linkedInvoiceFieldFound == true) {
        return;
    }

    const classroomKitsIds = currentEntry.subrecords[
        "xero-order-items"
    ]
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

    let invoiceValue = {
        "2708638-job": [currentEntry.recordValueId],
        "date-issued": moment.tz(companyTimeZone).format("YYYY-MM-DD"),
        "due-date": moment.tz(companyTimeZone).format("YYYY-MM-DD"),
        reference: currentEntry["2708638-name"],
        customer: currentEntry["2708638-invoicing-organisation"],
        status: xeroStatuses.DRAFT,
    };

    C.addJsonToSummary(invoiceValue);
    let createInvoice = await C.createEntries({
        values: [invoiceValue],
        recordInternalId: "invoices",
        options: {
            returnRecordInfo: true,
            makeAutoId: true,
        },
    });

    if (createInvoice.success && createInvoice.success.length > 0) {
        ids = createInvoice.success[0].id;

        C.addHtmlToSummary(
            "Invoice Creation Successful Link: <a href='https://app.clevero.co/app/records/1719816/view/" +
            ids +
            "'>" +
            ids +
            "</a>"
        );

        await C.updateEntries({
            updates: [
                {
                    value: {
                        "2708638-final-invoice-generated": true,
                    },
                    entryId: currentEntry.recordValueId,
                    recordInternalId: "jobs",
                },
            ],
            options: {
                // throwOnUpdateError: true,
                returnRecordInfo: true,
            },
        });
    } else {
        C.addHtmlToSummary("Invoice Creation Failed");
    }

    let createdInvoiceEntryId = createInvoice.success[0].id;

    let getCreatedEntry = await C.getEntry({
        recordInternalId: "invoices",
        entryId: +createdInvoiceEntryId,
    });

    // const updatedEntry = await C.updateEntries({
    //     updates: [{
    //         value: { "invoice-number": getCreatedEntry.autoId },
    //         recordInternalId: "invoices",
    //         entryId: getCreatedEntry.recordValueId
    //     }]
    // });

    let lineItems = currentEntry.associations["street-science-services"];
    lineItems = _.filter(lineItems, function (session) {
        return (
            session["2708638-service-type"] == 300021099 ||
            session["2708638-service-type"] == 300021100
        );
    });

    const groupedSessions = _.groupBy(lineItems, session =>
        `${session["2708638-xero-item"]}-${session["2708638-rate-per-head"]}-${session["2708638-apply-discount"] ? true : false}`);
    C.addJsonToSummary({ groupedSessions });

    let orderLineValues = [];
    let sumTotal = 0;
    let netTotal = 0;
    let taxTotal = 0;

    let index = 1;
    for (let key in groupedSessions) {
        const group = groupedSessions[key];
        const applyDiscount = group[0]["2708638-apply-discount"] || false;
        // return C.addJsonToSummary({group})
        const totalQuantity = group.reduce((acc, curr) => {
            const q = curr["2708638-final-number-of-kids"] || 1;
            return acc + q;
        }, 0);
        const netValue = totalQuantity * group[0]["2708638-rate-per-head"];
        const taxValue = netValue * 0.1;
        const totalValue = netValue * 1.1;

        sumTotal += totalValue;
        netTotal += netValue;
        taxTotal += taxValue;

        orderLineValues.push({
            "2708638-session": [group[0].recordValueId],
            item: group[0]["2708638-xero-item"],
            description: group[0]["2708638-invoice-line-description"],
            quantity: totalQuantity,
            rate: group[0]["2708638-rate-per-head"],
            "tax-rate": [300101130],
            account: secondaryJobTypeOjbect[0]["2708638-default-revenue-account"],
            tax: taxValue.toFixed(2),
            total: totalValue.toFixed(2),
            net: netValue.toFixed(2),
            parent: +createdInvoiceEntryId,
            index: index++,
        });

        if (applyDiscount) {
            const discountNetValue = totalQuantity * -6;
            const discountTaxValue = discountNetValue * 0.1;
            const discountTotalValue = discountNetValue * 1.1;
            sumTotal += discountTotalValue;
            netTotal += discountNetValue;
            taxTotal += discountTaxValue;
            orderLineValues.push({
                "2708638-session": [group[0].recordValueId],
                item: group[0]["2708638-xero-item"],
                description: group[0]["2708638-invoice-line-description"],
                quantity: totalQuantity,
                rate: -6,
                "tax-rate": [300101130],
                account:
                    secondaryJobTypeOjbect[0][
                    "2708638-default-revenue-account"
                    ],
                tax: discountTaxValue.toFixed(2),
                total: discountTotalValue.toFixed(2),
                net: discountNetValue.toFixed(2),
                parent: +createdInvoiceEntryId,
                index: orderLineValues.length + 1,
            });
        }
    }
    C.addJsonToSummary({ orderLineValues });

    for (const kit of currentEntry.subrecords[
        "xero-order-items"
    ]) {
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

        sumTotal += totalAmount;
        netTotal += netAmount;
        taxTotal += taxAmount;

        orderLineValues.push({
            parent: +createdInvoiceEntryId,
            index: orderLineValues.length + 1,
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

    // Add discount item
    let travelAccountCode = 300101151;
    let travelAmount = currentEntry["2708638-travel-fee"];
    if (travelAmount && travelAmount > 0) {
        orderLineValues.push({
            item: [300290113],
            description: "Travel & Accommodation Charge",
            quantity: 1,
            rate: travelAmount,
            "tax-rate": [300101130],
            account: [travelAccountCode],
            tax: (travelAmount * 0.1).toFixed(2),
            total: (travelAmount * 1.1).toFixed(2),
            net: travelAmount.toFixed(2),
            parent: +createdInvoiceEntryId,
            index: orderLineValues.length + 1,
        });

        sumTotal += travelAmount * 1.1;
        netTotal += travelAmount;
        taxTotal += travelAmount * 0.1;
    }

    // Add discount item
    let accountCode = 300101151;
    let initialDiscount = currentEntry["2708638-initial-deposit-amount"] || 0;
    orderLineValues.push({
        item: [300101398],
        description: "Less deposit paid",
        quantity: 1,
        rate: initialDiscount * -1,
        "tax-rate": [300101130],
        account: [accountCode],
        tax: (initialDiscount * 0.1 * -1).toFixed(2),
        total: (initialDiscount * 1.1 * -1).toFixed(2),
        net: (initialDiscount * -1).toFixed(2),
        parent: +createdInvoiceEntryId,
        index: orderLineValues.length + 1,
    });

    sumTotal += initialDiscount * -1 * 1.1;
    netTotal += initialDiscount * -1;
    taxTotal += initialDiscount * -1 * 0.1;

    C.addJsonToSummary({ orderLineValues });
    let createdInvoiceWithOrderLineItems = await C.createEntries({
        values: orderLineValues,
        recordInternalId: "xero-order-items",
        options: {
            returnRecordInfo: true,
            makeAutoId: true,
        },
    });

    C.log("Invoice and its order line items are created successfully");
    const response = await C.updateEntries({
        updates: [
            {
                value: {
                    "net-total": netTotal,
                    "tax-total": taxTotal,
                    total: sumTotal,
                },
                recordInternalId: "invoices",
                entryId: createdInvoiceEntryId,
            },
        ],
    });

    return C.addRedirect(`/app/records/1719816/view/${createdInvoiceEntryId}`);
}
