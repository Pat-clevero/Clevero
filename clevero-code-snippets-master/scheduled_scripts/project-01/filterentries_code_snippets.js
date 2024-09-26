/* Search Clients where all-of Clients match the following:
*   First Name Equals Jena
*/
async function script(C) {
    const testFiltered = await C.filterEntries({
        filter: [
            {
                subject: "19229", // First Name
                type: "text",
                operator: "equals", // Equals
                ignoreCase: true,
                value: "Jena", // Jena
            },
        ],
        recordInternalId: "pritam-clients",
    });
    C.log(testFiltered);
}

// Test
async function script(C) {
    const testFiltered = await C.filterEntries({
        filter: [
            [
                {
                    "subject": "16251",
                    "type": "date",
                    "operator": "equals",
                    "ignoreCase": true,
                    "value": {
                        "relative": true,
                        "value": null,
                        "type": {
                            "type": "START_OF",
                            "ref": "this_year"
                        }
                    }
                },
                "and",
                {
                    "subject": "19229",
                    "type": "text",
                    "operator": "equals",
                    "ignoreCase": true,
                    "value": "Jena"
                }
            ]
        ],
        recordInternalId: "pritam-clients",
    });
    C.log(testFiltered);
}

// Filter timesheets that are assigned to Ivan Mejico within the starting and ending Date
async function script(C) {
    const testFiltered = await C.filterEntries({
        filter: [
            [
                {
                    "subject": "10459", // field ID of "Employee" on kalysys-timesheets record
                    "type": "array",
                    "operator": "any_of",
                    "ignoreCase": true,
                    "value": [
                        "2122170" // employee ID (recordValueId)
                    ]
                },
                "and",
                [
                    {
                        "subject": "10457", // field ID of "Date" on kalysys-timesheets record
                        "type": "date",
                        "operator": "within",
                        "ignoreCase": true,
                        "value": {
                            "from": {
                                "relative": false,
                                "value": "2023-07-17" // starting date
                            },
                            "to": {
                                "relative": false,
                                "value": "2023-07-23" // ending date
                            }
                        }
                    }
                ]
            ]
        ],
        recordInternalId: "kalysys-timesheets", // *
    });
    C.log(testFiltered);
}

// Get employee entry with "Ivan Mejico" as Full name
async function script(C) {
    const testFiltered = await C.filterEntries({
        filter: [
            {
                subject: "388", // field ID of "First name" on employees record 
                type: "text",
                operator: "equals",
                ignoreCase: true,
                value: "Ivan Mejico", // value of First name
            },
        ],
        recordInternalId: "kalysys-timesheets", // *
    });
    C.log(testFiltered);
}

// Get all timesheets worked on the previous day by Ivan Mejico
async function script(C) {
    const testFiltered = await C.filterEntries({
        filter: [
            [
                {
                    "subject": "10459", // field ID of "Employee" on kalysys-timesheets record
                    "type": "array",
                    "operator": "any_of",
                    "ignoreCase": true,
                    "value": [
                        "2122170" // employee ID (recordValueId)
                    ]
                },
                "and",
                {
                    "subject": "10457",
                    "type": "date",
                    "operator": "equals",
                    "ignoreCase": true,
                    "value": {
                        "relative": true,
                        "value": "1",
                        "type": "MINUS_DAYS"
                    }
                }
            ]
        ],
        recordInternalId: "kalysys-timesheets", // *
    });
    C.log(testFiltered);
}