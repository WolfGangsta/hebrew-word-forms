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

let workArea = document.getElementById("workArea");
let beginButton = document.getElementById("begin");

let lessonDiv = document.createElement("div");

let focusedWord = document.createElement("p");
focusedWord.style = "font-size: 36px";
lessonDiv.appendChild(focusedWord);
let transliteration = document.createElement("p");
lessonDiv.appendChild(transliteration);
let translation = document.createElement("p");
lessonDiv.appendChild(translation);

let randomButton = document.createElement("button");
randomButton.innerText = "Random word";
randomButton.addEventListener("click", showRandomWord);

let showAllButton = document.createElement("button");
showAllButton.innerText = "Show all";
showAllButton.addEventListener("click", showAll);

let allRootsDiv = document.createElement("div");

let allRootsTable = document.createElement("table");

function showRandomWord() {
    let wordList = Object.keys(vocabulary);
    let n = Math.floor(Math.random() * wordList.length);
    let root = wordList[n];

    let finalRoot = hebrew.finalize(root);
    let translit = hebrew.transliterate(root);
    let transl = hebrew.translate(root).join(", ") + "; "
        + hebrew.translate(root, false, true).join(", ") + "; "
        + hebrew.translate(root, true).join(", ");

    focusedWord.innerHTML = finalRoot;
    transliteration.innerHTML = translit;
    translation.innerHTML = transl;

    if (allRootsDiv.parentElement) {
        workArea.removeChild(allRootsDiv);
    }
    if (!lessonDiv.parentElement) {
        workArea.appendChild(lessonDiv);
    }
}

function showAll() {
    if (lessonDiv.parentElement) {
        workArea.removeChild(lessonDiv);
    }
    if (!allRootsDiv.parentElement) {
        workArea.appendChild(allRootsDiv);
    }
}

function beginLesson() {
    workArea.appendChild(randomButton);
    workArea.appendChild(showAllButton);

    workArea.appendChild(lessonDiv);
    showRandomWord();
}

function main() {
    hebrew = new Hebrew(letterInfo, vocabulary);

    for (let root of Object.keys(vocabulary)) {
        let row = document.createElement("tr");

        let rootTd = document.createElement("td");
        rootTd.innerText = hebrew.finalize(root);
        row.appendChild(rootTd);

        let lessonTd = document.createElement("td");
        lessonTd.innerText = vocabulary[root].lesson;
        lessonTd.setAttribute("style", "text-align:right");
        row.appendChild(lessonTd);

        let transTd = document.createElement("td");
        transTd.innerText = hebrew.translate(root).join("; ");
        row.appendChild(transTd);
        
        allRootsDiv.appendChild(row);
    }
    allRootsDiv.appendChild(allRootsTable);

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
