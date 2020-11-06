export const
    DAGESH = "ּ",
    SHEVA = "ְ",
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

export class Letters {
    constructor(letterInfo) {
        this.info = letterInfo;
    }
    isConsonant(letter) {
        return this.info[letter].isFinal
            || this.info[letter].type == "consonant";
    }
    isVowel(letter) {
        return this.info[letter].type == "vowel";
    }
    isShort(letter) {
        return this.info[letter].length <= 1;
    }
    isGuttural(letter) {
        return this.info[letter].isGuttural
            || (this.info[letter].isFinal
                && this.info[this.info[letter].regular].isGuttural);
    }
    isBegadkefat(letter) {
        return this.info[letter].isBegadkefat
            || (this.info[letter].isFinal
                && this.info[this.info[letter].regular].isBegadkefat);
    }
    isFinalForm(letter) {
        return !!this.info[letter].isFinal;
    }
    hasFinalForm(letter) {
        return !!this.info[letter].final;
    }
    finalForm(letter) {
        return this.info[letter].final;
    }
    regularForm(letter) {
        return this.info[letter].regular;
    }
    transliterate(letter) {
        if (this.isFinalForm(letter)) {
            let reg = this.info[letter].regular;
            return this.info[reg].transliteration;
        }
        return this.info[letter].transliteration;
    }
}