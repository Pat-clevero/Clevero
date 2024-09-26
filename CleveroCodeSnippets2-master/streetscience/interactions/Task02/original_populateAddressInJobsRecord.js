async function handler(C) {
    const organisationId = C.getValue("2708638-organisation")[0];

    const eventType = C.event.eventType;

    if (!organisationId) {
        if (eventType === "FORM_UPDATE") {
            return C.mergeAll([
                C.setValue("2708638-bell-times", ""),
                C.setValue("2708638-head-of-curriculum", []),
                C.setValue("2708638-travel-time", ""),
                C.setValue("2708638-region", []),
                C.setValue("2708638-parking-instruction", ""),
                C.setValue("2708638-address", ""),
                C.setValue("2708638-billing-contact", ""),
                C.setValue("2708638-decision-maker", ""),
            ]);a
        }
        return;
    }

    const organisation = await C.api.getEntry({
        recordId: 1819867,
        id: +organisationId,
        responseType: "iov",
    });
    

    const actions = [];

    if (eventType === "MODE_SET") {
        const bellTimes = C.getValue("2708638-bell-times");
        const headOfCurriculum = C.getValue("2708638-head-of-curriculum")[0];
        const travelTime = C.getValue("2708638-travel-time");
        const travelFee = C.getValue("2708638-travel-fee");
        const region = C.getValue("2708638-region")[0];
        const parkingInstruction = C.getValue("2708638-parking-instruction");
        const decisionMaker = C.getValue("2708638-decision-maker")[0];
        const billingContact = C.getValue("2708638-billing-contact")[0];

        if (!bellTimes) {
            actions.push(
                C.setValue(
                    "2708638-bell-times",
                    organisation["2708638-bell-times"]
                )
            );
        }
        if (!headOfCurriculum) {
            const hocId =
                organisation["2708638-head-of-curriculum"] &&
                JSON.parse(organisation["2708638-head-of-curriculum"])[0];

            actions.push(
                C.setValue("2708638-head-of-curriculum", hocId ? [hocId] : [])
            );
        }
        
        if (!decisionMaker) {
            const decisionMakerId =
                organisation["2708638-decision-maker"] &&
                JSON.parse(organisation["2708638-decision-maker"])[0];

            actions.push(
                C.setValue("2708638-decision-maker", decisionMakerId ? [decisionMakerId] : [])
            );
        }
        
        if (!billingContact) {
            const billingContactId =
                organisation["2708638-billing-contact"] &&
                JSON.parse(organisation["2708638-billing-contact"])[0];

            actions.push(
                C.setValue("2708638-billing-contact", billingContactId ? [billingContactId] : [])
            );
        }

        if (!travelTime) {
            actions.push(
                C.setValue(
                    "2708638-travel-time",
                    organisation["2708638-travel-time"]
                )
            );
        }
        
        if (!travelFee) {
            actions.push(
                C.setValue(
                    "2708638-travel-fee",
                    organisation["2708638-default-travel-fee"]
                )
            );
        }

        if (!region) {
            const regionId =
                organisation["2708638-region"] &&
                JSON.parse(organisation["2708638-region"])[0];
            actions.push(
                C.setValue("2708638-region", regionId ? [regionId] : [])
            );
        }

        if (!parkingInstruction) {
            actions.push(
                C.setValue(
                    "2708638-parking-instruction",
                    organisation["2708638-parking-instructions"]
                )
            );
        }
        
    } else {
        const hocId =
            organisation["2708638-head-of-curriculum"] &&
            JSON.parse(organisation["2708638-head-of-curriculum"])[0];
        const regionId =
            organisation["2708638-region"] &&
            JSON.parse(organisation["2708638-region"])[0];
        const billingContact =
            organisation["2708638-billing-contact"] &&
            JSON.parse(organisation["2708638-billing-contact"])[0];
        const decisionMaker =
            organisation["2708638-decision-maker"] &&
            JSON.parse(organisation["2708638-decision-maker"])[0];
            
        const parkingInstructions =
            organisation["2708638-parking-instructions"];
        const bellTimes = organisation["2708638-bell-times"];
        const address = organisation["address"];
        const travelTime = organisation["2708638-travel-time"];
        const travelFee = organisation["2708638-default-travel-fee"];
        console.log(address);
        
        actions.push(
            C.setValue("2708638-bell-times", bellTimes),
            C.setValue("2708638-parking-instruction", parkingInstructions),
            C.setValue("2708638-region", regionId ? [regionId] : []),
            C.setValue("2708638-head-of-curriculum", hocId ? [hocId] : []),
            C.setValue("2708638-travel-time", travelTime),
            C.setValue("2708638-address", address),
            C.setValue("2708638-travel-fee", travelFee),
            C.setValue("2708638-billing-contact", billingContact ? [billingContact] : []),
            C.setValue("2708638-decision-maker", decisionMaker ? [decisionMaker] : [])
        );
    }

    return C.mergeAll(actions);
}
