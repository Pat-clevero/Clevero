async function script(C) {
    const currentEntry = await C.getCurrentEntry();
    let project = currentEntry["1662670-project"][0];
    let projectDetails = await C.getEntry({
        recordInternalId: "admedia-projects",
        entryId: project,
        loadAssociations: true,
        associations: [
            {
                internalId: "admedia-commercials",
                responseType: "iov",
            },
            {
                internalId: "admedia--expenses",
                responseType: "iov",
            },
            {
                internalId: "admedia-timesheets",
                responseType: "iov",
            },
        ],

    });
    
    return {projectDetails};

    let revenueValue = [];
    let costValue = [];
    let timesheetValue = [];
    if (projectDetails.associations["admedia-commercials"] && projectDetails.associations["admedia-commercials"].length > 0) {
        _.forEach(projectDetails.associations["admedia-commercials"], function (o) {
            //let total = o["1662670-total"] ? o["1662670-total"] : 0;
            let dubTotal = o["1662670-dub-total"] ? o["1662670-dub-total"] : 0;
            let cadTotal = o["1662670-cad-total"] ? o["1662670-cad-total"] : 0;
            let voiceOverTotal = o["1662670-voiceover-total"] ? o["1662670-voiceover-total"] : 0;
            revenueValue.push(dubTotal);
            revenueValue.push(cadTotal);
            revenueValue.push(voiceOverTotal);
        })
    }
    
    if (projectDetails.associations["admedia--expenses"] && projectDetails.associations["admedia--expenses"].length > 0) {
        _.forEach(projectDetails.associations["admedia--expenses"], async function (o) {
            let amount = o["1662670-amount"] ? o["1662670-amount"] : 0;
            let onCharge = o["1662670-on-charge-to-client"][0];
            let onMark = o["1662670-mark-up"] ? o["1662670-mark-up"] : 0;
            if (onCharge == 1142 || onCharge == "1142") {
                let totalMarkup = +amount * (1 + (onMark / 100));
                revenueValue.push(+totalMarkup.toFixed(2));
            }
            costValue.push(+amount.toFixed(2));
        })
    }
    
    if (projectDetails.associations["admedia-timesheets"] && projectDetails.associations["admedia-timesheets"].length > 0) {

        _.forEach(projectDetails.associations["admedia-timesheets"], function (o) {
            let revVal = o["1662670-revenue"] ? o["1662670-revenue"] : 0;
            let costVal = o["1662670-cost"] ? o["1662670-cost"] : 0;
            
            revenueValue.push(revVal);
            timesheetValue.push(revVal);
            costValue.push(costVal);
        })
    }
    // return { projectDetails, revenueValue, costValue };

    if ((revenueValue && revenueValue.length > 0) || (costValue && costValue.length > 0)) {

        let projectTotalRevenue = revenueValue.reduce((acc, val) => acc + val);
        let projectTotalCost = costValue.reduce((acc, val) => acc + val);
        let timesheetRevenue = timesheetValue.reduce((acc, val) => acc + val);
        
        let projectProfit = +projectTotalRevenue - +projectTotalCost

        const response = await C.updateEntries({
            updates: [
                {
                    value: {
                        "1662670-revenue": +projectTotalRevenue,
                        "1662670-cost": +projectTotalCost,
                        "1662670-profit": +projectTotalRevenue - +projectTotalCost,
                        "1662670-labour-total": +timesheetRevenue,
                    },
                    recordInternalId: "admedia-projects",
                    entryId: project,
                },
            ],
        });
    }
    C.log("Project revenue and cost successfully updated")

}
