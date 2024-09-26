function a(context) {
    let fields = context.fieldStates.state;
    let fieldKeys = [7676, 7677, 7678, 7679, 7683, 7684, 7685, 7744, 7869, 8163, 8165, 8201, 8203, 8230, 8240, 8244, 8254, 8255, 8328, 8475, 8476, 8532, 8578, 8579, 8598, 8644, 9066, 9067, 9632, 9759, 10005, 11401, 11665, 11674, 11676, 11677, 11713];
    let fieldIdsToHide = fieldKeys;
    fieldKeys.forEach((key) => {
        if (fieldIdsToHide.includes(key)) {
            context.fieldStates.updateState(key, {
                inputState: {
                    hidden: true
                }
            });
        } else {
            context.fieldStates.updateState(key, {
                inputState: {
                    hidden: false
                }
            });
        }
    });
    return context.fieldStates.getValue('7677');
}