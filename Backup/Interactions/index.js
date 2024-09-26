async function handler(C) {
    let actions = [];
    // Get the value of "Expected Completion Date"
    const dueDate = C.getValue("due-date");

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
        nextFriday.setDate(
            today.getDate() + ((5 - today.getDay() + 7) % 7) + 7
        ); // Calculate Friday of next week
        return nextFriday;
    }

    const today = new Date();
    const nextFriday = calcNextFriday(today);
    console.log(nextFriday);
    
    actions.push(
        C.setValue(
            "due-date",
            C.moment(nextFriday).format("YYYY-MM-DD") //Set Due Date to the Friday next week
        )
    );

    return C.mergeAll(actions);
    

    // if (dueDate.length == "") {
        
    // } else {
    //     console.log("Hello");
    // }
}

// async function handler2(C) {
//     let actions = [];

//     actions.push(C.setValue("date", C.moment().format("YYYY-MM-DD")));

//     return C.mergeAll(actions);
// }