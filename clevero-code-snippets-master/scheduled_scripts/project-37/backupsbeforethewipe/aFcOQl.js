// If Session Type (Room Booking) set Activity to Booking (Room/House)
async function handler(clev) {
    let actions = [];
    let sessionType = clev.getValue("activity-booking-type");

    if (
        sessionType[0] === "141358" //Room Booking
    ) {
        actions.push(clev.setValue("class-type", ["132716"])); //Booking (Room/House)
    } else {
        actions.push(clev.setValue("class-type", []));
    }

    return clev.mergeAll(actions);
}
