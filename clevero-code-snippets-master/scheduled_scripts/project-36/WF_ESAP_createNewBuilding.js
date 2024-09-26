async function script(C) {
    const currentEntry = await C.getCurrentEntry();
    const buildingName = currentEntry["2181892-building-name"];
    const address = currentEntry["2181892-address"];
    const apartmentsCount = currentEntry["2181892--of-apartments"];
    const recurringAmount = currentEntry["2181892-recurring-amount"];
    const attachments = currentEntry["2181892-proposal-attachment"];

    const createBuildingResult = await C.createEntry({
        recordInternalId: "esap-australia-buildings",
        value: {
            "2181892-building-name": buildingName,
            "2181892-address": address,
            "2181892-apartment": apartmentsCount,
            "2181892-recurring-amount": recurringAmount,
            "2181892-attachments": attachments,
        }
    });

    if ( createBuildingResult.success && createBuildingResult.success.length > 0) {
        const entryId = createBuildingResult.success[0].id;
        C.addHtmlToSummary(
            "Building Creation Successful Link: <a href='https://app.clevero.co/app/records/2221642/view/" +
            entryId +
            "'>" +
            entryId +
            "</a>"
        );
    } else {
        C.addHtmlToSummary("Building Creation Failed");
    }
}