import { Letters, DAGESH } from "./letters.mjs";

// TODO: Catalog the rest of the verb root vocabulary

export default class Hebrew {
    constructor(letterInfo, vocabulary) {
        this.letterInfo = letterInfo;
        this.vocabulary = vocabulary;
        this.letters = new Letters(letterInfo);
    }
    // Change the final consonant of a Hebrew word
    // to its final form, if applicable.
    finalLetterForm(word) {
        let letts = this.lettersOf(word);
        for (let i = letts.length - 1; i >= 0; i--) {
            let letter = letts[i];
            if (this.letters.isConsonant(letter)) {
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

    transliterate(word) {
        let letts = this.lettersOf(word);
        let translit = "";
        for (let i = 0; i < letts.length; i++) {
            let letter = letts[i];
            let translitLetter = this.letters.transliterate(letter);
            // TODO: Treat dageshes correctly
            if (typeof translitLetter == "string") {
                translit += translitLetter;
            } else {
                if (letts[i + 1] == DAGESH) {
                    translit += translitLetter[1];
                    i++;
                } else {
                    translit += translitLetter[0];
                }
            }
        }
        return translit;
    }

    translate(word, past, singular) {
        // TODO: Use all translations, not just the first one
        let entry = this.vocabulary[word].translations[0];
        if (past) {
            if (typeof entry == "string") {
                if (entry.slice(-1) == "e") {
                    return entry + "d";
                } else {
                    return entry + "ed";
                }
            } else {
                return entry[1];
            }
        } else if (singular) {
            if (typeof entry == "string") {
                // TODO: Have better -s suffix-adding system
                if (["sh", "ch"].includes(entry.slice(-1))
                    || entry.slice(-2, -1) == entry.slice(-1)) {
                    return entry + "es";
                } else {
                    return entry + "s";
                }
            } else {
                entry = entry[0];
                if (typeof entry == "string") {
                // TODO: Have better -s suffix-adding system
                if (["sh", "ch"].includes(entry.slice(-1))
                    || entry.slice(-2, -1) == entry.slice(-1)) {
                    return entry + "es";
                } else {
                    return entry + "s";
                }
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

    // Return the theme vowel of a root.
    themeVowel(root) {
        // TODO: change to patach when appropriate
        return CHOLEM;
    }

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