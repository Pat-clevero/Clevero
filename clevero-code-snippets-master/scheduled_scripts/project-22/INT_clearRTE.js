async function handler(C){
    const noteTemplate = C.getValue("1614495-note-template");
    let actions = [];

    if(noteTemplate.length === 0)
        actions.push(C.setValue("1614495-note", ""));

    return C.mergeAll(actions);
}