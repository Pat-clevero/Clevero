async function script(C) {
    currentEntry = await C.getCurrentEntry({
        loadSubrecords: true,
        subrecords: [
            {
                internalId: "xero-order-items",
                responseType: "iov",
            },
        ],
    });

    let tenantId = (await C.getCompanySettings()).xeroOrganisation.xeroId;
    if (!tenantId) {
        throw "Default xero organisation is not set in company settings";
    }
    const [
        xeroTaxRates,
        xeroBrandingThemes,
        xeroCurrencies,
        xeroLineAmountTypes,
        xeroInvoiceTypes,
        xeroInvoiceStatusCodes,
        xeroAccounts,
    ] = await Promise.all([
        C.getEntries({
            recordInternalId: "xero-tax-rates",
            ignoreLimits: true,
            filter: [],
        }),
        C.getEntries({
            recordInternalId: "xero-branding-themes",
            ignoreLimits: true,
            filter: [],
        }),
        C.getEntries({
            recordInternalId: "xero-currencies",
            ignoreLimits: true,
            filter: [],
        }),
        C.getEntries({
            recordInternalId: "xero-line-amount-types-131-1596167634161",
            ignoreLimits: true,
            filter: [],
        }),
        C.getEntries({
            recordInternalId: "xero-invoice-types-131-1596167577672",
            ignoreLimits: true,
            filter: [],
        }),
        C.getEntries({
            recordInternalId: "xero-invoice-status-codes-131-1596167673522",
            ignoreLimits: true,
            filter: [],
        }),
        C.getEntries({
            recordInternalId: "accounts",
            ignoreLimits: true,
            filter: [],
        }),
    ]);

    let brandingThemeID = xeroBrandingThemes.entries[0]
        ? xeroBrandingThemes.entries[0]["xero-id"]
        : undefined;
        
    if (
        !currentEntry["1918262-clinic"] ||
        !currentEntry["1918262-clinic"].length
    ) {
        throw "No client associated with the invoice";
    }
    const client = currentEntry["1918262-clinic"][0];

    const contact = await C.getEntry({
        recordInternalId: "standard-organisations",
        entryId: client,
    });

    const xeroContactEntryData = {
        contactID: contact["xero-id"],
        name: contact["name"],
        emailAddress: contact["email"],
    };
    if(contact && contact["xero-id"].length == 0){
        const xeroContactResponse = await C.xeroUpsert({
            recordId: contact.recordId,
            entryId: contact.recordValueId,
            xeroTenantId: tenantId,
            correspondingRecordType: "contact",
            xeroEntryData: xeroContactEntryData,
        });
    
        const xeroUpdatedContactInfo = xeroContactResponse.body.contacts[0];
    
    
        await C.updateEntries({
            updates: [
                {
                    value: {
                        "xero-id": xeroUpdatedContactInfo.contactID,
                        "xero-updated-date-utc": new Date(
                            xeroUpdatedContactInfo.updatedDateUTC
                        ).toISOString(),
                    },
                    entryId: contact.recordValueId,
                    recordInternalId: "standard-organisations",
                },
            ],
            options: {
                // throwOnUpdateError: true,
                returnRecordInfo: true,
            },
        });
    }
    C.addJsonToSummary(contact["xero-id"]);

    if (currentEntry["branding-theme-id"]) {
        const brandingTheme = await C.getEntry({
            recordInternalId: "xero-branding-themes",
            entryIds: [currentEntry["branding-theme-id"][0]],
        });

        brandingThemeID = brandingTheme[0]["xero-id"];
    }

    const lineItemsData = currentEntry.subrecords["xero-order-items"];

    //  return {brandingThemeID,lineItemsData}

    const getLineItems = async () => {
        return await Promise.all(
            lineItemsData.map(async (item) => {
                let itemId = (item["1918262-appointment"] && item["1918262-appointment"][0]) || null;
                // const [itemEntry] =
                //     itemId &&
                //     (await C.getEntry({
                //         recordInternalId: "xero-items",
                //         entryIds: [+itemId],
                //     }));
                const accountId = (item.account && item.account[0]) || "200";
                const [itemAccount] =
                    accountId &&
                    (await C.getEntry({
                        recordInternalId: "accounts",
                        entryIds: [+accountId],
                    }));
                const taxRate = item["tax-rate"][0] || null;
                const [taxRateValue] =
                    taxRate &&
                    (await C.getEntry({
                        recordInternalId: "xero-tax-rates",
                        entryIds: [+taxRate],
                    }));

             /*    const category = item["1662670-category"][0] || null;
               const [categoryValue] =
                    category &&
                    (await C.getEntry({
                        recordInternalId: "xero-category-options",
                        entryIds: [+category],
                    }));
               */

                return {
                    description: item.description || "test",
                    quantity: item.quantity,
                    discountRate:item.discount || 0,
                    unitAmount: item.rate,
                    //taxAmount: item.tax,
                    taxType:
                        taxRateValue["xero-id"].toString() ||
                        taxRateValue.code.toString() ||
                        null,
                    accountCode: itemAccount.code.toString(),
                 

                    // department:categoryValue.name.toString()|| null
                };
            })
        );
    };

     let XeroStatus = currentEntry["status"][0];
    
      function currentStatusValue(XeroStatus) {
        switch (XeroStatus) {
            case +34126: //DRAFT
                return "DRAFT";
            case +34127: // SUBMITTED
                return "SUBMITTED";
            case +34128: //DELETED
                return "DELETED";
            case +34129: // AUTHORISED
                return "AUTHORISED";
            case +34130: // PAID
                return "PAID";
            case +34131: // VOIDED
                return "VOIDED";

            default:
                return;
        }
    }
    
    const invoiceData = {
      //  invoiceNumber: currentEntry["invoice-number"] || null,
        invoiceID: currentEntry["xero-id"] || undefined,
        type: "ACCREC",
        contact: {
            contactID: contact["xero-id"] || xeroUpdatedContactInfo.contactID,
        },
        dueDate: moment(currentEntry["due-date"] || undefined).format(
            "YYYY-MM-DD"
        ),
        date: moment(currentEntry["date-issued"] || undefined).format(
            "YYYY-MM-DD"
        ),
        lineAmountTypes: "Exclusive",
        currencyCode: "AUD",
        status: currentStatusValue(XeroStatus), 
        lineItems: await getLineItems(),
        reference: currentEntry.reference?currentEntry.reference:"",
        brandingThemeID: brandingThemeID,
    };

   //  return { invoiceData };

      C.log("invoiceData-->",invoiceData)

    const xeroInvoiceResponse = await C.xeroUpsert({
        recordId: currentEntry.recordId,
        entryId: currentEntry.recordValueId,
        xeroTenantId: tenantId,
        correspondingRecordType: "invoice",
        xeroEntryData: invoiceData,
    });

    C.log("xeroInvoiceResponse-->", xeroInvoiceResponse);

    const xeroInvoiceUpdatedInfo = xeroInvoiceResponse.body.invoices[0];

    await C.updateEntries({
        updates: [
            {
                value: {
                    "xero-id": xeroInvoiceUpdatedInfo.invoiceID,
                    "xero-updated-date-utc": new Date(
                        xeroInvoiceUpdatedInfo.updatedDateUTC
                    ).toISOString(),
                    "invoice-number": xeroInvoiceUpdatedInfo.invoiceNumber,
                },
                entryId: currentEntry.recordValueId,
                recordInternalId: "invoices",
            },
        ],
        options: {
            // throwOnUpdateError: true,
            returnRecordInfo: true,
        },
    });

    C.log("Success after invoice sync!");

    return;
}

