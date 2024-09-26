/*
 * 1. Get the support case entries that have the current entry as a parent
 * 2. For every child/linked entry update the values of:
 *   a) status field
 *   b) assigned-to field
 */
async function script(C) {
    // Get current entry on the submitted form
    const currentEntry = await C.getCurrentEntry();

    // Get all the child/linked Support Cases
    const parentFieldID = "19247";
    const linkedSupportCases = await C.filterEntries({
        filter: [
            {
                subject: parentFieldID,
                type: "array",
                operator: "any_of",
                ignoreCase: true,
                value: [currentEntry.recordValueId],
            },
        ],
        recordInternalId: "support-requests",
    });
    C.log("NO. OF SUPPORT CASES: ", linkedSupportCases.entries.length);
    
    // Update each child/linked Support Case
    const status = currentEntry.status;
    
    // For "Completed - Awaiting Confirmation from Customer"
    const customerAdvised = status[0] == "637518";
    const customerApprovalDue = status[0] == "637518" 
        ? moment().add(5, "days")
        : "";
        
    const assignedTo = currentEntry["assigned-to"];
    linkedSupportCases.entries.forEach(async (linkedSupportCase) => {
        const response = await C.updateEntries({
            updates: [
                {
                    value: {
                        status: status,
                        "assigned-to": assignedTo,
                        "customer-advised": customerAdvised,
                        "customer-approval-due": customerApprovalDue
                    },
                    entryId: linkedSupportCase.recordValueId,
                    recordInternalId: "support-requests",
                },
            ],
        });
        C.log("UPDATED RESPONSE: ", response);
    });
}

