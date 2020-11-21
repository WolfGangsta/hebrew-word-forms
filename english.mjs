// Conjugate an English verb entry.
// TODO: Fix bad forms: I were, he were, she were
export function conjugate(entry, past, singular, firstPerson) {
    if (past) {
        if (typeof entry == "string") {
            return addD(entry, singular);
        } else {
            return entry[1];
        }
    } else if (singular) {
        if (typeof entry == "string") {
            return addS(entry, firstPerson);
        } else {
            entry = entry[0];
            if (typeof entry == "string") {
                return addS(entry, firstPerson);
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

function toBe(past, singular, firstPerson) {
    if (past) return singular ? "was" : "were";
    if (singular) return firstPerson ? "am" : "is";
    return "are";
}

function addD(verb, singular) {
    if (verb.includes(" ")) {
        let words = verb.split(" ");
        return addD(words[0], singular) + " " + words.slice(1).join(" ");
    }
    if (verb == "be") return toBe(true, singular);
    if (verb.slice(-1) == "e") return verb + "d";
    if (verb.slice(-1) == "y") return verb.slice(0, -1) + "ied";
    return verb + "ed";
}

function addS(verb, firstPerson) {
    if (verb.includes(" ")) {
        let words = verb.split(" ");
        return addS(words[0], firstPerson) + " " + words.slice(1).join(" ");
    }
    if (verb == "be") return toBe(false, true, firstPerson);
    if (["sh", "ch"].includes(verb.slice(-2))
        || ["s", "o"].includes(verb.slice(-1))) {
        return verb + "es";
    }
    if (verb.slice(-1) == "y") return verb.slice(0, -1) + "ies";
    return verb + "s";
}