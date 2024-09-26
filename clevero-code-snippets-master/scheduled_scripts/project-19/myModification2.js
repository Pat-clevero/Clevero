async function script(C) {
    const getChildrenAppointments = async (appointmentId) => {
        return await C.filterEntries({
            filter: [
                {
                    subject: "1795685-parent-appointment",
                    requestType: "i",
                    type: "array",
                    operator: "any_of",
                    ignoreCase: true,
                    value: [appointmentId]
                }
            ],
            recordInternalId: "ferrari-consulting-group-appointments"
        });
    };

    const createOrderLineItems = async (parentInvoiceId, entries) => {
        let arrayOfArraysOfOrderLineValues = await Promise.all(
            entries.map(async (currentEntry) => {
                let primaryServiceFieldFound = currentEntry.hasOwnProperty("1795685-primary-service");
                let secondaryServiceFieldFound = currentEntry.hasOwnProperty("1795685-secondary-services");

                let orderLineValues = [];
                if (primaryServiceFieldFound == true && (currentEntry["1795685-primary-service"] && currentEntry["1795685-primary-service"].length > 0)) {
                    // C.log("PRIMARY EXECUTED***");
                    let primaryItemSelected = currentEntry["1795685-primary-service"][0];
                    let primaryItemSelectedDetails = await C.getEntry({
                        recordInternalId: "xero-items",
                        entryId: primaryItemSelected
                    });

                    let rateValue = primaryItemSelectedDetails["sales-details-unit-price"] ? primaryItemSelectedDetails["sales-details-unit-price"] : 0;
                    let taxValue = primaryItemSelectedDetails["sales-details-tax-type"][0] ? primaryItemSelectedDetails["sales-details-tax-type"][0] : 0;

                    let taxDetails = await C.getEntry({
                        recordInternalId: "xero-tax-rates",
                        entryId: taxValue
                    });

                    let taxNumeric = taxDetails["effective-tax-rate"] ? taxDetails["effective-tax-rate"] : 0
                    let numericTaxValueFinal = (rateValue * taxNumeric) / 100;
                    let netValueFinal = rateValue
                    let totalValue = numericTaxValueFinal + netValueFinal

                    orderLineValues.push({
                        item: [primaryItemSelected],
                        description: primaryItemSelectedDetails.description
                            ? `${primaryItemSelectedDetails.description} - ${moment(currentEntry["1795685-start-time"]).tz("Australia/Sydney").format("DD/MM/YYYY")}`
                            : "",
                        rate: rateValue,
                        "tax-rate": primaryItemSelectedDetails["sales-details-tax-type"] ? primaryItemSelectedDetails["sales-details-tax-type"] : [],
                        account: primaryItemSelectedDetails["sales-details-account"] ? primaryItemSelectedDetails["sales-details-account"] : [],
                        quantity: 1,
                        net: netValueFinal,
                        tax: numericTaxValueFinal,
                        total: totalValue,
                        parent: +parentInvoiceId,
                        index: 1
                    });
                    // C.log("PRIMARY PUSHED");
                }
                if (secondaryServiceFieldFound == true && (currentEntry["1795685-secondary-services"] && currentEntry["1795685-secondary-services"].length > 0)) {
                    // C.log("SECONDARY EXECUTED***");
                    let secondaryItemSelected = currentEntry["1795685-secondary-services"][0];
                    let secondaryItemSelectedDetails = await C.getEntry({
                        recordInternalId: "xero-items",
                        entryId: secondaryItemSelected
                    });

                    let rateValue = secondaryItemSelectedDetails["sales-details-unit-price"] ? secondaryItemSelectedDetails["sales-details-unit-price"] : 0;
                    let taxValue = secondaryItemSelectedDetails["sales-details-tax-type"][0] ? secondaryItemSelectedDetails["sales-details-tax-type"][0] : 0;

                    let taxDetails = await C.getEntry({
                        recordInternalId: "xero-tax-rates",
                        entryId: taxValue
                    });
                    let taxDetailsSecondary = await C.getEntry({
                        recordInternalId: "xero-tax-rates",
                        entryId: taxValue
                    });

                    let taxNumeric = taxDetailsSecondary["effective-tax-rate"] ? taxDetailsSecondary["effective-tax-rate"] : 0
                    let numericTaxValueFinal = (rateValue * taxNumeric) / 100;
                    let netValueFinal = rateValue
                    let totalValue = numericTaxValueFinal + netValueFinal

                    orderLineValues.push({
                        item: [secondaryItemSelected],
                        description: secondaryItemSelectedDetails.description
                            ? `${secondaryItemSelectedDetails.description} - ${moment(currentEntry["1795685-start-time"]).tz("Australia/Sydney").format("DD/MM/YYYY")}`
                            : "",
                        rate: rateValue,
                        "tax-rate": secondaryItemSelectedDetails["sales-details-tax-type"] ? secondaryItemSelectedDetails["sales-details-tax-type"] : [],
                        account: secondaryItemSelectedDetails["sales-details-account"] ? secondaryItemSelectedDetails["sales-details-account"] : [],
                        quantity: 1,
                        net: netValueFinal,
                        tax: numericTaxValueFinal,
                        total: totalValue,
                        parent: +parentInvoiceId,
                        index: 1
                    });
                    // C.log("SECONDARY PUSHED");
                }
                return orderLineValues;
            })
        );

        if (!arrayOfArraysOfOrderLineValues.length > 0) return true

        const values = arrayOfArraysOfOrderLineValues.flatMap(innerArray => innerArray);

        let createOrderItemsResult = await C.createEntries({
            values,
            recordInternalId: "xero-order-items",
            options: {
                returnRecordInfo: true,
                makeAutoId: true,
            },
        });
        C.log("order line tiems are created successfully");
        return createOrderItemsResult;
    }

    const currentEntry = await C.getCurrentEntry();

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

    let invoiceValues = []

    invoiceValues.push({
        "1795685-appointment": [+currentEntry.recordValueId],
        reference: currentEntry.autoId,
        customer: currentEntry["1795685-client"],
        "date": moment().format("YYYY-MM-DD"),
        "due-date": moment().add(7, "days").format("YYYY-MM-DD"),
        "status": [34126],
        "date-issued": moment(currentEntry["1795685-start-time"]).format("YYYY-MM-DD")
    })
    //  return { invoiceValues }


    let createInvoice = await C.createEntries({
        values: invoiceValues,
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
    } else {
        C.addHtmlToSummary("Project Creation Failed");
    }

    let createdInvoiceEntryId = createInvoice.success[0].id;
    let getCreatedEntry = await C.getEntry({
        recordInternalId: "invoices",
        entryId: +createdInvoiceEntryId
    });

    const updatedEntry = await C.updateEntries({
        updates: [{
            value: { "invoice-number": getCreatedEntry.autoId },
            recordInternalId: "invoices",
            entryId: getCreatedEntry.recordValueId
        }]
    });


    let currentAppointment = currentEntry;
    let entriesArray = [currentAppointment];

    const childrenAppointments = await getChildrenAppointments(currentAppointment.recordValueId);
    childrenAppointments.entries.forEach((appointment) => {
        entriesArray.push(appointment);
    });

    let createdInvoiceWithOrderLineItems = await createOrderLineItems(createdInvoiceEntryId, entriesArray);

    let id = createdInvoiceWithOrderLineItems.success[0].value[11771];

    const sumTotal = await C.sumSubrecords([+id], "invoices", ["xero-order-items"], "total");
    const netTotal = await C.sumSubrecords([+id], "invoices", ["xero-order-items"], "net");
    const taxTotal = await C.sumSubrecords([+id], "invoices", ["xero-order-items"], "tax");


    const finalTotal = Object.values(sumTotal)[0]["xero-order-items"];
    const finalNet = Object.values(netTotal)[0]["xero-order-items"];
    const finalTaxTotal = Object.values(taxTotal)[0]["xero-order-items"];

    C.log("finalTax-->", finalTotal);


    const response = await C.updateEntries({
        updates: [
            {
                value: {
                    "net-total": +finalNet,
                    "tax-total": +finalTaxTotal,
                    "total": finalTotal
                },
                recordInternalId: "invoices",
                entryId: createdInvoiceWithOrderLineItems.success[0].value[11771],
            },
        ],
    });


    return
    C.log("Xero sync starts")

    // //Xero Sync Process Start

    let invoiceToBeSynced = await C.getEntry({
        recordInternalId: "invoices",
        entryId: +createdInvoiceEntryId,
        loadSubrecords: true,
        subrecords: [
            {
                internalId: "xero-order-items",
                responseType: "iov",
            },
        ],
    });

    if (
        !invoiceToBeSynced["customer"] ||
        !invoiceToBeSynced["customer"].length
    ) {
        throw "No client associated with the invoice";
    }
    const client = invoiceToBeSynced["customer"][0];

    const contact = await C.getEntry({
        recordInternalId: "standard-organisations",
        entryId: client,
    });

    const xeroContactEntryData = {
        contactID: contact["xero-id"],
        name: contact["name"],
        emailAddress: contact["email"],
    };

    const xeroContactResponse = await C.xeroUpsert({
        recordId: contact.recordId,
        entryId: contact.recordValueId,
        xeroTenantId: tenantId,
        correspondingRecordType: "contact",
        xeroEntryData: xeroContactEntryData,
    });

    const xeroUpdatedContactInfo = xeroContactResponse.body.contacts[0];

    C.log("SUCCESS AFTER CONTACT SYNC");

    await C.updateEntries({
        updates: [
            {
                value: {
                    "xero-id": xeroUpdatedContactInfo.contactID,
                    "xero-updated-date": new Date(
                        xeroUpdatedContactInfo.updatedDateUTC
                    ).toISOString(),
                },
                entryId: contact.recordValueId,
                recordInternalId: "standard-organisations",
            },
        ],
        options: {
            // throwOnUpdateError: true,
            returnRecordInfo: true,
        },
    });


    if (invoiceToBeSynced["branding-theme-id"]) {
        const brandingTheme = await C.getEntry({
            recordInternalId: "xero-branding-themes",
            entryIds: [invoiceToBeSynced["branding-theme-id"][0]],
        });

        brandingThemeID = brandingTheme[0]["xero-id"];
    }

    const lineItemsData = invoiceToBeSynced.subrecords["xero-order-items"];

    const getLineItems = async () => {
        return await Promise.all(
            lineItemsData.map(async (item) => {
                // const itemId = (item.item && item.item[0]) || null;
                // const [itemEntry] =
                //     itemId &&
                //     (await C.getEntry({
                //         recordInternalId: "xero-items",
                //         entryIds: [+itemId],
                //     }));
                const accountId = (item.account && item.account[0]) || "200";
                const [itemAccount] =
                    accountId &&
                    (await C.getEntry({
                        recordInternalId: "accounts",
                        entryIds: [+accountId],
                    }));
                const taxRate = item["tax-rate"][0] || null;
                const [taxRateValue] =
                    taxRate &&
                    (await C.getEntry({
                        recordInternalId: "xero-tax-rates",
                        entryIds: [+taxRate],
                    }));

                return {
                    description: item.description || "test",
                    quantity: item.quantity,
                    unitAmount: item.rate,
                    //taxAmount: item.tax,
                    //  itemCode: itemEntry.code || null,
                    taxType: taxRateValue["xero-id"].toString() || taxRateValue.code.toString() || null,
                    accountCode: itemAccount.code.toString(),
                };
            })
        );
    };

    let currentStatus = invoiceToBeSynced["status"][0]
    function getStatus(currentStatus) {
        switch (currentStatus) {
            case 34126: //DRAFT
                return "DRAFT";
            case 34127: // SUBMITTED
                return "SUBMITTED";
            case 34128: //DELETED
                return "DELETED";
            case 34129: // AUTHORISED
                return "AUTHORISED";
            case 34130: // PAID
                return "PAID";
            case 34131: // VOIDED
                return "VOIDED";

            default:
                return;
        }
    }

    let statusValue = await getStatus(currentStatus);


    const invoiceData = {
        invoiceNumber: invoiceToBeSynced["invoice-number"] || null,
        invoiceID: invoiceToBeSynced["xero-id"] || undefined,
        type: "ACCREC",
        contact: {
            contactID: xeroUpdatedContactInfo.contactID,
        },
        dueDate: moment(invoiceToBeSynced["due-date"] || undefined).format(
            "YYYY-MM-DD"
        ),
        date: moment(invoiceToBeSynced["date-issued"] || undefined).format(
            "YYYY-MM-DD"
        ),
        lineAmountTypes: "Exclusive",
        currencyCode: "AUD",
        status: statusValue,
        lineItems: await getLineItems(),
        reference: invoiceToBeSynced.reference,
        brandingThemeID: brandingThemeID,
    };

    //  C.log("invoiceData-->",invoiceData)
    //  return {invoiceData}

    const xeroInvoiceResponse = await C.xeroUpsert({
        recordId: invoiceToBeSynced.recordId,
        entryId: invoiceToBeSynced.recordValueId,
        xeroTenantId: tenantId,
        correspondingRecordType: "invoice",
        xeroEntryData: invoiceData,
    });

    //  C.log("xeroInvoiceResponse-->", xeroInvoiceResponse);

    const xeroInvoiceUpdatedInfo = xeroInvoiceResponse.body.invoices[0];

    await C.updateEntries({
        updates: [
            {
                value: {
                    "xero-id": xeroInvoiceUpdatedInfo.invoiceID,
                    "xero-updated-date-utc": new Date(
                        xeroInvoiceUpdatedInfo.updatedDateUTC
                    ).toISOString(),
                    "invoice-number": xeroInvoiceUpdatedInfo.invoiceNumber,
                },
                entryId: invoiceToBeSynced.recordValueId,
                recordInternalId: "invoices",
            },
        ],
        options: {
            // throwOnUpdateError: true,
            returnRecordInfo: true,
        },
    });

    C.log("Success after invoice sync!");
}