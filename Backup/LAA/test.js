async function script(C) {
    const tenantId = (await C.getCompanySettings()).xeroOrganisation.xeroId;
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

    let invoices = await C.filterEntries({
        filter: [
            {
                subject: "xero-id",
                requestType: "i",
                type: "checkbox",
                operator: "is_empty",
                ignoreCase: true,
            },
            "and",
            {
                subject: "17490",
                type: "date",
                operator: "after",
                ignoreCase: true,
                value: { relative: false, value: "2024-02-11" },
            },/*"and",
             {
                subject: "id",
                type: "number:recordValue",
                operator: "any_of",
                value: [2727378],
            },*/
        ],
        limit: 50,
        recordInternalId: "invoices",
    });

   // return {invoices}

    if (!invoices.entries.length > 0) return;

    let filteredInvoices = invoices.entries;
    let invoicesFilteredIds = [];
    _.forEach(filteredInvoices, function (o) {
        invoicesFilteredIds.push(o.recordValueId);
    });
    C.log("invoicesFilteredEntryIds-->", invoicesFilteredIds);
    let brandingThemeID = xeroBrandingThemes.entries[0]
        ? xeroBrandingThemes.entries[0]["xero-id"]
        : undefined;

    for (let i = 0; i < filteredInvoices.length; i++) {
        let currentEntry = filteredInvoices[i];
        if (
            !currentEntry["122601-guest"] ||
            !currentEntry["122601-guest"].length
        ) {
            continue;
        }

        const guest = currentEntry["122601-guest"][0];

        const contact = await C.getEntry({
            recordInternalId: "life-guests",
            entryId: guest,
        });
        // C.log("contact-->", contact);
        let xeroUpdatedContactInfoContact;
        if (!contact["xero-id"]) {
            C.log("Guest doesnt have xero id, Needs to sync it across xero");

            const xeroContactEntryData = {
                contactID: contact["xero-id"] || undefined,
                name: contact["full-name"],
                emailAddress: contact["email"],
            };
            //  C.log("xeroContactEntryData",xeroContactEntryData);

            const xeroContactResponse = await C.xeroUpsert({
                recordId: contact.recordId,
                entryId: contact.recordValueId,
                xeroTenantId: tenantId,
                correspondingRecordType: "contact",
                xeroEntryData: xeroContactEntryData,
            });
            C.log("Success on contact sync");

            const xeroUpdatedContactInfo = xeroContactResponse.body.contacts[0];
            xeroUpdatedContactInfoContact = xeroUpdatedContactInfo.contactID;

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
                        recordInternalId: "life-guests",
                    },
                ],
                options: {
                    // throwOnUpdateError: true,
                    returnRecordInfo: true,
                },
            });
        }

        if (currentEntry["branding-theme-id"]) {
            const brandingTheme = await C.getEntry({
                recordInternalId: "xero-branding-themes",
                entryIds: [currentEntry["branding-theme-id"][0]],
            });

            brandingThemeID = brandingTheme[0]["xero-id"];
        }

        const invoiceDetails = await C.getEntry({
            recordInternalId: "invoices",
            entryId: currentEntry.recordValueId,
            loadSubrecords: true,
            subrecords: [
                {
                    internalId: "xero-order-items",
                    responseType: "iov",
                },
            ],
        });
        // C.log("invoiceDetails-->",invoiceDetails);
        //return
        const lineItemsData = invoiceDetails.subrecords["xero-order-items"];

        const linkedBooking = currentEntry["122601-booking"][0];

        const linkedBookingDetails = await C.getEntry({
            recordInternalId: "life-bookings",
            entryId: linkedBooking,
        });

        const linkedTour = linkedBookingDetails.tour[0];
        const tourDetails = await C.getEntry({
            recordInternalId: "life-tours",
            entryId: linkedTour,
        });
        const linkedProduct = tourDetails.product[0];
        const linkedProductDetails = await C.getEntry({
            recordInternalId: "life-products",
            entryId: linkedProduct,
        });

        const tourCode = linkedProductDetails["item-code"];
        //  C.log("tourCode-->",tourCode)
        const area = tourDetails.area[0];
        const areaDetails = await C.getEntry({
            recordInternalId: "laa-area-131-1623909515076",
            entryId: area,
        });

        const areaAdminCode = areaDetails["122601-admin-code"]
            ? areaDetails["122601-admin-code"]
            : "";

        const getLineItems = async () => {
            return await Promise.all(
                lineItemsData.map(async (item) => {
                    /* const itemId = (item.item && item.item[0]) || null;
                 const [itemEntry] =
                     itemId &&
                     (await C.getEntry({
                         recordInternalId: "xero-items",
                         entryIds: [+itemId],
                     }));*/
                    const accountId =
                        (item.account && item.account[0]) || "200";
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

                    return {
                        description: item.description || "test",
                        quantity: item.quantity,
                        unitAmount: item.rate,
                        //taxAmount: item.tax,
                        // itemCode: itemEntry.name || null,
                        taxType:
                            taxRateValue["xero-id"].toString() ||
                            taxRateValue.code.toString() ||
                            null,
                        //accountCode: itemAccount.name,

                        accountCode: itemAccount.code.toString(),
                        tracking: [
                            {
                                trackingCategoryID:
                                    "648454e8-3c06-4bdb-a24a-baac643d8c0b",
                                option: `${tourCode}`,
                            },
                            {
                                trackingCategoryID:
                                    "85d2d4a7-9f7d-4541-b139-4c35993f0f4c",
                                option: `${areaAdminCode}`,
                            },
                        ],
                    };
                })
            );
        };
        const lineItemFinal = await getLineItems();
        //  C.log("lineItemFinal", lineItemFinal);

        const invoiceData = {
            invoiceNumber: currentEntry["invoice-number"] || null,
            invoiceID: currentEntry["xero-id"] || undefined,
            type: "ACCREC",
            contact: {
                contactID: contact["xero-id"]
                    ? contact["xero-id"]
                    : xeroUpdatedContactInfoContact,
            },
            dueDate: C.moment(currentEntry["due-date"] || undefined).format(
                "YYYY-MM-DD"
            ),
            date: C.moment(currentEntry["date-issued"] || undefined).format(
                "YYYY-MM-DD"
            ),
            lineAmountTypes: "Exclusive",
            currencyCode: "AUD",
            status: "AUTHORISED",
            lineItems: await getLineItems(),
            reference: currentEntry.reference,
           // brandingThemeID: brandingThemeID,
        };
        //  return {invoiceData}
        C.log("invoiceData", invoiceData);
        // return

        try {
            const xeroInvoiceResponse = await C.xeroUpsert({
                recordId: currentEntry.recordId,
                entryId: currentEntry.recordValueId,
                xeroTenantId: tenantId,
                correspondingRecordType: "invoice",
                xeroEntryData: invoiceData,
            });

            // C.log("xeroInvoiceResponse-->", xeroInvoiceResponse);

            const xeroInvoiceUpdatedInfo = xeroInvoiceResponse.body.invoices[0];

            await C.updateEntries({
                updates: [
                    {
                        value: {
                            "xero-id": xeroInvoiceUpdatedInfo.invoiceID,
                            "xero-updated-date-utc": new Date(
                                xeroInvoiceUpdatedInfo.updatedDateUTC
                            ).toISOString(),
                            "quick-link": `go.xero.com/app/!K9Rtd/invoicing/view/${xeroInvoiceUpdatedInfo.invoiceID}`,
                            // "invoice-number": xeroInvoiceUpdatedInfo.invoiceNumber,
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
        } catch (error) {
            // Handle the error, if needed
            C.log(`Error in iteration ${i + 1}:`, error);
        }
    }
}
