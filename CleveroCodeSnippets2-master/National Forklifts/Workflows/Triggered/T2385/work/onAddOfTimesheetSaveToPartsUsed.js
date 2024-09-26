async function script(C) {
    const subrecords = [{
        internalId: "forklift-parts-used",
        responseType: "iov",
    }];
    const { timeSheet: currentEntry, job } = await C.getCurrentEntry({
        loadSubrecords: true,
        subrecords,
    }).then(async (timeSheet) => {
        let job = await C.getEntry({
            recordInternalId: "forklift-jobs",
            entryId: timeSheet.job[0],
            loadSubrecords: true,
            subrecords,
        });

        return { timeSheet, job };
    });
    const timesheet_partsUsed = currentEntry.subrecords["forklift-parts-used"];
    const job_partsUsed = job.subrecords["forklift-parts-used"];

    const buildPartUsedObj = (part, index) => ({
        "part-number": part["part-number"],
        parent: job.recordValueId,
        index: index + 1,
        description: `${part["part-number"]} - ${part.description}`,
        quantity: part.quantity,
        "tax-rate": ["129032"]
    });

    const jobPartNumbers = job_partsUsed.map(
        (job_partUsed) =>
            job_partUsed["part-number"]
    );
    const timesheetPartNumbers = timesheet_partsUsed.map(
        (timesheet_partUsed) =>
            timesheet_partUsed["part-number"]
    );
    // merge for indexing
    const mergedPartNumbers = [
        ...new Set([
            ...jobPartNumbers,
            ...timesheetPartNumbers
        ])
    ];

    const updates = [];
    const values = [];
    jobPartNumbers.forEach((partNumber) => {
        if (timesheetPartNumbers.includes(partNumber)) {
            const index = mergedPartNumbers.indexOf(partNumber);
            // get the job's existing subrecord id using part-number as key identifier
            const entryId = job_partsUsed.filter(
                (job_partUsed) =>
                    job_partUsed["part-number"] === partNumber
            )[0].recordValueId;
            // get the matching subrecord in the timesheet
            const timesheetPart = timesheet_partsUsed.filter(
                (timesheet_partUsed) =>
                    timesheet_partUsed["part-number"] === partNumber
            )[0];
            // assuming that timesheet's part subrecords is the more updated one, update the job's subrecords
            updates.push({
                value: buildPartUsedObj(timesheetPart, index),
                entryId,
                recordInternalId: "forklift-parts-used",
            });
        }
    });

    timesheetPartNumbers.forEach((partNumber) => {
        // if the timesheet's part subrecord does not exist in the job, create it
        if (!jobPartNumbers.includes(partNumber)) {
            const index = mergedPartNumbers.indexOf(partNumber);
            const result_filterTimesheetParts = timesheet_partsUsed.filter(
                (timesheet_partUsed) =>
                    timesheet_partUsed["part-number"] === partNumber
            );
            if (result_filterTimesheetParts.length > 0)
                values.push(buildPartUsedObj(result_filterTimesheetParts[0], index));
        }
    });

    C.addJsonToSummary({
        updates,
        values,
    });

    let result_updateParts;
    if (updates.length > 0) {
        result_updateParts = await C.updateEntries({ updates });
    }

    let result_createParts;
    if (values.length > 0) {
        result_createParts = await C.createEntries({
            values,
            recordInternalId: "forklift-parts-used",
        });
    }

    return {
        result_updateParts,
        result_createParts,
    };
}