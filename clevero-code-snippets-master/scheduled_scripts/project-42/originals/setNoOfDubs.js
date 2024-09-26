async function handler(clev) {
    let dubDestination = clev.getValue("1662670-dub-destination");
    let finalCountValue = [];
    if (dubDestination && dubDestination.length > 0) {
        await Promise.all(dubDestination.map (async( val)=>{
             let dubDestinationDetail = await clev.api.getEntry({
                recordId: "1956128",
                responseType: "iov",
                id: val,
            });

       

            const countValue = dubDestinationDetail["1662670-count"]
                ? dubDestinationDetail["1662670-count"]
                : 0;
        

            return finalCountValue.push(+countValue);
        }))
       
        
        let totalCounts=finalCountValue.reduce((acc,val)=>acc+val);
        return clev.setValue("1662670--of-dubs", totalCounts);
        
        
        
    } else {
        return clev.setValue("1662670--of-dubs", 0);
    }
}
