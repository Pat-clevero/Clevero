async function handler(clev) {
    let actions = [];

    let courseSelect = clev.getValue("course");
    if (courseSelect && courseSelect.length > 0) {
        let courseObject = await clev.api.getEntry({
            recordId: "148796",
            responseType: "iov",
            id: courseSelect,
        });

        let courseActivity = JSON.parse(courseObject["activity"]); // "JSON.parse()" converts a string to an array
        let courseCategory = JSON.parse(courseObject["activity-category"]);
        let defaultReportCode = courseObject["default-report-code"]
            ? JSON.parse(courseObject["default-report-code"])
            : [];

        actions.push(clev.setValue("class-type", courseActivity));
        actions.push(clev.setValue("category", courseCategory));
        actions.push(clev.setValue("default-report-code", defaultReportCode));

        actions.push(clev.setFieldDisabled("class-type", true));
        actions.push(clev.setFieldDisabled("category", true));
        actions.push(clev.setFieldDisabled("default-report-code", true));
    } else {
        actions.push(clev.setValue("class-type", []));
        actions.push(clev.setValue("category", []));
        actions.push(clev.setValue("default-report-code", []));

        actions.push(clev.setFieldDisabled("class-type", false));
        actions.push(clev.setFieldDisabled("category", false));
        actions.push(clev.setFieldDisabled("default-report-code", false));
    }

    return clev.mergeAll(actions);
}

