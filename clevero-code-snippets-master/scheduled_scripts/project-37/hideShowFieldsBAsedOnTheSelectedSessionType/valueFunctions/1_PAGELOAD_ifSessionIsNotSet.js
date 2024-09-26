function ifSessionIsNotSet(context) {
    console.log('in here');
    let fields = context.fieldStates.state;
    let fieldKeys = [7658, 7659, 7660, 7661, 7662, 7663, 7664, 7666, 7673, 7674, 7778, 7811, 8223, 8256, 8266, 8267, 8268, 8269, 8270, 8271, 8272, 8273, 8274, 8275, 8276, 8277, 8278, 8279, 8281, 8521, 8531, 8543, 8582, 9827, 9829, 9828, 10858, 10859, 10860, 11001, 10941, 10940, 11000, 11010, 11009, 11011, 11140, 15861, 15862];
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
    return context.fieldStates.getValue('8265');
}