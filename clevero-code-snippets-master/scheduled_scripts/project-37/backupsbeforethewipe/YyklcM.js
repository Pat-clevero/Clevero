//Set Start Time to 9:00 AM, End Time to 10:00 AM, and Duration to 60
async function handler(clev) {
    let actions = [];

    actions.push(
        clev.setValue(
            "start-time",
            clev.moment().set({ hour: 9, minute: 0 }).toISOString()
        )
    );
    actions.push(
        clev.setValue(
            "end-time",
            clev.moment().set({ hour: 10, minute: 0 }).toISOString()
        )
    );
    actions.push(clev.setValue("duration", "60"));

    return clev.mergeAll(actions);
}
