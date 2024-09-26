function ifSessionIsCourseOrProgram(context) {
    console.log('here2');
    let course = JSON.parse(context.fieldStates.getValue(8531)[0]);
    console.log(course);
    let fieldKeys = [7658, 7659, 7660, 7661, 7662, 7663, 7664, 7666, 7673, 7674, 7778, 7811, 8223, 8256, 8266, 8267, 8268, 8269, 8270, 8271, 8272, 8273, 8274, 8275, 8276, 8277, 8278, 8279, 8281, 8521, 8531, 8543, 8582, 9110, 9111, 9118, 9119, 9121, 9122, 9123, 9124, 9127, 9710, 9711, 9712, 9827, 9829, 9828, 11010, 11009, 11011, 11140];
    new Promise((resolve) => {
        context.utils.api.getEntryJson({
            recordId: '148796',
            id: context.fieldStates.getValue(8531)[0].toString(),
            responseType: 'iov',
            key: 'delivery'
        }).then((sourcedValue) => {
            try {
                console.log(JSON.parse(sourcedValue));
                if (JSON.parse(sourcedValue)[0] == '247734') {
                    let fields = context.fieldStates.state;
                    fieldIdsToHide = [];
                    let mandatoryFields = [];
                    fieldIdsToHide = [8276, 8277, 8278, 7658];
                    mandatoryFields = [8531, 7659];
                } else {
                    fieldIdsToHide = [7658, 8281, 8266, 8267, 8268, 8269, 8270, 8271, 8272, 8273, 8274, 8275, 8276, 8277, 8278, 8279];
                    mandatoryFields = [8531, 7659];
                }
                fieldKeys.forEach((key) => {
                    if (fieldIdsToHide.includes(key)) {
                        context.fieldStates.updateState(key, {
                            inputState: {
                                hidden: true
                            },
                        });
                    } else {
                        context.fieldStates.updateState(key, {
                            inputState: {
                                hidden: false
                            },
                        });
                    }
                });
                fieldKeys.forEach((key) => {
                    if (mandatoryFields.includes(key)) {
                        context.fieldStates.updateState(key, {
                            inputState: {
                                mandatory: true
                            },
                        });
                        return context.fieldStates.getValue('8265');
                    } else {
                        context.fieldStates.updateState(key, {
                            inputState: {
                                mandatory: false
                            },
                        });
                    }
                });
                return context.fieldStates.getValue('8265');
                resolve(JSON.parse(sourcedValue));
            } catch (e) {
                resolve([]);
            }
        });
    });
    return context.fieldStates.getValue('8265');
}