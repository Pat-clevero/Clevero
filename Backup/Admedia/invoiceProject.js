async function script(C) {
    const formMetaData = await C.getEventMetadata().uiValue;
    const currentEntryDetails = await C.getCurrentEntry();

    if (!formMetaData.values.invoice) {
        return {
            message:
                "Your invoice was not generated. Please choose the invoicing process first to execute the process. Please repeat your process again and make sure to choose the invoicing process.",
        };
    }

    const invoicingProcess = formMetaData.values.invoice;

    // return { formMetaData, currentEntryDetails, invoicingProcess };

    C.addJsonToSummary({ formMetaData: formMetaData });
    C.addJsonToSummary({ currentEntryDetails: currentEntryDetails });
    C.addJsonToSummary({ invoicingProcess: invoicingProcess });
    
    C.log("invoicingProcess-->",invoicingProcess);
   
    let currentEntry = await C.getCurrentEntry();
    let projectDepartment = currentEntry["1662670-department"];

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
            let nonBillable = o["1662670-non-billable-time"];
            return (
                (invoiceFoundField == false ||
                    (o["1662670-invoice"] &&
                        !o["1662670-invoice"].length > 0)) &&
                (nonBillable == false || !nonBillable)
            );
        }
    );
    // Tasks
    let getAssociatedTasks = await C.getAssociations(
        [currentEntry.recordValueId],
        "admedia-projects",
        ["admedia-tasks"]
    );
    let associatedTasks =
        getAssociatedTasks[`${currentEntry.recordValueId}`]["admedia-tasks"];

    // Expenses
    let getAssociatedExpenses = await C.getAssociations(
        [currentEntry.recordValueId],
        "admedia-projects",
        ["admedia--expenses"]
    );
    const associatedExpenses =
        getAssociatedExpenses[currentEntry.recordValueId]["admedia--expenses"];
    let unInvoicedAssociatedExpenses = _.filter(
        associatedExpenses,
        function (o) {
            let invoiceFoundField = o.hasOwnProperty("1662670-invoice");
            let isNoAssociatedInvoice =
                invoiceFoundField == false ||
                (o["1662670-invoice"] && !o["1662670-invoice"].length > 0);
            let isChargeToClient = +o["1662670-on-charge-to-client"] === 1142;
            return isNoAssociatedInvoice && isChargeToClient;
        }
    );

    let getAssociatedCommercials = await C.getAssociations(
        [currentEntry.recordValueId],
        "admedia-projects",
        ["admedia-commercials"]
    );
    const associatedCommercials =
        getAssociatedCommercials[currentEntry.recordValueId][
            "admedia-commercials"
        ];
    let unInvoicedAssociatedCommercials = _.filter(
        associatedCommercials,
        function (o) {
            let invoiceFoundField = o.hasOwnProperty("1662670-invoice");
            let isNoAssociatedInvoice =
                invoiceFoundField == false ||
                (o["1662670-invoice"] && !o["1662670-invoice"].length > 0);
            let isReadyForInvoicing = o["1662670-ready-for-invoicing"] === true;
            return isNoAssociatedInvoice && isReadyForInvoicing;
        }
    );

    C.addJsonToSummary({
        unInvoicedAssociatedTimesheets,
        unInvoicedAssociatedExpenses,
        unInvoicedAssociatedCommercials,
        associatedTasks,
    });

   /* if (
        unInvoicedAssociatedTimesheets.length === 0 &&
        unInvoicedAssociatedExpenses.length === 0 &&
        unInvoicedAssociatedCommercials.length === 0
    )
        return {
            message:
                "No invoice has been generated for this project. Please ensure that there are outstanding timesheets, expenses, or commercials associated with this project that is yet to be invoiced.",
        };*/

    let createdInvoice = await C.createEntries({
        values: [
            {
                "xero-type": [34120],
                "xero-status": [34126],
                "1662670-client": currentEntry["1662670-organisation"],
                "date-issued": moment()
                    .tz("Australia/Sydney")
                    .format("YYYY-MM-DD"),
                "due-date": moment()
                    .tz("Australia/Sydney")
                    .add(14, "days")
                    .format("YYYY-MM-DD"),
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
                    //"invoice-number": getCreatedInvoice.autoId,
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

    orderLineValues.push({
        description: currentEntry["1662670-title"],
        //rate: +finalRate,
        //"tax-rate": [1849164], // defaulted to GST on Income
        //account: [1849170], // defaulted to sales
        net: 0,
        tax: 0,
        total: 0,
        parent: +createdInvoiceEntryId,
        index: lastIndex + 1,
    });

    lastIndex = lastIndex + 1;
    if (
        currentEntry["1662670-purchase-order-number"] &&
        currentEntry["1662670-purchase-order-number"].length > 0
    ) {
        orderLineValues.push({
            description: currentEntry["1662670-purchase-order-number"],
            //rate: +finalRate,
            //"tax-rate": [1849164], // defaulted to GST on Income
            //account: [1849170], // defaulted to sales
            net: 0,
            tax: 0,
            total: 0,
            parent: +createdInvoiceEntryId,
            index: lastIndex + 1,
        });
        lastIndex = lastIndex + 1;
    }

    if (
        currentEntry["1662670-invoice-description"] &&
        currentEntry["1662670-invoice-description"].length > 0
    ) {
        orderLineValues.push({
            description: currentEntry["1662670-invoice-description"],
            //rate: +finalRate,
            //"tax-rate": [1849164], // defaulted to GST on Income
            //account: [1849170], // defaulted to sales
            net: 0,
            tax: 0,
            total: 0,
            parent: +createdInvoiceEntryId,
            index: lastIndex + 1,
        });
        lastIndex = lastIndex + 1;
    }

    C.addJsonToSummary(associatedCommercials);

    if (associatedCommercials.length > 0) {
        associatedCommercials.forEach((commercial) => {
            const productDescription = commercial["1662670-product"] || "";
            const keyNumber = commercial["1662670-key-number"] || "";

            const description = `${productDescription}-${keyNumber}`;
            C.log("description-->", description);
            orderLineValues.push({
            description: description,
            //rate: +finalRate,
            //"tax-rate": [1849164], // defaulted to GST on Income
            //account: [1849170], // defaulted to sales
            net: 0,
            tax: 0,
            total: 0,
            parent: +createdInvoiceEntryId,
            index: lastIndex + 1,
        });
        lastIndex = lastIndex + 1;
        });
        
    }

    if (unInvoicedAssociatedExpenses.length > 0) {
        await Promise.all(
            unInvoicedAssociatedExpenses.map(async (expense, index) => {
                const expenseItemId = expense.recordValueId;
                const isCommercial = expense["1662670-commercial-expense"];
                let trackingCategory = projectDepartment;
                // if (isCommercial) {
                //     trackingCategory = ["1773861"];
                // }

                if (
                    expense["1662670-task"] &&
                    expense["1662670-task"].length > 0
                ) {
                    try{
                        const taskDetails = await C.getEntry({
                            recordInternalId: "admedia-tasks",
                            entryId: expense["1662670-task"][0],
                        });
                        trackingCategory = taskDetails["1662670-department"];
                    }
                    catch(e){
                        trackingCategory = projectDepartment;
                    }
                }
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
                    "tracking-options-1": trackingCategory,
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
            },
        };

        await Promise.all(
            unInvoicedAssociatedCommercials.map(async (commercial, index) => {
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

                commercialTotals.voiceOver.total += commercial[
                    "1662670-voiceover-total"
                ]
                    ? +commercial["1662670-voiceover-total"]
                    : 0;
                commercialTotals.dub.total += commercial["1662670-dub-total"]
                    ? +commercial["1662670-dub-total"]
                    : 0;
                commercialTotals.cad.total += commercial["1662670-cad-total"]
                    ? +commercial["1662670-cad-total"]
                    : 0;
                commercialTotals.misc.total += commercial[
                    "1662670-miscellaneous-total"
                ]
                    ? +commercial["1662670-miscellaneous-total"]
                    : 0;
            })
        );

        for (let key in commercialTotals) {
            const totalItem = commercialTotals[key];
            let finalRate = totalItem.total;
            if (finalRate === 0) continue;
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
    
    
    // For actual
    if (invoicingProcess[0] == 2693023) {
        C.log("This is actual invoicing process");
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
                                        "1662670-invoice": [
                                            createdInvoiceEntryId,
                                        ],
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
                    
                    C.log(itemDetail);

                    let categoryValue = itemDetail["1662670-department"]
                        ? itemDetail["1662670-department"]
                        : projectDepartment;

                    let titleValue = taskEntryDetail["1662670-title"]
                        ? taskEntryDetail["1662670-title"]
                        : "";

                    let taskItemId = taskEntryDetail["1662670-item"]
                        ? taskEntryDetail["1662670-item"]
                        : "";
                    orderLineValues.push({
                        item: taskItemId,
                        description: titleValue,
                        "tracking-options-1": categoryValue,
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
                    lastIndex = lastIndex + 1;
                })
            );
        }
    } else {
        C.log("This is budget invoicing");
        await Promise.all(
            associatedTasks.map(async function (task) {
                const currentTask = task;
                const assignedTo = currentTask["1662670-assigned-to"];
                const assignedToDetails = await C.getEntry({
                    recordInternalId: "employees",
                    entryId: assignedTo[0],
                });
                const chargeOutRate = assignedToDetails[
                    "1662670-charge-out-rate"
                ]
                    ? assignedToDetails["1662670-charge-out-rate"]
                    : 0;
                const budgetedHours = currentTask["1662670-budgeted-hours"]
                    ? currentTask["1662670-budgeted-hours"]
                    : 0;
                const finalRate = chargeOutRate * budgetedHours;
                
                C.log(currentTask);
                
                orderLineValues.push({
                    item: currentTask["1662670-item"]
                        ? currentTask["1662670-item"]
                        : [],
                    description: currentTask["1662670-name"]
                        ? currentTask["1662670-name"]
                        : "",
                    "tracking-options-1": currentTask["1662670-department"]
                        ? currentTask["1662670-department"]
                        : [],
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
                lastIndex = lastIndex + 1;
            })
        );
        if (unInvoicedAssociatedTimesheets.length > 0) {
            _.forEach(unInvoicedAssociatedTimesheets, async function (o) {
                await C.updateEntries({
                    updates: [
                        {
                            value: {
                                "1662670-invoice": [createdInvoiceEntryId],
                            },
                            entryId: o.recordValueId,
                            recordInternalId: "admedia-timesheets",
                        },
                    ],
                });
            });
        }
    }

    // For budget

    C.addJsonToSummary({ orderLineValues: orderLineValues });

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
    const quotedCampaignBudget =
        +currentEntry["1662670-quoted-campaign-budget"] || 0;
    const sum = await C.sumAssociations(
        [currentEntry.recordValueId],
        "admedia-projects",
        ["invoices"],
        "net-total"
    );
    const finalAmount = Object.values(sum)[0]["invoices"];
    const totalInvoiced = +finalAmount;

    const amountRemaining = quotedCampaignBudget - totalInvoiced;

    const projectUpdated = await C.updateEntries({
        updates: [
            {
                value: {
                    "1662670-total-invoiced": +finalAmount,
                    "1662670-amount-remaining": +amountRemaining,
                    "1662670-status": ["1774680"],
                },
                recordInternalId: "admedia-projects",
                entryId: currentEntry.recordValueId,
            },
        ],
    });

    // End of calculating total invoiced value in admedia projects
    return { response, projectUpdated };
}
