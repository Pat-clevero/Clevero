async function script(C) {
    let [
        quotedCampaignBudget,
        currentLabourRevenue,
        currentExpensesRevenue,
        currentTotalRevenue,
        currentExpenseCost,
        currentLabourCost,
        profit
    ] = Array(7).fill(0);

    const currentEntry = await C.getCurrentEntry();
    let project = C.utilityInputs.task.event.event === "AFTER_DELETE"
            ? C.utilityInputs.task.event.eventMetadata.data.oldValues.value["1662670-project"][0]
            : currentEntry["1662670-project"][0];

    const associatedEntries = await C.getAssociations(
        project,
        "admedia-projects",
        [
            "admedia-tasks",
            "admedia--expenses",
            "admedia-timesheets",
        ]
    );

    // 1. QUOTED CAMPAIGN BUDGET
    const associatedTasks = associatedEntries[project]["admedia-tasks"];
    const budgetHoursArray = [];
    const budgetHourRatesTotal = await Promise
        .all(associatedTasks
            .map(async (task) => {
                const employee = task["1662670-assigned-to"][0];
                const employeeEntry = await C.getEntry({
                    recordInternalId: "employees",
                    entryId: employee,
                });
                const chargeOutRate = +employeeEntry["1662670-charge-out-rate"];
                const budgetHours = +task["1662670-budgeted-hours"];
                budgetHoursArray.push(budgetHours);

                return chargeOutRate * budgetHours;
            }))
        .then(result =>
            result.reduce((acc, v) => acc + v, 0));
    const yesValue = 1142;
    const associatedExpenses = associatedEntries[project]["admedia--expenses"];
    const chargedExpensesTotal = associatedExpenses
        .filter(expense =>
            expense["1662670-on-charge-to-client"][0] === yesValue)
        .reduce((acc, expense) =>
            acc + expense["1662670-total-amount"], 0);
    const budgetHoursTotal = budgetHoursArray.reduce((acc, v) => acc + v, 0);
    quotedCampaignBudget = budgetHourRatesTotal + chargedExpensesTotal;

    // 2. CURRENT LABOUR
    const associatedTimesheets = associatedEntries[project]["admedia-timesheets"];
    currentLabourRevenue = associatedTimesheets
        .map(timesheet =>
            timesheet["1662670-revenue"])
        .reduce((acc, v) => acc + v, 0);

    // 3. CURRENT EXPENSES
    currentExpensesRevenue = chargedExpensesTotal;

    // 4. CURRENT TOTAL
    currentTotalRevenue = currentExpensesRevenue + currentLabourRevenue;

    // 5. CURRENT EXPENSE COST
    currentExpenseCost = associatedExpenses
        .reduce((acc, expense) =>
            acc + expense["1662670-amount"], 0);

    // 6. CURRENT LABOUR COST
    currentLabourCost = associatedTimesheets
        .map(timesheet =>
            timesheet["1662670-cost"])
        .reduce((acc, v) => acc + v, 0);

    // 7. PROFIT (LABOUR & EXPENSES)
    profit = quotedCampaignBudget - currentExpenseCost - currentLabourCost;

    const updateResult = await C.updateEntries({
        updates: [
            {
                value: {
                    "1662670-quoted-campaign-budget": quotedCampaignBudget,
                    "1662670-labour-total": currentLabourRevenue,
                    "1662670-total-expenses": currentExpensesRevenue,
                    "1662670-revenue": currentTotalRevenue,
                    "1662670-current-expense-cost": currentExpenseCost,
                    "1662670-cost": currentLabourCost,
                    "1662670-profit": profit,
                    "1662670-total-budget-hours": budgetHoursTotal,
                },
                entryId: project,
                recordInternalId: "admedia-projects",
            },
        ],
    });

    return updateResult;
}