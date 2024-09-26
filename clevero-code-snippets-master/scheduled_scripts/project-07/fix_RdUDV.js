async function handler(C){
    
    console.log("C: ", C)
    
    const data = await C.api.fetchSelectData({
        //recordId:"organisations"
        fieldId:"instance"
    });
    
    console.log(data);
    
    
    // //If only one option is present
    
    // if(data.totalMatchedEntries==1){
    //     return C.setValue("field-internal-id",[`${data.options[0].value}`]);
    // }
    // //If multiple options are present
    // else return ;
}