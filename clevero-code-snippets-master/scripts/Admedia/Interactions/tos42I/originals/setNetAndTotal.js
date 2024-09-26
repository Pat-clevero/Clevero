async function handler(clev) {
    let actions = [];

    let preproductionHours = clev.getValue("1662670-pre-production-hours") ? clev.getValue("1662670-pre-production-hours") : 0;
    let filmingHours = clev.getValue("1662670-filming") ? clev.getValue("1662670-filming") : 0;
    let editingHours = clev.getValue("1662670-editing-hours") ? clev.getValue("1662670-editing-hours") : 0;

    let audiosupplierSelect = clev.getValue("1662670-audio-supplier"); // AUDIO SUPPLIER
    let audiosupplierObject = null;
    let audioDefaultRate = 0;
    if (audiosupplierSelect) {
        audiosupplierObject = await clev.api.getEntry({
            recordId: "574930",
            responseType: "iov",
            id: audiosupplierSelect,
        });
        audioDefaultRate = +audiosupplierObject?.["1662670-default-rate"] || 0;
    }
    let audioProduct = audioDefaultRate;

    let cadtypeSelect = clev.getValue("1662670-cad-type"); // CAD TYPE
    let cadtypeObject = null;
    let cadtypeRate = 0;
    if (cadtypeSelect) {
        cadtypeObject = await clev.api.getEntry({
            recordId: "1807625",
            responseType: "iov",
            id: cadtypeSelect,
        });

        cadtypeRate = +cadtypeObject?.["1662670-default-rate"] || 0;
    }

    let prioritySelect = clev.getValue("1662670-priority"); // PRIORITY
    let priorityObject = null;
    let priorityRate = 0;
    if (prioritySelect) {
        priorityObject = await clev.api.getEntry({
            recordId: "1807475",
            responseType: "iov",
            id: prioritySelect,
        });

        priorityRate = +priorityObject?.["1662670-multiplier"] || 0;
    }

    let finalCountValue = [];
    let dubValue = 0;
    if (clev.event.payload.field !== "1662670-dub-destination") {
        let numberofDubs = clev.getValue("1662670--of-dubs")
            ? clev.getValue("1662670--of-dubs")
            : 0;
        dubValue = numberofDubs * 50;

        actions.push(clev.setValue("1662670--of-dubs", numberofDubs));
        actions.push(clev.setValue("1662670-dub-total", dubValue));
    } else {
        let dubDestination = clev.getValue("1662670-dub-destination");
        await Promise.all(dubDestination.map(async (val) => {
            let dubDestinationDetail = await clev.api.getEntry({
                recordId: "1956128",
                responseType: "iov",
                id: val,
            });
            const countValue = dubDestinationDetail["1662670-count"]
                ? dubDestinationDetail["1662670-count"]
                : 0;

            return finalCountValue.push(+countValue);
        }));
        let totalCounts = finalCountValue.reduce((acc, val) => acc + val, 0);
        dubValue = totalCounts * 50;

        actions.push(clev.setValue("1662670--of-dubs", totalCounts));
        actions.push(clev.setValue("1662670-dub-total", dubValue));
    }

    let miscellaneousTotal = clev.getValue("1662670-miscellaneous-total") ? clev.getValue("1662670-miscellaneous-total") : 0;
    const productionValue = preproductionHours * 180;
    const filmingValue = filmingHours * 180;
    const editingValue = editingHours * 180;
    const cadValue = cadtypeRate * priorityRate;
    console.log(productionValue, filmingValue, editingValue, audioProduct, dubValue, cadValue, miscellaneousTotal);

    let net = productionValue + filmingValue + editingValue + audioProduct + dubValue + cadValue + (+miscellaneousTotal);
    let total = +net * 1.1;
    let totalValue = total.toFixed(2)

    console.log("net-->", net);
    console.log("total-->", total);

    actions.push(clev.setValue("1662670-net", isNaN(net) ? 0 : net));
    actions.push(clev.setValue("1662670-total", isNaN(totalValue) ? 0 : totalValue));

    return clev.mergeAll(actions);
}