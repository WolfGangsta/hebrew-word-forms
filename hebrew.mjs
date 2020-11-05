import { Letters, DAGESH } from "./letters.mjs";
import * as English from "./english.mjs";

// TODO: Catalog the rest of the verb root vocabulary

export default class Hebrew {
    constructor(letterInfo, vocabulary) {
        this.letterInfo = letterInfo;
        this.letters = new Letters(letterInfo);

        this.wordList = vocabulary.map(word => word.root);
        this.vocabulary = {};
        for (let word of vocabulary) {
            let wordCopy = Object.assign({}, word);
            delete wordCopy.root;
            this.vocabulary[word.root] = wordCopy;
        }
        console.log(this.vocabulary);
    }

    // Change the final consonant of a Hebrew word
    // to its final form (if applicable) and
    // TODO: fold repeated letters into one with a dagesh
    finalize(word) {
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

    // Transliterate a word, changing each letter
    // to its appropriate Latin-alphabet analog
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

    // Translate a root to its English meaning(s)
    translate(root, past, singular) {
        // TODO: Use all translations, not just the first one
        let translations = [];
        let entries = this.vocabulary[root].translations;
        for (let entry of entries) {
            translations.push(English.conjugate(entry, past, singular));
        }
        return translations;
    }

    // Return the theme vowel of a root
    themeVowel(root) {
        // TODO: change to patach when appropriate
        return CHOLEM;
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