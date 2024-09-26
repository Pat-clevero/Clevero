async function script(C) {
    const currentEntry = await C.getCurrentEntry();

    const status = currentEntry.status[0];

    const now = moment().toISOString();
    const ticketSubmitted = currentEntry["issued-at"];
    const forReviewDate = currentEntry["resolved-fixed-on"];
    const completedDate = currentEntry["reviewed-and-completed-date"];
    const customerApprovalDate = currentEntry["customer-approval-date"];
    const closedDate = currentEntry["ticket-closed"];

    const setForReviewDate = forReviewDate ? forReviewDate : now;
    const setCompletedDate = completedDate ? completedDate : now;
    const setcustomerApprovalDate = customerApprovalDate
        ? customerApprovalDate
        : undefined;
    const setclosedDate = closedDate ? closedDate : now;

    let valuesToUpdate = {};

    if (status == "115500") {
        //For Review

        valuesToUpdate["resolved-fixed-on"] = setForReviewDate;
        // valuesToUpdate["dev-duration"] = moment(setForReviewDate).diff(
        //     moment(ticketSubmitted),
        //     "days"
        // );
        // Note: this was the fix for the commented code above to show decimal places
        valuesToUpdate["dev-duration"] = getDateDiffInDecimal(ticketSubmitted, setForReviewDate); 
        
        valuesToUpdate["reviewed-and-completed-date"] = null;
        valuesToUpdate["review-duration"] = null;
        valuesToUpdate["customer-approval-date"] = null;
        valuesToUpdate["customer-approval-duration"] = null;
        valuesToUpdate["ticket-closed"] = null;
        valuesToUpdate["closed-duration"] = null;
        valuesToUpdate["customer-advised"] = null;
        valuesToUpdate["customer-approval-due"] = null;
    } else if (status == "115501") {
        //Reviewed - More Work Required

        valuesToUpdate["rework-needed"] = true;

        valuesToUpdate["resolved-fixed-on"] = null;
        valuesToUpdate["dev-duration"] = null;
        valuesToUpdate["reviewed-and-completed-date"] = null;
        valuesToUpdate["review-duration"] = null;
        valuesToUpdate["customer-approval-date"] = null;
        valuesToUpdate["customer-approval-duration"] = null;
        valuesToUpdate["ticket-closed"] = null;
        valuesToUpdate["closed-duration"] = null;
        valuesToUpdate["customer-advised"] = null;
        valuesToUpdate["customer-approval-due"] = null;
    } else if (status == "115759") {
        //Ongoing Communication with Customer

        valuesToUpdate["resolved-fixed-on"] = null;
        valuesToUpdate["dev-duration"] = null;
        valuesToUpdate["reviewed-and-completed-date"] = null;
        valuesToUpdate["review-duration"] = null;
        valuesToUpdate["customer-approval-date"] = null;
        valuesToUpdate["customer-approval-duration"] = null;
        valuesToUpdate["ticket-closed"] = null;
        valuesToUpdate["closed-duration"] = null;
        valuesToUpdate["customer-advised"] = null;
        valuesToUpdate["customer-approval-due"] = null;
    } else if (status == "637518") {
        //Completed - Awaiting Confirmation from Customer

        valuesToUpdate["resolved-fixed-on"] = setForReviewDate;
        // valuesToUpdate["dev-duration"] = moment(setForReviewDate).diff(
        //     moment(ticketSubmitted),
        //     "days"
        // );
        // Note: this was the fix for the commented code above to show decimal places
        valuesToUpdate["dev-duration"] = getDateDiffInDecimal(ticketSubmitted, setForReviewDate);
        
        valuesToUpdate["reviewed-and-completed-date"] = setCompletedDate;
        valuesToUpdate["review-duration"] = moment(setCompletedDate).diff(
            moment(setForReviewDate),
            "days"
        );
        valuesToUpdate["customer-advised"] = true;
        valuesToUpdate["customer-approval-due"] = moment(now).add(5, "days");

        valuesToUpdate["customer-approval-date"] = null;
        valuesToUpdate["customer-approval-duration"] = null;
        valuesToUpdate["ticket-closed"] = null;
        valuesToUpdate["closed-duration"] = null;
    } else if (status == "115758") {
        //Closed

        valuesToUpdate["resolved-fixed-on"] = setForReviewDate;
        // valuesToUpdate["dev-duration"] = moment(setForReviewDate).diff(
        //     moment(ticketSubmitted),
        //     "days"
        // );
        // Note: this was the fix for the commented code above to show decimal places
        valuesToUpdate["dev-duration"] = getDateDiffInDecimal(ticketSubmitted, setForReviewDate);
        
        valuesToUpdate["reviewed-and-completed-date"] = setCompletedDate;
        valuesToUpdate["review-duration"] = moment(setCompletedDate).diff(
            moment(setForReviewDate),
            "days"
        );
        valuesToUpdate["customer-approval-date"] = setcustomerApprovalDate;
        valuesToUpdate["customer-approval-duration"] = moment(
            setcustomerApprovalDate || now
        ).diff(moment(setCompletedDate), "days");
        valuesToUpdate["ticket-closed"] = setclosedDate;
        valuesToUpdate["closed-duration"] = moment(setclosedDate).diff(
            moment(ticketSubmitted),
            "days"
        );
    } else {

        valuesToUpdate["resolved-fixed-on"] = null;
        valuesToUpdate["dev-duration"] = null;
        valuesToUpdate["reviewed-and-completed-date"] = null;
        valuesToUpdate["review-duration"] = null;
        valuesToUpdate["customer-approval-date"] = null;
        valuesToUpdate["customer-approval-duration"] = null;
        valuesToUpdate["ticket-closed"] = null;
        valuesToUpdate["closed-duration"] = null;
        valuesToUpdate["customer-advised"] = null;
        valuesToUpdate["customer-approval-due"] = null;
    }

    const response = await C.updateEntries({
        updates: [
            {
                value: valuesToUpdate,
                entryId: currentEntry.recordValueId,
                recordInternalId: "support-requests",
            },
        ],
    });

    return { response, currentEntry };
}

function getDateDiffInDecimal(fromDate, toDate) {
    const diffInMilliseconds = moment(toDate).diff(moment(fromDate));
    const diffInDays = moment.duration(diffInMilliseconds).asDays();
    const roundedDiffInDays = diffInDays.toFixed(2);
    // Convert the number to a string and manually add trailing zeros if needed
    return parseFloat(roundedDiffInDays).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
}
