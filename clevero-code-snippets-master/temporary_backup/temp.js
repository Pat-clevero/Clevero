// [SCHEDULED] Sync unsynced invoices to xero
async function(context) {
    const metaData = context.input['__metadata'],
        moment = context.utils['moment'];
    var safeJSONParse = (jsonStr, defaultVal = []) => {
            try {
                return JSON.parse(jsonStr)
            } catch (err) {
                return defaultVal
            }
        },
        getXeroTenantId = () => {
            try {
                return metaData.companySettings.xeroOrganisation.xeroId
            } catch (err) {
                throw console.log('Default xero organisation is not set in company settings'), err
            }
        };
    const {
        UPDATE_ENTRY,
        GET_ENTRIES,
        XERO_UPSERT
    } = context.actions;
    context = metaData.triggerInputs.entry;
    if (context) {
        var customerId = safeJSONParse(context.customer)[0];
        if (customerId) {
            var [contact] = await GET_ENTRIES({
                recordId: 659712,
                entryIds: [customerId],
                responseType: 'iov'
            }), xeroContactEntryData = {
                contactID: contact['xero-id'],
                name: contact['trading-name'],
                emailAddress: contact.email
            }, xeroContactEntryData = {
                recordId: contact.recordId,
                entryId: contact.recordValueId,
                xeroTenantId: getXeroTenantId(),
                xeroDetails: {
                    correspondingRecordType: 'contact'
                },
                xeroEntryData: xeroContactEntryData
            }, xeroContactEntryData = (await XERO_UPSERT(xeroContactEntryData)).data.xero.contacts[0], [
                [contact], xeroContactEntryData, [customerId]
            ] = (await UPDATE_ENTRY({
                recordId: contact.recordId,
                entryId: contact.recordValueId,
                mapInternalIdToFieldId: !0,
                values: {
                    'xero-id': xeroContactEntryData.contactID,
                    'xero-updated-date-utc': new Date(xeroContactEntryData.updatedDateUTC).toISOString()
                }
            }), console.log('Success after contact sync!'), await Promise.all([GET_ENTRIES({
                recordId: 659712,
                entryIds: [customerId],
                responseType: 'iov'
            }), GET_ENTRIES({
                recordId: 34144,
                responseType: 'iov',
                fetchAllEntries: !0
            }), GET_ENTRIES({
                recordId: 648221,
                entryIds: [safeJSONParse(context.proposal)[0]],
                responseType: 'iv'
            })])), xeroContactEntryData = xeroContactEntryData[0]['xero-id'], safeJSONParse = +safeJSONParse(context['invoice-type'])[0];
            let status;
            status = 652573 == safeJSONParse || 743606 == safeJSONParse ? 'AUTHORISED' : 'DRAFT';
            safeJSONParse = {
                invoiceNumber: context['invoice-number'] || context.autoId,
                invoiceID: void 0,
                type: 'ACCREC',
                contact: {
                    contactID: contact['xero-id']
                },
                dueDate: moment(context['due-date'] || void 0).format('YYYY-MM-DD'),
                date: moment(context.date || void 0).format('YYYY-MM-DD'),
                lineAmountTypes: 'Exclusive',
                currencyCode: 'AUD',
                status: status,
                lineItems: [{
                    description: `Audit Wise Group ${customerId['audit-type']} Audit`,
                    quantity: 1,
                    unitAmount: context.subtotal,
                    accountCode: '200',
                    taxType: 'OUTPUT'
                }],
                reference: context.reference,
                brandingThemeID: xeroContactEntryData
            }, contact = (await XERO_UPSERT({
                recordId: context.recordId,
                entryId: context.recordValueId,
                xeroTenantId: getXeroTenantId(),
                xeroDetails: {
                    correspondingRecordType: 'invoice'
                },
                xeroEntryData: safeJSONParse
            })).data.xero.invoices[0];
            return console.log('Success after invoice sync!'), UPDATE_ENTRY({
                recordId: context.recordId,
                entryId: context.recordValueId,
                mapInternalIdToFieldId: !0,
                values: {
                    'xero-id': contact.invoiceID,
                    'xero-updated-date-utc': new Date(contact.updatedDateUTC).toISOString(),
                    'in-xero': !0
                }
            })
        }
    }
}