async function handler(C) {
    const generateSetActions = async (session, course) => {
        let actions = [];
        if (session) {
            const sessionTerm = session.term
                ? JSON.parse(session.term)
                : [];
            const sessionActivityType = session["class-type"]
                ? JSON.parse(session["class-type"])
                : [];
            const duration = session.duration;
            const sessionDeliveryMethod = session["delivery-method"]
                ? JSON.parse(session["delivery-method"])
                : [];

            actions.push(C.setValue("term", sessionTerm));
            actions.push(C.setValue("activity-type", sessionActivityType));
            actions.push(C.setValue("duration", duration));
            actions.push(C.setValue("attended-via", sessionDeliveryMethod));
        } else {
            actions.push(C.setValue("term", []));
            actions.push(C.setValue("activity-type", []));
            actions.push(C.setValue("duration", null));
            actions.push(C.setValue("attended-via", []));
        }

        if (course) {
            const courseCategory = course["activity-category"]
                ? JSON.parse(course["activity-category"])
                : [];
            actions.push(C.setValue("category", courseCategory));
        } else {
            actions.push(C.setValue("category", []));
        }

        return actions;
    };

    const fetchEnrollment = async (enrolmentId) =>
        await C.api.getEntry({
            recordId: "676915",
            responseType: "iov",
            id: enrolmentId,
        });

    const fetchCourse = async (courseId) =>
        await C.api.getEntry({
            recordId: "148796",
            responseType: "iov",
            id: courseId,
        });

    const fetchSession = async (memberId) =>
        await C.api.getEntry({
            recordId: "132157",
            responseType: "iov",
            id: memberId,
        });

    const fetchMember = async (sessionId) =>
        await C.api.getEntry({
            recordId: "132159",
            responseType: "iov",
            id: sessionId,
        });

    const formEvent = C.getEvent();
    let linkedEnrolment = C.getValue("linked-enrolment");
    if (formEvent.eventType === "MODE_SET" && linkedEnrolment.length > 0) {
        let resultActions = await fetchEnrollment(linkedEnrolment[0])
            .then(async (linkedEnrolmentObject) => {
                let sessionObject;
                let actions = [];
                if (linkedEnrolmentObject && linkedEnrolmentObject.member) {
                    actions.push(C.setValue("member", JSON.parse(linkedEnrolmentObject.member)));
                    const memberObject = await fetchMember(JSON.parse(linkedEnrolmentObject.member));
                    if(memberObject && memberObject.email)
                        actions.push(C.setValue("attendee-email", JSON.parse(memberObject.email)));
                }
                if (linkedEnrolmentObject && linkedEnrolmentObject.session) {
                    actions.push(C.setValue("activity", JSON.parse(linkedEnrolmentObject.session)));
                    sessionObject = await fetchSession(JSON.parse(linkedEnrolmentObject.session));
                }
                
                return { actions, sessionObject };
            })
            .then(async ({ actions, sessionObject }) => {
                if (!sessionObject)
                    return { actions };
                else if (sessionObject && sessionObject.course) {
                    const courseObject = await fetchCourse(JSON.parse(sessionObject.course));
                    return {
                        actions,
                        sessionObject,
                        courseObject,
                    };
                }
                
                return { actions, sessionObject };
            })
            .then(async ({ 
                actions, 
                sessionObject, 
                courseObject 
            }) => {
                const relatedFieldActions = await generateSetActions(sessionObject, courseObject);
                actions = actions.concat(relatedFieldActions);
                
                return actions;
            })
            .catch(e => {
                console.error(e.message);
                throw e;
            });
            
        return C.mergeAll(resultActions);
    }

    if (formEvent.eventType === "FORM_UPDATE" && formEvent.payload.field === "activity") {
        let selectedSession = C.getValue("activity");
        const resultActions = await fetchSession(
            selectedSession
        ).then(async (sessionObject) => {
            const course = sessionObject && sessionObject.course
                ? JSON.parse(sessionObject.course)
                : [];
            const courseObject = course.length > 0
                ? await fetchCourse(course)
                : null;
            return { sessionObject, courseObject };
        }).then(async ({ sessionObject, courseObject }) =>
            await generateSetActions(sessionObject, courseObject));

        return C.mergeAll(resultActions);
    }
}