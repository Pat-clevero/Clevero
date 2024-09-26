async function handler(C) {
    let actions = [];
    let linkedEnrolment = C.getValue("linked-enrolment");

    if (linkedEnrolment.length > 0) {
        let linkedEnrolmentObject = await C.api.getEntry({
            recordId: "676915",
            responseType: "iov",
            id: linkedEnrolment[0],
        });

        let linkedEnrolmentMember = JSON.parse(linkedEnrolmentObject.member); // "JSON.parse()" converts a string to an array
        let linkedEnrolmentSession = JSON.parse(linkedEnrolmentObject.session); // "JSON.parse()" converts a string to an array

        actions.push(C.setValue("member", linkedEnrolmentMember));
        actions.push(C.setValue("activity", linkedEnrolmentSession));

        return C.mergeAll(actions);
    }
}
