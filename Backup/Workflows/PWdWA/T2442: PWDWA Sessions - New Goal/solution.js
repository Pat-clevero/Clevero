async function handler(C) {
    const actions = [];
    
    const scoreType = C.getValue("score-type");

    const hideFields = [
        "2580357-primary-domain",
        "definitions",
        "2580357-primary-score",
        "2580357-requires-secondary-domain",
        "2580357-secondary-domain",
        "2580357-secondary-definition",
        "2580357-secondary-score",
        "2580357-behaviours",
        "2580357-behaviours-definitions",
        "2580357-confidence",
        "2580357-confidence-definitions",
        "2580357-engagement",
        "2580357-engagement-definitions",
        "2580357-impact",
        "2580357-impact-definitions",
        "2580357-knowledge",
        "2580357-knowledge-definitions",
        "2580357-skills",
        "2580357-skills-definitions",
        "2580357-service-listened",
        "2580357-service-listened-definitions",
        "2580357-satisfied-with-the-services",
        "2580357-satisfied-with-the-services-definitions",
        "2580357-deal-with-issues",
        "2580357-deal-with-issues-definitions",
        "2580357-empowerment",
        "2580357-empowerment-definitions",
    ];

    const showFieldsBasedOnScoreType = {
        2661277: [
            "2580357-primary-domain",
            "definitions",
            "2580357-primary-score",
            "2580357-requires-secondary-domain",
        ],
        2661278: [
            "2580357-behaviours",
            "2580357-behaviours-definitions",
            "2580357-confidence",
            "2580357-confidence-definitions",
            "2580357-engagement",
            "2580357-engagement-definitions",
            "2580357-impact",
            "2580357-impact-definitions",
            "2580357-knowledge",
            "2580357-knowledge-definitions",
            "2580357-skills",
            "2580357-skills-definitions",
            "2580357-empowerment",
            "2580357-empowerment-definitions",
        ],
        2661279: [
            "2580357-service-listened",
            "2580357-service-listened-definitions",
            "2580357-satisfied-with-the-services",
            "2580357-satisfied-with-the-services-definitions",
            "2580357-deal-with-issues",
            "2580357-deal-with-issues-definitions",
        ],
    };

    hideFields.forEach((field) => {
        actions.push(C.setFieldHidden(field, true));
    });

    console.log("Score Type:");
    console.log(scoreType);
    console.log("showFieldsBasedOnScoreType")
    console.log(showFieldsBasedOnScoreType[scoreType[0]]);
    console.log("TEST:")
    console.log(scoreType && showFieldsBasedOnScoreType[scoreType[0]]);
    
    
    // TEST
    const caseField = C.getValue("case");
    const caseFieldValue = await C.api.getEntry({
        id: caseField[0],
        responseType: "iov",
        recordId: 2371069,
    });

    const getStr = caseFieldValue["organisation-activity"]
    const orgActivity = JSON.parse(getStr);
    // console.log(Array.isArray(orgActivity)); // true
    // console.log(orgActivity[0]); // "2655930"



    if (orgActivity[0] === "2679629") { // NDAP
        console.log("NDAP");
    } else if (orgActivity[0] === "2679636") { // NDIS
        console.log("NDIS");
    }
    
    
    
    
    if (scoreType && showFieldsBasedOnScoreType[scoreType[0]]) { // If Cicumstances is selected
        // To show the fields if score type is selected
        showFieldsBasedOnScoreType[scoreType[0]].forEach((field) => {
            actions.push(C.setFieldHidden(field, false));
        });
        
        // Circumstances
        if (scoreType[0] === "2661277") {
            console.log("CIRCUMSTANCES");
            actions.push(
                C.setFieldMandatory("2580357-primary-domain", true),
                C.setFieldMandatory("2580357-primary-score", true)
            );
            const requireSecondaryDomain = C.getValue(
                "2580357-requires-secondary-domain"
            );
            if (requireSecondaryDomain && requireSecondaryDomain === true) {
                actions.push(
                    C.setFieldHidden("2580357-secondary-domain", false),
                    C.setFieldHidden("2580357-secondary-definition", false),
                    C.setFieldHidden("2580357-secondary-score", false),
                    C.setFieldMandatory("2580357-secondary-domain", true),
                    C.setFieldMandatory("2580357-secondary-score", true)
                );
            } else {
                actions.push(
                    C.setFieldHidden("2580357-secondary-domain", true),
                    C.setFieldHidden("2580357-secondary-definition", true),
                    C.setFieldHidden("2580357-secondary-score", true),
                    C.setFieldMandatory("2580357-secondary-domain", false),
                    C.setFieldMandatory("2580357-secondary-score", false)
                );
            }
        } else {
            // Reset mandatory fields if scoreType is NOT CIRCUMSTANCES
            actions.push(
                C.setFieldMandatory("2580357-primary-domain", false),
                C.setFieldMandatory("2580357-primary-score", false),
                C.setFieldMandatory("2580357-secondary-domain", false),
                C.setFieldMandatory("2580357-secondary-score", false)
            );
        }
    }

    return C.mergeAll(actions);
}
