async function script(C) {
    C.log(
        "CURRENT DATETIME IN SYDNEY(AEST): ",
        moment().tz("Australia/Sydney").format("YYYY-MM-DD HH:mm:ss")
    );
    const celebrants = await getMembersThatDoesHaveDOBSet(C.filterEntries);
    const celebrantsForThisMonth = celebrants
        .filter((celebrant) => {
            const currentMonth = moment().tz("Australia/Sydney").format("MM");
            const monthOfBirth = moment(celebrant["date-of-birth"]).format("MM");
            return monthOfBirth === currentMonth;
        })
        .map((celebrant) => ({
            fullName: celebrant["full-name"],
            birthDay: celebrant["date-of-birth"],
        }));
    C.log("CELEBRANTS FOR THIS MONTH >>> ", celebrantsForThisMonth);

    const adminEmail = "admin@norlanecc.com.au";
    return await sendEmailToAdmin(C, celebrantsForThisMonth, adminEmail);
}

async function getMembersThatDoesHaveDOBSet(callback) {
    const celebrants = await callback({
        ignoreLimits: true,
        filter: [
            {
                subject: "7780",
                type: "date",
                operator: "not_empty",
                ignoreCase: true,
            },
        ],
        recordInternalId: "neighbourhood-house-members",
    });

    return celebrants.entries;
}

async function sendEmailToAdmin(C, members, adminEmail) {
    const recordInternalId = "neighbourhood-house-members";
    const entryId = 7780;
    const subject = "Birthday Celebrants for his month";
    const templateId = 2184582;

    const emailInput = {
        entryId,
        recordInternalId,
        templateId,
        subject,
    };

    const response = await C.mergeEmailTemplate(emailInput);

    const listOfCelebrantsString = members.map(
        (member) =>
            `<li>${member.fullName} -  <b>${moment(member.birthDay).format(
                "MMMM DD, YYYY"
            )}</b></li>`
    );
    const listString = `<ul>${listOfCelebrantsString.join("")}</ul>`;
    const replacements = {
        "{celebrants}": listString,
    };
    const body = response.body.replace(
        /{celebrants}/g,
        (match) => replacements[match]
    );
    C.log(`> Email sent to ${adminEmail}`);
    const emailResponse = await C.sendEmail({
        entryId,
        recordInternalId,
        from: {
            email: "notifications@mailvero.com",
            name: "Clevero Notification",
        },
        to: [adminEmail],
        subject,
        body,
    });

    return { response, emailResponse };
}

