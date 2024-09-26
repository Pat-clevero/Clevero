async function script(C) {
    let bookingsWithEmptyStartDate = await C.filterEntries({
        recordInternalId: "life-bookings",
        ignoreLimits: false,
        filter: [
            {
                subject: "tour-start-date",
                requestType: "i",
                type: "datetime",
                operator: "is_empty",
                ignoreCase: true
            }
        ],
        limit: 201,
    });
    C.log("No. of bookings to update:", bookingsWithEmptyStartDate.totalMatchedEntries);

    const updates = await Promise.all(
        bookingsWithEmptyStartDate.entries.map(async (booking) => {
            if(booking.tour) {
                const tourEntryId = booking.tour[0];
                const tourEntry = await C.getEntry({
                    recordInternalId: "life-tours",
                    entryId: tourEntryId,
                });

                if (tourEntry && tourEntry.hasOwnProperty("start-date")) {
                    return {
                        value: {
                            "tour-start-date": tourEntry["start-date"]
                        },
                        entryId: booking.recordValueId,
                        recordInternalId: "life-bookings",
                    };
                } 
            }
        })
    );

    const updateResponse = await C.updateEntries({ updates: updates.filter(i => i) });
    return updateResponse;
}