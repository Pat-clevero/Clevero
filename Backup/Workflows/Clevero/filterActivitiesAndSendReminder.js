async function script(C) {
    // Initialization
    const { entryId, recordInternalId, recordId } = C.getEvent();

    const filteredActivities = await C.filterEntries({
        filter: [
            {
                subject: "reminder-date",
                requestType: "i",
                type: "datetime",
                operator: "equals",
                ignoreCase: true,
                value: {
                    relative: true,
                    value: null,
                    type: "TODAY",
                },
            },
            "and",
            {
                subject: "do-not-send-reminder",
                requestType: "i",
                type: "checkbox",
                operator: "is_false",
                ignoreCase: true,
            },
        ],
        recordInternalId: "kalysys-activities",
    });
    
    // OPTION 1
    // const sendNotificationAndEmail = async (activity) => {
    //     const activityEntryId = activity.recordValueId;
    //     // Get User values
    //     let user = await C.getEntry({
    //         entryId: activity.user[0],
    //         recordInternalId: "employees",
    //     });
    //     // Get User email
    //     let userEmail = user.email;
        
    //     C.addJsonToSummary({ activity });

    //     // Send NOTIFICAITON
    //     try {
    //         const notifResponse = C.sendNotification({
    //             payload: {
    //                 message: `New Activity Reminder!`,
    //                 metadata: {
    //                     redirectUrl: `/app/records/${recordId}/view/${activityEntryId}`,
    //                 },
    //                 topic: "COMMUNICATIONS",
    //                 subTopic: "EMAIL_REPLY",
    //             },
    //             audience: "USER",
    //             employeeId: activity.user[0],
    //         });
    //         C.log("Notification sent.");
    //         C.addJsonToSummary({ notifResponse });
            
    //     } catch (error) {
    //         C.addJsonToSummary(error);
    //     }

    //     //Send EMAIL to User
    //     const emailInput = {
    //         entryId: activityEntryId,
    //         recordInternalId: "kalysys-activities",
    //         from: {
    //             email: "renz@clevero.co",
    //             name: "Renz",
    //         },
    //         to: [userEmail],
    //         logEmail: [
    //             {
    //                 recordId: activity.recordId,
    //                 entryId: activityEntryId,
    //             },
    //         ],
    //         templateId: 104759,
    //         options: {
    //             logEmailToCurrentEntry: true, // Optional
    //         },
    //     };

    //     try {
    //         const emailResponse = await C.sendEmail(emailInput);
    //         C.log("Email sent.");
    //         C.addJsonToSummary({ emailResponse });
    //     } catch (error) {
    //         C.addJsonToSummary(error);
    //     }
    // }
    
    // Use map to set timeouts and send notifications/emails
    // const res = filteredActivities.entries.map((activity) => {
    //     const reminderDate = new Date(activity["reminder-date"]);
    //     const now = new Date();
    //     const delay = reminderDate - now;

    //     if (delay > 0) {
    //         setTimeout(() => sendNotificationAndEmail(activity), delay);
    //     } else {
    //         sendNotificationAndEmail(activity);
    //     }
    // });


    // OPTION 2
    for (const activity of filteredActivities.entries) {
      const activityEntryId = activity.recordValueId;
        // Get User values
        let user = await C.getEntry({
            entryId: activity.user[0],
            recordInternalId: "employees",
        });
        // Get User email
        let userEmail = user.email;
        
        C.addJsonToSummary({ activity });

        // Send NOTIFICAITON
        try {
            const notifResponse = C.sendNotification({
                payload: {
                    message: `New Activity Reminder!`,
                    metadata: {
                        redirectUrl: `/app/records/${recordId}/view/${entryId}`,
                    },
                    topic: "COMMUNICATIONS",
                    subTopic: "EMAIL_REPLY",
                },
                audience: "USER",
                employeeId: activity.user[0],
            });
            C.log("Notification sent.");
            C.addJsonToSummary({ notifResponse });
            
        } catch (error) {
            C.addJsonToSummary(error);
        }

        //Send EMAIL to User
        const emailInput = {
            entryId: activityEntryId,
            recordInternalId: "kalysys-activities",
            from: {
                email: "renz@clevero.co",
                name: "Renz",
            },
            to: [userEmail],
            logEmail: [
                {
                    recordId: activity.recordId,
                    entryId: activityEntryId,
                },
            ],
            templateId: 104759,
            options: {
                logEmailToCurrentEntry: true, // Optional
            },
        };

        try {
            const emailResponse = await C.sendEmail(emailInput);
            C.log("Email sent.");
            C.addJsonToSummary({ emailResponse });
        } catch (error) {
            C.addJsonToSummary(error);
        }  
    }

    // Checking
    
    C.addJsonToSummary({
        filteredActivities,
        res
    });

    return;
}
