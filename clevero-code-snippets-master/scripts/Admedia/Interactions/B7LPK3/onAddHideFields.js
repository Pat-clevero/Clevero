async function handler(C) {
    let actions = [];
    const isChargedToClient = C.getValue("1662670-on-charge-to-client")[0];
    const noValue = "1143";
    if (!isChargedToClient || isChargedToClient == noValue) {
        // hide
        actions.push(C.setFieldHidden("1662670-markup-type", true));
        actions.push(C.setFieldHidden("1662670-mark-up", true));
        actions.push(C.setFieldHidden("1662670-markup-amount", true));
        // set not mandatory
        actions.push(C.setFieldMandatory("1662670-markup-type", false));
        actions.push(C.setFieldMandatory("1662670-mark-up", false));
        actions.push(C.setFieldMandatory("1662670-markup-amount", false));
        // reset
        actions.push(C.setValue("1662670-markup-type", []));
        actions.push(C.setValue("1662670-mark-up", 0));
        actions.push(C.setValue("1662670-markup-amount", 0));
    } else {
        actions.push(C.setFieldHidden("1662670-markup-type", false));
        actions.push(C.setFieldMandatory("1662670-markup-type", true));

        const markUpType = C.getValue("1662670-markup-type")[0];
        const percentOptionValue = "2334943";
        const fixedOptionValue = "2334944";
        if (markUpType == percentOptionValue) {
            // show and set to mandatory - MARKUP %
            actions.push(C.setFieldDisabled("1662670-mark-up", false));
            actions.push(C.setFieldMandatory("1662670-mark-up", true));
            // hide and set to optional - MARKUP AMOUNT 
            actions.push(C.setFieldDisabled("1662670-markup-amount", true));
            actions.push(C.setFieldMandatory("1662670-markup-amount", false));
            
            actions.push(C.setValue("1662670-mark-up", 0));
            actions.push(C.setValue("1662670-markup-amount", 0));

            actions.push(C.setFieldHidden("1662670-mark-up", false));
            actions.push(C.setFieldHidden("1662670-markup-amount", false));
        } else if (markUpType == fixedOptionValue) {
            // hide and set to optional - MARKUP %
            actions.push(C.setFieldDisabled("1662670-mark-up", true));
            actions.push(C.setFieldMandatory("1662670-mark-up", false));
            actions.push(C.setValue("1662670-mark-up", 0));
            // show and set to mandatory - MARKUP AMOUNT
            actions.push(C.setFieldDisabled("1662670-markup-amount", false));
            actions.push(C.setFieldMandatory("1662670-markup-amount", true));
            
            actions.push(C.setValue("1662670-mark-up", 0));
            actions.push(C.setValue("1662670-markup-amount", 0));

            actions.push(C.setFieldHidden("1662670-mark-up", false));
            actions.push(C.setFieldHidden("1662670-markup-amount", false));
        } else {
            // hide markup amout and percent then reset to 0
            actions.push(C.setFieldHidden("1662670-mark-up", true));
            actions.push(C.setFieldHidden("1662670-markup-amount", true));
            actions.push(C.setFieldMandatory("1662670-mark-up", false));
            actions.push(C.setFieldMandatory("1662670-markup-amount", false));
            actions.push(C.setValue("1662670-mark-up", 0));
            actions.push(C.setValue("1662670-markup-amount", 0));
        }
    }

    return C.mergeAll(actions);
}