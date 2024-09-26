async function handler(C){
    const mainContact = C.getValue("main-contact");
    let mainContactObject = await C.api.getEntry({
        recordId: "659712",
        responseType: "iov",
        id: mainContact,
    });

    return C.mergeAll(
        C.setValue("first-name", mainContactObject["first-name"]),
        C.setValue("last-name", mainContactObject["last-name"])
    )
}