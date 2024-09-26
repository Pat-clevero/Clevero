function a(context) {
    try {
        const utils = context.utils;
        let promises = [];
        let transactionType = context.fieldStates.getValue('7739')[0];
        if (transactionType === '134222') { // voucher
            promises = [context.utils.api.getEntryJson({
                recordId: '132155', // neighbourhood-house-activities
                id: context.fieldStates.getValue(7678)[0],
                responseType: 'iv',
                key: 'name',
            }), context.utils.api.getEntryJson({
                recordId: '132157', // neighbourhood-house-members
                id: context.fieldStates.getValue(7676)[0],
                responseType: 'iv',
                key: 'full-name',
            }), ];
        } else if (transactionType === '132967') { // Term/Course Booking
            promises = [context.utils.api.getEntryJson({
                recordId: '132155',
                id: context.fieldStates.getValue(7678)[0],
                responseType: 'iv',
                key: 'name',
            }), context.utils.api.getEntryJson({
                recordId: '132157',
                id: context.fieldStates.getValue(7676)[0],
                responseType: 'iv',
                key: 'full-name',
            }), context.utils.api.getEntryJson({
                recordId: '148796',
                id: context.fieldStates.getValue(8532)[0],
                responseType: 'iv',
                key: 'name',
            }), ];
        } else if (transactionType === '132966') { // Pay as you go
            promises = [context.utils.api.getEntryJson({
                recordId: '132159',
                id: context.fieldStates.getValue(7677)[0],
                responseType: 'iv',
                key: 'name',
            }), context.utils.api.getEntryJson({
                recordId: '132157',
                id: context.fieldStates.getValue(7676)[0],
                responseType: 'iv',
                key: 'full-name',
            }), ];
        } else if (transactionType === '139005') { // Donation
            promises = [context.utils.api.getEntryJson({
                recordId: '132157',
                id: context.fieldStates.getValue(8244)[0],
                responseType: 'iv',
                key: 'full-name',
            }), context.utils.api.getEntryJson({
                recordId: '132159',
                id: context.fieldStates.getValue(7677)[0],
                responseType: 'iv',
                key: 'name',
            }), ];
        } else if (transactionType === '140758') { // Room Booking
            promises = [context.utils.api.getEntryJson({
                recordId: '132159',
                id: context.fieldStates.getValue(7677)[0],
                responseType: 'iv',
                key: 'name',
            }), ];
        } else if (transactionType === '140759') { // Cash Adjustment
            promises = [context.utils.api.getEntryJson({
                recordId: '199',
                id: context.fieldStates.getValue(8255)[0],
                responseType: 'iv',
                key: 'name',
            }), ];
        } else if (transactionType === '142642') { // Refund
            promises = [context.utils.api.getEntryJson({
                recordId: '199',
                id: context.fieldStates.getValue(8255)[0],
                responseType: 'iv',
                key: 'name',
            }), ];
        } else if (transactionType === '149211') { // Membership Fee
            promises = [context.utils.api.getEntryJson({
                recordId: '132157',
                id: context.fieldStates.getValue(7676)[0],
                responseType: 'iv',
                key: 'full-name',
            }), ];
        } else if (transactionType === '150991') { // Expense
            promises = [context.utils.api.getEntryJson({
                recordId: '199',
                id: context.fieldStates.getValue(8255)[0],
                responseType: 'iv',
                key: 'name',
            }), ];
        }
        return new Promise((resolve) => {
            Promise.all(promises).then((results) => {
                let name = '';
                let transactionType = context.fieldStates.getValue('7739')[0];
                if (transactionType === '134222') {
                    let activityType = results[0] || '';
                    let member = results[1] || '';
                    name = 'Voucher - ' + activityType + ' - ' + member;
                } else if (transactionType === '132967') {
                    let activityType = results[0] || '';
                    let member = results[1] || '';
                    let course = results[2] || '';
                    name = course + ' - ' + member;
                } else if (transactionType === '132966') {
                    let activity = results[0] || '';
                    let member = results[1] || '';
                    name = activity + ' - ' + member;
                } else if (transactionType === '139005') {
                    let contact = results[0] || '';
                    name = 'Donation - ' + contact;
                } else if (transactionType === '140758') {
                    let activity = results[0] || '';
                    name = 'Room Booking - ' + activity;
                } else if (transactionType === '140759') {
                    let employee = results[0] || '';
                    name = 'Cash Adjustment - ' + employee + ' - ' + context.utils.moment().format('YYYY-MM-DD');
                } else if (transactionType === '142642') {
                    let employee = results[0] || '';
                    name = 'Refund - ' + employee + ' - ' + context.utils.moment().format('YYYY-MM-DD');
                } else if (transactionType === '149211') {
                    let member = results[0] || '';
                    name = 'Member Fee - ' + member + ' - ' + context.utils.moment().format('YYYY-MM-DD');
                } else if (transactionType === '150991') {
                    let employee = results[0] || '';
                    name = 'Expense - ' + employee + ' - ' + context.utils.moment().format('YYYY-MM-DD');
                }
                resolve(name);
            });
        });
    } catch (e) {}
}