async function handler(C) {
    const actions = [];

    try {
        const startTime = new Date(C.getValue("1918262-start-time")).getTime();
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
    } catch (error) {
        console.error("Error occurred while processing dates:", error);
    }

    return C.mergeAll(actions);
}
