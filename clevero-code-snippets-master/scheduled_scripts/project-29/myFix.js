async function handler(C) {
   
    let arr = [];
    const entries = await C.api.fetchSelectData({
        recordId: 1709718,
        fieldId: 18824,
        filters: [],
    });
    
    entries.options.forEach((e) => arr.push(e.value));

    const entryData = await Promise.all(
        arr.map(async (entryId) => {
            const data = await C.api.getEntry({
                recordId: 1709718,
                id: entryId,
                responseType: "iov",
            });
            return data;
        })
    );

    const currentKeyValue = C.getValue("1662670-key-number"); // get key number that is currently typed
    let isValid = true;

    console.log({entryData});
    entryData.some((data) => {
        if (data && data["1662670-key-number"] === currentKeyValue) {
           isValid = false;
        }
    });
    
    if (!isValid) {
        alert("This key number already exists, please choose something else")
    }
    
}
