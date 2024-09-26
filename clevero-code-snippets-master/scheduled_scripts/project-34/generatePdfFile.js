async function script(C) {
    const event = C.getEvent();
    const entryId = event.entryId;
    const recordInternalId = event.recordInternalId;

    const pdf = await C.getPdfFromGoogleDocsTemplate({
        entryId,
        recordInternalId,
        templateId: 2277000,
        generatedFileDestinationField: "1795685-attachments", // field where the generated pdf will be stored
        uuidFieldForPdfFile: "FCG Quotes Document"
    });
    return { pdf };
}