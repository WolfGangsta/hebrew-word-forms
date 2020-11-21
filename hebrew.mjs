import {
    Letters,
    DAGESH, SHEVA,
    CHATEF_PATACH, CHATEF_SEGOL,
    PATACH, SEGOL,
    QAMETS, CHOLEM
} from "./letters.mjs";
import * as English from "./english.mjs";

// TODO: Catalog the rest of the verb root vocabulary

export class Hebrew {
    constructor(letterInfo, vocabulary, paradigms) {
        this.letterInfo = letterInfo;
        this.letters = new Letters(letterInfo);

        this.wordList = vocabulary.map(word => word.root);
        this.vocabulary = {};
        for (let word of vocabulary) {
            let wordCopy = Object.assign({}, word);
            delete wordCopy.root;
            this.vocabulary[word.root] = wordCopy;
        }

        this.paradigms = paradigms;
    }

    // Transliterate a word, changing each letter
    // to its appropriate Latin-alphabet analog
    transliterate(word) {
        let letts = this.lettersOf(word);
        let translit = "";
        let vowelP = [];
        let lastConsonant = "";
        for (let i = 0; i < letts.length; i++) {
            let letter = letts[i];
            let translitLetter = this.letters.transliterate(letter);

            // Do not pronounce silent alef (p. 83)
            if (letter == "א"
                && (i == letts.length - 1
                    || !this.letters.isVowel(letts[i + 1])))
                continue;

            // Strong dagesh doubles the last consonant.
            // Weak dagesh should have already been taken care of.
            if (letter == DAGESH) {
                if (!this.letters.isBegadkefat(letts[i - 1])
                    || vowelP[vowelP.length - 2])
                    translit += lastConsonant;
                continue;
            }

            // Do not pronounce silent sheva (p. 14)
            if (letter == SHEVA) {
                let lastVowel;
                if (letts[i - 2] == "א") {
                    lastVowel = letts[i - 3];
                } else {
                    lastVowel = letts[i - 2];
                }

                if (this.letters.isVowel(lastVowel)
                    && this.letters.isShort(lastVowel)
                    && lastVowel != SHEVA)
                {
                    vowelP.push(false);
                    continue;
                }
            }

            vowelP.push(this.letters.isVowel(letter));

            if (typeof translitLetter == "string") {
                if (this.letters.isConsonant(letter))
                    lastConsonant = translitLetter;
                translit += translitLetter;
            } else {
                if (letts[i + 1] == DAGESH) {
                    lastConsonant = translitLetter[1];
                    translit += translitLetter[1];
                } else {
                    translit += translitLetter[0];
                }
            }
        }
        return translit;
    }

    // Find a root's weak parts
    weaknesses(rootStr) {
        let weaknesses = [];

        if (rootStr == "לקח") {
            weaknesses.push("Irregular");
        }

        let root = this.lettersOf(rootStr);

        if (this.letters.isGuttural(root[0])) {
            weaknesses.push("I Guttural");
        } else if (root[0] == "נ") {
            weaknesses.push("I Nun");
        } else if (root[0] == "י") {
            weaknesses.push("I Yod");
        }

        if (this.letters.isGuttural(root[1])) {
            weaknesses.push("II Guttural");
        }

        if (root[2] == "א") {
            weaknesses.push("III Alef");
        } else if (root[2] == "ה") {
            weaknesses.push("III Hey");
        }

        if (weaknesses.length == 0) weaknesses.push("Strong");

        return weaknesses;
    }

    // Translate a root to its English meaning(s)
    translateRoot(root, past, singular, firstPerson) {
        let translations = [];
        let vocabEntry = this.vocabulary[root];
        let entries = vocabEntry ? vocabEntry.translations : [];
        for (let entry of entries) {
            translations.push(English.conjugate(entry, past, singular, firstPerson));
        }
        return translations;
    }

    // Create a <span> element of Hebrew
    // text with a transliteration rollover
    span(text) {
        let span = document.createElement("span");
        span.innerText = text;
        span.title = this.transliterate(text);
        span.className = "hebrewText";
        return span;
    }

    // Split Hebrew text into a list of letters
    lettersOf(text) {
        let letts = [];
        for (let i = 0; i < text.length; i++) {
            let doubleLetter = text.slice(i, i + 2);
            if (this.letterInfo[doubleLetter]) {
                letts.push(doubleLetter);
                i++;
                continue;
            }
            let singleLetter = text[i];
            if (this.letterInfo[singleLetter]) {
                letts.push(singleLetter);
            }
        }
        return letts;
    }
}

export class Verb {
    constructor(hb, rootStr, perf, pers, sing, masc) {
        this.hb = hb;
        this.l = hb.letters;

        this.root = hb.lettersOf(rootStr);
        this.weaknesses = hb.weaknesses(rootStr);
        this.letts = this.root.slice();

        this.perfect = perf;
        this.person = pers;
        this.singular = sing;
        this.masculine = masc;

        this.summary = document.createElement("div");
    }

    /**
     * @param {String} str
     */
    get str() {
        let letts = this.letts.slice();

        // Change the last letter to its final form,
        // if applicable
        for (let i = letts.length - 1; i >= 0; i--) {
            let letter = letts[i];
            if (this.l.isConsonant(letter)
                || (this.l.isVowel(letter)
                    && this.l.isLong(letter)))
            {
                if (this.l.hasFinalForm(letter)) {
                    let replacement = this.l.finalForm(letter);
                    letts.splice(i, 1, replacement);
                }
                break;
            }
        }

        return letts.join("");
    }

    set str(str) {
        this.letts = this.hb.lettersOf(str);
    }

    toString() {
        return this.str;
    }

    // Translate the verb to its English meaning(s)
    translate() {
        let conjugations = this.hb.translateRoot(
            this.root.join(""),
            this.perfect,
            false, /* this.singular && this.person != 2, */
            this.person == 1
        );
        let g = this.masculine ? "m" : "f";
        let n = this.singular ? "s" : "p";
        let pronoun = "";
        if (this.person == 1) pronoun = this.singular ? "I " : "we ";
        if (this.person == 2) pronoun = "you (" + g + n + ") ";
        if (this.person == 3) {
            if (this.singular) {
                pronoun = this.masculine ? "he/it " : "she/it ";
            } else {
                pronoun = "they ";
                if (!this.perfect) pronoun += "(" + g + ") ";
            }
        }
        if (!this.perfect) pronoun += "will ";
        return pronoun + conjugations.join(", ");
    }

    // Conjugate a Hebrew word form
    conjugate(perf, pers, sing, masc) {

        // TODO: Define these functions

        // Don't try to conjugate unknown weaknesses
        if (this.weaknesses.includes("II Guttural")
            || this.weaknesses.includes("I Yod")
            || this.weaknesses.includes("Hollow")
            || this.weaknesses.includes("Geminate"))
        {
            this.addStep(
                "Ummm...",
                ":(",
                ":(",
                "This root has irregularities I haven't studied yet--it shouldn't be in this list.",
            )
            return this;
        }

        // Add vowels to root
        this.createBaseForm();

        // Compensatory lengthening (p. 25)
        // TODO: Make this rule apply more generally
        this.applyIIIGuttural();

        // III Hey??
        // Mutate root as needed

        // Add prefix and suffix
        this.addAffixes();

        // I Guttural, III Alef, III Hey
        this.applyIGuttural();
        // "a"-ify/lengthen vowels

        // I Nun 
        this.applyINun();

        // LQCH irregular root
        this.applyLQCH();

        // Assimilate Nuns
        this.assimilateNun();

        // Assimilate double letters
        // TODO!!
        // this.assimilateDoubles();

        // TODO: find why this happens; see if it happens with other letters
        if (this.letts.slice(-1) == "כ") {
            this.letts.push(SHEVA);
        }

        // Finalize the spelling
        this.finalize();

        return this;
    }

    addStep(title, before, after, ...rules) {
        let stepDiv = document.createElement("div");

        let h = document.createElement("h4");
        h.innerText = title;
        stepDiv.append(h);

        for (let rule of rules) {
            let p = document.createElement("p");
            if (typeof rule == "string") {
                p.append(rule);
            } else {
                let u, i, desc = rule[1];

                if (rule[0]) {
                    desc = " " + desc;

                    u = document.createElement("u");
                    u.innerText = rule[0] + ":";
                }

                if (rule[2]) {
                    desc += " ";

                    i = document.createElement("i");
                    i.innerText = "(" + rule[2] + ")";
                }

                p.append(...[u, desc, i].filter(x => x));
            }
            stepDiv.append(p);
        }

        let comparison = document.createElement("p");
        comparison.append(
            before,
            " --> ",
            after,
        )
        stepDiv.append(comparison);

        this.summary.append(stepDiv);
    }

    createBaseForm() {
        let before = this.hb.span(this.str);

        let description = (
            "First, we will create the base form of the qal "
            + (this.perfect ? "perfect" : "imperfect")
            + " paradigm, with "
        );
        if (this.perfect) {
            this.letts = [
                this.letts[0], QAMETS,
                this.letts[1], PATACH,
                this.letts[2]
            ];
            description += "qamets and patach.";
        } else {
            let themeVowel = this.themeVowel();
            this.letts = [
                this.letts[0], SHEVA,
                this.letts[1], themeVowel,
                this.letts[2]
            ];
            description += "sheva and the theme vowel (which is ";
            if (themeVowel == PATACH) {
                // TODO: describe XXX
                description += "patach, because of XXX).";
            } else {
                description += "cholem, as usual).";
            }
        }

        this.addStep(
            "Creating the base form",
            before,
            this.hb.span(this.str),
            description,
        );

        this.baseForm = this.letts.slice();
        return this;
    }

    applyIIIGuttural() {
        let before = this.hb.span(this.str);

        if (this.letts[4] == "א" || this.letts[4] == "ה") {
            this.letts[3] = QAMETS;
            let weakLetter = this.l.name(this.letts[4]);

            let description = (
                "The "
                + weakLetter
                + " in the final position of this root requires "
                + "us to change the patach to a qamets."
            );
    
            weakLetter = weakLetter[0].toUpperCase() + weakLetter.slice(1);
            let title = (
                "III "
                + weakLetter
                + ": Vowel length compensation"
            );
    
            this.addStep(
                title,
                before,
                this.hb.span(this.str),
                description,
            );
        }

        return this;
    }

    addAffixes() {
        let before = this.hb.span(this.str);

        let form = this.hb.paradigms.qal
        [this.perfect ? "perfect" : "imperfect"]
        [this.singular ? "singular" : "plural"]
        [this.person];
        if (form.m) form = form[this.masculine ? "m" : "f"];

        let prefix = form[0] || "";
        let suffix = form[1] || "";

        let description = (
            "Now, we create the form for the verb"
            + (prefix
                ? (suffix
                    ? ", adding a prefix and a suffix"
                    : ", adding a prefix")
                : (suffix
                    ? ", adding a suffix"
                    : ". Lucky for us, this is the perfect 3ms form--"
                      + "we don't have to change anything!"))
        );

        if ([
            "ָה",
            "וּ",
            "ִי"
        ].includes(suffix)) {
            description += (
                " and shortening the "
                + this.l.name(this.letts[3])
                + " into a sheva"
            );
            this.letts[3] = SHEVA;
        } else if ([
            "ְתֶמ",
            "ְתֶנ"
        ].includes(suffix)) {
            description += (
                " and shortening the "
                + this.l.name(this.letts[1])
                + " into a sheva"
            );
            this.letts[1] = SHEVA;
        }

        // TODO: Make exception for III Hey, III Alef
        if (suffix && suffix[1] == "ת")
            suffix = suffix.slice(0, 2) + DAGESH + suffix.slice(2);

        if (prefix || suffix) description += ".";

        this.baseForm = this.letts.slice();

        this.str = prefix + this.str + suffix;

        this.addStep(
            "Adding affixes",
            before,
            this.hb.span(this.str),
            description,
        );

        return this;
    }

    applyIGuttural() {
        if (this.weaknesses.includes("I Guttural")
            && this.baseForm[1] == SHEVA)
        {
            let before = this.hb.span(this.str);

            let description =
                "Gutturals such as "
                + this.l.name(this.root[0])
                + " can't take a sheva. ";

            if (!this.perfect) {
                if (this.singular && this.person == 1) {
                    description +=
                        "Ordinarily, they attract a-class vowels, "
                        + "but in this case the aleph's segol wins out, "
                        + "so we change the sheva to a chatef-segol.";
                    this.letts[1] = SEGOL;
                    this.letts[3] = CHATEF_SEGOL;
                } else {
                    if (this.letts[5] == SHEVA) {
                        description +=
                            "Instead, they attract a-class vowels. "
                            + "The next vowel is a sheva, "
                            + "which is a sure sign we'll use a patach, "
                            + "not a chatef-patach.";
                        this.letts[3] = PATACH;
                    } else {
                        description += 
                            "Instead, they attract a-class vowels, "
                            + "so we change the sheva to a chatef-patach.";
                        this.letts[3] = CHATEF_PATACH;
                    }
                    description +=
                        " The chireq in the prefix also changes to a patach.";
                    this.letts[1] = PATACH;
                }
            } else {
                description += 
                    "Instead, they attract a-class vowels, "
                    + "so we change the sheva to a chatef-patach. ";
                this.letts[1] = CHATEF_PATACH;
            }

            this.addStep(
                "I Guttural: \"a\" attraction",
                before,
                this.hb.span(this.str),
                description,
            );
        }

        return this;
    }

    applyINun() {
        if (this.root[0] == "נ" && !this.perfect) {
            // Record state of word beforehand
            let before = this.hb.span(this.str);

            // Find the nun
            for (let i = 1; i < this.letts.length - 1; i++) {
                if (this.letts[i] == "נ" && this.letts[i + 1] == SHEVA) {
                    // Get rid of it
                    this.letts.splice(i, 2);

                    // Put the dagesh in
                    this.letts.splice(i + 1, 0, DAGESH);

                    break;
                }
            }

            this.addStep(
                "I Nun",
                before,
                this.hb.span(this.str),
                "This root is a I Nun root; in the imperfect paradigm, the "
                + "nun is assimilated into the next consonant as a strong dagesh.",
            );
        }

        return this;
    }

    applyLQCH() {
        if (this.root.join("") == "לקח" && !this.perfect) {
            // Record state of word beforehand
            let before = this.hb.span(this.str);

            // Find the nun
            for (let i = 0; i < this.letts.length - 1; i++) {
                if (this.letts[i] == "ל" && this.letts[i + 1] == SHEVA) {
                    // Get rid of it
                    this.letts.splice(i, 2);

                    // Put the dagesh in
                    this.letts.splice(i + 1, 0, DAGESH);

                    break;
                }
            }

            this.addStep(
                "Irregular root: לקח",
                before,
                this.hb.span(this.str),
                "This root is irregular; in the imperfect paradigm, the "
                + "lamed is assimilated into the next consonant as a strong dagesh.",
            );
        }

        return this;
    }

    assimilateNun() {
        // Record state of word beforehand
        let before = this.hb.span(this.str);

        let nunFound = false;

        // Find short vowel + nun + sheva
        for (let i = 0; i < this.letts.length - 2; i++) {
            if (this.letts[i] == "נ"
                && this.letts[i + 1] == SHEVA
                && this.letts[i + 2] == "נ")
            {
                // Get rid of it
                this.letts.splice(i, 2);

                // Put the dagesh in
                this.letts.splice(i + 1, 0, DAGESH);

                nunFound = true;
            }
        }

        if (nunFound) this.addStep(
            "Nun assimilation",
            before,
            this.hb.span(this.str),
            "This word has a double nun, which is spelled with a dagesh.",
        );

        return this;
    }

    // Add weak dageshes where necessary.
    finalize() {
        // Record state of word beforehand
        let before = this.hb.span(this.str);
        let description = [];

        // Add weak dageshes where applicable
        let changed = false;
        /* for (let i = 0; i < this.letts.length; i++) {
            if (this.l.isBegadkefat(this.letts[i])
                && this.letts[i + 1] != DAGESH)
            {
                // If this isn't the first letter, we need to make sure
                // the letter comes after a closed syllable.
                if (i > 0) {
                    let offset = 1;
                    let lastLetter = this.letts[i - 1];

                    // If there is a silent alef, look back one more letter
                    if (i > 1 && lastLetter == "א") {
                        offset = 2;
                        lastLetter = this.letts[i - 2];
                    }

                    // If this is a vocal vowel, there is no need to add a dagesh.
                    if (lastLetter == SHEVA) {
                        // For sheva, check whether it is silent or vocal

                        // Position of sheva
                        let j = i - offset;

                        if (j > 1) {
                            let lastLastLetter = this.letts[j - 2];

                            // If there is a silent alef, look back one more letter
                            if (j > 2 && lastLastLetter == "א") {
                                lastLastLetter = this.letts[j - 3];
                            }

                            // Short and silent
                            if (!this.l.isVowel(lastLastLetter)
                                || !this.l.isShort(lastLastLetter))
                            {
                                // It's vocal. No dagesh.
                                continue;
                            }
                        } else {
                            // It's vocal. No dagesh.
                            continue;
                        }
                    } else {
                        // Non-sheva vowels are vocal. No dagesh.
                        if (this.l.isVowel(lastLetter))
                            continue;
                    }
                }

                // Add a weak dagesh
                this.letts.splice(i + 1, 0, DAGESH);
                changed = true;
                i++;
            }
        } */
        if (this.l.isBegadkefat(this.letts[0])
            && !this.letts[1] != DAGESH) {
            this.letts.splice(1, 0, DAGESH);
            changed = true;
        }
        if (changed) description.push(
            "add a weak dagesh to the first letter, since it is a Begadkefat."
        );

        if (description.length > 0 ) this.addStep(
            "Last steps",
            before,
            this.hb.span(this.str),
            "Finally, we " + description.join(" and ") + ".",
        );

        return this;
    }

    // Return the theme vowel of the root
    themeVowel() {
        if (this.l.isGuttural(this.root[2])) return PATACH;
        return CHOLEM;
    }
}
