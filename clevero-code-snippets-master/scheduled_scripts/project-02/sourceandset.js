async function handler(C) {
    console.log("---------");
    console.log("TESTING: Ivan's script started here");
    let actions = [];

    const parentSupportCaseId = C.getValue("parent-support-case");
    console.log("PARENT: ", parentSupportCaseId);
    if (parentSupportCaseId.length === 0) {
        console.log("parentSupportCaseId is empty");
        return;
    }

    let parentSupportCaseEntry = await C.api.getEntry({
        recordId: "72911",
        responseType: "iov",
        id: parentSupportCaseId,
    });
    // console.log("STRINGIFIED>>> ", JSON.stringify(supportCaseEntry));
    
    // set customer field
    if(parentSupportCaseEntry === null) {
        console.log("parentSupportCaseEntry is null");
        return;
    }
    
    if (parentSupportCaseEntry.customer) {
        const customerId = JSON.parse(parentSupportCaseEntry.customer);
        actions.push(C.setValue("customer", customerId));
    }

    // set email field
    if (parentSupportCaseEntry.email) {
        const customerEmail = parentSupportCaseEntry.email;
        actions.push(C.setValue("email", customerEmail));
    }

    // set phone field
    if (parentSupportCaseEntry.phone) {
        const customerPhone = parentSupportCaseEntry.phone;
        actions.push(C.setValue("phone", customerPhone));
    }

    // set type field
    if (parentSupportCaseEntry.type) {
        const typeId = JSON.parse(parentSupportCaseEntry.type);
        actions.push(C.setValue("type", typeId));
    }

    // set support-case-category-clevero field
    if (parentSupportCaseEntry["support-case-category-clevero"]) {
        const categoryId = JSON.parse(
            parentSupportCaseEntry["support-case-category-clevero"]
        );
        actions.push(C.setValue("support-case-category-clevero", categoryId));
    }

    // set status field
    if (parentSupportCaseEntry.status) {
        const statusId = JSON.parse(parentSupportCaseEntry.status);
        actions.push(C.setValue("status", statusId));
    }

    // set expected-completion-date field
    if (parentSupportCaseEntry["expected-completion-date"]) {
        const expectedCompletionDate =
            parentSupportCaseEntry["expected-completion-date"];
        actions.push(
            C.setValue("expected-completion-date", expectedCompletionDate)
        );
    }

    // set assigned-to field
    if (parentSupportCaseEntry["assigned-to"]) {
        const assignedToId = JSON.parse(parentSupportCaseEntry["assigned-to"]);
        actions.push(C.setValue("assigned-to", assignedToId));
    }

    // set concerned-department field
    if (parentSupportCaseEntry["concerned-department"]) {
        const concernedDepartmentId = JSON.parse(
            parentSupportCaseEntry["concerned-department"]
        );
        actions.push(C.setValue("concerned-department", concernedDepartmentId));
    }

    // set owner field
    if (parentSupportCaseEntry.owner) {
        const reviewerId = JSON.parse(parentSupportCaseEntry.owner);
        actions.push(C.setValue("owner", reviewerId));
    }

    // set priority field
    if (parentSupportCaseEntry.priority) {
        const priorityId = JSON.parse(parentSupportCaseEntry.priority);
        actions.push(C.setValue("priority", priorityId));
    }

    return C.mergeAll(actions);
}