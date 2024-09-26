async function handler(clev) {
    let actions = [];

    const currentRole = clev.getCurrentRole();
    const employeeId = currentRole.employeeId;
    const job = clev.getValue("job-project");
    //const employeeFieldId = "reviewer";

    actions.push(clev.setValue("reviewer", [`${employeeId}`])); //Set Reviewer to logged in user
    //actions.push(clev.setValue("job-project", ["105602"])); //Set Job/Project to Adhoc One Off Tasks
    //actions.push(clev.setValue("category", ["1225331"])); //Set Category to One Off
    //actions.push(clev.setValue("assigned-to", ["31291"])); // Set Assigned To to Mark Vida
    actions.push(clev.setValue("status", ["27105"])); //Set Status to Not Started
    actions.push(
        clev.setValue("assigned-date", clev.moment().format("YYYY-MM-DD"))
    ); //Set Assigned Date to today
    actions.push(clev.setValue("priority", ["27114"])); //Set Priority to Normal

    if (job.length === 0) {
        actions.push(clev.setValue("job-project", ["105602"])); //Set Job/Project to Adhoc One Off Tasks
        actions.push(clev.setValue("category", ["1225331"])); //Set Category to One Off
    }
    
    // Function to calculate next Friday
    function calcNextFriday(today) {
        /**  
         * Calculate the number of days to add to reach the next Friday
         * Explanation of the formula:
         * - `(5 - today.getDay() + 7) % 7`: Calculate the number of days to add to reach Friday.
         * - `today.getDay()`: returns the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday).
         * - `(5 - today.getDay() + 7) % 7`: ensures we get the correct number of days to Friday, even if today is already Friday or later in the week.
         * - `+ 7`: Ensures that if today is Friday, it moves to the next Friday of the following week.
         */
        const nextFriday = new Date(today);
        nextFriday.setDate(today.getDate() + (5 - today.getDay() + 7) % 7 + 7); // Calculate Friday of next week
        return nextFriday;
    }

    const today = new Date();
    const nextFriday = calcNextFriday(today);

    actions.push(
        clev.setValue(
            "due-date",
            clev.moment(nextFriday).format("YYYY-MM-DD") //Set Due Date to the Friday next week
        )
    );

    return clev.mergeAll(actions);
}
