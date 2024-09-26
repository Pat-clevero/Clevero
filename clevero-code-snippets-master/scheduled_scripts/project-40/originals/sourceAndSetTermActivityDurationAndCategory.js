async function handler(clev) {
    let actions = [];

    let sessionSelect = clev.getValue("activity");
    console.log(sessionSelect);

    if (sessionSelect.length > 0) {
        let sessionObject = await clev.api.getEntry({
            recordId: "132159",
            responseType: "iov",
            id: sessionSelect[0],
        });

        const sessionTerm = sessionObject.term
            ? JSON.parse(sessionObject.term)
            : [];

        const sessionActivityType = sessionObject["class-type"]
            ? JSON.parse(sessionObject["class-type"])
            : [];

        const duration = sessionObject.duration;

        // const sessionCategory = sessionObject["activity-category"]
        //     ? JSON.parse(sessionObject["activity-category"])
        //     : [];

        const sessionDeliveryMethod = sessionObject["delivery-method"]
            ? JSON.parse(sessionObject["delivery-method"])
            : [];

        actions.push(clev.setValue("term", sessionTerm));
        actions.push(clev.setValue("activity-type", sessionActivityType));
        actions.push(clev.setValue("duration", duration));
        //actions.push(clev.setValue("category", sessionCategory));
        actions.push(clev.setValue("attended-via", sessionDeliveryMethod));
        return clev.mergeAll(actions);
    } else {
        actions.push(clev.setValue("term", []));
        actions.push(clev.setValue("activity-type", []));
        actions.push(clev.setValue("duration", null));
        //actions.push(clev.setValue("category", []));
        actions.push(clev.setValue("attended-via", []));
        return clev.mergeAll(actions);
    }

    /*  
    
    let sessionObject = await clev.api.getEntry({
            recordId: "132159",
            responseType: "iov",
            id: sessionSelect,
        });
    
    let sessionTerm =sessionObject.term? JSON.parse(sessionObject.term) : [];
    
    let sessionActivityType = JSON.parse(sessionObject["class-type"]);
    
    let sessionDuration = +sessionObject.duration;
    
    let sessionCategory = JSON.parse(sessionObject.category);
    
    

    if (sessionSelect.length > 0) {
        actions.push(clev.setValue("term", sessionTerm || []));
        actions.push(clev.setValue("activity-type", sessionActivityType || []));
        actions.push(clev.setValue("duration", sessionDuration || []));
        actions.push(clev.setValue("category", sessionCategory || []));
    } else {
        actions.push(clev.setValue("term", []));
        actions.push(clev.setValue("activity-type", []));
        actions.push(clev.setValue("duration", null));
        actions.push(clev.setValue("category", []));
    }

    return clev.mergeAll(actions);
    */
}
