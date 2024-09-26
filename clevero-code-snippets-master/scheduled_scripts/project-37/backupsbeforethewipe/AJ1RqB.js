// Calculate End Time
async function handler(clev) {
    let actions = [];

    let startTime = clev.getValue("start-time");
    let duration = clev.getValue("duration");

    actions.push(
        clev.setValue(
            "end-time",
            clev.moment(startTime).add(duration, "minutes").toISOString()
        )
    );

    return clev.mergeAll(actions);
}
