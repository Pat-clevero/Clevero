async function script(C) {
    /**
     * 1. Get the ids of the x number of patients from the filter
     * 2. Iterate through each id, get all the notes entry related to the id, combine the notes and put them in the pdf
     * 3. Tick and fill in the the file and checkbox fields
     * 
     * Pseudocode
     * 1. const ids = getEntries
     * 2. ids.forEach(async (id) => {
     *      const notes = getAssociations()
     *        const pdf = combineNotes(notes)
     *      })
     */
    try {
        const { entries: patients } = await C.getEntries({
            filter: [
                {
                    subject: "id",
                    type: "number:recordValue",
                    operator: "any_of",
                    value: ["200028522"],
                },
                "and",
                [
                    {
                        subject: "1614495-notes-pdf-generated",
                        requestType: "i",
                        type: "checkbox",
                        operator: "is_empty",
                        ignoreCase: true,
                    },
                    "or",
                    {
                        subject: "1614495-notes-pdf-generated",
                        requestType: "i",
                        type: "checkbox",
                        operator: "is_false",
                        ignoreCase: true,
                    },
                ],
            ],
            limit: 2,
            // sortBy: "-1",
            // sortOrder: -1,
            // page: 0,
            recordInternalId: "hello-mello-patients",
        });

        C.addJsonToSummary({ patients });

        if (!patients.length) {
            return { message: "No patients found." };
        }

        const patientIds = patients.map(patient => patient.recordValueId);
        const idsWithAssociatedNotes = await C.getAssociations(
            patientIds,
            "hello-mello-patients",
            ["hello-mello-notes"],
        );

        // return { idsWithAssociatedNotes };

        /**
         * To Dos
         * 1. Iterate through each object properties (patient ids)
         * 2. For each id, combine all notes into PDF. If `hello-mello-notes` array is empty, dont proceed with combination process.
         */

        // for (const key in idsWithAssociatedNotes) {
        //     if (idsWithAssociatedNotes.hasOwnProperty(key)) {
        //         const patientId = key;
        //         if(idsWithAssociatedNotes[patientId]) {
        //             const notesArray = idsWithAssociatedNotes[patientId]["hello-mello-notes"];
                    
        //         }

        //     }
        // }
        C.addJsonToSummary({func: C.getPdfFromGoogleDocsTemplate});

    } catch (err) {
        throw err;
    }
}