async function handler(C) {
    const hours = C.getValue("hours");
    const numberOfVolunteers = C.getValue("number-of-volunteers");
    const totalVolunteerHours = hours * numberOfVolunteers;

    return C.mergeAll(
        C.setValue("total-volunteer-hours", totalVolunteerHours));
}
