// Sync invoice to xero
async function(context) {
    const metaData = context.input['__metadata'],
        moment = context.utils['moment'],
        safeJSONParse = (jsonStr, defaultVal = []) => {
            try {
                return JSON.parse(jsonStr)
            } catch (err) {
                return defaultVal
            }
        };
    var getXeroTenantId = () => {
        try {
            return metaData.companySettings.xeroOrganisation.xeroId
        } catch (err) {
            throw console.log('Default xero organisation is not set in company settings'), err
        }
    };
    const {
        GET_ENTRIES,
        XERO_UPSERT,
        UPDATE_ENTRY
    } = context.actions, [, , xeroCurrencies, xeroBrandingThemes] = await Promise.all([await GET_ENTRIES({
        recordId: 34148,
        responseType: 'iov',
        fetchAllEntries: !0
    }), await GET_ENTRIES({
        recordId: 3953,
        responseType: 'iov',
        fetchAllEntries: !0
    }), await GET_ENTRIES({
        recordId: 34136,
        responseType: 'iov',
        fetchAllEntries: !0
    }), await GET_ENTRIES({
        recordId: 34144,
        responseType: 'iov',
        fetchAllEntries: !0
    }), await GET_ENTRIES({
        recordId: 34132,
        responseType: 'iov',
        fetchAllEntries: !0
    })]), currentInvoice = metaData.triggerInputs.triggerEntryDetail;
    context = safeJSONParse(currentInvoice.customer)[0];
    if (context) {
        var [contact] = await GET_ENTRIES({
            recordId: 659712,
            entryIds: [context],
            responseType: 'iov'
        }), [contact] = (contact['xero-id'] || (xeroContactEntryData = {
            contactID: void 0,
            name: contact['trading-name'],
            emailAddress: contact.email
        }, xeroContactEntryData = (await XERO_UPSERT({
            recordId: contact.recordId,
            entryId: contact.recordValueId,
            xeroTenantId: getXeroTenantId(),
            xeroDetails: {
                correspondingRecordType: 'contact'
            },
            xeroEntryData: xeroContactEntryData
        })).data.xero.contacts[0], await UPDATE_ENTRY({
            recordId: contact.recordId,
            entryId: contact.recordValueId,
            mapInternalIdToFieldId: !0,
            values: {
                'xero-id': xeroContactEntryData.contactID,
                'xero-updated-date-utc': new Date(xeroContactEntryData.updatedDateUTC).toISOString()
            }
        }), console.log('Success after contact sync!')), await GET_ENTRIES({
            recordId: 659712,
            entryIds: [context],
            responseType: 'iov'
        }));
        const lineAmountTypes = metaData.loadedEntries['xero-line-amount-types'],
            xeroInvoiceStatusCodes = metaData.loadedEntries['xero-invoice-status-codes'];
        var xeroContactEntryData = lineAmountTypes.find(lt => lt.recordValueId === +safeJSONParse(currentInvoice['line-amount-types'])[0]) || {},
            context = xeroCurrencies.find(c => c.recordValueId === +safeJSONParse(currentInvoice.currency)[0]) || {},
            invoiceStatus = xeroInvoiceStatusCodes.find(s => s.recordValueId === +safeJSONParse(currentInvoice.status)[0]) || {},
            brandingThemeID = (xeroBrandingThemes.find(b => b.recordValueId === +safeJSONParse(currentInvoice['branding-theme-id'])[0]) || {})['xero-id'],
            context = context.code,
            [proposal] = await GET_ENTRIES({
                recordId: 648221,
                entryIds: [safeJSONParse(currentInvoice.proposal)[0]],
                responseType: 'iv'
            }),
            contact = {
                invoiceNumber: currentInvoice['invoice-number'] || currentInvoice.autoId,
                invoiceID: void 0,
                type: 'ACCREC',
                contact: {
                    contactID: contact['xero-id']
                },
                dueDate: moment(currentInvoice['due-date'] || void 0).format('YYYY-MM-DD'),
                date: moment(currentInvoice.date || void 0).format('YYYY-MM-DD'),
                lineAmountTypes: xeroContactEntryData.value || 'Exclusive',
                currencyCode: context || 'AUD',
                status: invoiceStatus.value || 'DRAFT',
                lineItems: [{
                    description: `Audit Wise Group ${proposal['audit-type']} Audit`,
                    quantity: 1,
                    unitAmount: currentInvoice.subtotal,
                    accountCode: '200',
                    taxType: 'OUTPUT'
                }],
                reference: currentInvoice.reference,
                brandingThemeID: brandingThemeID
            },
            xeroContactEntryData = (console.log('invoiceData: ', contact), await XERO_UPSERT({
                recordId: currentInvoice.recordId,
                entryId: currentInvoice.recordValueId,
                xeroTenantId: getXeroTenantId(),
                xeroDetails: {
                    correspondingRecordType: 'invoice'
                },
                xeroEntryData: contact
            })),
            context = xeroContactEntryData.data.xero.invoices[0],
            invoiceStatus = await UPDATE_ENTRY({
                recordId: currentInvoice.recordId,
                entryId: currentInvoice.recordValueId,
                mapInternalIdToFieldId: !0,
                values: {
                    'xero-id': context.invoiceID,
                    'xero-updated-date-utc': new Date(context.updatedDateUTC).toISOString()
                }
            });
        return console.log('Success after invoice sync!'), {
            updatedInvoice: invoiceStatus
        }
    }
}