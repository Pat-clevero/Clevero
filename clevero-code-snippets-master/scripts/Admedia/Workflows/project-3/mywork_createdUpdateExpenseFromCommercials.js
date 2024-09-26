async function script(C) {
    const currentEntry = await C.getCurrentEntry();
    const eventType = C.utilityInputs.task.event.event;
    let project = eventType == "AFTER_DELETE"
        ? C.utilityInputs.task.event.eventMetadata.data.oldValues.value["1662670-project"][0]
        : currentEntry["1662670-project"][0];

    let projectDetails = await C.getEntry({
        recordInternalId: "admedia-projects",
        entryId: project,
        loadAssociations: true,
        associations: [
            {
                internalId: "admedia-commercials",
                responseType: "iov",
            },
            {
                internalId: "admedia--expenses",
                responseType: "iov",
            },
        ],
    });

    const associatedCommercials = projectDetails.associations["admedia-commercials"];

    const commercialValues = associatedCommercials.map(async commercial => {
        const cadTypeId = commercial["1662670-cad-type"];
        let cadTypeDefaultCost = 0;
        if (cadTypeId && cadTypeId.length > 0) {
            const cadTypeObject = await C.getEntry({
                recordInternalId: "admedia-cad-types",
                entryId: +cadTypeId[0],
            });
            cadTypeDefaultCost = cadTypeObject["1662670-default-cost"]
                ? +cadTypeObject["1662670-default-cost"]
                : 0;
        }

        const numberOfDubs = commercial["1662670--of-dubs"]
            ? + commercial["1662670--of-dubs"]
            : 0;
        const dubsDefaultCost = 18.66 * numberOfDubs;

        const supplierId = commercial["1662670-audio-supplier"];
        let defaultAudioCost = 0;
        if (supplierId && supplierId.length > 0) {
            const supplierObject = await C.getEntry({
                recordInternalId: "xero-suppliers",
                entryId: +supplierId[0],
            });
            defaultAudioCost = supplierObject["1662670-default-cost"]
                ? +supplierObject["1662670-default-cost"]
                : 0;
        }

        return {
            netTotal: commercial["1662670-net"],
            cadTypeDefaultCost,
            dubsDefaultCost,
            defaultAudioCost,
        };
    });

    const mappedCommercialValues = await Promise.all(commercialValues);
    C.addJsonToSummary({ mappedCommercialValues });

    let [
        sumOfNetTotals,
        cadTypeDefaultCostTotal,
        dubsDefaultCostTotal,
        defaultAudioCostTotal,
    ] = mappedCommercialValues.reduce((accumulator, commercialValue) => {
        accumulator[0] += commercialValue.netTotal;
        accumulator[1] += commercialValue.cadTypeDefaultCost;
        accumulator[2] += commercialValue.dubsDefaultCost;
        accumulator[3] += commercialValue.defaultAudioCost;
        return accumulator;
    }, [0, 0, 0, 0]);

    C.addJsonToSummary({
        sumOfNetTotals,
        cadTypeDefaultCostTotal,
        dubsDefaultCostTotal,
        defaultAudioCostTotal,
    });

    const costToAdmedia = cadTypeDefaultCostTotal + dubsDefaultCostTotal + defaultAudioCostTotal;
    const fixedAmountTypeValue = "2334944";
    const yesValue = "1142";

    const values = {
        "1662670-date": C.moment(),
        "1662670-title": "Commercial Cost",
        "1662670-project": [project],
        "1662670-commercial-expense": true,
        "1662670-markup-type": [fixedAmountTypeValue],
        "1662670-on-charge-to-client": [yesValue],
        "1662670-total-amount": sumOfNetTotals,
        "1662670-amount": costToAdmedia,
        "1662670-markup-amount": sumOfNetTotals - costToAdmedia,
    };

    const associatedExpenses = projectDetails.associations["admedia--expenses"];
    C.addJsonToSummary({ associatedExpenses });
    const commercialExpenses = associatedExpenses
        .filter(expense =>
            expense["1662670-commercial-expense"]);
    const expenseId = commercialExpenses[0]?.recordValueId;
    const hasCommercialExpense = commercialExpenses.length > 0;

    let response;
    if (!hasCommercialExpense) {
        response = await C.createEntries({
            values: [values],
            recordInternalId: "admedia--expenses",
            options: {
                returnRecordInfo: true,
                makeAutoId: true,
            },
        });
        C.log("Expense CREATED");
    } else if (hasCommercialExpense && sumOfNetTotals === 0) {
        response = await C.deleteEntries({
            deletes: [
                {
                    entryIds: [commercialExpenses[0].recordValueId],
                    recordInternalId: "admedia--expenses",
                },
            ],
        });
        C.log("Expense DELETED");
    } else {
        response = await C.updateEntries({
            updates: [
                {
                    value: values,
                    entryId: expenseId,
                    recordInternalId: "admedia--expenses",
                },
            ],
        });
        C.log("Expense UPDATED");
    }

    if (response.success.length === 0)
        return { response };

    const associatedEntries = await C.getAssociations(
        project,
        "admedia-projects",
        [
            "admedia--expenses",
            "admedia-tasks",
        ]
    );
    const updatedExpenses = associatedEntries[project]["admedia--expenses"];
    const updatedTasks = associatedEntries[project]["admedia-tasks"];

    // QUOTED CAMPAIGN BUDGET
    const budgetHourRatesTotal = await Promise
        .all(updatedTasks
            .map(async (task) => {
                const employee = task["1662670-assigned-to"][0];
                const employeeEntry = await C.getEntry({
                    recordInternalId: "employees",
                    entryId: employee,
                });
                const chargeOutRate = +employeeEntry["1662670-charge-out-rate"];
                const budgetHours = +task["1662670-budgeted-hours"];

                return chargeOutRate * budgetHours;
            }))
        .then(result =>
            result.reduce((acc, v) => acc + v, 0));
    const chargedExpensesTotal = updatedExpenses
        .filter(expense =>
            expense["1662670-on-charge-to-client"][0] == yesValue)
        .reduce((acc, expense) =>
            acc + expense["1662670-total-amount"], 0);
    const quotedCampaignBudget = budgetHourRatesTotal + chargedExpensesTotal;

    // CURRENT EXPENSES 
    const currentExpenses = chargedExpensesTotal;

    // CURRENT TOTAL
    const project_currentLabor = +projectDetails["1662670-labour-total"] || 0;
    const currentTotal = currentExpenses + project_currentLabor;

    // CURRENT EXPENSE COST
    const currentExpenseCost = updatedExpenses
        .reduce((acc, expense) =>
            acc + expense["1662670-amount"], 0);

    // PROFIT (LABOUR & EXPENSES)
    const project_currentLaborCost = +projectDetails["1662670-cost"] || 0;
    const profit = quotedCampaignBudget - currentExpenseCost - project_currentLaborCost;


    const sumResult = await C.sumAssociations(
        [project],
        "admedia-projects",
        ["invoices"],
        "net-total"
    );
    const totalInvoiced = +Object.values(sumResult)[0].invoices;
    const amountInvoiceRemaining = quotedCampaignBudget - totalInvoiced;

    const updateProjectResponse = await C.updateEntries({
        updates: [
            {
                value: {
                    "1662670-quoted-campaign-budget": quotedCampaignBudget,
                    "1662670-total-expenses": currentExpenses,
                    "1662670-revenue": currentTotal,
                    "1662670-current-expense-cost": currentExpenseCost,
                    "1662670-profit": profit,
                    "1662670-amount-remaining": amountInvoiceRemaining,
                },
                entryId: project,
                recordInternalId: "admedia-projects",
            },
        ],
    });

    return { response, updateProjectResponse };
}