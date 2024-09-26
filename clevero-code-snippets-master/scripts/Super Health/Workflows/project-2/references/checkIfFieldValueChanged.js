async function script(C) {
    let currentEntry = await C.getCurrentEntry();
    const assignedTo = currentEntry["assigned-to"][0];
    const assignedToData = await C.getEntry({
        entryId: assignedTo,
        recordInternalId: "employees",
    });
    const email = assignedToData.email;
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
    const assignedToValue = currentEntry["assigned-to"];
    if (assignedToValue == null || assignedToValue.length < 0) {
        return true;
    }
    
   
    
    if (shouldTriggerRun(2798)) {
        await C.sendEmail({
            entryId: currentEntry.recordValueId,
            recordInternalId: "kalysys-config-tasks",
            from: {
                email: "notifications@mailvero.com",
                name: "Clevero Task Notification",
            },
            to: [email],
            templateId: 29084,
        });
    } else {
        return false;
    }
    return { currentEntry };
}
