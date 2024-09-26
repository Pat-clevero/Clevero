// Set Name
async function handler(clev) {
    let actions = [];

    let activitySelect = clev.getValue("class-type");
    let activityObject = await clev.api.getEntry({
        recordId: "132155",
        responseType: "iov",
        id: activitySelect,
    });
    let activityName = activityObject.name;

    let roomSelect = clev.getValue("room");
    let roomObject = await clev.api.getEntry({
        recordId: "132156",
        responsType: "iov",
        id: roomSelect,
    });
    let roomName = roomObject.name;

    let startTime = clev.getValue("start-time");

    const name = activityName + " - " + roomName + " - " + clev.moment(startTime).format('HH:mm A DD/MM/YYYY');

    actions.push(clev.setValue("name", name));
    

    return clev.mergeAll(actions);
}
