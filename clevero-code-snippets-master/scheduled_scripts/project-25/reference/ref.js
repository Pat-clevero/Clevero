async function script(C) {
    let currentEntry = await C.getCurrentEntry({
        loadSubrecords: true,
        subrecords: [
            {
                internalId: "xero-order-items",
                responseType: "iov",
            },
        ],

    });
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

    let linkedInvoiceFieldFound = currentEntry.hasOwnProperty("1918262-linked-invoice");

    if (linkedInvoiceFieldFound == true && currentEntry["1918262-linked-invoice"].length > 0) return;

    let invoiceValues = []




    invoiceValues.push({
        "1918262-appointment": [+currentEntry.recordValueId],
        "1918262-clinic": currentEntry["1918262-clinic"],
        reference: currentEntry.autoId,
        "date": moment().format("YYYY-MM-DD"),
        "due-date": moment().add(7, "days").format("YYYY-MM-DD"),
        "status": [34126],
        "date-issued": moment(currentEntry["1795685-start-time"]).format("YYYY-MM-DD")
    })

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
    })

    const updatedEntry = await C.updateEntries({
        updates: [{
            value: { "invoice-number": getCreatedEntry.autoId },
            recordInternalId: "invoices",
            entryId: getCreatedEntry.recordValueId
        }]
    });

    const updatedAppointmentEntry = await C.updateEntries({
        updates: [{
            value: { "1918262-linked-invoice": [+createdInvoiceEntryId] },
            recordInternalId: "insight-mobile-veterinary-diagnostics-appointments",
            entryId: currentEntry.recordValueId
        }]
    });


    let lineItems = currentEntry.subrecords["xero-order-items"];
    let orderLineValues = [];
    if (lineItems && !lineItems.length > 0) {
        orderLineValues.push({
            "1918262-appointment": [currentEntry.recordValueId],
            description: "no invoice line present on appointment",
            quantity: 1,
            rate: 0,
            "tax-rate": [2058501],
            account: [2058506],
            tax: 0,
            total: 0,
            net: 0,
            parent: +createdInvoiceEntryId,
            index: 1
        })
    }

    else {
        lineItems.map((val, index) => {
            const currentLine = val;
            const rateValue = currentLine.rate
            const taxValue = 0.1 * rateValue
            const netValue = rateValue * currentLine.quantity
            const totalValue = (0.1 * rateValue) + (rateValue * currentLine.quantity)

            orderLineValues.push({
                "1918262-appointment": [currentEntry.recordValueId],
                description: val.description,
                quantity: val.quantity,
                rate: rateValue,
                "tax-rate": [2058501],
                account: [2058506],
                tax: taxValue.toFixed(2),
                total: totalValue.toFixed(2),
                net: netValue.toFixed(2),
                parent: +createdInvoiceEntryId,
                index: index + 1
            })
        })
    }
    C.log("orderLineValues-->", orderLineValues)


    let createdInvoiceWithOrderLineItems = await C.createEntries({
        values: orderLineValues,
        recordInternalId: "xero-order-items",
        options: {
            returnRecordInfo: true,
            makeAutoId: true,
        },
    });
    C.log("order line tiems are created successfully");

    let id = createdInvoiceWithOrderLineItems.success[0].value[11771];

    const sumTotal = await C.sumSubrecords([+id], "invoices", ["xero-order-items"], "total");
    const netTotal = await C.sumSubrecords([+id], "invoices", ["xero-order-items"], "net");
    const taxTotal = await C.sumSubrecords([+id], "invoices", ["xero-order-items"], "tax");


    const finalTotal = Object.values(sumTotal)[0]["xero-order-items"];
    const finalNet = Object.values(netTotal)[0]["xero-order-items"];
    const finalTaxTotal = Object.values(taxTotal)[0]["xero-order-items"];



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
        !invoiceToBeSynced["1918262-clinic"] ||
        !invoiceToBeSynced["1918262-clinic"].length
    ) {
        throw "No client associated with the invoice";
    }
    const client = invoiceToBeSynced["1918262-clinic"][0];

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
                    "xero-updated-date-utc": new Date(
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
      //  invoiceNumber: invoiceToBeSynced["invoice-number"] || null,
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



