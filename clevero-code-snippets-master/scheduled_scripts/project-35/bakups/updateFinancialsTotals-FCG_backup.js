async function handler(C) {
    // console.log("C: ", C);
    const lineValues = C.state.subValues["xero-order-items"];

    const newNet = lineValues.map((v) => +v.net).reduce((agg, v) => agg + v, 0);
    const newTax = lineValues.map((v) => +v.tax).reduce((agg, v) => agg + v, 0);
    const newTotal = lineValues
        .map((v) => +v.total)
        .reduce((agg, v) => agg + v, 0);

    const returnValue = C.mergeAll(
        C.setValue("1795685-net", newNet),
        C.setValue("1795685-tax", newTax),
        C.setValue("1795685-total", newTotal)
    );
    return returnValue;

    // console.log("line values: ", lineValues)
    // console.log("return value: ", returnValue)
}
