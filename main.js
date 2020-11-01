import Hebrew from "./hebrew.mjs";

let hebrew;

let letterInfo;
let vocabulary;
let promises = [
    new Promise(resolve => {
        fetch("letters.json")
        .then(response => response.json())
        .then(json => {
            letterInfo = json;
            resolve();
        });
    }),
    new Promise(resolve => {
        fetch("vocabulary.json")
        .then(response => response.json())
        .then(json => {
            vocabulary = json;
            resolve();
        });
    })
];

let lesson = document.getElementById("lesson");
let focusedWord = document.createElement("p");
focusedWord.style = "font-size: 36px";
let transliteration = document.createElement("p");

function showRandomWord() {
    let n = Math.floor(Math.random() * vocabulary.length);
    let vocabEntry = vocabulary[n];
    let rootForm = hebrew.finalLetterForm(vocabEntry.root);
    focusedWord.innerHTML = rootForm;
    transliteration.innerHTML = hebrew.transliterate(rootForm);
}

function beginLesson() {
    lesson.appendChild(focusedWord);
    lesson.appendChild(transliteration);
    showRandomWord();
}

function main() {
    hebrew = new Hebrew(letterInfo, vocabulary);

    let beginButton = document.getElementById("begin");
    beginButton.addEventListener("click", beginLesson);
    
    let genesis = "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ׃";

    let genesisP = document.createElement("p");
    genesisP.innerText = genesis;
    document.body.append(genesisP);

    let genesisP2 = document.createElement("p");
    genesisP2.innerText = hebrew.lettersOf(genesis).join(" ");
    document.body.append(genesisP2);

    let translitP = document.createElement("p");
    translitP.innerText = hebrew.transliterate(genesis);
    document.body.append(translitP);
}

Promise.all(promises).then(main);
