async function handler(C) {
    const hours = C.getValue("hours");
    const numberOfStaff = C.getValue("number-of-staff");
    const totalStaffHours = hours * numberOfStaff;

    return C.mergeAll(
        C.setValue("total-staff-hours", totalStaffHours));
}
