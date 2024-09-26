async function script(C) {
    let eventData = C.getEventMetadata();

    const [
        { entries: disabilitiesEntries },
        { entries: aoiEntries },
    ] = await Promise.all([
        C.getEntries({
            recordInternalId: "people-with-disabilities-wa-inc-disabilities",
            filter: [],
            limit: 1000,
        }),
        C.getEntries({
            recordInternalId:
                "people-with-disabilities-wa-inc-area-of-interests",
            filter: [],
            limit: 1000,
        }),
    ]);

    const disabilities = _.fromPairs(
        disabilitiesEntries.map((entry) => [
            entry["2580357-name"].toLowerCase(),
            entry.recordValueId,
        ])
    );

    const aoi = _.fromPairs(
        aoiEntries.map((entry) => [
            entry["2580357-name"].toLowerCase(),
            entry.recordValueId,
        ])
    );

    const firstName = eventData.body["1.3"];
    const lastName = eventData.body["1.6"];

    const email = eventData.body["2"];
    const phone = eventData.body["4"];

    const organisation = eventData.body["8"];

    const type = eventData.body["5"];
    const streetAddress = eventData.body["9.1"];
    const suburb = eventData.body["9.3"];
    const state = eventData.body["9.4"];
    const preferredContactMethod = eventData.body["7"];

    const otherInterests = eventData.body["16"];
    const otherDisabilities = eventData.body["12"];

    let disabilityIds = [];
    let aoiIds = [];

    Object.values(eventData.body).forEach((v) => {
        const value = v ? v.toLowerCase() : undefined;
        if (Object.keys(disabilities).includes(value)) {
            disabilityIds.push(disabilities[value]);
        }
        if (Object.keys(aoi).includes(value)) {
            aoiIds.push(aoi[value]);
        }
    });

    const typeMapping = {
        "Full member": 2673889,
        "Associate Member": 2673890,
        "Organisational Member": 2673891,
    };

    const preferredContactMethodMapping = {
        Email: 2697212,
        Phone: 2697213,
        Post: 2697224,
    };

    const pendingApprovalStatus = 2673902;
    const websiteSourceValue = 10007831;
    
    const value = {
        "2580357-member-type": typeMapping[type] ? [typeMapping[type]] : [],
        "2580357-first-name": firstName,
        "2580357-last-name": lastName,
        "2580357-full-name": `${firstName} ${lastName}`,
        "2580357-address": {
            description: `${streetAddress}, ${suburb}, ${state}`,
        },
        "2580357-email": email,
        "2580357-phone": phone,
        "2580357-disabilities": disabilityIds,
        "2580357-area-of-interests": aoiIds,
        "2580357-preferred-contact-method": preferredContactMethodMapping[
            preferredContactMethod
        ]
            ? [preferredContactMethodMapping[preferredContactMethod]]
            : [],
        "2580357-approval-status": [pendingApprovalStatus],
        "2580357-company-name": organisation,
        "2580357-other-interests": otherInterests,
        "2580357-other-disabilities": otherDisabilities,
        "2580357-source": [websiteSourceValue],
    };

    const memberCreateResponse = await C.createEntry({
        recordInternalId: "people-with-disabilities-wa-inc-members",
        value,
    })
        // email 1
        .then(async (result_createMember) => {
            if (
                result_createMember.success.length > 0 &&
                result_createMember.success[0].value["21994"]
            ) {
                try {
                    const memberEmail =
                        result_createMember.success[0].value["21994"];
                    const memberEntryId = result_createMember.success[0].id;
                    const response_sendEmail = await C.sendEmail({
                        entryId: memberEntryId,
                        recordInternalId:
                            "people-with-disabilities-wa-inc-members",
                        from: {
                            email: "notifications@mailvero.com",
                            name: "Clevero Notifications",
                        },
                        templateId: 10008138,
                        to: ["vanessa@pwdwa.org"],
                        subject: "",
                        body: "",
                        logEmail: [
                            { recordId: 2673905, entryId: memberEntryId },
                        ],
                    });
                } catch (error) {
                    C.log({ error });
                }
            }
            return result_createMember;
        })
        // email 2
        .then(async (result_createMember) => {
            if (
                result_createMember.success.length > 0 &&
                result_createMember.success[0].value["21994"]
            ) {
                try {
                    const memberEmail =
                        result_createMember.success[0].value["21994"];
                    const memberEntryId = result_createMember.success[0].id;
                    const response_sendEmail = await C.sendEmail({
                        entryId: memberEntryId,
                        recordInternalId:
                            "people-with-disabilities-wa-inc-members",
                        from: {
                            email: "notifications@mailvero.com",
                            name: "Clevero Notifications",
                        },
                        templateId: 10008098,
                        to: [memberEmail],
                        subject: "",
                        body: "",
                        logEmail: [
                            { recordId: 2673905, entryId: memberEntryId },
                        ],
                    });
                } catch (error) {
                    C.log({ error });
                }
            }
        })
        .finally((result_createMember) => result_createMember);

    return {
        memberCreateResponse,
        data: eventData.body,
        value,
        disabilities,
        aoi,
    };
}

