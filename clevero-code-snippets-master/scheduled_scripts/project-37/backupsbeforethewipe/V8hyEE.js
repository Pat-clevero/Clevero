// Filter Course/Program based on the selected Session Type
async function handler(clev) {
    let actions = [];

    const sessionType = clev.getValue("activity-booking-type");

    if (sessionType && sessionType.length > 0) {
        const sessionTypeId = sessionType[0];
        actions.push(
            clev.setFilters("course", [
                {
                    subject: "type",
                    requestType: "i",
                    type: "array",
                    operator: "any_of",
                    value: [sessionTypeId],
                },
            ])
        );
        return clev.mergeAll(actions);
    } else {
        return clev.setValue("course", []);
    }
}
