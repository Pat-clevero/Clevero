async function script(C) {
    const filterEntries = async (recordInternalId, subject, value) => {
        const filterResult = await C.filterEntries({
            filter: [
                {
                    requestType: "i",
                    subject: subject,
                    type: "array",
                    operator: "any_of",
                    ignoreCase: true,
                    value: value,
                },
            ],
            recordInternalId: recordInternalId,
        });

        return filterResult;
    };

    const clearLinkedInvoiceFieldFromEntries = async (recordInternalId, items) => {
        const updates = items.map((item) => ({
            value: {
                "1662670-invoice": []
            },
            entryId: item.recordValueId,
            recordInternalId: recordInternalId,
        }));

        const responses = await Promise.all(updates.map((update) =>
            C.updateEntries({ updates: [update] })));
        return responses;
    };

    const deletedEntryId = C.getCurrentEntryBeforeUpdate().id;

    const timesheetFilterResult = await filterEntries(
        "admedia-timesheets",
        "1662670-invoice",
        [deletedEntryId]
    );
    const expenseFilterResult = await filterEntries(
        "admedia--expenses",
        "1662670-invoice",
        [deletedEntryId]
    );
    const filteredTimesheets = timesheetFilterResult.entries;
    const filteredExpenses = expenseFilterResult.entries;

    const timesheetUpdates = await clearLinkedInvoiceFieldFromEntries("admedia-timesheets", filteredTimesheets);
    const expenseUpdates = await clearLinkedInvoiceFieldFromEntries("admedia--expenses", filteredExpenses);

    return { timesheetUpdates, expenseUpdates };
}