async function script(C) {
    const currentEntry = await C.getCurrentEntry();
    const linkedMember = currentEntry["2580357-member"];
    const applyForMembership = currentEntry["2580357-apply-for-membership"];

    const yesValue = 1142;
    const pendingApprovalValue = "2673902";
    const individualTypeValue = "2713755";
    const intakeOfficerSourceValue = 10007828;

    C.addJsonToSummary({ linkedMember, applyForMembership });

    if (
        (!linkedMember || linkedMember.length === 0) &&
        applyForMembership[0] === yesValue
    ) {
        const responses = await C.createEntry({
            value: {
                "2580357-first-name": currentEntry["given-name"],
                "2580357-last-name": currentEntry["family-name"],
                "2580357-full-name": `${currentEntry["given-name"]} ${currentEntry["family-name"]}`,
                "2580357-phone": currentEntry.phone,
                "2580357-email": currentEntry.email,
                "2580357-year-of-birth": moment(
                    currentEntry["date-of-birth"]
                ).format("YYYY"),
                "2580357-date-created": moment().format("YYYY-MM-DD"),
                "2580357-approval-status": [pendingApprovalValue],
                "2580357-type": [individualTypeValue],
                "2580357-member-type": currentEntry["2580357-membership-type"],
                "2580357-source": [intakeOfficerSourceValue],
            },
            recordInternalId: "people-with-disabilities-wa-inc-members",
            options: {
                returnRecordInfo: true,
                makeAutoId: true,
            },
        })
            .then(async (response_createMember) => {
                const newMemberId = response_createMember.success[0].id;
                C.addJsonToSummary({ response_createMember });
                const response_updateClient = await C.updateEntries({
                    updates: [
                        {
                            value: {
                                "2580357-member": [newMemberId],
                            },
                            entryId: currentEntry.recordValueId,
                            recordInternalId: "dex-clients",
                        },
                    ],
                });

                return {
                    response_createMember,
                    response_updateClient,
                };
            })
            .then(async ({ response_createMember, response_updateClient }) => {
                const newMemberId = response_createMember.success[0].id;
                const response_sendEmail = await C.sendEmail({
                    entryId: newMemberId,
                    recordInternalId: "people-with-disabilities-wa-inc-members",
                    from: {
                        email: "notifications@mailvero.com",
                        name: "Clevero Notifications",
                    },
                    templateId: 10008447,
                    to: ["vanessa@pwdwa.org"],
                    subject: "New Member Has Been Created",
                    body: "",
                    logEmail: [{ recordId: 2673905, entryId: newMemberId }],
                });

                return {
                    response_createMember,
                    response_updateClient,
                    response_sendEmail,
                };
            });

        return { responses };
    }

    return {
        message:
            'Linked member is already assigned or Apply for Membership field is "No". No actions taken.',
    };
}