// Hide/show fields based on the selected Session Type
async function handler(clev) {
    let actions = [];

    const generateHideShowFieldsActions = (fields, hiddenFields) => {
        return fields.map((field) =>
            hiddenFields.includes(field)
                ? clev.setFieldHidden(field, true)
                : clev.setFieldHidden(field, false));
    };

    const allFields = [
        "course",
        "session-cancelled",
        "start-time",
        "end-time",
        "duration",
        "cost",
        "term",
        "class-type",
        "instructor",
        "delivery-method",
        "room",
        "session-capacity",
        "remaining-capacity",
        "zoom-link",
        "activity-fee",
        "where",
        "available-online",
        "name",
        "website-image",
        "short-description",
        "long-description",
        "terms-and-conditions",
        "privacy-policy",
        "cancellation-and-refund-policy",
        "contact-name",
        "contact-email",
        "contact-phone",
        "url",
        // note: fields hidden in rule but not in here (re. migration from rule to interaction)
        "cleaning-arrangements",
        "notes",
        "contact",
        "organisation",
        "purpose-of-hire",
        "estimated-number-of-people",
        "number-of-people-who-live-in-municipality",
        "public-liability-insurance",
        "insurance-policy",
        "surcharge-added-to-fees",
        "group-incorporated",
        "contact-details-of-security-company",
        "will-alcohol-be-served",
        "will-alcohol-be-sold",
        "liquor-license",
        "application-form",
        "group-type",
        "free-session-old",
        "image",
        "display-name",
        "terms-and-conditions",
        "category",
        "default-report-code",
        // note: fields in EL but not in the old form (re. migration from rule to interaction)
        "child-activity",
        "max-number-of-children",
        "child-price-session",
        "request-emergency-contacts-for-child",
        "request-emergency-contacts-for-new-members",
        "request-emergency-contacts-for-existing-members",

        "online-payment-methods",
        "statuses",
    ];

    const sessionTypes = {
        course: "153643",
        program: "141357",
        roombooking: "141358",
        oneoff: "154473",
    };
    const deliveryTypes = {
        internal: "247733",
        externalprovider: "247734",
    };

    let sessionType = clev.getValue("activity-booking-type");
    let fieldsToHide = [];
    switch (sessionType[0]) {
        case sessionTypes.course:
        case sessionTypes.program:
            const courseProgram = clev.getValue("course");
            if (courseProgram.length > 0) {
                const courseObject = await clev.api.getEntry({
                    recordId: "148796",
                    responseType: "iov",
                    id: courseProgram[0],
                });
                fieldsToHide = courseObject.delivery == deliveryTypes.externalprovider
                    ? [
                        // "name",
                        "will-alcohol-be-served",
                        "will-alcohol-be-sold",
                        "liquor-license",
                        "contact-email",
                        "contact-name",
                        "contact-phone",
                        "privacy-policy",
                    ]
                    : [
                        // "name",
                        "will-alcohol-be-served",
                        "will-alcohol-be-sold",
                        "liquor-license",
                        "group-type",
                        "contact",
                        "organisation",
                        "purpose-of-hire",
                        "estimated-number-of-people",
                        "number-of-people-who-live-in-municipality",
                        "public-liability-insurance",
                        "insurance-policy",
                        "surcharge-added-to-fees",
                        "group-incorporated",
                        "contact-details-of-security-company",
                    ];
            };
            actions = actions.concat(
                generateHideShowFieldsActions(allFields, fieldsToHide));
            actions.push(clev.setFieldMandatory("course", true));
            break;
        case sessionTypes.roombooking:
            fieldsToHide = [
                "course",
                "instructor",
                "session-capacity",
                "remaining-capacity",
                "delivery-method",
                "zoom-link",
                "available-online",
                // "name",
                "contact-email",
                "contact-name",
                "contact-phone",
                "privacy-policy",
            ];
            actions = actions.concat(
                generateHideShowFieldsActions(allFields, fieldsToHide));
            break;
        case sessionTypes.oneoff:
            fieldsToHide = [
                "course",
                "session-cancelled",
                "start-time",
                "end-time",
                "duration",
                "cost",
                "term",
                "class-type",
                "instructor",
                "delivery-method",
                "room",
                "session-capacity",
                "remaining-capacity",
                "zoom-link",
                "activity-fee",
                "where",
                "available-online",
                // "name",
                "group-type",
                "contact",
                "organisation",
                "purpose-of-hire",
                "estimated-number-of-people",
                "number-of-people-who-live-in-municipality",
                "public-liability-insurance",
                "insurance-policy",
                "surcharge-added-to-fees",
                "group-incorporated",
                "contact-details-of-security-company",
                "will-alcohol-be-served",
                "will-alcohol-be-sold",
                "liquor-license",
                "application-form",
            ];
            actions = actions.concat(
                generateHideShowFieldsActions(allFields, fieldsToHide));
            break;
        default:
            fieldsToHide = allFields;
            actions = actions.concat(
                generateHideShowFieldsActions(fieldsToHide, allFields));
            break;
    }

    return clev.mergeAll(actions);
}