async function script(C) {
    var fieldList = [
        {
            id: "8593",
            internalId: "first-aid-expiry",
            name: "First Aid Certificate"
        },
        {
            id: "8595",
            internalId: "working-with-children-expiry",
            name: "Working with Children Certificate"
        },
        {
            id: "8597",
            internalId: "food-handlers-expiry",
            name: "Food Handling Certificate"
        }
    ];

    // get all facilitators that have expiring certificates on each field
    let filterResults = await Promise.all(
        fieldList.map(async (field) => {
            let facilitator = await getFacilitators(field.id, C.filterEntries);
            return facilitator.entries.map((obj) => ({
                id: obj.recordValueId,
                certicate: field.name,
                expiry: obj[field.internalId],
                email: obj["contact-email-nh-facilitators"],
                firstName: obj["first-name"],
                lastName: obj["last-name"],
                fullName: obj["full-name"],
            }));
        })
    );

    // send emails for each expiring certificate
    filterResults.forEach(async (resultItem) => {
        resultItem.forEach(async (facilitator) => {
            const result = await sendEmailToFacilitator(C, facilitator);
            C.log(result);
        });
    })
}

// Get Facilitators that have their certificate to expire in 2 weeks
async function getFacilitators(fieldId, callback) {
    return await callback({
        ignoreLimits: true,
        filter: [
            [
                {
                    subject: fieldId,
                    type: "date",
                    operator: "equals",
                    ignoreCase: true,
                    value: {
                        relative: true,
                        value: "2",
                        type: "PLUS_WEEKS",
                    },
                },
            ],
        ],
        recordInternalId: "neighbourhood-house-instructors",
    });
}

async function sendEmailToFacilitator(C, facilitator) {
    const adminEmail = "admin@norlanecc.com.au";
    const recordInternalId = "neighbourhood-house-instructors";
    const entryId = facilitator.id;
    const templateId = 2122640;
    const subject = `${facilitator.fullName}'s ${facilitator.certicate} expiring in 2 weeks`;

    const emailInput = {
        entryId,
        recordInternalId,
        templateId,
        subject,
    };

    const response = await C.mergeEmailTemplate(emailInput);
    const replacements = {
        "{facilitator}": facilitator.fullName,
        "{certificate}": facilitator.certicate,
        "{expiry}": moment(facilitator.expiry).format("MMMM DD, YYYY")
    };
    const body = response.body.replace(
        /{facilitator}|{certificate}|{expiry}/g,
        (match) => replacements[match]
    );
    C.log(`> [${facilitator.fullName}] **${facilitator.certicate} expiring in 2 weeks** - Email sent to ${adminEmail}`);
    const emailResponse = await C.sendEmail({
        entryId,
        recordInternalId,
        from: {
            email: "notifications@mailvero.com", // Standard email 
            name: "Clevero Notification Service", // Standard name
        },
        to: [adminEmail],
        subject,
        body,
    });

    return { response, emailResponse };
}