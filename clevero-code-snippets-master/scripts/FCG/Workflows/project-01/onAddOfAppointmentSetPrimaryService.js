async function script(C) {
    const currentEntry = await C.getCurrentEntry();
    const matterType = currentEntry["1795685-matter-type"];
    const custodyType = currentEntry["1795685-custody-type"];
    const fundingType = currentEntry["1795685-funding-type"];
    const isEvidentiaryReportNeeded =
        currentEntry["1795685-evidentiary-report-needed"];
    const isViolentSexualRiskAssessment =
        currentEntry["1795685-violentsexual-risk-assessment"];

    C.addJsonToSummary({
        matterType,
        custodyType,
        fundingType,
        isEvidentiaryReportNeeded,
        isViolentSexualRiskAssessment,
    });

    const filteredServiceMappings = await C.filterEntries({
        filter: [
            {
                subject: "1795685-matter-type",
                type: "array",
                operator: "any_of",
                ignoreCase: true,
                value: matterType,
                requestType: "i",
            },
            "and",
            {
                subject: "1795685-custody-type",
                type: "array",
                operator: "any_of",
                ignoreCase: true,
                value: custodyType,
                requestType: "i",
            },
            "and",
            {
                subject: "1795685-funding-type",
                type: "array",
                operator: "any_of",
                ignoreCase: true,
                value: fundingType,
                requestType: "i",
            },
            "and",
            {
                subject: "1795685-evidentiary-report-needed",
                type: "checkbox",
                operator: !!isEvidentiaryReportNeeded ? "is_true" : "is_false",
                ignoreCase: true,
                requestType: "i",
            },
            "and",
            {
                subject: "1795685-violentsexual-risk-assessment",
                type: "checkbox",
                operator: !!isViolentSexualRiskAssessment
                    ? "is_true"
                    : "is_false",
                ignoreCase: true,
                requestType: "i",
            },
        ],
        recordInternalId: "ferrari-consulting-group-service-mappings",
    });
    const numOfFilterMatches = filteredServiceMappings.entries.length;
    if (numOfFilterMatches <= 0)
        return {
            message:
                "No Service Mapping matches the current Appointment. No Primary Service is set.",
        };

    C.log({ numOfFilterMatches });
    const primaryService = +filteredServiceMappings.entries[0][
        "1795685-default-primary-service"
    ][0];

    const itemObject = await C.getEntry({
        recordInternalId: "xero-items",
        entryId: primaryService,
    });
    const itemRate = itemObject["sales-details-unit-price"];

    const response = await C.updateEntries({
        updates: [
            {
                value: {
                    "1795685-primary-service": [primaryService],
                    "1795685-revenue": itemRate,
                },
                entryId: currentEntry.recordValueId,
                recordInternalId: "ferrari-consulting-group-appointments",
            },
        ],
    });

    return { response };
}
