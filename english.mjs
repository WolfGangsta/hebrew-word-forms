// Conjugate an English word entry.
export function conjugate(entry, past, singular) {
    // TODO: fix broken forms: calles, dwelles, punishs, watchs, gos
    // TODO: conjugate "be X" forms
    if (past) {
        if (typeof entry == "string") {
            return addD(entry)
        } else {
            return entry[1];
        }
    } else if (singular) {
        if (typeof entry == "string") {
            return addS(entry);
        } else {
            entry = entry[0];
            if (typeof entry == "string") {
                return addS(entry);
            } else {
                return entry[1];
            }
        }
    } else {
        while (typeof entry != "string") {
            entry = entry[0];
        }
        return entry;
    }
}

function addD(verb) {
    if (verb.slice(-1) == "e") {
        return verb + "d";
    } else if (verb.slice(-1) == "y") {
        return verb.slice(0, -1) + "ied";
    } else {
        return verb + "ed";
    }
}

function addS(verb) {
    // TODO: Have better -s suffix-adding system
    if (["sh", "ch"].includes(verb.slice(-1))
        || verb.slice(-2, -1) == verb.slice(-1)) {
        return verb + "es";
    } else if (verb.slice(-1) == "y") {
        return verb.slice(0, -1) + "ies";
    } else {
        return verb + "s";
    }
}