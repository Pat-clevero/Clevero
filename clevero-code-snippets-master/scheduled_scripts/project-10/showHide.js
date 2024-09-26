async function handler(C) {
    const fieldSettings = {
        // Duration
        "2157241": {
            hidden: ["1918262-species", "1918262-age", "1918262-weight-restriction"],
            mandatory: ["1918262-duration"]
        },
        // Global Procedures Allowed
        "2157242": {
            hidden: ["1918262-age", "1918262-duration", "1918262-weight-restriction"],
            mandatory: ["1918262-species"]
        },
        // Species Restrictions
        "2157243": {
            hidden: ["1918262-duration"],
            mandatory: ["1918262-species", "1918262-age", "1918262-weight-restriction"]
        }
    };

    const fieldList = ["1918262-species", "1918262-age", "1918262-weight-restriction", "1918262-duration"];
    const guidelineType = C.getValue("1918262-guideline-type")[0];
    let actions = [];

    fieldList.forEach((field) => {
        if (fieldSettings.hasOwnProperty(guidelineType)) {
            if (fieldSettings[guidelineType].hidden.includes(field))
                actions.push(C.setFieldHidden(field, true));
            else
                actions.push(C.setFieldHidden(field, false));

            if (fieldSettings[guidelineType].mandatory.includes(field))
                actions.push(C.setFieldMandatory(field, true));
            else
                actions.push(C.setFieldMandatory(field, false));
        } else {
            actions.push(C.setFieldHidden(field, false));
            actions.push(C.setFieldMandatory(field, false));
        }
    });

    return C.mergeAll(actions);
}