async function script(C) {
    /*
     * 1. Check if there's any Membership to expire today.
     * 2. Set the status of each member that has membership set to expire today to "Inactive".
     * 3. Send an email to admin@norlanecc.com.au notifying the change.
     * 4. Check if there's any Membership to expire in the next 2 weeks.
     * 5. Send a notification email to admin@norlanecc.com.au of these memberships. 1 email each.
     */
    // Get all members whose memberships expiring today
    const expiringTodayList = await getMembershipsExpiringToday(C.filterEntries);
    // Set to Inactive for each
    let updateResults = await Promise.all(
        expiringTodayList.map(async (member) =>
            await C.updateEntries({
                updates: [
                    {
                        value: {
                            "member-status": [132987] // Inactive
                        },
                        entryId: member.recordValueId,
                        recordInternalId: "neighbourhood-house-members",
                    },
                ],
            })
        )
    );
    C.log("UPDATE RESULTS >>>", updateResults);
    // Send an email notifying admin that the member status have been set to inactive 
    let updateEmailResults = await Promise.all(
        expiringTodayList.map(async (member) =>
            await sendEmailToAdmin(C, member, 2122703))
    );
    C.log("UPDATE EMAIL RESULTS >>>", updateEmailResults );

    // Get all members whose memberships are expiring in the next 2 weeks
    const expiringNext2WeeksList = await getMembershipsExpiringIn2Weeks(C.filterEntries);
    // Create and send an email for each expiring membership to admin@norlanecc.com.au
    let expiryEmailResults = await Promise.all(
        expiringNext2WeeksList.map(async (member) =>
            await sendEmailToAdmin(C, member, 2122698))
    );
    C.log("EXPIRY EMAIL RESULTS >>>", expiryEmailResults );
}

async function getMembershipsExpiringToday(callback) {
    const filtered = await callback({
        ignoreLimits: true,
        filter: [
            [
                {
                    subject: "8574",
                    type: "date",
                    operator: "equals",
                    ignoreCase: true,
                    value: {
                        relative: true,
                        value: null,
                        type: "TODAY",
                    },
                },
            ],
        ],
        recordInternalId: "neighbourhood-house-members",
    });

    return filtered.entries;
}

async function getMembershipsExpiringIn2Weeks(callback) {
    const filtered = await callback({
        ignoreLimits: true,
        filter: [
            [
                {
                    subject: "8574",
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
        recordInternalId: "neighbourhood-house-members",
    });

    return filtered.entries;
}

async function sendEmailToAdmin(C, member, templateId) {
    const adminEmail = "admin@norlanecc.com.au";
    const recordInternalId = "neighbourhood-house-members";
    const entryId = member.recordValueId;
    const subject = `${member["full-name"]}'s membership`;

    const emailInput = {
        entryId,
        recordInternalId,
        templateId,
        subject,
    };

    const expiry = moment(member["membership-expiry"]);
    const response = await C.mergeEmailTemplate(emailInput);
    const replacements = {
        "{member}": member["full-name"],
        "{expiry}": expiry.format("MMMM DD, YYYY")
    };
    const body = response.body.replace(
        /{member}|{expiry}/g,
        (match) => replacements[match]
    );
    C.log(`> Email sent to ${adminEmail}`);
    const emailResponse = await C.sendEmail({
        entryId,
        recordInternalId,
        from: {
            email: "notifications@mailvero.com",
            name: "Clevero Notification Service",
        },
        to: [adminEmail],
        subject,
        body,
    });

    return { response, emailResponse };
}