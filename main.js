let lesson = document.getElementById("lesson");
let focusedWord = document.createElement("p");
focusedWord.style = "font-size: 36px";
let transliteration = document.createElement("p");

function showRandomWord() {
    let n = Math.floor(Math.random() * vocabulary.length);
    let vocabEntry = vocabulary[n];
    let rootForm = finalLetterForm(vocabEntry.root);
    focusedWord.innerHTML = rootForm;
    transliteration.innerHTML = transliterate(rootForm);
}

function beginLesson() {
    lesson.appendChild(focusedWord);
    lesson.appendChild(transliteration);
    showRandomWord();
}

function main() {
    let beginButton = document.getElementById("begin");
    beginButton.addEventListener("click", beginLesson);
    
    let genesis = "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ׃";

    let genesisP = document.createElement("p");
    genesisP.innerText = genesis;
    document.body.append(genesisP);

    let genesisP2 = document.createElement("p");
    genesisP2.innerText = lettersOf(genesis).join(" ");
    document.body.append(genesisP2);

    let translitP = document.createElement("p");
    translitP.innerText = transliterate(genesis);
    document.body.append(translitP);
}

Promise.all(promises).then(main);
