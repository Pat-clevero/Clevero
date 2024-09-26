async function handler(C) {
    let actions = [];
    const projType = C.getValue("category");
    let jobProject = C.getValue("job-project");
    
    // For checking
    // console.log("Job-Project: " + jobProject[0]);
    // console.log("Proj Type: " + projType[0]);

    if (
        (!jobProject[0] && jobProject.length === 0) && // if job-project is empty
        (projType[0] === "1225331")
    ) {
        actions.push(
            C.setValue("job-project", ["105602"])
        );
    } 
    
    

    return C.mergeAll(actions);
}
