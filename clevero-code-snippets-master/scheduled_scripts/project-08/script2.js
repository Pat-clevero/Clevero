// On add auto set Reviewer to Mark Vida
async function handler(C){
    return C.mergeAll([
        C.setValue("owner", ["31291"])
    ]);
}
