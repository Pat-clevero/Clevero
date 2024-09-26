// Source and set Activity, Category, and Report Code based on the selected Course
async function handler(clev) {
    let actions = [];

    let courseSelect = clev.getValue("course");
    let courseObject = await clev.api.getEntry({
        recordId: "148796",
        responseType: "iov",
        id: courseSelect,
    });

    let courseActivity = JSON.parse(courseObject["activity"]); // "JSON.parse()" converts a string to an array
    let courseActivityId = courseObject.activity;
    let courseCategory = JSON.parse(courseObject["activity-category"]);
    let defaultReportCode = courseObject["default-report-code"]
        ? JSON.parse(courseObject["default-report-code"])
        : [];

    if (courseSelect && courseSelect.length > 0) {
        actions.push(clev.setValue("class-type", courseActivity));
        actions.push(clev.setValue("category", courseCategory));
        actions.push(clev.setValue("default-report-code", defaultReportCode));
    } else {
        actions.push(clev.setValue("class-type", []));
        actions.push(clev.setValue("category", []));
        actions.push(clev.setValue("default-report-code", []));
    }

    return clev.mergeAll(actions);
}
