async function handler(C) {
    const fields = [
        "1795685-start-time",
        "1795685-shorthand-note",
        "1795685-meeting-url",
        "1795685-uuid",
        "1795685-charge-for-no-show", // boolean
        "1795685-crn-needs-confirming", // boolean
        "1795685-court-date-needs-confirming", // boolean
        "1795685-primary-service", // array
        "1795685-secondary-services", // array
    ];

    let actions = fields.map(field => {
        const fieldValue = C.getValue(field);
        if (fieldValue) {
            if (
                field === "1795685-charge-for-no-show" ||
                field === "1795685-crn-needs-confirming" ||
                field === "1795685-court-date-needs-confirming"
            ) return C.setValue(field, false);

            if (field === "1795685-primary-service" || field === "1795685-secondary-services")
                return C.setValue(field, []);

            return C.setValue(field, "");
        }
        else return null;
    });

    actions = actions.filter(action => action !== null);

    return C.mergeAll(actions);
}
