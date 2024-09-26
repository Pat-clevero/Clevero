async function script(C) {
    const jobStatus = {
        invoice_sent: 300308780,
        deposit_sent: 300308777,
        invoice_paid: 300308781,
        deposit_paid: 300308778,
    };
    const jobsWithInvoiceOrDepositSent = await C.getEntries({
        recordInternalId: "jobs",
        ignoreLimits: true,
        loadAssociations: true,
        associations: [
            {
                internalId: "invoices",
                responseType: "iov",
            },
        ],
        filter: [
            {
                subject: "2708638-status",
                requestType: "i",
                type: "array",
                operator: "any_of",
                ignoreCase: true,
                value: [
                    jobStatus.invoice_sent,
                    jobStatus.deposit_sent
                ],
            },
        ],
    });
    C.addJsonToSummary({ jobsWithInvoiceOrDepositSent });

    const updates = [];
    jobsWithInvoiceOrDepositSent
        .entries
        .forEach(async (job) => {
            const invoicePaidStatus = 34130;
            const finalInvoicesWithPaidStatus = job.associations
                .invoices
                .filter((invoice) =>
                    invoice.status == invoicePaidStatus &&
                    invoice["2708638-final-invoice"] === true);
            // C.addJsonToSummary({ finalInvoicesWithPaidStatus });
            if (finalInvoicesWithPaidStatus.length >= 1)
                updates.push({
                    value: {
                        "2708638-status":
                            job["2708638-status"] == jobStatus.invoice_sent
                                ? jobStatus.invoice_paid
                                : job["2708638-status"] == jobStatus.deposit_sent
                                    ? jobStatus.deposit_paid
                                    : job["2708638-status"],
                    },
                    entryId: job.recordValueId,
                    recordInternalId: "jobs"
                });
        });

    C.addJsonToSummary({ updates });
    const updatesResult = await C.updateEntries({
        updates,
    });
    return { updatesResult };
}