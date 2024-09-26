// Set Reviewer to Mark Vida if assigned-to is changed to Mark Vida
async function handler(C) {
    let actions = [];
    const assignedTo = C.getValue("assigned-to");
    if (assignedTo[0] == "31291")
        actions.push(C.setValue("owner", [assignedTo[0]]));

    return C.mergeAll(actions);
}
