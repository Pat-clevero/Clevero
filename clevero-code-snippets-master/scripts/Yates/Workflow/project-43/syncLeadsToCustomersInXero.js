async function script(C) {
    const currentEntry = await C.getCurrentEntry();
    const tenantId = (await C.getCompanySettings()).xeroOrganisation.xeroId;

    if (!tenantId) {
        throw "Default xero organisation is not set in company settings";
    }

    const xeroContactEntryData = {
        contactID: currentEntry["xero-id"],
        name: currentEntry.name,
        emailAddress: currentEntry.email,
    };
 
    const xeroClient = await C.xeroUpsert({
        recordId: currentEntry.recordId,
        entryId: currentEntry.recordValueId,
        xeroTenantId: tenantId,
        correspondingRecordType: "contact",
        xeroEntryData: xeroContactEntryData,
    });
    
    let valuesToUpdate = {};
    let response = "";
    if(xeroClient.response.statusCode == 200) {
        valuesToUpdate["xero-id"] = xeroClient.body.contacts[0].contactID;
        valuesToUpdate["xero-updated-date-utc"] = moment().toISOString();

        response = await C.updateEntries({
            updates: [
                {
                    value: valuesToUpdate,
                    entryId: currentEntry.recordValueId,
                    recordInternalId: "yates-leads",
                },
            ],
        });
    }

    return { xeroClient, response };
}
