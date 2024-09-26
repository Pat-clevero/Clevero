async function handler(C) {
    const job = C.getValue("2708638-job");
    const jobData = await C.api.getEntry({
        responseType: "iov",
        recordId: "3000013",
        id: job[0],
    });
    console.log({ jobData });

    const classroomList = jobData["2708638-classroom-and-year-levels"];

    return C.mergeAll(C.setValue("2708638-class-room-list", classroomList));
}
