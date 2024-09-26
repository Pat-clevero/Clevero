// Calculate Duration
async function handler(clev) {
    let actions = [];

    const startTime = new Date(clev.getValue("start-time"));
    const endTime = new Date(clev.getValue("end-time"));
    
    const newStartTime = startTime.setSeconds(0, 0);
    const newEndtTime = endTime.setSeconds(0, 0);
    
    const durationDiff = newEndtTime - newStartTime;
    
    const durationDiffMinute = durationDiff / (1000 * 60) ;
    //const durationDiffHour = durationDiffMinute / 60 ;
    //const durationDiffDay = durationDiffHour / 24 ;

    actions.push(
        clev.setValue("duration", durationDiffMinute)
    );

    return clev.mergeAll(actions);
}
