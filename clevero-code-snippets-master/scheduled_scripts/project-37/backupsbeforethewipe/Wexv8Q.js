// If Session Type (One Off) and Available Online is ticked, hide/show fields
async function handler(clev) {
    let actions = [];
    let sessionType = clev.getValue("activity-booking-type");
    let availableOnline = clev.getValue("available-online");

    if (
        sessionType[0] === "154473" && //One Off
        availableOnline === true
    ) {
        actions.push(clev.setFieldHidden("website-image", false));
        actions.push(clev.setFieldHidden("short-description", false));
        actions.push(clev.setFieldHidden("long-description", false));
        actions.push(clev.setFieldHidden("image", false));
        actions.push(clev.setFieldHidden("terms-and-conditions", false));
        actions.push(clev.setFieldHidden("privacy-policy", false));
        actions.push(
            clev.setFieldHidden("cancellation-and-refund-policy", false)
        );
        actions.push(clev.setFieldHidden("contact-name", false));
        actions.push(clev.setFieldHidden("contact-email", false));
        actions.push(clev.setFieldHidden("contact-phone", false));
        actions.push(clev.setFieldHidden("url", false));
        actions.push(clev.setFieldHidden("display-name", false));
    } else {
        actions.push(clev.setFieldHidden("website-image", true));
        actions.push(clev.setFieldHidden("short-description", true));
        actions.push(clev.setFieldHidden("long-description", true));
        actions.push(clev.setFieldHidden("image", true));
        actions.push(clev.setFieldHidden("terms-and-conditions", true));
        actions.push(clev.setFieldHidden("privacy-policy", true));
        actions.push(
            clev.setFieldHidden("cancellation-and-refund-policy", true)
        );
        actions.push(clev.setFieldHidden("contact-name", true));
        actions.push(clev.setFieldHidden("contact-email", true));
        actions.push(clev.setFieldHidden("contact-phone", true));
        actions.push(clev.setFieldHidden("url", true));
        actions.push(clev.setFieldHidden("display-name", true));
    }

    return clev.mergeAll(actions);
}
