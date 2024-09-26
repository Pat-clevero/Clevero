async function handler(C) {
    const actions = [];

    const departmentSelect = C.getValue("1662670-department");

    //Content ==1773861
    //Media ==1773863
    //Web ==1773864

    //Content Alone

    if (
        departmentSelect.includes("1773861") &&
        !departmentSelect.includes("1773863") &&
        !departmentSelect.includes("1773864")
    ) {
        actions.push(C.setFieldMandatory("1662670-content-item", true));
        actions.push(C.setFieldMandatory("1662670-media-buying-items", false));
        actions.push(C.setFieldMandatory("1662670-web-development-items", false));
    }

    // Media Alone

    if (
        !departmentSelect.includes("1773861") &&
        departmentSelect.includes("1773863") &&
        !departmentSelect.includes("1773864")
    ) {
        actions.push(C.setFieldMandatory("1662670-content-item", false));
        actions.push(C.setFieldMandatory("1662670-media-buying-items", true));
        actions.push(C.setFieldMandatory("1662670-web-development-items", false));
    }

    //Web Alone

    if (
        !departmentSelect.includes("1773861") &&
        !departmentSelect.includes("1773863") &&
        departmentSelect.includes("1773864")
    ) {
        actions.push(C.setFieldMandatory("1662670-content-item", false));
        actions.push(C.setFieldMandatory("1662670-media-buying-items", false));
        actions.push(C.setFieldMandatory("1662670-web-development-items", true));
    }

    //Content and Media

    if (
        departmentSelect.includes("1773861") &&
        departmentSelect.includes("1773863") &&
        !departmentSelect.includes("1773864")
    ) {
        actions.push(C.setFieldMandatory("1662670-content-item", true));
        actions.push(C.setFieldMandatory("1662670-media-buying-items", true));
        actions.push(C.setFieldMandatory("1662670-web-development-items", false));
        actions.push(C.setValue("1662670-web-development-items", []));
    }

    //Content and web

    if (
        departmentSelect.includes("1773861") &&
        !departmentSelect.includes("1773863") &&
        departmentSelect.includes("1773864")
    ) {
        actions.push(C.setFieldMandatory("1662670-content-item", true));
        actions.push(C.setFieldMandatory("1662670-media-buying-items", false));
        actions.push(C.setValue("1662670-media-buying-items", []));
        actions.push(C.setFieldMandatory("1662670-web-development-items", true) );
    }

    //Content, media and web

    if (
        departmentSelect.includes("1773861") &&
        departmentSelect.includes("1773863") &&
        departmentSelect.includes("1773864")
    ) {
        actions.push(C.setFieldMandatory("1662670-content-item", true));
        actions.push(C.setFieldMandatory("1662670-media-buying-items", true));
        actions.push(C.setFieldMandatory("1662670-web-development-items", true));
    }

    //Media and Web

    if (
        !departmentSelect.includes("1773861") &&
        departmentSelect.includes("1773863") &&
        departmentSelect.includes("1773864")
    ) {
        actions.push(C.setFieldMandatory("1662670-content-item", false));
        actions.push(C.setValue("1662670-content-item", []));
        actions.push(C.setFieldMandatory("1662670-media-buying-items", true));
        actions.push(C.setFieldMandatory("1662670-web-development-items", true));
    }

    if (
        !departmentSelect.includes("1773861") &&
        !departmentSelect.includes("1773863") &&
        !departmentSelect.includes("1773864")
    ) {
        actions.push(C.setFieldMandatory("1662670-content-item", false));
        actions.push(C.setFieldMandatory("1662670-media-buying-items", false));
        actions.push(C.setFieldMandatory("1662670-web-development-items", false));
        actions.push(C.setValue("1662670-content-item", []));
        actions.push(C.setValue("1662670-media-buying-items", []));
        actions.push(C.setValue("1662670-web-development-items", []));
    }

    return C.mergeAll(actions);
}
