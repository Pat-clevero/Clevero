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
    
    function calcNextFriday(today) {
        const currentWeek = Math.ceil(today.getDate() / 7);
        const nextWeek = currentWeek + 1;
        const nextFriday = new Date(today.getFullYear(), today.getMonth(), (nextWeek * 7) - (today.getDay() === 0 ? 6 : (today.getDay() - 1)));
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
