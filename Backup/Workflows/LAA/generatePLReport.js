async function script(C) {
    const event = C.getEvent()
    const entryId = event.entryId;
    const recordInternalId = event.recordInternalId;
    C.log(entryId,recordInternalId)
    
    const pdf = await C.getPdfFromGoogleDocsTemplate({
        entryId,
        recordInternalId,
        templateId: 1913133,
        generatedFileDestinationField: "pl-report", // field where the generated pdf will be stored
        uuidFieldForPdfFile: "title"
    });
    return {pdf };
}


// test
async function script(C) {
    try {
        const event = C.getEvent();
        const entryId = event.entryId;
        const recordInternalId = event.recordInternalId;
        C.log(entryId, recordInternalId);
        
        const pdf = await C.getPdfFromGoogleDocsTemplate({
            entryId,
            recordInternalId,
            templateId: 1913133,
            generatedFileDestinationField: "pl-report", // field where the generated pdf will be stored
            uuidFieldForPdfFile: "title"
        });
        
        return { pdf };
    } catch (error) {
        C.log('Error generating PDF:', error);
        throw error;
    }
}
