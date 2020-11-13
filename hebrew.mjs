import { Letters, DAGESH, SHEVA, QAMETS, PATACH, CHOLEM } from "./letters.mjs";
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

    // Translate a word to its English meaning(s)
    translateWord(root, perfect, person, singular, masculine) {
        let conjugations = this.translateRoot(
            root,
            perfect,
            false, /* singular && person != 2, */
            person == 1
        );
        let g = masculine ? "m" : "f";
        let n = singular ? "s" : "p";
        let pronoun = "";
        if (person == 1) pronoun = singular ? "I " : "we ";
        if (person == 2) pronoun = "you (" + g + n + ") ";
        if (person == 3) {
            if (singular) {
                pronoun = masculine ? "he/it " : "she/it ";
            } else {
                pronoun = "they ";
                if (!perfect) pronoun += "(" + g + ") ";
            }
        }
        if (!perfect) pronoun += "will ";
        return pronoun + conjugations.join(", ");
    }

    // Translate a root to its English meaning(s)
    translateRoot(root, past, singular, firstPerson) {
        let translations = [];
        let entries = this.vocabulary[root].translations;
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

export class Word {
    constructor(hb, rootStr, perf, pers, sing, masc) {
        this.hb = hb;
        this.root = hb.lettersOf(rootStr);
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
        return this.letts.join("");
    }

    // Conjugate a Hebrew word form
    conjugate(perf, pers, sing, masc) {

        // TODO: Define these functions

        // Add vowels to root
        this.createBaseForm();

        // III Hey??
        // Mutate root as needed

        // Add prefix and suffix
        this.addAffixes();

        // Compensatory lengthening (p. 25)
        // TODO: Make this rule apply more generally
        if (this.letts[4] == "א" || this.letts[4] == "ה") {
            this.letts[3] = QAMETS;
        }

        // I Guttural, III Alef, III Hey
        // "a"-ify/lengthen vowels

        // I Nun 
        this.applyINun();

        // LQCH irregular root
        this.applyLQCH();

        // Assimilate Nuns
        this.assimilateNun();

        // TODO: find why this happens; see if it happens with other letters
        if (this.letts.slice(-1) == "כ") {
            this.letts.push(SHEVA);
        }

        // Finalize the spelling
        this.finalize();

        return this;
    }

    addSummary(title, description, before, after) {
        let sum = document.createElement("div");

        let h3 = document.createElement("h3");
        h3.innerText = title;

        let p = document.createElement("p");
        p.append(
            description,
            before,
            " --> ",
            after,
            ".",
        );

        sum.append(h3, p);
        this.summary.append(sum);
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
            description += "qamets and patach: ";
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
                description += "patach, because of XXX): ";
            } else {
                description += "cholem, as usual): ";
            }
        }

        this.addSummary(
            "Creating the base form",
            description,
            before,
            this.hb.span(this.str),
        );

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
                    : ". Lucky for us, this is the perfect 3ms form--we don't have to change anything! "))
        );

        if ([
            "ָה",
            "וּ",
            "ִי"
        ].includes(suffix)) {
            description += (
                " and shortening the "
                + this.hb.letters.name(this.letts[3])
                + " into a sheva"
            );
            this.letts[3] = SHEVA;
        } else if ([
            "ְתֶּם",
            "ְתֶּן"
        ].includes(suffix)) {
            description += (
                " and shortening the "
                + this.hb.letters.name(this.letts[1])
                + " into a sheva"
            );
            this.letts[1] = SHEVA;
        }
        if (prefix || suffix) description += ": ";

        this.str = prefix + this.str + suffix;

        this.addSummary(
            "Adding affixes",
            description,
            before,
            this.hb.span(this.str),
        );

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

            this.addSummary(
                "I Nun",
                "This root is a I Nun root; in the perfect paradigm, the nun is assimilated into the next consonant as a dagesh: ",
                before,
                this.hb.span(this.str),
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

            this.addSummary(
                "Irregular root: לקח",
                "This root is irregular; in the perfect paradigm, the lamed is assimilated into the next consonant as a dagesh: ",
                before,
                this.hb.span(this.str),
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

        if (nunFound) this.addSummary(
            "Nun assimilation",
            "This word has a double nun, which is spelled with a dagesh: ",
            before,
            this.hb.span(this.str),
        );

        return this;
    }

    // Change the final consonant
    // to its final form (if applicable) and
    // add weak dageshes where necessary.
    finalize() {
        // Record state of word beforehand
        let before = this.hb.span(this.str);
        let description = [];

        // Add a weak dagesh to the first letter if it is Begadkefat
        // TODO: Do this for everywhere there should be a weak dagesh
        if (this.hb.letters.isBegadkefat(this.letts[0])
            && this.letts[1] != DAGESH)
        {
            this.letts.splice(1, 0, DAGESH);
            description.push(
                "add a weak dagesh to the beginning "
                + this.hb.letters.name(this.letts[0])
            );
        }

        // Change the last letter to its final form,
        // if applicable
        for (let i = this.letts.length - 1; i >= 0; i--) {
            let letter = this.letts[i];
            if (this.hb.letters.isConsonant(letter)
                || (this.hb.letters.isVowel(letter)
                    && this.hb.letters.isLong(letter)))
            {
                if (this.hb.letters.hasFinalForm(letter)) {
                    let replacement = this.hb.letters.finalForm(letter);
                    this.letts.splice(i, 1, replacement);
                    description.push(
                        "change the last "
                        + this.hb.letters.name(letter)
                        + " to its final form"
                    );
                }
                break;
            }
        }

        if (description.length > 0 ) this.addSummary(
            "Last steps",
            "Finally, we " + description.join(" and ") + ": ",
            before,
            this.hb.span(this.str),
        );

        return this;
    }

    // Return the theme vowel of the root
    themeVowel() {
        if (this.hb.letters.isGuttural(this.root[2])) return PATACH;
        return CHOLEM;
    }
}
