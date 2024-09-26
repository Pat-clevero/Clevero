async function handler(C) {
    function getIsYes(fieldValue) {
        const yesValue = "1142";
        const noValue = "1143";

        return fieldValue === yesValue
            ? true
            : fieldValue === noValue
            ? false
            : false; // for neither yes or no (null, undefined, or empty)
    }

    const discussedMembershipValue = C.getValue("2580357-discussed-membership");
    const isDiscussed = getIsYes(discussedMembershipValue[0]);

    const applyForMembershipValue = C.getValue("2580357-apply-for-membership");
    const isApply = getIsYes(applyForMembershipValue[0]);
    
    const setValueActions = []; 
    if(!isDiscussed)
        setValueActions.push(C.setValue("2580357-apply-for-membership", []));
    if(!(isDiscussed && isApply))
        setValueActions.push(C.setValue("2580357-membership-type", []));

    return C.mergeAll(
        C.setFieldHidden("2580357-apply-for-membership", !isDiscussed),
        C.setFieldHidden("2580357-membership-type", !(isDiscussed && isApply)),
        C.setFieldMandatory("2580357-membership-type", isDiscussed && isApply),
        setValueActions
    );
}
