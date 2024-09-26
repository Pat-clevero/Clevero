async function handler(C) {
    const safeJSONParse = (jsonStr, defaultVal = []) => {
        try {
            return JSON.parse(jsonStr);
        } catch (err) {
            return defaultVal;
        }
    };
    let actions = [];

    const event = C.getEventPayload();
    const getAllSubValues = C.getAllSubValues("forklift-parts-used");

    const allSubIndexValues = getAllSubValues;
    let descriptionValue = "";

    allSubIndexValues.forEach((line) => {
        const partNumber = line["part-number"] || "";
        const description = line.description || "";
        const quantity = line.quantity || 0;

        descriptionValue += `${partNumber}-${description}-${quantity},`;
    });
    
    return C.setValue("132-parts-used", descriptionValue);
}