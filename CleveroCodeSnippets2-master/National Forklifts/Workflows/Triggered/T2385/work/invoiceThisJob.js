async function script(C) {
    const currentEntry = await C.getCurrentEntry({
        loadSubrecords: true,
        subrecords: [
            {
                internalId: "forklift-parts-used",
                responseType: "iov",
            },
        ],
    });

    const {
        [currentEntry.recordValueId]: {
            "forklift-timesheets": associatedTimesheets
        } = {},
    } = await C.getAssociations(
        [currentEntry.recordValueId],
        "forklift-jobs",
        ["forklift-timesheets"],
    );

    const partsUsed = currentEntry.subrecords["forklift-parts-used"];

    const getEffectiveTaxRateForId = async (id) => {
        const taxRateEntry = await C.getEntry({
            recordInternalId: "xero-tax-rates",
            entryId: id,
        });
        const etr = +taxRateEntry["effective-tax-rate"];

        return etr;
    };

    const currentEntryCustomer = await C.getEntry({
        recordInternalId: "forklift-customers",
        entryId: currentEntry.customer[0],
    });
    const linkedOrg = currentEntryCustomer["132-linked-organisation"];

    const billingTypes = {
        time_and_materials: 200028954,
        quoted_fixed_price: 200028953,
    };
    const date = moment.tz("Australia/Sydney");
    const dueDate = moment().add(7, "days");
    const draftStatusValue = [34126];

    let response_createInvoice = await C.createEntry({
        value: {
            "date-issued": date.format("YYYY-MM-DD"),
            "due-date": dueDate.format("YYYY-MM-DD"),
            "reference": currentEntry.autoId,
            "status": draftStatusValue,
            "customer": linkedOrg,
            "132-linked-job": [currentEntry.recordValueId],
            "net-total": 0,
            "tax-total": 0,
            "total": 0,
        },
        recordInternalId: "invoices",
        options: {
            returnRecordInfo: true,
            makeAutoId: true,
        },
    });

    if (
        response_createInvoice.success &&
        response_createInvoice.success.length > 0
    ) {
        ids = response_createInvoice.success[0].id;
        C.addHtmlToSummary(
            "Invoice Creation Successful Link: <a href='https://qa3.clevero.co/app/records/1719816/view/" +
            ids +
            "'>" +
            ids +
            "</a>"
        );
    } else {
        C.addHtmlToSummary("Project Creation Failed");
    }

    let finalNet = 0;
    let finalTax = 0;
    let finalTotal = 0;

    const gstOnIncomeValueId = 129032;
    const defaultTaxRate = await getEffectiveTaxRateForId(gstOnIncomeValueId);

    const createdInvoiceId = response_createInvoice.success[0].id;
    let values = [];
    let index = 1;
    if (currentEntry["132-billing-type"][0] === billingTypes.time_and_materials) {
        let totalTimesheetDuration = associatedTimesheets
            .map(timesheet =>
                +timesheet.duration)
            .reduce((a, b) => a + b, 0);

        const unitPrice = 120;
        const net = unitPrice * totalTimesheetDuration;
        const tax = (net * defaultTaxRate) / 100;

        finalNet += net;
        finalTax += tax;
        finalTotal += net + tax;

        values.push({
            description: "Labour",
            quantity: totalTimesheetDuration,
            rate: unitPrice,
            "tax-rate": [gstOnIncomeValueId],
            net,
            tax,
            total: net + tax,
            parent: createdInvoiceId,
            index,
        });

        // loop through each part and add them as a line
        C.addJsonToSummary({ partsUsed });
        const mappedValues = await Promise.all(partsUsed.map(async part => {
            const taxRateValueId = +part["tax-rate"][0] || gstOnIncomeValueId;
            finalNet += part.net;
            finalTax += part.tax;
            finalTotal += part.total;

            return {
                description: part.description,
                quantity: part.quantity,
                rate: part.rate,
                "tax-rate": [taxRateValueId],
                net: part.net,
                tax: part.tax,
                total: part.total,
                parent: createdInvoiceId,
                index: ++index,
            };
        }));

        values = [...values, ...mappedValues];

    } else if (currentEntry["132-billing-type"][0] === billingTypes.quoted_fixed_price) {
        const amount = +currentEntry["132-quote-amount-to-charge"] || 0;
        const quantity = 1;
        const net = amount * quantity;
        const tax = (net * defaultTaxRate) / 100;
        const total = net + tax;
        finalNet += net;
        finalTotal += total;
        finalTax += tax;

        values.push({
            quantity,
            rate: amount,
            "tax-rate": [gstOnIncomeValueId],
            net,
            tax,
            total,
            parent: createdInvoiceId,
            index: 1,
        });
    } else {
        throw "Unknown billing type";
    }

    let response_createOrderLine = await C.createEntries({
        values,
        recordInternalId: "xero-order-items",
        options: {
            returnRecordInfo: true,
            makeAutoId: true,
        },
    });

    await C.updateEntries({
        updates: [
            {
                value: {
                    "net-total": +finalNet,
                    "tax-total": +finalTax,
                    total: finalTotal,
                },
                recordInternalId: "invoices",
                entryId:
                    response_createOrderLine.success[0].value[11771],
            },
        ],
    });

    C.log("Invoice created!");
    return C.addRedirect(
        `/app/records/1719816/view/${createdInvoiceId}`
    );

    /* XERO SYNC STUFF ***************************************
    let tenantId = (await C.getCompanySettings()).xeroOrganisation.xeroId;
    if (!tenantId) {
        throw "Default xero organisation is not set in company settings";
    }

    let [
        xeroTaxRates,
        xeroBrandingThemes,
        xeroCurrencies,
        xeroLineAmountTypes,
        xeroInvoiceTypes,
        xeroInvoiceStatusCodes,
        xeroAccounts,
    ] = await Promise.all([
        C.getEntries({
            recordInternalId: "xero-tax-rates",
            ignoreLimits: true,
            filter: [],
        }),
        C.getEntries({
            recordInternalId: "xero-branding-themes",
            ignoreLimits: true,
            filter: [],
        }),
        C.getEntries({
            recordInternalId: "xero-currencies",
            ignoreLimits: true,
            filter: [],
        }),
        C.getEntries({
            recordInternalId: "xero-line-amount-types-131-1596167634161",
            ignoreLimits: true,
            filter: [],
        }),
        C.getEntries({
            recordInternalId: "xero-invoice-types-131-1596167577672",
            ignoreLimits: true,
            filter: [],
        }),
        C.getEntries({
            recordInternalId: "xero-invoice-status-codes-131-1596167673522",
            ignoreLimits: true,
            filter: [],
        }),
        C.getEntries({
            recordInternalId: "accounts",
            ignoreLimits: true,
            filter: [],
        }),
    ]);

    let brandingThemeID = xeroBrandingThemes.entries[0]
        ? xeroBrandingThemes.entries[0]["xero-id"]
        : undefined;

    * END XERO SYNC STUFF **********************************/
}