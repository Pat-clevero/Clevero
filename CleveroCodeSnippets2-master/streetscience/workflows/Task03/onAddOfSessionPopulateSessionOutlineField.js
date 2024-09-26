async function script(C) {
    const sessionTypes = {
        "workshop": 300021099,
        "show": 300021100,
        "shop": 300021100,
        "setup": 300263188,
        "packup": 300263189,
        "break": 300263190
    };

    const currentEntry = await C.getCurrentEntry();

    const jobObject = await C.getEntry({
        recordInternalId: "jobs",
        entryId: currentEntry["2708638-job"][0],
        loadAssociations: true,
        associations: [
            {
                internalId: "street-science-services",
                responseType: "iov",
            }
        ]
    });
    let sessionObjects = jobObject
        .associations["street-science-services"]
        .filter((obj) => obj.recordValueId !== currentEntry.recordValueId);
    sessionObjects = [currentEntry, ...sessionObjects]
        .sort(
            (a, b) => new Date(a["2708638-start-time"]) - new Date(b["2708638-start-time"])
        );
    C.addJsonToSummary({ sessionObjects });

    const sessionArr = await Promise.all(sessionObjects.map(async (obj) => {
        const sessionType = obj["2708638-service-type"] && obj["2708638-service-type"].length
            ? obj["2708638-service-type"][0]
            : null;

        const templateID = obj["2708638-template"] && obj["2708638-template"].length
            ? obj["2708638-template"][0]
            : null;
        let sessionTemplate = "";
        if (templateID) {
            const templateObj = await C.getEntry({
                recordInternalId: "street-science-sessions-templates",
                entryId: templateID,
            });
            sessionTemplate = templateObj
                ? templateObj["2708638-name"]
                : "";
        }

        const groupName = obj["2708638-group-name"] ?? "";
        const noOfKids = obj["2708638-no-of-kids"]
            ? `${obj["2708638-no-of-kids"]} students`
            : "";
        const startTime = obj["2708638-start-time"]
            ? moment
                .tz(obj["2708638-start-time"], "Australia/Brisbane")
                .format("hh:mma")
            : "";
        const endTime = obj["2708638-end-time"]
            ? moment
                .tz(obj["2708638-end-time"], "Australia/Brisbane")
                .format("hh:mma")
            : "";

        let outputString = "";
        switch (sessionType) {
            case sessionTypes.workshop:
            case sessionTypes.show:
                outputString = `${sessionTemplate} (${groupName} - ${noOfKids}): ${startTime} - ${endTime}`;
                break;
            case sessionTypes.setup:
                outputString = `Arrival/Set up: ${startTime} - ${endTime}`;
                break;
            case sessionTypes.break:
                outputString = `BREAK: ${startTime} - ${endTime}`;
                break;
            case sessionTypes.packup:
                outputString = `Pack up: ${startTime} - ${endTime}`;
                break;
            default:
                break;
        }

        return outputString;
    }));
    C.addJsonToSummary({ sessionArr });

    const jobId = currentEntry["2708638-job"][0];
    const updateProjectResult = await C.updateEntries({
        updates: [
            {
                value: {
                    "2708638-session-outline": sessionArr.join("<br>"),
                },
                entryId: jobId,
                recordInternalId: "jobs"
            },
        ],
    });

    return { updateProjectResult };
}