async function handler(C) {
    try {
        // Initialization
        let actions = [];
        let finalReport = C.getValue("1795685-final-report");
        let status = C.getValue("1795685-status");

        // Define the date for the report sent
        const reportSentDate = C.moment().format("YYYY-MM-DD");

        // Check if finalReport has content and status is not equal to 1851316
        if (finalReport.length > 0 && status !== 1851316) {
            actions.push(C.setValue("1795685-psychometrics-sent-1", true));
            actions.push(C.setValue("1795685-psychometrics-received-1", true));
            actions.push(C.setValue("1795685-report-in-review-folder-1", true));
            actions.push(C.setValue("1795685-report--reviewed-feedback-1", true));
            actions.push(C.setValue("1795685-report-sent-1", true));
            actions.push(C.setValue("1795685-status", [1851316]));
            actions.push(C.setValue("1795685-report-sent-date", reportSentDate));
        } else {
            actions.push(C.setValue("1795685-psychometrics-sent-1", false));
            actions.push(C.setValue("1795685-psychometrics-received-1", false));
            actions.push(C.setValue("1795685-report-in-review-folder-1", false));
            actions.push(C.setValue("1795685-report--reviewed-feedback-1", false));
            actions.push(C.setValue("1795685-report-sent-1", false));
            actions.push(C.setValue("1795685-status", [1851316]));
            actions.push(C.setValue("1795685-report-sent-date", ""));
        }

        // Execute all actions
        return C.mergeAll(actions);
    } catch (error) {
        console.error("An error occurred:", error);
    }
    
}

