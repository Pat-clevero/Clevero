async function script(C) {
    const currentStatusValue = (invoiceType) =>
        652573 == invoiceType || 743606 == invoiceType ? "AUTHORISED" : "DRAFT";

    let tenantId = (await C.getCompanySettings()).xeroOrganisation.xeroId;
    if (!tenantId)
        throw "Default xero organisation is not set in company settings";

    const currentEntry = await C.getCurrentEntry({
        loadSubrecords: true,
        subrecords: [
            {
                internalId: "xero-order-items",
                responseType: "iov",
            },
        ],
    });

    const customerId = currentEntry.customer[0];
    if (!customerId) throw "No Customer/Provider associated with the invoice";

    const contact = await C.getEntry({
        recordInternalId: "awg-providers",
        entryId: customerId,
    });

    let xeroUpdatedContactInfo, updateContactResponse, xeroContactResponse;
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
            correspondingRecordType: 'contact',
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
    C.addJsonToSummary({ xeroUpdatedContactInfo, updateContactResponse });

    const proposalId = currentEntry.proposal[0];
    const proposal = proposalId
        ? await C.getEntry({
            recordInternalId: "awg-proposals",
            entryId: proposalId,
        })
        : undefined;
    const xeroBrandingThemes = await C.getEntries({
        recordInternalId: "xero-branding-themes",
        ignoreLimits: true,
        filter: [],
    });
    let brandingThemeID = xeroBrandingThemes.entries[0]
        ? xeroBrandingThemes.entries[0]["xero-id"]
        : undefined;

    const invoiceData = {
        invoiceNumber: currentEntry["invoice-number"] || currentEntry.autoId,
        invoiceID: void 0,
        type: "ACCREC",
        contact: {
            contactID: contact["xero-id"] || xeroUpdatedContactInfo.contactID,
        },
        dueDate: moment(currentEntry["due-date"] || undefined).format(
            "YYYY-MM-DD"
        ),
        date: moment(currentEntry.date || undefined).format("YYYY-MM-DD"),
        lineAmountTypes: "Exclusive",
        currencyCode: "AUD",
        status: currentStatusValue(currentEntry["invoice-type"]),
        lineItems: [
            {
                description: `Audit Wise Group ${(proposal || {})["audit-type"]
                    } Audit`,
                quantity: 1,
                unitAmount: currentEntry.subtotal,
                accountCode: "200",
                taxType: "OUTPUT",
            },
        ],
        reference: currentEntry.reference || "",
        brandingThemeID: brandingThemeID,
    };
    C.log("invoiceData-->", invoiceData);

    const xeroInvoiceResponse = await C.xeroUpsert({
        recordId: currentEntry.recordId,
        entryId: currentEntry.recordValueId,
        xeroTenantId: tenantId,
        correspondingRecordType: "invoice",
        xeroEntryData: invoiceData,
    });
    C.log("xeroInvoiceResponse-->", xeroInvoiceResponse);
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
    C.log("Success after invoice sync!");

    return {
        xeroContactResponse,
        updateContactResponse,
        xeroInvoiceResponse,
        updateInvoiceResponse,
    };
}