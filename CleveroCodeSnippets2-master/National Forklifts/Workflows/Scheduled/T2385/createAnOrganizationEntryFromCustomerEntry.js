async function script(C) {
    const config = {
        testingMode: false,
        filterLimit: 5,
        entryIdToFilter: ["802692"], // test customer entry
    };
  
    let filter = [
        {
            subject: "132-linked-organisation",
            requestType: "i",
            type: "array",
            operator: "is_empty",
            ignoreCase: true,
        },
    ];

    if (
        config.testingMode &&
        config.filterLimit === 1 &&
        config.entryIdToFilter.length === 1
    ) {
        filter.push("and");
        filter.push({
            subject: "id",
            type: "number:recordValue",
            operator: "any_of",
            value: config.entryIdToFilter,
        });
    }

    let { entries: customersWithNoLinkedOrg } = await C.filterEntries({
        filter,
        limit: config.filterLimit,
        recordInternalId: "forklift-customers",
    });

    if (config.testingMode) return { customersWithNoLinkedOrg };

    const customerIds = customersWithNoLinkedOrg.map(
        (customer) => customer.recordValueId
    );

    const values = customersWithNoLinkedOrg.map((customer) => ({
        address: customer.address,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        website: customer.website,
    }));
    if (config.testingMode) C.addJsonToSummary({ values });

    let createResult, updateResult;
    try {
        createResult = await C.createEntries({
            values,
            recordInternalId: "standard-organisations",
        });

        if (createResult.failed.length > 0)
            return C.addJsonToSummary({
                "entries create failed": createResult.failed,
            });

        const createdEntryIDs = createResult.success.map((i) => i.id);

        const updates = customerIds.map((id, index) => ({
            value: {
                "132-linked-organisation": [createdEntryIDs[index]],
            },
            entryId: id,
            recordInternalId: "forklift-customers",
        }));
        updateResult = await C.updateEntries({ updates });
    } catch (error) {
        C.addJsonToSummary(error);
    }

    return { createResult, updateResult };
}
