async function script(C) {
    const filteredEntries = await C.filterEntries({
        filter: [
            [
                {
                    requestType: "i",
                    subject: "in-xero",
                    type: "checkbox",
                    operator: "is_false",
                    ignoreCase: true,
                },
                "or",
                {
                    requestType: "i",
                    subject: "in-xero",
                    type: "checkbox",
                    operator: "is_empty",
                    ignoreCase: true,
                },
            ],
            "and",
            [
                {
                    requestType: "i",
                    subject: "xero-id",
                    type: "text",
                    operator: "is_empty",
                    ignoreCase: true,
                },
                "or",
                {
                    requestType: "i",
                    subject: "xero-id",
                    type: "text",
                    operator: "equals",
                    value: "",
                    ignoreCase: true,
                }
            ],
            "and",
            {
                requestType: "i",
                subject: "status",
                type: "array",
                operator: "none_of",
                ignoreCase: true,
                value: ["34130"], // PAID
            },
            // FOR TESTING
            // {
            //     subject: "13672",
            //     type: "array",
            //     operator: "any_of",
            //     ignoreCase: true,
            //     value: ["1212376"],
            // },
        ],
        recordInternalId: "awg-invoices",
    });
    const unsyncedInvoices = filteredEntries.entries;

    // FOR TESTING
    // const invoice = await C.getEntry({
    //     recordInternalId: "awg-invoices",
    //     entryId: 2364088,
    // });
    // const unsyncedInvoices = [ invoice ];

    const currentStatusValue = (invoiceType) =>
        652573 == invoiceType || 743606 == invoiceType ? "AUTHORISED" : "DRAFT";

    let tenantId = (await C.getCompanySettings()).xeroOrganisation.xeroId;
    if (!tenantId)
        throw "Default xero organisation is not set in company settings";

    const response = await Promise.all(
        unsyncedInvoices.map(async (invoice) => {
            const currentEntry = invoice;
            const customerId = currentEntry.customer[0];
            if (!customerId) return;

            const contact = await C.getEntry({
                recordInternalId: "awg-providers",
                entryId: customerId,
            });

            let xeroUpdatedContactInfo,
                updateContactResponse,
                xeroContactResponse;

            if (contact && !contact["xero-id"]) {
                const xeroContactEntryData = {
                    contactID: contact["xero-id"],
                    name: contact["name"],
                    emailAddress: contact["email"],
                };

                xeroContactResponse = await C.xeroUpsert({
                    recordId: contact.recordId,
                    entryId: contact.recordValueId,
                    xeroTenantId: tenantId,
                    correspondingRecordType: "contact",
                    xeroEntryData: xeroContactEntryData,
                });
                xeroUpdatedContactInfo = xeroContactResponse.body.contacts[0];

                updateContactResponse = await C.updateEntries({
                    updates: [
                        {
                            value: {
                                "xero-id": xeroUpdatedContactInfo.contactID,
                                "xero-updated-date-utc": new Date(
                                    xeroUpdatedContactInfo.updatedDateUTC
                                ).toISOString(),
                            },
                            entryId: contact.recordValueId,
                            recordInternalId: "awg-providers",
                        },
                    ],
                    options: {
                        // throwOnUpdateError: true,
                        returnRecordInfo: true,
                    },
                });
            }

            const proposalId = currentEntry.proposal[0];
            const proposal = proposalId
                ? await C.getEntry({
                      recordInternalId: "awg-proposals",
                      entryId: proposalId,
                  })
                : undefined;
            const auditTypeId = proposal
                ? proposal["audit-type"][0]
                : undefined;
            let auditType = undefined;
            if (auditTypeId) {
                const getAuditTypeResult = await C.getEntry({
                    recordInternalId: "awg-audit-types",
                    entryId: auditTypeId,
                });
                auditType = getAuditTypeResult
                    ? getAuditTypeResult.name
                    : undefined;
            }

            const xeroBrandingThemes = await C.getEntries({
                recordInternalId: "xero-branding-themes",
                ignoreLimits: true,
                filter: [],
            });
            let brandingThemeID = xeroBrandingThemes.entries[0]
                ? xeroBrandingThemes.entries[0]["xero-id"]
                : undefined;

            const invoiceData = {
                invoiceNumber:
                    currentEntry["invoice-number"] || currentEntry.autoId,
                invoiceID: void 0,
                type: "ACCREC",
                contact: {
                    contactID:
                        contact["xero-id"] || xeroUpdatedContactInfo.contactID,
                },
                dueDate: moment(currentEntry["due-date"] || undefined).format(
                    "YYYY-MM-DD"
                ),
                date: moment(currentEntry.date || undefined).format(
                    "YYYY-MM-DD"
                ),
                lineAmountTypes: "Exclusive",
                currencyCode: "AUD",
                status: currentStatusValue(currentEntry["invoice-type"]),
                lineItems: [
                    {
                        description: `Audit Wise Group ${auditType} Audit`,
                        quantity: 1,
                        unitAmount: currentEntry.subtotal,
                        accountCode: "200",
                        taxType: "OUTPUT",
                    },
                ],
                reference: currentEntry.reference || "",
                brandingThemeID: brandingThemeID,
            };
            // C.log("invoiceData-->", invoiceData);

            const xeroInvoiceResponse = await C.xeroUpsert({
                recordId: currentEntry.recordId,
                entryId: currentEntry.recordValueId,
                xeroTenantId: tenantId,
                correspondingRecordType: "invoice",
                xeroEntryData: invoiceData,
            });
            // C.log("xeroInvoiceResponse-->", xeroInvoiceResponse);
            const xeroInvoiceUpdatedInfo = xeroInvoiceResponse.body.invoices[0];

            const updateInvoiceResponse = await C.updateEntries({
                updates: [
                    {
                        value: {
                            "xero-id": xeroInvoiceUpdatedInfo.invoiceID,
                            "xero-updated-date-utc": new Date(
                                xeroInvoiceUpdatedInfo.updatedDateUTC
                            ).toISOString(),
                            "in-xero": true,
                        },
                        entryId: currentEntry.recordValueId,
                        recordInternalId: "awg-invoices",
                    },
                ],
                options: {
                    // throwOnUpdateError: true,
                    returnRecordInfo: true,
                },
            });
            C.log(`Success after invoice sync! Invoice ID: ${currentEntry.recordValueId}`);

            return {
                xeroContactResponse,
                updateContactResponse,
                xeroInvoiceResponse,
                updateInvoiceResponse,
            };
        })
    );

    return response;
}