async function script(C) {
    let oldFieldValues = C.getCurrentEntryBeforeUpdate();
    return { oldFieldValues };
    function shouldTriggerRun(fieldId) {
        let oldFieldValues = C.getCurrentEntryBeforeUpdate();
        if (oldFieldValues == undefined) {
            return true;
        } else {
            const OldFieldValues = oldFieldValues.FieldValues;
            const oldField = OldFieldValues.find(
                (field) => +field.fieldId === +fieldId
            );
            if (!oldField) return true;
            const oldValue = JSON.parse(oldField.value)[0];
            const newField = currentEntry["assigned-to"];
            const newValue = newField[0];
            if (_.isEqual(+oldValue, +newValue)) {
                return false;
            } else {
                return true;
            }
        }
    }

    // const recipientEmail = "hello@clevero.co";
    const recipientEmail = "ivan@clevero.co";
    const currentEntry = await C.getCurrentEntry();
    const entryId = currentEntry.recordValueId;
    const role = await C.getRole();
    const requiredRole = "Patient Portal";
    // const requiredRole = "Admin";
    let response;
    if (role.name == requiredRole) {
        const emailResponse = await C.sendEmail({
            entryId: currentEntry.recordValueId,
            recordInternalId: "super-health-team-crs-claims",
            from: {
                email: "notifications@mailvero.com",
                name: "Clevero Notification Service",
            },
            to: [recipientEmail],
            templateId: 2406818,
        });
    } else return { message: "Email not sent" };

    return response;
}
