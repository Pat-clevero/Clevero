async function script(C) {
    const fullNameList = ["Ivan Mejico", "Paul Abiva", "Bhuwan Bhatt", "Syuujie Yoshino"];
    
    fullNameList.forEach(async (fullName) => {
        // Get employee entry
        const filteredEmployeeData = await C.filterEntries({
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
        if (employeeEntries.length <= 0)
            throw new Error(`No related employee matches for ${fullName}.`);
        const employeeId = employeeEntries[0].recordValueId;
        const employeeEmail = employeeEntries[0].email;

        // Get timesheets assigned to employee for previous day
        const lastMondayDate = moment().subtract(1, "week").startOf("isoWeek");
        const lastSundayDate = moment().subtract(1, "week").endOf("isoWeek");
        const filteredEmployeeSheets = await C.filterEntries({
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
                    [
                        {
                            subject: "10457", // field ID of "Date" on kalysys-timesheets record
                            type: "date",
                            operator: "within",
                            ignoreCase: true,
                            value: {
                                from: {
                                    relative: false,
                                    value: lastMondayDate.format("YYYY-MM-DD"), // starting date
                                },
                                to: {
                                    relative: false,
                                    value: lastSundayDate.format("YYYY-MM-DD"), // ending date
                                },
                            },
                        },
                    ],
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
            recordInternalId: "kalysys-timesheets", // *
        });
        const employeeSheets = filteredEmployeeSheets.entries;
        const totalDuration = getTotalDurationFromSheets(employeeSheets);

        C.log("\n-----------------------\n");
        C.log(
            `(${fullName}) SHEETS DATE: `,
            `${lastMondayDate.format("YYYY-MM-DD")} - ${lastSundayDate.format(
                "YYYY-MM-DD"
            )}`
        );
        C.log(`(${fullName}) SHEETS: `, employeeSheets);
        C.log(`(${fullName}) LENGTH: `, employeeSheets.length);
        C.log(`(${fullName}) TOTAL DURATION: `, totalDuration);
        C.log("\n-----------------------\n");

        const entryId = employeeId;
        const recordInternalId = "kalysys-timesheets";
        const lastMondayDateString = moment(lastMondayDate).format(
            "MMMM DD, YYYY"
        );
        const lastSundayDateString = moment(lastSundayDate).format(
            "MMMM DD, YYYY"
        );
        const emailInput = {
            entryId,
            recordInternalId,
            templateId: 2162355,
            subject: `Total worked hours on ${lastMondayDateString} - ${lastSundayDateString}`,
        };
        const response = await C.mergeEmailTemplate(emailInput);
        const replacements = {
            "{employee_name}": employeeEntries[0]["first-name"],
            "{timesheet_duration}": totalDuration,
            "{timesheet_count}": employeeSheets.length,
            "{attention_message}":
                totalDuration < 40
                    ? "It is advised to log 40 work hours a week."
                    : "",
            "{ecouragement_message}":
                totalDuration >= 40 ? "Keep up the excellent work!" : "",
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
            subject: `Total worked hours on ${lastMondayDateString} - ${lastSundayDateString}`,
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