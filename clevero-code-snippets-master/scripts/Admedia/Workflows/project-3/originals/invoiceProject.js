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

    // Timesheets
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

    // Expenses
    let getAssociatedExpenses = await C.getAssociations(
        [currentEntry.recordValueId],
        "admedia-projects",
        ["admedia--expenses"]
    );
    const associatedExpenses = getAssociatedExpenses[currentEntry.recordValueId]["admedia--expenses"];
    let unInvoicedAssociatedExpenses = _.filter(
        associatedExpenses,
        function (o) {
            let invoiceFoundField = o.hasOwnProperty("1662670-invoice");
            let isNoAssociatedInvoice = invoiceFoundField == false ||
                                    (o["1662670-invoice"] && !o["1662670-invoice"].length > 0)
            let isChargeToClient = +o["1662670-on-charge-to-client"] === 1142;
            return (
                isNoAssociatedInvoice && isChargeToClient
            );
        }
    );

    let getAssociatedCommercials = await C.getAssociations(
        [currentEntry.recordValueId],
        "admedia-projects",
        ["admedia-commercials"]
    );
    const associatedCommercials = getAssociatedCommercials[currentEntry.recordValueId]["admedia-commercials"];
    let unInvoicedAssociatedCommercials = _.filter(
        associatedCommercials,
        function (o) {
            let invoiceFoundField = o.hasOwnProperty("1662670-invoice");
            let isNoAssociatedInvoice = invoiceFoundField == false ||
                                    (o["1662670-invoice"] && !o["1662670-invoice"].length > 0)
            let isReadyForInvoicing = o["1662670-ready-for-invoicing"] === true;
            return (
                isNoAssociatedInvoice && isReadyForInvoicing
            );
        }
    );

    if (unInvoicedAssociatedTimesheets.length === 0 &&
        unInvoicedAssociatedExpenses.length === 0 &&
        unInvoicedAssociatedCommercials.length === 0)
        return { message: "No invoice has been generated for this project. Please ensure that there are outstanding timesheets, expenses, or commercials associated with this project that is yet to be invoiced." };

    let createdInvoice = await C.createEntries({
        values: [
            {
                "xero-type": [34120],
                "xero-status": [34126],
                "1662670-client": currentEntry["1662670-organisation"],
                "date-issued": moment().format("YYYY-MM-DD"),
                "due-date": moment().add(7, "days").format("YYYY-MM-DD"),
                "1662670-project": [currentEntry.recordValueId],
                reference: currentEntry["1662670-pa-number"],
            },
        ],
        recordInternalId: "invoices",
        options: {
            returnRecordInfo: true,
            makeAutoId: true,
        },
    });
    if (createdInvoice.success && createdInvoice.success.length > 0) {
        let createdInvoiceRecordId = createdInvoice.success[0].id;
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
    // let billingType = currentEntry["1662670-billing-type"];
    // if (billingType == undefined) return true;

    // Adding order line item based on the billing type of project
    //Billing Type==1826030
    //Time and Materials==1826031
    //if billing type is fixed, we will create a hard coded signle order line
    // let billingType = 1826031;
    let orderLineValues = [];

    let lastIndex = 0;
    if (unInvoicedAssociatedTimesheets.length > 0) {
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

                let categoryValue = itemDetail["1662670-department"]
                    ? itemDetail["1662670-department"]
                    : [];

                let titleValue = taskEntryDetail["1662670-title"]
                    ? taskEntryDetail["1662670-title"]
                    : "";

                let taskItemId = taskEntryDetail["1662670-item"]
                    ? taskEntryDetail["1662670-item"]
                    : "";
                orderLineValues.push({
                    item: taskItemId,
                    description: titleValue,
                    "1662670-category": categoryValue,
                    rate: +finalRate,
                    "tax-rate": [1849164], // defaulted to GST on Income
                    account: [1849170], // defaulted to sales
                    quantity: 1,
                    net: +finalRate,
                    tax: +finalRate * 0.1,
                    total: finalRate + finalRate * 0.1,
                    parent: +createdInvoiceEntryId,
                    index: index + 1,
                });
                lastIndex = index + 1;
            })
        );
    }

    if (unInvoicedAssociatedExpenses.length > 0) {
        await Promise.all(
            unInvoicedAssociatedExpenses.map(async (expense, index) => {
                const expenseItemId = expense.recordValueId;
                await C.updateEntries({
                    updates: [
                        {
                            value: {
                                "1662670-invoice": [createdInvoiceEntryId],
                            },
                            entryId: +expenseItemId,
                            recordInternalId: "admedia--expenses",
                        },
                    ],
                });

                const finalRate = expense["1662670-total-amount"]
                    ? expense["1662670-total-amount"]
                    : 0;

                orderLineValues.push({
                    item: [],
                    description: expense["1662670-title"]
                        ? expense["1662670-title"]
                        : "",
                    "1662670-category": [],
                    rate: finalRate,
                    "tax-rate": [1849164], // defaulted to GST on Income
                    account: [1849170], // defaulted to sales
                    quantity: 1,
                    net: +finalRate,
                    tax: +finalRate * 0.1,
                    total: finalRate + finalRate * 0.1,
                    parent: +createdInvoiceEntryId,
                    index: lastIndex + 1,
                });
                lastIndex += 1;
            })
        );
    }

    if (unInvoicedAssociatedCommercials.length > 0) {
        let commercialTotals = {
            voiceOver: {
                description: "Voiceover",
                total: 0,
            },
            dub: {
                description: "Dub",
                total: 0,
            },
            cad: {
                description: "CAD",
                total: 0,
            },
            misc: {
                description: "Miscellaneous",
                total: 0,
            }
        };

        await Promise.all(unInvoicedAssociatedCommercials.map(async (commercial, index) => {
            const commercialId = commercial.recordValueId;
            await C.updateEntries({
                updates: [
                    {
                        value: {
                            "1662670-invoice": [createdInvoiceEntryId],
                        },
                        entryId: +commercialId,
                        recordInternalId: "admedia-commercials",
                    },
                ],
            });

            commercialTotals.voiceOver.total += commercial["1662670-voiceover-total"]
                ? +commercial["1662670-voiceover-total"]
                : 0;
            commercialTotals.dub.total += commercial["1662670-dub-total"]
                ? +commercial["1662670-dub-total"]
                : 0;
            commercialTotals.cad.total += commercial["1662670-cad-total"]
                ? +commercial["1662670-cad-total"]
                : 0;
            commercialTotals.misc.total += commercial["1662670-miscellaneous-total"]
                ? +commercial["1662670-miscellaneous-total"]
                : 0;
        }));

        for (let key in commercialTotals) {
            const totalItem = commercialTotals[key];
            let finalRate = totalItem.total;
            if(finalRate === 0) continue;
            orderLineValues.push({
                item: [],
                description: totalItem.description,
                "1662670-category": [],
                rate: +finalRate,
                "tax-rate": [1849164], // defaulted to GST on Income
                account: [1849170], // defaulted to sales
                quantity: 1,
                net: +finalRate,
                tax: +finalRate * 0.1,
                total: finalRate + finalRate * 0.1,
                parent: +createdInvoiceEntryId,
                index: lastIndex + 1,
            });
            lastIndex += 1;
        }
    }

    // C.log("orderLineValues-->", orderLineValues);
    C.addJsonToSummary({
        unInvoicedAssociatedTimesheets,
        unInvoicedAssociatedExpenses,
        unInvoicedAssociatedCommercials,
        orderLineValues
    });

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
    const revenueValue = currentEntry["1662670-revenue"]
        ? currentEntry["1662670-revenue"]
        : 0;

    const sum = await C.sumAssociations(
        [currentEntry.recordValueId],
        "admedia-projects",
        ["invoices"],
        "net-total"
    );

    const finalAmount = Object.values(sum)[0]["invoices"];
    const totalInvoiced = +finalAmount;
    const amountRemaining = +revenueValue - +totalInvoiced;

    const projectUpdated = await C.updateEntries({
        updates: [
            {
                value: {
                    "1662670-total-invoiced": +finalAmount,
                    "1662670-amount-remaining": +amountRemaining,
                },
                recordInternalId: "admedia-projects",
                entryId: currentEntry.recordValueId,
            },
        ],
    });

    // End of calculating total invoiced value in admedia projects
    return { response, projectUpdated };

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

    //  C.log("invoiceData-->",invoiceData)

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