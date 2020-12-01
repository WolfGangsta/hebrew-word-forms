import {
    Verb,
    IRREGULAR,
    I, II, III,
    HOLLOW,
    GEMINATE,
} from "./hebrew.mjs";
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
    constructor(hb, wordList, form, questionDiv, answerDiv, feedbackDiv) {
        this.hb = hb;
        this.wordList = wordList;
        this.form = form;
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            this.checkAnswer();
        });
        this.questionDiv = questionDiv;
        this.answerDiv = answerDiv;
        this.feedbackDiv = feedbackDiv;
        this.submitButton = this.form.children[this.form.children.length - 1];
    }

    newQuestion() {
        this.mistakes = [];
        let opts = [];
        do {
            // Take chances
            do {
                let i = Math.floor(Math.random() * this.wordList.length);
                this.root = this.wordList[i];
                this.perfect = Math.random() >= 0.5;
                this.person = Math.floor(Math.random() * 3) + 1;
                this.singular = Math.random() >= 0.5;
                this.masculine = Math.random() >= 0.5;

                this.mistakes[0] = Math.floor(Math.random() * CONFUSE.TOTAL);
                this.mistakes[1] = Math.floor(Math.random() * (CONFUSE.TOTAL - 1));

                if (this.mistakes[1] >= this.mistakes[0])
                    this.mistakes[1]++;
            } while (this.person == 1 && this.mistakes.includes(CONFUSE.PERSON))

            // The correct word
            this.word = new Verb(
                this.hb, this.root, this.perfect,
                this.person, this.singular, this.masculine
            ).conjugate();

            // The word with this.mistakes[0] made
            this.word0 = new Verb(
                this.hb, this.root, this.perfect,
                this.person, this.singular, this.masculine
            );

            // The word with this.mistakes[1] made
            this.word1 = new Verb(
                this.hb, this.root, this.perfect,
                this.person, this.singular, this.masculine
            );

            // The word with both this.mistakes made
            this.word01 = new Verb(
                this.hb, this.root, this.perfect,
                this.person, this.singular, this.masculine
            );

            // Make this.mistakes
            this.messUp(this.mistakes[0], this.word0, this.word01);
            this.messUp(this.mistakes[1], this.word1, this.word01);

            // Conjugate words with this.mistakes
            this.word0.conjugate();
            this.word1.conjugate();
            this.word01.conjugate();

            // Get messy
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

    messUp(mistake, ...words) {
        switch (mistake) {
            case CONFUSE.NUMBER:
                for (let word of words)
                    word.singular = !this.singular;
                break;
            case CONFUSE.GENDER:
                for (let word of words)
                    word.masculine = !this.masculine;
                break;
            case CONFUSE.TENSE:
                for (let word of words)
                    word.perfect = !this.perfect;
                break;
            case CONFUSE.THEME_VOWEL:
                // Choose a random, wrong theme vowel
                let randomThemeVowel;
                do {
                    let i = Math.floor(Math.random() * VOWELS.length);
                    randomThemeVowel = VOWELS[i];
                } while (randomThemeVowel == this.word.themeVowel())

                for (let word of words)
                    word.themeVowelOverride = randomThemeVowel;
                break;
            case CONFUSE.PERSON:
                // Confuse 2nd and 3rd person
                for (let word of words)
                    word.person = 5 - this.person;
                break;
            case CONFUSE.I:
                let wrongIWeakness;
                do {
                    let iWeaknesses = [undefined, "Guttural", "Nun"];
                    let i = Math.floor(Math.random() * iWeaknesses.length);
                    wrongIWeakness = iWeaknesses[i];
                } while (wrongIWeakness == this.word.weaknesses[I])

                for (let word of words)
                    word.weaknesses[I] = wrongIWeakness;
                break;
            case CONFUSE.III:
                let wrongIIIWeakness;
                do {
                    let iiiWeaknesses = [undefined, "Guttural", "Alef", "Hey"];
                    let i = Math.floor(Math.random() * iiiWeaknesses.length);
                    wrongIIIWeakness = iiiWeaknesses[i];
                } while (wrongIIIWeakness == this.word.weaknesses[III])

                for (let word of words)
                    word.weaknesses[III] = wrongIIIWeakness;
                break;
        }
    }

    showQuestion() {
        while (this.questionDiv.length > 0) {
            this.questionDiv.remove(this.questionDiv.children[0]);
        }

        let g;
        if (this.person == 1
            || (this.person == 3
                && !this.singular
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

    checkAnswer() {
        let answers = Array.from(this.answerDiv.children);

        let selectedAnswer = answers.find(
            element => element.children[0].children[0].checked
        );
        // If no answer is selected, give up
        if (!selectedAnswer) return;

        let correctAnswer = answers.find(
            element => element.children[0].children[0].value == "correct"
        );

        let selection = selectedAnswer.children[0].children[0].value;

        // Clear feedback
        this.feedbackDiv.innerHTML = "";

        let h = document.createElement("h4");
        let p = document.createElement("p");

        switch (selection) {
            case "correct":
                // correct answer
                selectedAnswer.className = "correct";
                h.innerText = "Correct!";
                for (let answer of answers) {
                    answer.children[0].children[0].disabled = true;
                }
                this.submitButton.disabled = true;
                break;
            case "0":
                // first mistake
                selectedAnswer.className = "incorrect";
                selectedAnswer.children[0].children[0].disabled = true;
                h.innerText = "Not quite...";
                p.append(
                    "Almost there! "
                    + this.explain(this.mistakes[0], this.word0.themeVowel)
                );
                break;
            case "1":
                // second mistake
                selectedAnswer.className = "incorrect";
                selectedAnswer.children[0].children[0].disabled = true;
                h.innerText = "Not quite...";
                p.append(
                    "Almost there! "
                    + this.explain(this.mistakes[1], this.word1.themeVowel)
                );
                break;
            case "01":
                // both this.mistakes
                selectedAnswer.className = "incorrect";
                selectedAnswer.children[0].children[0].disabled = true;
                h.innerText = "Review this root!";
                p.append(
                    "There are a couple things to take note of here. "
                    + this.explain(this.mistakes[0], this.word0.themeVowel)
                    + " In addition, "
                    + this.explain(this.mistakes[1], this.word1.themeVowel)
                );
                break;
        }

        this.feedbackDiv.append(h, p);

        //this.submitButton.innerText = "Next question";
    }

    explain(mistake, wrongThing) {
        switch (mistake) {
            case CONFUSE.NUMBER:
                return "Check the number. Do we need a singular or a plural form?";
            case CONFUSE.GENDER:
                return "You might have confused the gender forms.";
            case CONFUSE.TENSE:
                return "Which paradigm are you using--perfect or imperfect?";
            case CONFUSE.THEME_VOWEL:
                return "Take a look at the theme vowel (the vowel below the second root letter).";
            case CONFUSE.PERSON:
                let correctPerson = this.person == 3 ? "3rd" : "2nd";
                let wrongPerson = this.person == 3 ? "2nd" : "3rd";
                return (
                    "We need a "
                    + correctPerson
                    + "-person form, not a "
                    + wrongPerson
                    + "-person one."
                );
            case CONFUSE.I:
                return "Take a look at the first letter of the root. Is it weak?";
            case CONFUSE.III:
                return "Take a look at the third letter of the root. Is it weak?";
            default:
                return "There's a mistake I don't know how to describe."
        }
    }

    /**
     * @param {Array} options
     */
    set options(opts) {
        for (let input of document.getElementsByName("quiz")) {
            this.answerDiv.remove(input);
        }

        let i = 0;
        for (let opt of opts) {
            let div = document.createElement("div");

            let input = document.createElement("input");
            input.type = "radio";
            input.name = "quiz";
            input.id = [
                "correct", "0",
                "1", "01"
            ][i];
            input.value = input.id;

            let label = document.createElement("label");
            label["for"] = input.id;
            label.append(input, this.hb.span(opt));

            div.append(label);

            if (Math.random() < 0.5) {
                this.answerDiv.append(div);
            } else {
                this.answerDiv.prepend(div);
            }

            i++;
        }

        this.opts = opts;
    }
    get options() {
        return this.opts;
    }
}