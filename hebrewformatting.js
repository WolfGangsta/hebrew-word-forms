const
    SHEVA = "ְ",
    DAGESH = "ּ",
    CHATEF_SEGOL = "ֱ",
    CHATEF_PATACH = "ֲ",
    CHATEF_QAMETS = "ֳ",
    CHIREQ = "ִ",
    TSERE = "ֵ",
    SEGOL = "ֶ",
    PATACH = "ַ",
    QAMETS = "ָ",
    CHOLEM = "ֹ",
    QIBBUTS = "ֻ",
    QAMETS_CHATUF = "ׇ",
    CHIREQ_YOD = "ִי",
    CHOLEM_VAV = "וֹ",
    SHUREQ = "וּ";

// TODO: Transliterate sheva correctly!!
// TODO: Catalog the rest of the verb root vocabulary

let letterInfo;
let lettersRequest = new XMLHttpRequest();
lettersRequest.open("GET", "letters.json");
lettersRequest.responseType = "json";
lettersRequest.send();
lettersRequest.onload = function() {
    letterInfo = lettersRequest.response;
};

// Change the final consonant of a Hebrew word
// to its final form, if applicable.
function finalLetterForm(word) {
    let letters = lettersOf(word);
    for (let i = letters.length - 1; i >= 0; i--) {
        let letter = letters[i];
        if (isConsonant(letter)) {
            if (hasFinalForm(letter)) {
                let replacement = finalForm(letter);
                return (
                    letters.slice(0, i).join('')
                    + replacement
                    + letters.slice(i + 1).join('')
                );
            }
            return word;
        }
    }
    return word;
}

function transliterate(word) {
    let letters = lettersOf(word);
    let translit = "";
    for (let i = 0; i < letters.length; i++) {
        let letter = letters[i];
        let translitLetter = transliterateLetter(letter);
        // TODO: Treat dageshes correctly
        if (typeof translitLetter == "string") {
            translit += translitLetter;
        } else {
            if (letters[i+1] == DAGESH) {
                translit += translitLetter[1];
                i++;
            } else {
                translit += translitLetter[0];
            }
        }
    }
    return translit;
}

// Return the theme vowel of a root.
function themeVowel(root) {
    // TODO: change to patach when appropriate
    return CHOLEM;
}

function lettersOf(word) {
    let list = [];
    for (let i = 0; i < word.length; i++) {
        let doubleLetter = word.slice(i, i + 2);
        if (letterInfo[doubleLetter]) {
            list.push(doubleLetter);
            i++;
            continue;
        }
        let singleLetter = word[i];
        if (letterInfo[singleLetter]) {
            list.push(singleLetter);
        }
    }
    return list;
}

function isConsonant(letter) {
    return !!(
        letterInfo[letter]
        && !letterInfo[letter].isVowel
    );
}

function isGuttural(letter) {
    return !!(
        letterInfo[letter]
        && letterInfo[letter].isGuttural
    );
}

function isFinalForm(letter) {
    return !!(
        letterInfo[letter]
        && letterInfo[letter].isFinal
    );
}

function hasFinalForm(letter) {
    return !!(
        letterInfo[letter]
        && letterInfo[letter].final
    );
}

function finalForm(letter) {
    return letterInfo[letter].final;
}

function transliterateLetter(letter) {
    if (isFinalForm(letter)) {
        let reg = letterInfo[letter].regular;
        return letterInfo[reg].transliteration;
    }
    return letterInfo[letter].transliteration;
}
