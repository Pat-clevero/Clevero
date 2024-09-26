async function script(C) {
    const currentEntry = await C.getCurrentEntry();
    const memberId = currentEntry.member[0];
    const memberObject = await C.getEntry({
        recordInternalId: "neighbourhood-house-members",
        entryId: memberId,
    });
    C.addJsonToSummary({ memberObject });

    const companySettings = await C.getCompanySettings();
    const companyEmail = companySettings.email;
    C.addJsonToSummary({ companyEmail });

    const memberEmail = memberObject.email;

    const now = moment().format("YYY-DD-MM hh:mm");
    const createdAt = moment(memberObject.createdAt).format("YYY-DD-MM hh:mm");
    C.log({ now, createdAt });
    if (now !== createdAt)
        return { message: "Email has already been used by a registered member. No confirmation email has been sent." };

    const result = await C.sendEmail({
        entryId: memberObject.recordValueId,
        recordInternalId: "neighbourhood-house-members",
        from: {
            email: companyEmail,
            name: "",
        },
        to: [memberEmail],
        templateId: 2418553,
    });

    return { result };
}