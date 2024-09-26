async function script(C) {
    const currentEntry = await C.getCurrentEntry();
    const role = await C.getRole();
    const requiredRole = "Patient Portal";

    if (role.name !== requiredRole)
        return { message: "Role is not 'Patient Portal'. Email not sent." };

    const editableFields = {
        phone: 3595,
        "date-of-birth": 3937,
        address: 3596,
        "super-fund": 3606,
        "superannuation-member-no": 5487,
        "compassionate-release": 9765,
        "super-form-response": 9762,
        "cid-attachment": 9760,
        "ato-approval-letter": 9764,
        "ato-receipt-file": 10087,
        "additional-files-1": 9794,
        "additional-files-2": 9795,
        "upload-super-form": 10435,
    };

    const deepEqual = (obj1, obj2) => {
        if (obj1 === obj2)
            return true;

        if (typeof obj1 !== 'object' || typeof obj2 !== 'object')
            return false;

        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length)
            return false;

        for (const key of keys1)
            if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key]))
                return false;

        return true;
    };

    const isFieldNewOrUpdated = (fieldInternalId, fieldId) => {
        let oldEntryState = C.getCurrentEntryBeforeUpdate();
        if (oldEntryState == undefined) {
            C.log("oldEntryState is empty");
            return true;
        }

        const oldFieldValues = oldEntryState.FieldValues;
        const oldField = oldFieldValues.find(
            (field) => +field.fieldId === +fieldId
        );
        
        if (!oldField && currentEntry[fieldInternalId]) { // for empty fields that were updated
            C.log("Empty field was updated", {
                oldValue: null,
                newValue: currentEntry[fieldInternalId]
            });
            return true;
        } else if (!oldField && !currentEntry[fieldInternalId]) {
            return false;
        }

        // for non-empty fields that were updated
        let oldValue;
        if (oldField && typeof oldField.value === "string") {
            try {
                const parsedValue = JSON.parse(oldField.value);
                oldValue = Array.isArray(parsedValue)
                    ? parsedValue[0]
                    : parsedValue;
            } catch {
                oldValue = oldField.value;
            }

            const newValue = Array.isArray(currentEntry[fieldInternalId])
                ? currentEntry[fieldInternalId][0]
                : currentEntry[fieldInternalId];
            
            // if both new and old values are null or empty 
            if(!oldValue && !newValue) {
                C.log("Both old and new values are null or empty");
                return false;
            }

            let isFieldUpdated;
            if (typeof oldValue === "object" && typeof newValue === "object") {
                C.log("-- Objects Compared");
                isFieldUpdated = !deepEqual(oldValue, newValue);
            } else {
                C.log("-- Non-objects Compared");
                isFieldUpdated = oldValue != newValue;
            }

            C.log({ oldValue, newValue, isFieldUpdated });
            return isFieldUpdated;
        }

        C.log(`${fieldInternalId} was not updated!`);
        return false;
    };

    let shouldSendEmail = false;
    for (const key in editableFields)
        shouldSendEmail = shouldSendEmail || isFieldNewOrUpdated(key, editableFields[key]);

    if (shouldSendEmail) {
        const recipientEmail = "hello@sheaustralia.org";
        const entryId = currentEntry.recordValueId;
        const emailResponse = await C.sendEmail({
            entryId,
            recordInternalId: "super-health-team-crs-claims",
            from: {
                email: "notifications@mailvero.com",
                name: "Clevero Notification Service",
            },
            to: [recipientEmail],
            templateId: 2406818,
        });

        return { emailResponse };
    } else {
        return { message: "No changes made. Email not sent" };
    }
}