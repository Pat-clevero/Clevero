async function handler(C){
    const isAvailableOnline = C.getValue("available-online");
    let actions = [];
    if(isAvailableOnline || isAvailableOnline === "true")
        actions.push(C.setFieldMandatory("online-payment-methods", true));
    else
        actions.push(C.setFieldMandatory("online-payment-methods", false));
    
    return C.mergeAll(actions);
}
