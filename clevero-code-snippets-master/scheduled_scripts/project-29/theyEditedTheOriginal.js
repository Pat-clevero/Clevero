async function handler(C) {
    try {
        const getEntries = await C.api.listEntries({
            internalId: "admedia-commercials",
            responseType: "iov",
            ignoreLimits: true,
        });

        const entryData = getEntries.entries;

        const currentKeyValue = C.getValue("1662670-key-number"); // get key number that is currently typed
        const entryWithSameKey = entryData.find(data => data["1662670-key-number"] === currentKeyValue);

        if (entryWithSameKey) {
            alert("This Key Number already exists, please type in new one");
        } else {
            console.log("Unique key number");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}
