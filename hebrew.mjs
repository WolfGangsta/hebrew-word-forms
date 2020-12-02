import {
    Letters,
    DAGESH, SHEVA,
    CHATEF_PATACH, CHATEF_SEGOL,
    PATACH, SEGOL,
    QAMETS, TSERE, CHOLEM
} from "./letters.mjs";
import * as English from "./english.mjs";

export const
    IRREGULAR = 0,
    I = 1,
    II = 2,
    III = 3,
    HOLLOW = 4,
    GEMINATE = 5;

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
        weaknesses.length = 4;

        if (this.vocabulary[rootStr])
            weaknesses[IRREGULAR] = this.vocabulary[rootStr].irregular;

        let root = this.lettersOf(rootStr);

        // I
        if (root[0] == "א") {
            weaknesses[I] = "Alef";
        } else if (this.letters.isGuttural(root[0])) {
            weaknesses[I] = "Guttural";
        } else if (root[0] == "נ") {
            weaknesses[I] = "Nun";
        } else if (root[0] == "י") {
            weaknesses[I] = "Yod";
        }

        // II
        if (this.letters.isGuttural(root[1])) {
            weaknesses[II] = "Guttural";
        }

        // III
        if (root[2] == "א") {
            weaknesses[III] = "Alef";
        } else if (root[2] == "ה") {
            weaknesses[III] = "Hey";
        } else if (this.letters.isGuttural(root[2])) {
            weaknesses[III] = "Guttural";
        }

        return weaknesses;
    }

    makeReadable(weaknesses) {
        let readable = [];
        if (weaknesses[IRREGULAR])
            readable.push("Irregular");
        if (weaknesses[I])
            readable.push("I " + weaknesses[I]);
        if (weaknesses[II])
            readable.push("II " + weaknesses[II]);
        if (weaknesses[III])
            readable.push("III " + weaknesses[III]);
        if (readable.length == 0)
            readable.push("Regular");
        return readable;
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

        this.rootStr = rootStr;
        this.root = hb.lettersOf(rootStr);
        this.weaknesses = hb.weaknesses(rootStr);
        this.readableWeaknesses = hb.makeReadable(this.weaknesses);
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
        return this.letts.join("");
    }

    set str(str) {
        this.letts = this.hb.lettersOf(str);
    }

    toString() {
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

        // Don't try to conjugate unknown weaknesses
        if (this.weaknesses[II] == "Guttural"
            || this.weaknesses[HOLLOW]
            || this.weaknesses[GEMINATE]
            || (!this.perfect
                && (this.weaknesses[I] == "Yod"
                    || this.weaknesses[I] == "Alef"
                    || this.root == "הלכ")))
        {
            this.addStep(
                "Ummm...",
                ":(",
                ":(",
                "This root has irregularities that aren't supported yet. Sorry!",
            )
            return this;
        }

        // Add vowels to root
        this.createBaseForm();

        // Add prefix and suffix
        this.addAffixes();

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
        let before = this.hb.span(this.toString());
        let rules = [];

        let description = (
            "First, we will create the base form of the qal "
            + (this.perfect ? "perfect" : "imperfect")
            + " paradigm, with "
        );

        // Add vowels
        if (this.perfect) {
            this.letts = [
                this.letts[0], QAMETS,
                this.letts[1], PATACH,
                this.letts[2]
            ];
            description += "qamets and patach.";

            // III Alef & III Hey
            if (this.weaknesses[III] == "Alef"
                || this.weaknesses[III] == "Hey")
            {
                this.letts[3] = QAMETS;

                let weakLetter = this.l.name(this.letts[4]);
                let weakLetterCaps = weakLetter[0].toUpperCase() + weakLetter.slice(1);
                let title = "III " + weakLetterCaps;
                let desc =
                    "The patach is lengthened to a qamets "
                    + "due to compensatory lengthening.";
                let lesson = "14.8"; // TODO: Is it still called that for III Hey??

                let rule = [
                    title,
                    desc,
                    lesson,
                ];

                rules.push(rule);
            }
        } else {
            let themeVowel = this.themeVowel();
            this.letts = [
                this.letts[0], SHEVA,
                this.letts[1], themeVowel,
                this.letts[2]
            ];
            description += "sheva and the theme vowel.";

            let weakness, rule, lesson;
            if (themeVowel == PATACH) {
                if (this.weaknesses[II] == "Guttural") {
                    if (this.weaknesses[III] == "Guttural") {
                        weakness = "II/III Guttural";
                        lesson = "11.4, ???"; // TODO: Find ???
                    } else {
                        weakness = "II Guttural";
                        lesson = "???"; // TODO: Find ???
                    }
                } else {
                    weakness = "III Guttural";
                    lesson = "11.4";
                }
                rule = "The theme vowel is patach, because gutturals attract the \"a\"-sound.";
            } else if (themeVowel == SEGOL) {
                weakness = "III Hey";
                rule = "The theme vowel is segol.";
                lesson = "see 15.7";
            } else if (themeVowel == QAMETS) {
                weakness = "III Alef";
                rule = "The theme vowel, like a III Guttural, is \"a\"-class, "
                    + "but it is a qamets instead of a patach "
                    + "due to compensatory lengthening.";
                lesson = "14.9";
            } else if (themeVowel == TSERE) {
                // TODO: acknowledge I Yod (Vav) instance of TSERE
                weakness = "Irregular";
                rule = "The theme vowel of נתנ, like a I Yod (Vav) root, is tsere.";
                lesson = "box below 17.3";
            } else {
                weakness = "Regular";
                rule = "The theme vowel is cholem.";
                lesson = "11.4";
            }
            rules.push([
                weakness,
                rule,
                lesson,
            ]);
        }
        rules.unshift(description);

        this.addStep(
            "Creating the base form",
            before,
            this.hb.span(this.toString()),
            ...rules,
        );

        return this;
    }

    addAffixes() {
        let before = this.hb.span(this.toString());
        let rules = [];

        let form = this.hb.paradigms.qal
        [this.perfect ? "perfect" : "imperfect"]
        [this.singular ? "singular" : "plural"]
        [this.person];
        if (form.m) form = form[this.masculine ? "m" : "f"];

        let prefix = form[0] || "";
        let suffix = form[1] || "";

        let description = "Now, we create the form for the verb";
        description += (
            prefix
                ? (suffix
                    ? ", adding a prefix and a suffix"
                    : ", adding a prefix")
                : (suffix
                    ? ", adding a suffix"
                    : ". Lucky for us, the perfect 3ms form "
                      + "doesn't have a prefix or a suffix!")
        );

        if ([
            "ָה",
            "וּ",
            "ִי"
        ].includes(suffix)) {
            if (this.weaknesses[III] != "Hey"
                || suffix == "ָה")
            {
                description += (
                    " and shortening the "
                    + this.l.name(this.letts[3])
                    + " into a sheva"
                );
                this.letts[3] = SHEVA;
            }
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

        if (prefix || suffix) description += ".";
        rules.push(description);

        // I Guttural
        if (this.weaknesses[I] == "Guttural"
            && this.letts[1] == SHEVA)
        {
            let desc, lesson;

            if (this.perfect) {
                desc =
                    "Gutturals such as "
                    + this.l.name(this.root[0])
                    + " attract a-class vowels, "
                    + "so it has a chatef-patach instead of a sheva.";
                lesson = "14.5";
                this.letts[1] = CHATEF_PATACH;
            } else {
                lesson = "14.6";
                if (this.singular && this.person == 1) {
                    desc =
                        "Ordinarily, gutturals such as "
                        + this.l.name(this.root[0])
                        + " attract a-class vowels, "
                        + "but in this case the alef's segol wins out, "
                        + "so we change the sheva to a chatef-segol.";
                    // prefix = prefix[0] + SEGOL;
                    this.letts[1] = CHATEF_SEGOL;
                } else {
                    if (this.letts[3] == SHEVA) {
                        let name = this.l.name(this.root[0]);
                        desc =
                            "Gutturals such as "
                            + name
                            + " attract a-class vowels. "
                            + "The next vowel is a sheva, "
                            + "which is a sure sign the "
                            + name
                            + " has a patach, "
                            + "not a chatef-patach.";
                        this.letts[1] = PATACH;
                    } else {
                        desc = 
                            "Gutturals such as "
                            + this.l.name(this.root[0])
                            + " attract a-class vowels, "
                            + "so we change the sheva to a chatef-patach.";
                        this.letts[1] = CHATEF_PATACH;
                    }
                    desc +=
                        " The chireq in the prefix also changes to a patach.";
                    prefix = prefix[0] + PATACH;
                }
            }

            rules.push([
                "I Guttural",
                desc,
                lesson
            ]);
        }

        // III Hey
        if (this.weaknesses[III] == "Hey") {
            let rule, lesson;
            if (this.perfect) {
                // Perfect forms
                lesson = "15.6";
                if (this.person == 3) {
                    if (this.singular) {
                        if (this.masculine) {
                            // 3ms: lengthen patach?
                            this.letts[3] = QAMETS;
                            rule = "In the perfect 3ms form, the patach becomes a qamets."
                        } else {
                            // 3fs: replace hey with tav
                            this.letts[4] = "ת";
                            rule = "In the perfect 3ms form, "
                                + "the hey is replaced with a tav before the suffix is added.";
                        }
                    } else {
                        // 3cp: remove -ah
                        this.letts.splice(3, 2);
                        rule = "This form loses the qamets-hey entirely "
                            + "to make room for the long vowel suffix.";
                    }
                } else {
                    // All other perfect: replace -ah with -iy
                    this.letts.splice(3, 2, "ִי");
                    rule = "This form, like most perfect forms, replaces the qamets-hey with a chireq-yod.";
                }
            } else {
                // Imperfect forms
                lesson = "15.7";
                if ([
                    "וּ",
                    "ִי"
                ].includes(suffix)) {
                    // long vowel suffix: remove -ah
                    this.letts.splice(3, 2);
                    rule = "This form loses the segol-hey entirely "
                    + "to make room for the long vowel suffix.";
                    lesson = "15.6-7";
        } else if (suffix == "ְנָה") {
                    // 3fp, 2fp: replace -ah with -ey
                    this.letts.splice(3, 2, "ֶי");
                    rule = "The 3fp and 2fp forms replace the segol-hey with a segol-yod.";
                }
            }
            if (rule) rules.push([
                "III Hey",
                rule,
                lesson,
            ])
        }

        // III Alef, III Hey
        if (this.weaknesses[III] == "Alef"
            || this.weaknesses[III] == "Hey")
        {
            if (suffix && [
                "ת",
                "נ"
            ].includes(suffix[1])) {
                // Remove sheva from tav or nun suffix
                suffix = suffix.slice(1);
                if (this.weaknesses[III] == "Alef") {
                    rules.push([
                        "III Alef",
                        "When an alef closes a syllable, it is silent. "
                        + "This means it cannot have a sheva.",
                        "14.8"
                    ]);
                } else {
                    rules.push([
                        "III Hey",
                        "In this case, the yod is part of a vowel, "
                        + "so it cannot take a sheva.",
                        "15.5"
                    ]);
                }

                // Explain no dagesh; remove
                // trailing sheva from perf 2fs
                if (suffix[0] == "ת") {
                    let rule, lesson;
                    rule = "Since the suffix follows a vowel";
                    if (this.weaknesses[III] == "Alef") {
                        lesson = this.perfect ? "14.8" : "14.9";
                    } else {
                        lesson = "15.6";
                    }
                    rule += ", we do not add a dagesh to the tav"
                    if (suffix[1] == SHEVA) {
                        suffix = suffix.slice(0, -1);
                        rule += " or a sheva after it.";
                    } else {
                        rule += ".";
                    }
                    rules.push([
                        "",
                        rule,
                        lesson,
                    ]);
                }

                // III Alef: segol in impf 3fp, 2fp
                if (this.weaknesses[III] == "Alef"
                    && suffix == "נָה")
                {
                    this.letts[3] = SEGOL;
                    rules.push([
                        "III Alef",
                        "In the imperfect 3fp and 2fp form, "
                        + "the vowel before the alef is segol.",
                        "14.9"
                    ])
                }
            }
        } else {
            // Add a dagesh to a tav suffix,
            // in non- III Hey and III Alef roots.
            if (suffix && suffix[1] == "ת") {
                suffix = suffix.slice(0, 2) + DAGESH + suffix.slice(2);
            }
        }

        // I Nun, Irregular לקח
        if ((
            this.weaknesses[I] == "Nun"
            || this.weaknesses[IRREGULAR] == "I Nun"
        ) && !this.perfect) {
            if (this.letts[1] == SHEVA) {
                // Get rid of letter I
                this.letts.splice(0, 2);

                // Add dagesh to letter II
                this.letts.splice(1, 0, DAGESH);
            }

            if (this.weaknesses[I] == "Nun") {
                rules.push([
                    "I Nun",
                    "In the imperfect paradigm, the "
                    + "nun is assimilated into the next consonant as a strong dagesh.",
                    "15.3",
                ]);
            } else {
                rules.push([
                    "Irregular",
                    "This root acts like a I Nun root; in the imperfect paradigm, the "
                    + this.l.name(this.root[0])
                    + " is assimilated into the next consonant as a strong dagesh.",
                    "15.4", // TODO: Do any other words act like לקח?
                ]);
            }
        }

        this.str = prefix + this.str + suffix;

        this.addStep(
            "Adding affixes",
            before,
            this.hb.span(this.toString()),
            ...rules,
        );

        return this;
    }

    assimilateNun() {
        // Record state of word beforehand
        let before = this.hb.span(this.toString());

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
            this.hb.span(this.toString()),
            "This word has a double nun, which is spelled with a strong dagesh.",
        );

        return this;
    }

    // Add weak dageshes where necessary.
    finalize() {
        // Record state of word beforehand
        let before = this.hb.span(this.toString());
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
            this.hb.span(this.toString()),
            "Finally, we " + description.join(" and ") + ".",
        );

        return this;
    }

    // Return the theme vowel of the root
    themeVowel() {
        // Override
        if (this.themeVowelOverride) return this.themeVowelOverride;

        // Irregular
        if (this.hb.vocabulary[this.rootStr].themeVowel)
            return this.hb.vocabulary[this.rootStr].themeVowel;

        // III Hey
        if (this.weaknesses[III] == "Hey")
            return SEGOL;

        // III Alef
        if (this.weaknesses[III] == "Alef")
            return QAMETS;

        // Guttural II, Guttural III (?)
        if (this.weaknesses[II] == "Guttural"
            || this.weaknesses[III] == "Guttural")
            return PATACH;

        // I Yod (Vav)
        if (this.weaknesses[I] == "Yod"
            && true)
            return TSERE;

        // Regular
        return CHOLEM;
    }
}
