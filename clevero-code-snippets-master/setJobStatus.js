async function script(C) {
    /** 
        Invoice status
        Authorised - 34129
        Paid - 34130
    **/
    const jobStatus = {
        invoice_sent: [300308780],
        deposit_sent: [300308777],
        invoice_paid: [300308781],
        deposit_paid: [300308778],
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
                value: [jobStatus.invoice_sent, jobStatus.deposit_sent],
            },
        ],
    });
    C.addJsonToSummary({
        jobsWithInvoiceOrDepositSent,
        // invoice_paid: jobStatus.invoice_paid,
        // deposit_paid: jobStatus.deposit_paid
    });

    // return;

    const updates = [];
    jobsWithInvoiceOrDepositSent.entries.forEach(async (job) => {
        try {
            // Search ALL invoices where job == currentJob
            const filteredInvoices = job.associations.invoices.filter(
                (invoice) => invoice["2708638-job"] === job.recordValueId
            );
            // const filteredInvoices = await C.filterEntries({
            //     filter: [
            //         {
            //             subject: "2708638-job",
            //             requestType: "i",
            //             type: "array",
            //             operator: "any_of",
            //             ignoreCase: true,
            //             value: [job.recordValueId],
            //         },
            //     ],
            //     recordInternalId: "invoices",
            // });
            // Check if no invoices were found
            if (!filteredInvoices || filteredInvoices.entries.length === 0) {
                return { message: "No invoices found." };
            }
            // Set Total Invoiced amount to Sum of all valid invoices
            const totalInvoicedAmount = filteredInvoices.entries.reduce(
                (agg, v) => {
                    return agg + (v.total || 0); // Ensure total is valid or fallback to 0
                },
                0
            );
            // Set Total Paid amount to Sum of all valid invoices where status == PAID
            const totalPaidAmount = filteredInvoices.entries
                .filter((v) => v.status[0] === 34130) // Only include PAID invoices
                .reduce((agg, v) => agg + (v["amount-paid"] || 0), 0); // Fallback to 0 if "amount-paid" is undefined
            const totalRemainingAmount = totalInvoicedAmount - totalPaidAmount;

            // Add the results to the summary
            C.addJsonToSummary({
                // currentEntry,
                filteredInvoices,
                totalInvoicedAmount,
                totalPaidAmount,
                totalRemainingAmount,
            });
        } catch (error) {
            C.log(`Error: ${error.message}`);
            C.addJsonToSummary({ error: error.message });
        }
        
        const invoicePaidStatus = 34130;
        const finalInvoicesWithPaidStatus = job.associations.invoices.filter(
            (invoice) =>
                invoice.status == invoicePaidStatus &&
                invoice["2708638-final-invoice"] === true
        );
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
                    // "2708638-total-invoiced-amount": totalInvoicedAmount
                    //     ? totalInvoicedAmount
                    //     : 0,
                    // "2708638-total-paid-amount": totalPaidAmount
                    //     ? totalPaidAmount
                    //     : 0,
                    // "2708638-total-remaining-amount": totalRemainingAmount
                    //     ? totalRemainingAmount
                    //     : 0,
                },
                entryId: job.recordValueId,
                recordInternalId: "jobs",
            });
    });

    C.addJsonToSummary({ updates });
    const updatesResult = await C.updateEntries({
        updates,
    });
    return { updatesResult };
}
