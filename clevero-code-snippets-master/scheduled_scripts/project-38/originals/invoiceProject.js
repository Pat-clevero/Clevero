async function script(C) {
    let currentEntry = await C.getCurrentEntry();

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

    let createdInvoice = await C.createEntries({
        values: [
            {
                "xero-type": [34120],
                "xero-status": [34126],
                "1662670-client": currentEntry["1662670-organisation"],
                "date-issued": moment().format("YYYY-MM-DD"),
                "due-date": moment().add(7, "days").format("YYYY-MM-DD"),
                "1662670-project": [currentEntry.recordValueId],
                "reference": currentEntry["1662670-pa-number"]
            },
        ],
        recordInternalId: "invoices",
        options: {
            returnRecordInfo: true,
            makeAutoId: true,
        },
    });

    if (createdInvoice.success && createdInvoice.success.length > 0) {
        createdInvoiceRecordId = createdInvoice.success[0].id;

        C.addHtmlToSummary(
            "Invoice Creation Successful Link: <a href='https://app.clevero.co/app/records/1719816/view/" +
            createdInvoiceRecordId +
            "'>" +
            createdInvoiceRecordId +
            "</a>"
        );
    } else {
        C.addHtmlToSummary("Invoice Creation Failed");
    }

    let getCreatedInvoice = await C.getEntry({
        recordInternalId: "invoices",
        entryId: createdInvoice.success[0].id,
    });

    const updatedEntry = await C.updateEntries({
        updates: [
            {
                value: {
                    "1662670-name": `${getCreatedInvoice.autoId} - ${currentEntry["1662670-title"]}`,
                    "invoice-number": getCreatedInvoice.autoId,

                },
                recordInternalId: "invoices",
                entryId: createdInvoice.success[0].id,
            },
        ],
    });

    let createdInvoiceEntryId = createdInvoice.success[0].id;
    let billingType = currentEntry["1662670-billing-type"];
    if (billingType == undefined) return true;

    // Adding order line item based on the billing type of project
    //Billing Type==1826030
    //Time and Materials==1826031
    //if billing type is fixed, we will create a hard coded signle order line
    let orderLineValues = [];
    let billingType = 1826031;
    // if (billingType == 1826030) {
    //     let rateValue = currentEntry["1662670-fixed-price-amount"]
    //         ? currentEntry["1662670-fixed-price-amount"]
    //         : 0;
    //     let taxValue = 0.1 * rateValue;
    //     let totalValue = taxValue + rateValue;

    //     orderLineValues.push({
    //         item: [],
    //         description: currentEntry["1662670-name"] ? currentEntry["1662670-name"] : "",
    //         rate: currentEntry["1662670-fixed-price-amount"]
    //             ? currentEntry["1662670-fixed-price-amount"]
    //             : 0,
    //         "tax-rate": [1728520],
    //         account: [1711725],
    //         quantity: 1,
    //         net: rateValue,
    //         tax: taxValue,
    //         total: totalValue,
    //         parent: +createdInvoiceEntryId,
    //         index: 1,
    //     });
    // }
    // if billing type is time and materials we will create order line items as per below
    if (billingType == 1826031) {
        let getAssociatedTimesheets = await C.getAssociations(
            [currentEntry.recordValueId],
            "admedia-projects",
            ["admedia-timesheets"]
        );
        let associatedTimesheets =
            getAssociatedTimesheets[`${currentEntry.recordValueId}`][
            "admedia-timesheets"
            ];
        let unInvoicedAssociatedTimesheets = _.filter(
            associatedTimesheets,
            function (o) {
                let invoiceFoundField = o.hasOwnProperty("1662670-invoice");
                return (
                    invoiceFoundField == false ||
                    (o["1662670-invoice"] && !o["1662670-invoice"].length > 0)
                );
            }
        );

        if (
            unInvoicedAssociatedTimesheets &&
            !unInvoicedAssociatedTimesheets.length > 0
        )
            return;

        let combinationOfTimesheetAndTask = [];
        _.forEach(unInvoicedAssociatedTimesheets, function (val) {
            let entryId = val.recordValueId;
            let linkedTaskId = val["1662670-task"][0];
            combinationOfTimesheetAndTask.push({
                entryIdValue: entryId,
                linkedTaskIdValue: linkedTaskId,
            });
        });

        let groupByTask = _.groupBy(
            combinationOfTimesheetAndTask,
            "linkedTaskIdValue"
        );
        let taskIds = Object.keys(groupByTask);

        await Promise.all(
            taskIds.map(async function (va, index) {
                let innerCombinationTimesheetIds = groupByTask[+va].map(
                    (a) => a.entryIdValue
                );
                let innerCombinationTimesheetIdsInternalData = await C.getEntries(
                    {
                        recordInternalId: "admedia-timesheets",
                        entryIds: innerCombinationTimesheetIds,
                    }
                );
                _.forEach(innerCombinationTimesheetIds, async function (o) {
                    await C.updateEntries({
                        updates: [
                            {
                                value: {
                                    "1662670-invoice": [createdInvoiceEntryId],
                                },
                                entryId: +o,
                                recordInternalId: "admedia-timesheets",
                            },
                        ],
                    });
                });

                let revenueVal = innerCombinationTimesheetIdsInternalData.map(
                    function (par) {
                        return +par["1662670-revenue"];
                    }
                );

                let finalRate = revenueVal.reduce((acc, val) => acc + val);

                let taskEntryDetail = await C.getEntry({
                    recordInternalId: "admedia-tasks",
                    entryId: +va,
                });
                let itemLinked = taskEntryDetail["1662670-item"][0];

                let itemDetail = await C.getEntry({
                    recordInternalId: "xero-items",
                    entryId: +itemLinked,
                });

                let categoryValue = itemDetail["1662670-department"] ? itemDetail["1662670-department"] : []


                let titleValue = taskEntryDetail["1662670-title"] ? taskEntryDetail["1662670-title"] : "";

                orderLineValues.push({
                    item: [],
                    description: titleValue,
                    "1662670-category": categoryValue,
                    rate: +finalRate,
                    "tax-rate": [1728520], // defaulted to GST on Income
                    account: [1849170], // defaulted to sales
                    quantity: 1,
                    net: +finalRate,
                    tax: +finalRate * 0.1,
                    total: finalRate + finalRate * 0.1,
                    parent: +createdInvoiceEntryId,
                    index: index + 1,
                });
            })
        );
    }

    // C.log("orderLineValues-->", orderLineValues);

    let createdInvoiceWithOrderLineItems = await C.createEntries({
        values: orderLineValues,
        recordInternalId: "xero-order-items",
        options: {
            returnRecordInfo: true,
            makeAutoId: true,
        },
    });

    let id = createdInvoiceWithOrderLineItems.success[0].value[11771];

    const sumTotal = await C.sumSubrecords(
        [+id],
        "invoices",
        ["xero-order-items"],
        "total"
    );
    const netTotal = await C.sumSubrecords(
        [+id],
        "invoices",
        ["xero-order-items"],
        "net"
    );
    const taxTotal = await C.sumSubrecords(
        [+id],
        "invoices",
        ["xero-order-items"],
        "tax"
    );

    const finalTotal = Object.values(sumTotal)[0]["xero-order-items"];
    const finalNet = Object.values(netTotal)[0]["xero-order-items"];
    const finalTaxTotal = Object.values(taxTotal)[0]["xero-order-items"];

    //   C.log("finalTax-->", finalTotal);

    const response = await C.updateEntries({
        updates: [
            {
                value: {
                    "net-total": +finalNet,
                    "tax-total": +finalTaxTotal,
                    total: finalTotal,
                },
                recordInternalId: "invoices",
                entryId:
                    createdInvoiceWithOrderLineItems.success[0].value[11771],
            },
        ],
    });


    // Calculating total invoiced value in admedia-projects
    const revenueValue = currentEntry["1662670-revenue"] ? currentEntry["1662670-revenue"] : 0;

    const sum = await C.sumAssociations([currentEntry.recordValueId], "admedia-projects", ["invoices"], "total")

    const finalAmount = Object.values(sum)[0]['invoices'];

    const totalInvoiced = +finalAmount;
    const amountRemaining = revenueValue - totalInvoiced



    const projectUpdated = await C.updateEntries({
        updates: [
            {
                value: {
                    "1662670-total-invoiced": +finalAmount,
                    "1662670-amount-remaining": amountRemaining
                },
                recordInternalId: "admedia-projects",
                entryId: currentEntry.recordValueId,
            },
        ],
    });



    // End of calculating total invoiced value in admedia projects


//    return { response, projectUpdated };

    //Xero Sync Process Start

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
        !invoiceToBeSynced["1662670-client"] ||
        !invoiceToBeSynced["1662670-client"].length
    ) {
        throw "No client associated with the invoice";
    }
    const client = invoiceToBeSynced["1662670-client"][0];

    const contact = await C.getEntry({
        recordInternalId: "admedia-organisations",
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
                recordInternalId: "admedia-organisations",
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
                    taxType:
                        taxRateValue["xero-id"].toString() ||
                        taxRateValue.code.toString() ||
                        null,

                    accountCode: itemAccount.code.toString(),
                };
            })
        );
    };

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
        status: "DRAFT",
        lineItems: await getLineItems(),
        reference: invoiceToBeSynced.reference,
        brandingThemeID: brandingThemeID,
    };
  //  return { invoiceData }

    //  C.log("invoiceData-->",invoiceData)
    // return {invoiceData}

    const xeroInvoiceResponse = await C.xeroUpsert({
        recordId: invoiceToBeSynced.recordId,
        entryId: invoiceToBeSynced.recordValueId,
        xeroTenantId: tenantId,
        correspondingRecordType: "invoice",
        xeroEntryData: invoiceData,
    });

   // C.log("xeroInvoiceResponse-->", xeroInvoiceResponse);

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
