async function handler(C) {
    const yearLevels = {
        2735976: "Prep",
        2691127: "Year 1",
        2691128: "Year 2",
        2691129: "Year 3",
        2691130: "Year 4",
        2691131: "Year 5",
        2691132: "Year 6",
        2735977: "Year 7-10",
    };
    const allSubValues = C.getAllSubValues(
        "street-science-classrooms-and-year-levels"
    );

    let result = "";
    allSubValues.forEach((sub) => {
        result += `${sub["2708638-classroom-name"]} - ${sub["2708638-nof-students"]} - ${yearLevels[sub["2708638-year-level"]]}\n`;
    });

    return C.mergeAll(C.setValue("2708638-classroom-and-year-levels", result));
}
