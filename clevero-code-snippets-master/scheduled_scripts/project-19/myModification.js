async function script(C) {
    const SyncWithXero = async (createdInvoiceEntryId) => {
        // TODO: Fix this code
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
        // *********

        C.log("Xero sync starts");

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

        let currentStatus = invoiceToBeSynced["status"][0];
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
    };

    const createInvoiceEntry = async (currentEntry) => {
        const invoiceValues = {
            "1795685-appointment": [+currentEntry.recordValueId],
            reference: currentEntry.autoId,
            customer: currentEntry["1795685-client"],
            "date": moment().format("YYYY-MM-DD"),
            "due-date": moment().add(7, "days").format("YYYY-MM-DD"),
            "status": [34126],
            "date-issued": moment(currentEntry["1795685-start-time"]).format("YYYY-MM-DD")
        };
        let createInvoiceResult = await C.createEntries({
            values: [invoiceValues],
            recordInternalId: "invoices",
            options: {
                returnRecordInfo: true,
                makeAutoId: true,
            },
        });

        // add to summary
        if (createInvoiceResult.success && createInvoiceResult.success.length > 0) {
            ids = createInvoiceResult.success[0].id;
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

        // get the created entry and update the invoice number
        let createdInvoiceEntryId = createInvoiceResult.success[0].id;
        let getCreatedEntryResult = await C.getEntry({
            recordInternalId: "invoices",
            entryId: +createdInvoiceEntryId
        });
        const updatedEntry = await C.updateEntries({
            updates: [{
                value: { "invoice-number": getCreatedEntryResult.autoId },
                recordInternalId: "invoices",
                entryId: getCreatedEntryResult.recordValueId
            }]
        });

        return createdInvoiceEntryId;
    };

    const createXeroOrderItemEntry = async (currentEntry, createdInvoiceEntryId) => {
        let primaryServiceFieldFound = currentEntry.hasOwnProperty("1795685-primary-service");
        let secondaryServiceFieldFound = currentEntry.hasOwnProperty("1795685-secondary-services");

        let orderLineValues = [];
        if (primaryServiceFieldFound == true && (currentEntry["1795685-primary-service"] && currentEntry["1795685-primary-service"].length > 0))
            orderLineValues.push(generateOrderLineValues(currentEntry, true, createdInvoiceEntryId));
        if (secondaryServiceFieldFound == true && (currentEntry["1795685-secondary-services"] && currentEntry["1795685-secondary-services"].length > 0))
            orderLineValues.push(generateOrderLineValues(currentEntry, true, createdInvoiceEntryId));
        if (!orderLineValues.length > 0) return;

        return await C.createEntries({
            values: orderLineValues,
            recordInternalId: "xero-order-items",
            options: {
                returnRecordInfo: true,
                makeAutoId: true,
            },
        });
    };

    const getChildrenAppointments = async (id) => {
        return await C.filterEntries({
            filter: [
                {
                    subject: "18346",
                    type: "array",
                    operator: "any_of",
                    ignoreCase: true,
                    value: [
                        "2232798"
                    ]
                }
            ],
            recordInternalId: "ferrari-consulting-group-appointments"
        });
    };

    const generateOrderLineValues = async (currentEntry, isPrimary = true, createdInvoiceEntryId) => {
        let itemSelected = isPrimary
            ? currentEntry["1795685-primary-service"][0]
            : currentEntry["1795685-secondary-service"][0];

        let itemSelectedDetails = await C.getEntry({
            recordInternalId: "xero-items",
            entryId: itemSelected
        });

        let rateValue = itemSelectedDetails["sales-details-unit-price"] ? itemSelectedDetails["sales-details-unit-price"] : 0;
        let taxValue = itemSelectedDetails["sales-details-tax-type"][0] ? itemSelectedDetails["sales-details-tax-type"][0] : 0;

        let taxDetails = await C.getEntry({
            recordInternalId: "xero-tax-rates",
            entryId: taxValue
        });

        let taxNumeric = taxDetails["effective-tax-rate"] ? taxDetails["effective-tax-rate"] : 0;
        let numericTaxValueFinal = (rateValue * taxNumeric) / 100;
        let netValueFinal = rateValue;
        let totalValue = numericTaxValueFinal + netValueFinal;

        return {
            item: [itemSelected],
            description: itemSelectedDetails.description
                ? `${itemSelectedDetails.description} - ${moment(currentEntry["1795685-start-time"]).format("DD/MM/YYYY")}`
                : "",
            rate: rateValue,
            "tax-rate": itemSelectedDetails["sales-details-tax-type"] ? itemSelectedDetails["sales-details-tax-type"] : [],
            account: itemSelectedDetails["sales-details-account"] ? itemSelectedDetails["sales-details-account"] : [],
            quantity: 1,
            net: netValueFinal,
            tax: numericTaxValueFinal,
            total: totalValue,
            parent: +createdInvoiceEntryId,
            index: 1
        };
    };

    const totalAndSetInvoiceFinacialsFields = async (id) => {
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
    }

    let currentEntry = await C.getCurrentEntry();
    const childrenAppointments = getChildrenAppointments(currentEntry.recordValueId);

    // current entry
    const createdInvoiceEntryId = createInvoiceEntry(currentEntry);
    // const createdInvoiceWithOrderLineItems = createXeroOrderItemEntry(currentEntry, createdInvoiceEntryId);
    // let id = createdInvoiceWithOrderLineItems.success[0].value[11771];
    // totalAndSetInvoiceFinacialsFields(id);
    // SyncWithXero(id);

    // children of current entry
    childrenappointments.foreach(() => {
        const createdinvoiceentry = createinvoiceentry(currententry);
        const createdinvoicewithorderlineitems = createxeroorderitementry(currententry, createdinvoiceentry);
        let id = createdinvoicewithorderlineitems.success[0].value[11771];
        totalandsetinvoicefinacialsfields(id);
        SyncWithXero(id);
    })
}