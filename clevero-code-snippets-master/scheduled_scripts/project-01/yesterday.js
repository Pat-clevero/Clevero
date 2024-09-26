async function script(C) {
    const fullNameList = ["Ivan Mejico", "Paul Abiva", "Bhuwan Bhatt", "Syuujie Yoshino"];

    fullNameList.forEach(async (fullName) => {
        // Get employee entry
        let filteredEmployeeData = await C.filterEntries({
            filter: [
                {
                    subject: "388", // Full name field ID
                    type: "text",
                    operator: "equals",
                    ignoreCase: true,
                    value: fullName,
                },
            ],
            recordInternalId: "employees",
        });
        const employeeEntries = filteredEmployeeData.entries;
        if (filteredEmployeeData.totalMatchedEntries <= 0)
            throw new Error(`No related employee matches for ${fullName}.`);
        let employeeId = employeeEntries[0].recordValueId;
        let employeeEmail = employeeEntries[0].email;

        // Get timesheets assigned to employee for previous day
        const filteredTimesheetData = await C.filterEntries({
            ignoreLimits: true,
            filter: [
                [
                    {
                        subject: "10459", // field ID of "Employee" on kalysys-timesheets record
                        type: "array",
                        operator: "any_of",
                        ignoreCase: true,
                        value: [
                            employeeId, // employee ID (recordValueId)
                        ],
                    },
                    "and",
                    {
                        subject: "10457",
                        type: "date",
                        operator: "equals",
                        ignoreCase: true,
                        value: {
                            relative: true,
                            value: "1",
                            type: "MINUS_DAYS",
                        },
                    },
                    "and",
                    {
                        subject: "17102",
                        type: "array",
                        operator: "none_of",
                        ignoreCase: true,
                        value: ["1686526"],
                    },
                ],
            ],
            recordInternalId: "kalysys-timesheets",
        });
        const employeeSheets = filteredTimesheetData.entries;
        const totalDuration = getTotalDurationFromSheets(employeeSheets);
        const previousDayDateString = moment().subtract(1, 'days').format('MMMM DD, YYYY');
        C.log("\n-----------------------\n");
        C.log(`(${fullName}) SHEETS DATE: `, previousDayDateString);
        C.log(`(${fullName}) SHEETS: `, employeeSheets);
        C.log(`(${fullName}) LENGTH: `, employeeSheets.length);
        C.log(`(${fullName}) TOTAL DURATION: `, totalDuration);
        C.log("\n-----------------------\n");

        const entryId = employeeId;
        const recordInternalId = "kalysys-timesheets";
        const emailInput = {
            entryId,
            recordInternalId,
            templateId: 2162325,
            subject: `Total worked hours on ${previousDayDateString}`,
        };
        const response = await C.mergeEmailTemplate(emailInput);
        const replacements = {
            "{employee_name}": employeeEntries[0]["first-name"],
            "{timesheet_duration}": totalDuration,
            "{timesheet_count}": employeeSheets.length,
            "{attention_message}": totalDuration < 8 ? "It is advised to log 8 work hours daily." : "",
            "{ecouragement_message}": totalDuration >= 8 ? "Keep up the excellent work!" : "",
        };
        const body = response.body.replace(
            /{employee_name}|{timesheet_duration}|{timesheet_count}|{attention_message}|{ecouragement_message}/g,
            (match) => replacements[match]
        );
        C.log(">>>");
        C.log(`Email sent to ${fullName} - (${employeeEmail})`);
        const emailResponse = await C.sendEmail({
            entryId,
            recordInternalId,
            from: {
                email: "notifications@mailvero.com",
                name: "Clevero Notification",
            },
            to: [employeeEmail],
            subject: `Total worked hours on ${previousDayDateString}`,
            body,
        });

        return { response, emailResponse };
    });
}

function getTotalDurationFromSheets(sheets) {
    return sheets.reduce((acc, sheet) => {
        return acc + sheet.duration;
    }, 0);
}

