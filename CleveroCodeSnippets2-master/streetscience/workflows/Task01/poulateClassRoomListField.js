async function script(C) {
    const yearLevels = {
        2735976: "Prep",
        2691127: "Year 1",
        2691128: "Year 2",
        2691129: "Year 3",
        2691130: "Year 4",
        2691131: "Year 5",
        2691132: "Year 6",
        2735977: "Year 7-10",
    };

    const currentEntry = await C.getCurrentEntry();
    const job = currentEntry["2708638-job"][0];
    const jobObject = await C.getEntry({
        recordInternalId: "jobs",
        entryId: job,
        loadSubrecords: true,
        subrecords: [
            {
                internalId: "street-science-classrooms-and-year-levels",
                responseType: "iov",
            },
        ],
    });
    C.addJsonToSummary(jobObject.subrecords);

    let outputString = "";
    const classroomsAndYearLevel = jobObject.subrecords["street-science-classrooms-and-year-levels"];
    classroomsAndYearLevel.forEach((data) => {
        const name = data["2708638-classroom-name"];
        const studentCount = data["2708638-nof-students"];
        const yrLevelId = data["2708638-year-level"];

        outputString += `${name} - ${studentCount} - ${yearLevels[yrLevelId]}\n`;
        C.log(`${name} - ${studentCount} - ${yrLevelId}\n`);
    });

    const response = await C.updateEntries({
        updates: [
            {
                value: {
                    "2708638-class-room-list": outputString,
                },
                entryId: currentEntry.recordValueId,
                recordInternalId: "street-science-services",
            },
        ],
    });

    return { response };
}