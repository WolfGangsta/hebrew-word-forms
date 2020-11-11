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

    // Change the final consonant of a Hebrew word
    // to its final form (if applicable) and
    // add weak dageshes where necessary.
    finalize(word) {
        let letts = this.lettersOf(word);

        // Add a weak dagesh to the first letter if it is Begadkefat
        // TODO: Do this for everywhere there should be a weak dagesh
        if (this.letters.isBegadkefat(letts[0]) && letts[1] != DAGESH) {
            letts.splice(1, 0, DAGESH);
            word = letts.join("");
        }

        for (let i = letts.length - 1; i >= 0; i--) {
            let letter = letts[i];
            if (this.letters.isConsonant(letter)
                || (this.letters.isVowel(letter)
                    && this.letters.isLong(letter)))
            {
                if (this.letters.hasFinalForm(letter)) {
                    let replacement = this.letters.finalForm(letter);
                    return (
                        letts.slice(0, i).join('')
                        + replacement
                        + letts.slice(i + 1).join('')
                    );
                }
                return word;
            }
        }
        return word;
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
            if (letter == SHEVA
                && i > 1
                && this.letters.isVowel(letts[i - 2])
                && this.letters.isShort(letts[i - 2]))
            {
                vowelP.push(false);
                continue;
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
                    i++;
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

    // Return the theme vowel of a root
    themeVowel(root) {
        let letts = this.lettersOf(root);
        if (this.letters.isGuttural(letts[2])) return PATACH;
        return CHOLEM;
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
    
    // Split a word into a list of letters
    lettersOf(word) {
        let letts = [];
        for (let i = 0; i < word.length; i++) {
            let doubleLetter = word.slice(i, i + 2);
            if (this.letterInfo[doubleLetter]) {
                letts.push(doubleLetter);
                i++;
                continue;
            }
            let singleLetter = word[i];
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
        {
            if (this.perfect) {
                this.letts = [
                    this.letts[0], QAMETS,
                    this.letts[1], PATACH,
                    this.letts[2]
                ];
            } else {
                this.letts = [
                    this.letts[0], SHEVA,
                    this.letts[1], this.hb.themeVowel(this.root),
                    this.letts[2]
                ];
            }
        }

        // I Nun, III Hey??
        // Mutate root as needed
        // if (this.letts[0] == "נ") {
        //     this.letts = [
        //         this.letts[2],
        //         DAGESH,
        //         this.letts[3],
        //         this.letts[4]
        //     ];
        // }

        // Add prefix and suffix
        let form = this.hb.paradigms.qal
        [this.perfect ? "perfect" : "imperfect"]
        [this.singular ? "singular" : "plural"]
        [this.person];
        if (form.m) form = form[this.masculine ? "m" : "f"];

        this.str = (form[0] || "") + this.str + (form[1] || "");

        // Compensatory lengthening (p. 25)
        // TODO: Make this rule apply more generally
        if (this.letts[4] == "א" || this.letts[4] == "ה") {
            this.letts[3] = QAMETS;
        }

        // Shorten vowels

        // I Guttural, III Alef, III Hey
        // "a"-ify/lengthen vowels

        // I Nun 
        this.applyINun();

        // LQCH irregular root

        this.assimilateNun();

        // TODO: find why this happens; see if it happens with other letters
        if (this.letts.slice(-1) == "כ") {
            this.letts.push(SHEVA);
        }

        // er... a bit strange. Put finalize in Word?
        this.str = this.hb.finalize(this.str);

        return this;
    }

    applyINun() {
        if (this.root[0] == "נ" && !this.perfect) {
            // Update summary
            let INun = document.createElement("div");
            let title = document.createElement("h3");
            title.innerText = "I Nun";
            let p = document.createElement("p");
            p.append(
                "This root is a I Nun root; in the perfect paradigm, the nun is assimilated into the next consonant as a dagesh:",
                this.hb.span(this.str),
                " --> ",
            );

            // Find the nun
            for (let i = 0; i < this.letts.length - 1; i++) {
                if (this.letts[i] == "נ" && this.letts[i + 1] == SHEVA) {
                    // Get rid of it
                    this.letts.splice(i, 2);

                    // Put the dagesh in
                    this.letts.splice(i + 1, 0, DAGESH);

                    break;
                }
            }

            p.append(
                this.hb.span(this.str),
                ".",
            );
            INun.append(title, p);
            this.summary.append(INun);
        }

        return this;
    }

    assimilateNun() {
        let assimNun = document.createElement("div");
        let title = document.createElement("h3");
        title.innerText = "Nun assimilation";
        let p = document.createElement("p");
        p.append(
            "This word has a nun with a sheva, which assimilates into the next consonant as a dagesh: ",
            this.hb.span(this.str),
            " --> ",
        );

        let nunFound = false;

        // Find short vowel + nun + sheva
        for (let i = 0; i < this.letts.length - 2; i++) {
            if (this.letts[i] == "נ"
                && this.letts[i + 1] == SHEVA)
            {
                // Get rid of it
                this.letts.splice(i, 2);

                // Put the dagesh in
                this.letts.splice(i + 1, 0, DAGESH);

                nunFound = true;
            }
        }

        p.append(
            this.hb.span(this.str),
            ".",
        );
        assimNun.append(title, p);
        if (nunFound) this.summary.append(assimNun);

        return this;
    }
}
