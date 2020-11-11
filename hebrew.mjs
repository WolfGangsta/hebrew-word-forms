import { Letters, DAGESH, SHEVA, QAMETS, PATACH, CHOLEM } from "./letters.mjs";
import * as English from "./english.mjs";

// TODO: Catalog the rest of the verb root vocabulary

export default class Hebrew {
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
                pronoun = "they (" + g + ") ";
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
