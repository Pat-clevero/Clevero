async function handler(clev) {
    let actions = [];
    let sessionType = clev.getValue("activity-booking-type");

    if (!sessionType[0]) {
        actions.push(clev.setFieldHidden("course", true));
        actions.push(clev.setFieldHidden("session-cancelled", true));
        actions.push(clev.setFieldHidden("start-time", true));
        actions.push(clev.setFieldHidden("end-time", true));
        actions.push(clev.setFieldHidden("duration", true));
        actions.push(clev.setFieldHidden("cost", true));
        actions.push(clev.setFieldHidden("term", true));
        actions.push(clev.setFieldHidden("class-type", true));
        actions.push(clev.setFieldHidden("instructor", true));
        actions.push(clev.setFieldHidden("delivery-method", true));
        actions.push(clev.setFieldHidden("room", true));
        actions.push(clev.setFieldHidden("session-capacity", true));
        actions.push(clev.setFieldHidden("remaining-capacity", true));
        actions.push(clev.setFieldHidden("zoom-link", true));
        actions.push(clev.setFieldHidden("activity-fee", true));
        actions.push(clev.setFieldHidden("where", true));
        actions.push(clev.setFieldHidden("available-online", true));
        actions.push(clev.setFieldHidden("name", true));

        actions.push(clev.setFieldHidden("website-image", true));
        actions.push(clev.setFieldHidden("short-description", true));
        actions.push(clev.setFieldHidden("long-description", true));
        actions.push(clev.setFieldHidden("terms-and-conditions", true));
        actions.push(clev.setFieldHidden("privacy-policy", true));
        actions.push(
            clev.setFieldHidden("cancellation-and-refund-policy", true)
        );
        actions.push(clev.setFieldHidden("contact-name", true));
        actions.push(clev.setFieldHidden("contact-email", true));
        actions.push(clev.setFieldHidden("contact-phone", true));
        actions.push(clev.setFieldHidden("url", true));
    } else if (sessionType[0] === "153643" || sessionType[0] === "141357") {
        //Course || Program
        actions.push(clev.setFieldHidden("course", false));
        actions.push(clev.setFieldHidden("session-cancelled", false));
        actions.push(clev.setFieldHidden("start-time", false));
        actions.push(clev.setFieldHidden("end-time", false));
        actions.push(clev.setFieldHidden("duration", false));
        actions.push(clev.setFieldHidden("cost", false));
        actions.push(clev.setFieldHidden("term", false));
        actions.push(clev.setFieldHidden("class-type", false));
        actions.push(clev.setFieldHidden("instructor", false));
        actions.push(clev.setFieldHidden("delivery-method", false));
        actions.push(clev.setFieldHidden("room", false));
        actions.push(clev.setFieldHidden("session-capacity", false));
        actions.push(clev.setFieldHidden("remaining-capacity", false));
        actions.push(clev.setFieldHidden("zoom-link", false));
        actions.push(clev.setFieldHidden("activity-fee", false));
        actions.push(clev.setFieldHidden("where", false));
        actions.push(clev.setFieldHidden("available-online", false));
        actions.push(clev.setFieldHidden("name", false));
    } else if (sessionType[0] === "141358") {
        //Room Booking
        actions.push(clev.setFieldHidden("course", true));
        actions.push(clev.setFieldHidden("session-cancelled", false));
        actions.push(clev.setFieldHidden("start-time", false));
        actions.push(clev.setFieldHidden("end-time", false));
        actions.push(clev.setFieldHidden("duration", false));
        actions.push(clev.setFieldHidden("cost", false));
        actions.push(clev.setFieldHidden("term", false));
        actions.push(clev.setFieldHidden("class-type", false));
        actions.push(clev.setFieldHidden("instructor", true));
        actions.push(clev.setFieldHidden("delivery-method", true));
        actions.push(clev.setFieldHidden("room", false));
        actions.push(clev.setFieldHidden("session-capacity", true));
        actions.push(clev.setFieldHidden("remaining-capacity", true));
        actions.push(clev.setFieldHidden("zoom-link", true));
        actions.push(clev.setFieldHidden("activity-fee", false));
        actions.push(clev.setFieldHidden("where", false));
        actions.push(clev.setFieldHidden("available-online", true));
        actions.push(clev.setFieldHidden("name", false));
    } else if (sessionType[0] === "154473") {
        //One Off
        actions.push(clev.setFieldHidden("course", true));
        actions.push(clev.setFieldHidden("session-cancelled", false));
        actions.push(clev.setFieldHidden("start-time", false));
        actions.push(clev.setFieldHidden("end-time", false));
        actions.push(clev.setFieldHidden("duration", false));
        actions.push(clev.setFieldHidden("cost", false));
        actions.push(clev.setFieldHidden("term", false));
        actions.push(clev.setFieldHidden("class-type", false));
        actions.push(clev.setFieldHidden("instructor", false));
        actions.push(clev.setFieldHidden("delivery-method", false));
        actions.push(clev.setFieldHidden("room", false));
        actions.push(clev.setFieldHidden("session-capacity", false));
        actions.push(clev.setFieldHidden("remaining-capacity", false));
        actions.push(clev.setFieldHidden("zoom-link", false));
        actions.push(clev.setFieldHidden("activity-fee", false));
        actions.push(clev.setFieldHidden("where", false));
        actions.push(clev.setFieldHidden("available-online", false));
        actions.push(clev.setFieldHidden("name", false));
    }

    return clev.mergeAll(actions);
}
