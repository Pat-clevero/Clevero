async function handler(C) {
    console.log("On change of Duration and Start Time, set End Time");
    const actions = [];

    try {
        const startTimeValue = C.getValue("1918262-start-time");
        if (startTimeValue) {
            const startTime = new Date(startTimeValue).getTime();
            const currentEndTime = new Date(
                C.getValue("1918262-end-time")
            ).getTime();
            const currentDuration = Math.round(
                (currentEndTime - startTime) / (1000 * 60)
            );
            const newDuration = C.getValue("1918262-duration");

            if (newDuration !== currentDuration) {
                const endTime = startTime + newDuration * 1000 * 60;
                actions.push(
                    C.setValue("1918262-end-time", new Date(endTime).toISOString())
                );
            }
        } else {
            console.log("cleared");
            actions.push(C.setValue("1918262-end-time", null));
        }

    } catch (error) {
        console.error("Error occurred while processing dates:", error);
    }
    console.log(actions);

    return C.mergeAll(actions);
}
