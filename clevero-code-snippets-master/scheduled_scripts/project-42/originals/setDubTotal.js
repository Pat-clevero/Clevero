async function handler(C) {
    let actions = [];

    let numberofdub = C.getValue("1662670--of-dubs")?C.getValue("1662670--of-dubs"):0;
    
   
    let totalDub = numberofdub * 50;

    actions.push(C.setValue("1662670-dub-total", totalDub));

    return C.mergeAll(actions);
}