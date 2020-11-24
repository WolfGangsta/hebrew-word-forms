import { Verb } from "./hebrew.mjs";
import { SEGOL, CHOLEM, PATACH, QAMETS } from "./letters.mjs";

const CONFUSE = {
    NUMBER: 0,
    GENDER: 1,
    TENSE: 2,
    THEME_VOWEL: 3,
    PERSON: 4,
    I: 5,
    III: 6,
    TOTAL: 7,
};

const VOWELS = [
    SEGOL,
    CHOLEM,
    PATACH,
    QAMETS,
];

export class Test {
    constructor(hb, questionDiv, answerDiv) {
        this.hb = hb;
        this.questionDiv = questionDiv;
        this.answerDiv = answerDiv;
        this.newQuestion();
    }

    newQuestion() {
        let i = Math.floor(Math.random() * this.hb.wordList.length);
        this.root = this.hb.wordList[i];
        this.perfect = Math.random() >= 0.5;
        this.person = Math.floor(Math.random() * 3) + 1;
        this.singular = Math.random() >= 0.5;
        this.masculine = Math.random() >= 0.5;

        // The correct word
        this.word = new Verb(
            this.hb, this.root, this.perfect,
            this.person, this.singular, this.masculine
        ).conjugate();

        let mistakes = [];
        let opts = [];
        do {
            do {
                mistakes[0] = Math.floor(Math.random() * CONFUSE.TOTAL);
                mistakes[1] = Math.floor(Math.random() * (CONFUSE.TOTAL - 1));
    
                if (mistakes[1] >= mistakes[0])
                    mistakes[1]++;
            } while (this.person == 1 && mistakes.includes(CONFUSE.PERSON))

            // The word with mistakes[0] made
            this.word0 = new Verb(
                this.hb, this.root, this.perfect,
                this.person, this.singular, this.masculine
            );

            // The word with mistakes[1] made
            this.word1 = new Verb(
                this.hb, this.root, this.perfect,
                this.person, this.singular, this.masculine
            );

            // The word with both mistakes made
            this.word01 = new Verb(
                this.hb, this.root, this.perfect,
                this.person, this.singular, this.masculine
            );

            // Make first mistake
            switch (mistakes[0]) {
                case CONFUSE.NUMBER:
                    this.word0.singular = !this.singular;
                    this.word01.singular = !this.singular;
                    break;
                case CONFUSE.GENDER:
                    this.word0.masculine = !this.masculine;
                    this.word01.masculine = !this.masculine;
                    break;
                case CONFUSE.TENSE:
                    this.word0.perfect = !this.perfect;
                    this.word01.perfect = !this.perfect;
                    break;
                case CONFUSE.THEME_VOWEL:
                    // Choose a random, wrong theme vowel
                    let randomThemeVowel;
                    do {
                        let i = Math.floor(Math.random() * VOWELS.length);
                        randomThemeVowel = VOWELS[i];
                    } while (randomThemeVowel == this.word.themeVowel())

                    this.word0.themeVowelOverride = randomThemeVowel;
                    this.word01.themeVowelOverride = randomThemeVowel;
                    break;
                case CONFUSE.PERSON:
                    // Confuse 2nd and 3rd person
                    this.word0.person = 5 - this.person;
                    this.word01.person = 5 - this.person;
                    break;
            }

            // Make second mistake
            switch (mistakes[1]) {
                case CONFUSE.NUMBER:
                    this.word1.singular = !this.singular;
                    this.word01.singular = !this.singular;
                    break;
                case CONFUSE.GENDER:
                    this.word1.masculine = !this.masculine;
                    this.word01.masculine = !this.masculine;
                    break;
                case CONFUSE.TENSE:
                    this.word1.perfect = !this.perfect;
                    this.word01.perfect = !this.perfect;
                    break;
                case CONFUSE.THEME_VOWEL:
                    // Choose a random, wrong theme vowel
                    let randomThemeVowel;
                    do {
                        let i = Math.floor(Math.random() * VOWELS.length);
                        randomThemeVowel = VOWELS[i];
                    } while (randomThemeVowel == this.word.themeVowel())

                    this.word1.themeVowelOverride = randomThemeVowel;
                    this.word01.themeVowelOverride = randomThemeVowel;
                    break;
                case CONFUSE.PERSON:
                    // Confuse 2nd and 3rd person
                    this.word1.person = 5 - this.person;
                    this.word01.person = 5 - this.person;
                    break;
                case CONFUSE.I:
                    // TODO
                    break;
                case CONFUSE.III:
                    // TODO
                    break;
            }

            // Conjugate words with mistakes
            this.word0.conjugate();
            this.word1.conjugate();
            this.word01.conjugate();

            opts = [
                this.word.toString(),
                this.word0.toString(),
                this.word1.toString(),
                this.word01.toString(),
            ];
        } while (
            opts[0] == opts[1]
            || opts[0] == opts[2]
            || opts[0] == opts[3]
            || opts[1] == opts[2]
            || opts[1] == opts[3]
            || opts[2] == opts[3]
        )

        this.options = opts;
        this.showQuestion();
    }

    showQuestion() {
        while (this.questionDiv.length > 0) {
            this.questionDiv.remove(this.questionDiv.children[0]);
        }

        let g;
        if (this.person == 1
            || (this.person == 3
                && this.singular
                && this.perfect
            )
        ) {
            g = "c";
        } else {
            g = this.masculine ? "m" : "f";
        }

        let n = this.singular ? "s" : "p";

        this.questionDiv.append(
            "What is the correct form for the root ",
            this.hb.span(this.root),
            " in the ",
            this.perfect ? "perfect " : "imperfect ",
            this.person.toString(), g, n,
            " form?",
        );
    }

    /**
     * @param {Array} options
     */
    set options(opts) {
        for (let input of document.getElementsByName("quiz")) {
            this.answerDiv.remove(input);
        }

        let i = 1;
        for (let opt of opts) {
            let input = document.createElement("input");
            input.type = "radio";
            input.name = "quiz";
            input.id = "answer" + i;
            input.value = opt;

            let label = document.createElement("label");
            label.for = "answer" + i;
            label.append(this.hb.span(opt));

            this.answerDiv.append(input, label);

            i++;
        }

        this.opts = opts;
    }
    get options() {
        return this.opts;
    }
}