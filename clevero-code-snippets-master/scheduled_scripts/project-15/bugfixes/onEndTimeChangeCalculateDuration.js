async function handler(C) {
    console.log("Calculate Duration in minutes");
    const actions = [];

    try {
        const startTime = new Date(C.getValue("1918262-start-time"));
        let endTime = new Date(C.getValue("1918262-end-time"));

        // Reset end time if it's equal to or earlier than start time
        if (endTime <= startTime) {
            endTime = new Date(startTime);
        }

        // Calculate duration in minutes and round it up
        const durationInMinutes = Math.ceil(
            (endTime - startTime) / (1000 * 60)
        );

        actions.push(C.setValue("1918262-duration", durationInMinutes));
    } catch (error) {
        console.error("Error occurred while processing dates:", error);
    }

    return C.mergeAll(actions);
}
