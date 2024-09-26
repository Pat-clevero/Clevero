async function script(C) {
    const currentEntry = await C.getCurrentEntry();
    const contact = await C.getEntry({
        recordInternalId: "contacts",
        entryId: currentEntry.contact[0],
    });

    const createEntryResponse = await C.createEntry({
        value: {
            "date-added": moment().format("YYYY-MM-DD"), // today
            "lead-owner": currentEntry.employee, // the employee from the kalysys event
            "lead-name": contact["full-name"], // the contact.full-name from the kalysys event
            contact: currentEntry.contact, // the contact from the kalysys event
            status: [96887], // "Active Prospect"
            type: [265070], // "Prospect Inbound"
            tags: [2191846] // "Self Service Scheduling"
        },
        recordInternalId: "kalysys-leads",
        options: {
            returnRecordInfo: true,
            makeAutoId: true,
        },
    });
    
    if(createEntryResponse.success.length === 0)
        throw new Error("Lead creation failed");
    else
        C.log("Lead creation successful >>> ", createEntryResponse.success[0].id);

    const updateEntryResponse = await C.updateEntries({
        updates: [
            {
                value: {
                    "linked-lead": [createEntryResponse.success[0].id],
                },
                entryId: currentEntry.recordValueId,
                recordInternalId: "kalysys-events"
            },
        ],
    });
    C.log("Meeting successfully linked to created lead.");

    return { createEntryResponse, updateEntryResponse  };
}

