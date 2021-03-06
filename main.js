import { Hebrew, Verb, I } from "./hebrew.mjs";
import { Test } from "./test.mjs";

let hebrew;

let letterInfo;
let vocabulary;
let paradigms;
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
        fetch("paradigms.json")
        .then(response => response.json())
        .then(json => {
            paradigms = json;
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

let lessonDiv = document.getElementById("lessonDiv");

let rootSelect = document.getElementById("root");
let rootInfo = document.getElementById("rootInfo");
let perfTab = document.getElementById("perfect");
let impfTab = document.getElementById("imperfect");
rootSelect.addEventListener("input", function() {
    let root = this.selectedOptions[0].innerText;
    if (root != "") {
        let weaknesses = hebrew.makeReadable(hebrew.weaknesses(root));
        rootInfo.innerText = weaknesses.join(", ");
        showWord(root);
        perfTab.style = "display: inline";
        impfTab.style = "display: inline";
    }
});

let testDiv = document.getElementById("testDiv");
testDiv.style.display = "none";
let questionDiv = document.getElementById("questionDiv");
let answerDiv = document.getElementById("answerDiv");
let testForm = document.getElementById("testForm");
let newQuestionButton = document.getElementById("newQuestionButton");

let vocabDiv = document.getElementById("vocabDiv");
vocabDiv.style.display = "none";

let vocabTable = document.createElement("table");
vocabDiv.appendChild(vocabTable);

let tabButtons = document.getElementsByClassName("tablinks");
for (let tabButton of tabButtons) {
    tabButton.addEventListener("click", function() {
        showTab(this.id.slice(0, -6) + "Div");
    });
}

function showForm(root, perfect, person, singular, masculine) {
    let word = new Verb(hebrew, root, perfect, person, singular, masculine)
    .conjugate();
    let transl = word.translate();

    let div = document.createElement("div");

    let details = document.createElement("details");
    let summary = document.createElement("summary");

    let p = document.createElement("p");
    let h = hebrew.span(word.toString());
    p.append(h, ": " + transl);

    summary.append(p);
    details.append(summary, word.summary);

    div.append(details);

    return div;
}

function showWord(root) {
    for (let perf = 1; perf >= 0; perf--) {
        let tab = perf ? perfTab : impfTab;
        let tbody = tab.children[tab.children.length - 1];

        while (tbody.children.length > 0) {
            tbody.removeChild(tbody.children[0]);
        }

        let word = new Verb(hebrew, root);
        if (!perf && (
            ["Yod", "Alef"].includes(word.weaknesses[I])
            || word.rootStr == "הלכ"
        )) {
            let tr = document.createElement("tr");
            let td = document.createElement("td");
            td.colSpan = 2;
            td.innerText =
                "Sorry! This root isn't supported in the imperfect.";
            tr.append(td);
            tbody.appendChild(tr);
        } else {
            for (let person = 3; person >= 1; person--) {
                for (let masc = 1; masc >= 0; masc--) {
                    let tr = document.createElement("tr");
                    tr.className = masc ? "m" : "f";
                    for (let sing = 1; sing >= 0; sing--) {
                        let td = document.createElement("td");
                        td.appendChild(showForm(root, perf, person, sing, masc));
                        if (person == 1
                            || (person == 3 && perf && !sing))
                        {
                            if (masc) {
                                td.rowSpan = 2;
                                td.className = "c";
                            } else {
                                continue;
                            }
                        }
                        tr.appendChild(td);
                    }
                    tbody.appendChild(tr);
                }
            }
        }
    }
}

function showTab(id) {
    for (let child of workArea.children)
        child.style.display = "none";

    let element = document.getElementById(id);
    element.style.display = "block";
}

function main() {
    hebrew = new Hebrew(letterInfo, vocabulary, paradigms);

    let wordList = hebrew.wordList;
    // let wordList = [
    //     "קטל", // Strong
    //     "עמד", // I Guttural
    //     // "רחצ", // II Guttural
    //     "שׁלח", // III Guttural (not technically a model verb)
    //     "נפל", // I Nun
    //     "יטב", // I Yod
    //     "ישׁב", // I Yod
    //     "גלה", // III Hey
    //     "מצא", // III Alef
    //     // "קומ", // Hollow
    //     // "סבב", // Geminate
    //     "אכל", // I Alef
    // ];
    for (let root of wordList) {
        let opt = document.createElement("option");
        opt.text = root;
        rootSelect.appendChild(opt);
    }

    // Initiate test
    let test = new Test(hebrew, wordList, testForm, questionDiv, answerDiv, feedbackDiv);
    test.newQuestion();
    newQuestionButton.addEventListener("click", () => { test.newQuestion(); })

    // Populate word list
    for (let root of hebrew.wordList) {
        let row = document.createElement("tr");

        let rootTd = document.createElement("td");
        rootTd.innerText = new Verb(hebrew, root);
        row.appendChild(rootTd);

        let lessonTd = document.createElement("td");
        lessonTd.innerText = hebrew.vocabulary[root].lesson;
        lessonTd.setAttribute("style", "text-align:right");
        row.appendChild(lessonTd);

        let transTd = document.createElement("td");
        transTd.innerText = hebrew.translateRoot(root).join("; ");
        row.appendChild(transTd);
        
        vocabTable.appendChild(row);
    }


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
