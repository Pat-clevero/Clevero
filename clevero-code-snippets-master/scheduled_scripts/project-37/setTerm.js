async function handler(C){
    let actions = [];
    const entries = await C.api.fetchSelectData({
        recordId: 132154,
        fieldId: 7643,
        filters: [{
            requestType: 'i',
            subject: 'start-date',
            type: 'date',
            operator: 'on_or_before',
            value: {
                relative: true,
                value: null,
                type: 'TODAY'
            }
        }, 'AND', {
            requestType: 'i',
            subject: 'end-date',
            type: 'date',
            operator: 'on_or_after',
            value: {
                relative: true,
                value: null,
                type: 'TODAY'
            }
        }],
    });

    actions.push(C.setValue("term", [`${entries.options[0].value}`]));
    return C.mergeAll(actions);
}