```javascript
let questions = [];
let currentQuestion = 0;
let score = 0;
let answeredQuestions = 0;

let selectedQuiz = "";
let selectedQuizName = "";


// ========================================
// GITHUB QUIZ FOLDER
// ========================================

const GITHUB_API_URL =
    "https://api.github.com/repos/rawbdeyn/MedSurg/contents/quizzes";


// ========================================
// LOAD QUIZ LIST FROM GITHUB
// ========================================

async function loadQuizList() {

    const quizList = document.getElementById("quizList");

    quizList.innerHTML = "<p>Loading quizzes...</p>";

    try {

        const response = await fetch(GITHUB_API_URL);

        if (!response.ok) {
            throw new Error("Unable to load quiz list.");
        }

        const files = await response.json();

        const quizFiles = files
            .filter(file => file.name.toLowerCase().endsWith(".txt"))
            .sort((a, b) => a.name.localeCompare(b.name));


        // ========================================
        // GROUP QUIZZES BY TOPIC
        // ========================================

        const topics = {};

        quizFiles.forEach(quiz => {

            let filename = quiz.name
                .replace(/\.txt$/i, "");

            let category = "situational";

            if (filename.toLowerCase().endsWith("_retention")) {
                category = "retention";
                filename = filename.replace(/_retention$/i, "");
            }

            // Determine topic name
            let topic = filename
                .replace(/_/g, " ")
                .replace(/-/g, " ")
                .trim();

            if (!topics[topic]) {
                topics[topic] = {
                    retention: [],
                    situational: []
                };
            }

            topics[topic][category].push(quiz);
        });


        quizList.innerHTML = "";


        // ========================================
        // CREATE TOPIC BOXES
        // ========================================

        Object.keys(topics)
            .sort()
            .forEach(topic => {

                const topicBox = document.createElement("div");
                topicBox.className = "quiz-topic";


                // ========================================
                // TOPIC TITLE
                // ========================================

                const topicTitle = document.createElement("div");
                topicTitle.className = "quiz-topic-title";
                topicTitle.textContent = formatQuizName(topic);

                topicBox.appendChild(topicTitle);


                // ========================================
                // RETENTION + SITUATIONAL CONTAINER
                // ========================================

                const categories = document.createElement("div");
                categories.className = "quiz-categories";


                // RETENTION
                categories.appendChild(
                    createQuizCategory(
                        topic,
                        topics[topic].retention,
                        "retention"
                    )
                );


                // SITUATIONAL
                categories.appendChild(
                    createQuizCategory(
                        topic,
                        topics[topic].situational,
                        "situational"
                    )
                );


                topicBox.appendChild(categories);

                quizList.appendChild(topicBox);
            });


    } catch (error) {

        quizList.innerHTML = `
            <div class="quiz-error">
                <p>Unable to load quizzes.</p>
                <button id="retryButton">Retry</button>
            </div>
        `;

        document
            .getElementById("retryButton")
            .addEventListener("click", loadQuizList);
    }
}


// ========================================
// CREATE RETENTION / SITUATIONAL CATEGORY
// ========================================

function createQuizCategory(topic, quizzes, category) {

    const categoryDiv = document.createElement("div");

    categoryDiv.className =
        `quiz-category ${category}`;


    // ========================================
    // CATEGORY TITLE
    // ========================================

    const categoryTitle = document.createElement("div");

    categoryTitle.className =
        "quiz-category-title";

    categoryTitle.textContent =
        category === "retention"
            ? "RETENTION"
            : "SITUATIONAL";

    categoryDiv.appendChild(categoryTitle);


    // ========================================
    // QUIZ BUTTONS
    // ========================================

    const quizGrid = document.createElement("div");

    quizGrid.className = "quiz-grid";


    quizzes.forEach(quiz => {

        const button = document.createElement("button");

        button.className = "quiz-button";

        button.textContent =
            formatQuizName(quiz.name);


        button.addEventListener("click", () => {

            startQuiz(
                quiz.download_url,
                formatQuizName(quiz.name)
            );

        });


        quizGrid.appendChild(button);

    });


    categoryDiv.appendChild(quizGrid);

    return categoryDiv;
}


// ========================================
// FORMAT QUIZ NAME
// ========================================

function formatQuizName(name) {

    return name
        .replace(/\.txt$/i, "")
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, char => char.toUpperCase());
}


// ========================================
// START QUIZ
// ========================================

function startQuiz(filename, name) {

    questions = [];
    currentQuestion = 0;
    score = 0;
    answeredQuestions = 0;

    selectedQuiz = filename;
    selectedQuizName = name;


    document.getElementById("menu").style.display = "none";

    document.getElementById("quizScreen").style.display = "block";

    document.getElementById("checkpoint").style.display = "none";

    document.getElementById("stoppedScreen").style.display = "none";

    document.getElementById("completeScreen").style.display = "none";


    document.getElementById("quizTitle").textContent =
        selectedQuizName;


    document.getElementById("submitButton").style.display =
        "inline-block";

    document.getElementById("nextButton").style.display =
        "none";


    document.getElementById("result").innerHTML = "";

    document.getElementById("question").textContent =
        "Loading quiz...";

    document.getElementById("choices").innerHTML = "";

    document.getElementById("questionNumber").textContent = "";


    loadQuiz(filename);
}


// ========================================
// LOAD QUIZ FILE
// ========================================

async function loadQuiz(downloadURL) {

    try {

        const response = await fetch(downloadURL);

        if (!response.ok) {
            throw new Error("Unable to load quiz.");
        }

        const text = await response.text();

        parseQuestions(text);


        if (questions.length === 0) {
            throw new Error("No questions found.");
        }


        shuffleQuestions();

        displayQuestion();


    } catch (error) {

        showQuizError();

    }
}


// ========================================
// QUIZ ERROR
// ========================================

function showQuizError() {

    document.getElementById("question").innerHTML = `
        <div class="quiz-error-message">
            <h3>Quiz Error</h3>
            <p>Unable to load this quiz.</p>
            <button id="errorBackButton">
                Go Back
            </button>
        </div>
    `;


    document.getElementById("choices").innerHTML = "";

    document.getElementById("questionNumber").textContent = "";

    document.getElementById("result").innerHTML = "";

    document.getElementById("submitButton").style.display =
        "none";

    document.getElementById("nextButton").style.display =
        "none";


    document
        .getElementById("errorBackButton")
        .addEventListener("click", returnToMenu);
}


// ========================================
// PARSE QUESTIONS
// ========================================

function parseQuestions(text) {

    questions = [];

    const lines = text
        .replace(/\r/g, "")
        .split("\n");


    let current = null;


    lines.forEach(line => {

        line = line.trim();


        if (line === "[MCQ]") {

            current = {

                type: "MCQ",

                question: "",

                choices: [],

                choice_count: 0,

                correct_answer: "",

                user_answer: "",

                is_correct: false,

                rationale: ""

            };

        }


        else if (current && line.startsWith("QUESTION:")) {

            current.question =
                line.substring(9).trim();

        }


        else if (current && /^A:/.test(line)) {

            current.choices[0] =
                line.substring(2).trim();

            current.choice_count++;

        }


        else if (current && /^B:/.test(line)) {

            current.choices[1] =
                line.substring(2).trim();

            current.choice_count++;

        }


        else if (current && /^C:/.test(line)) {

            current.choices[2] =
                line.substring(2).trim();

            current.choice_count++;

        }


        else if (current && /^D:/.test(line)) {

            current.choices[3] =
                line.substring(2).trim();

            current.choice_count++;

        }


        else if (current && line.startsWith("ANSWER:")) {

            current.correct_answer =
                line.substring(7).trim();

        }


        else if (current && line.startsWith("RATIONALE:")) {

            current.rationale =
                line.substring(10).trim();

        }


        else if (current && line === "END") {

            questions.push(current);

            current = null;

        }

    });
}


// ========================================
// ANSWER LETTER TO INDEX
// ========================================

function answerToIndex(answer) {

    return {
        A: 0,
        B: 1,
        C: 2,
        D: 3
    }[answer.toUpperCase()];

}


// ========================================
// SHUFFLE QUESTIONS
// ========================================

function shuffleQuestions() {

    for (
        let i = questions.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(Math.random() * (i + 1));

        [
            questions[i],
            questions[j]
        ] =
        [
            questions[j],
            questions[i]
        ];

    }
}


// ========================================
// DISPLAY QUESTION
// ========================================

function displayQuestion() {

    const q =
        questions[currentQuestion];


    document.getElementById("questionNumber").textContent =
        `Question ${currentQuestion + 1} of ${questions.length}`;


    document.getElementById("question").textContent =
        q.question;


    const choicesContainer =
        document.getElementById("choices");

    choicesContainer.innerHTML = "";


    q.choices.forEach((choice, index) => {

        const label =
            document.createElement("label");

        label.className =
            "answer-option";


        const radio =
            document.createElement("input");

        radio.type = "radio";

        radio.name = "answer";

        radio.value = index;


        const letter =
            document.createElement("span");

        letter.textContent =
            String.fromCharCode(65 + index);


        const text =
            document.createElement("span");

        text.textContent =
            choice;


        label.appendChild(radio);

        label.appendChild(letter);

        label.appendChild(text);


        choicesContainer.appendChild(label);

    });


    document.getElementById("result").innerHTML = "";


    document.getElementById("submitButton").style.display =
        "inline-block";


    document.getElementById("nextButton").style.display =
        "none";
}


// ========================================
// SUBMIT ANSWER
// ========================================

document
    .getElementById("submitButton")
    .addEventListener("click", function () {

        const selected =
            document.querySelector(
                'input[name="answer"]:checked'
            );


        if (!selected) {

            alert("Please select an answer.");

            return;

        }


        const q =
            questions[currentQuestion];


        const selectedIndex =
            parseInt(selected.value);


        const correctIndex =
            answerToIndex(q.correct_answer);


        q.user_answer =
            String.fromCharCode(
                65 + selectedIndex
            );


        q.is_correct =
            selectedIndex === correctIndex;


        answeredQuestions++;


        const options =
            document.querySelectorAll(
                'input[name="answer"]'
            );


        options.forEach(input => {

            input.disabled = true;


            const label =
                input.closest(".answer-option");


            const index =
                parseInt(input.value);


            if (index === correctIndex) {

                label.classList.add(
                    "correct-answer"
                );

            }


            if (
                index === selectedIndex &&
                selectedIndex !== correctIndex
            ) {

                label.classList.add(
                    "wrong-answer"
                );

            }

        });


        if (q.is_correct) {

            score++;


            document.getElementById("result").innerHTML = `
                <div class="correct-text">
                    <strong>Correct!</strong>
                    <p>${q.rationale}</p>
                </div>
            `;

        } else {

            document.getElementById("result").innerHTML = `
                <div class="incorrect-text">
                    <strong>Incorrect.</strong>
                    <p>
                        Correct answer:
                        ${q.correct_answer}
                    </p>
                    <p>${q.rationale}</p>
                </div>
            `;

        }


        document.getElementById("submitButton").style.display =
            "none";


        document.getElementById("nextButton").style.display =
            "inline-block";

    });


// ========================================
// NEXT QUESTION
// ========================================

document
    .getElementById("nextButton")
    .addEventListener("click", function () {

        currentQuestion++;


        // Checkpoint every 10 questions
        if (
            currentQuestion % 10 === 0 &&
            currentQuestion < questions.length
        ) {

            document.getElementById("checkpointScore").textContent =
                `Score: ${score} / ${answeredQuestions}`;


            document.getElementById("quizScreen").style.display =
                "none";


            document.getElementById("checkpoint").style.display =
                "block";


            return;

        }


        // Quiz finished
        if (currentQuestion >= questions.length) {

            finishQuiz();

            return;

        }


        displayQuestion();

    });


// ========================================
// CONTINUE FROM CHECKPOINT
// ========================================

document
    .getElementById("continueButton")
    .addEventListener("click", function () {

        document.getElementById("checkpoint").style.display =
            "none";


        document.getElementById("quizScreen").style.display =
            "block";


        displayQuestion();

    });


// ========================================
// STOP QUIZ
// ========================================

document
    .getElementById("stopButton")
    .addEventListener("click", function () {

        document.getElementById("checkpoint").style.display =
            "none";


        document.getElementById("quizScreen").style.display =
            "none";


        document.getElementById("stoppedScreen").style.display =
            "block";


        document.getElementById("stoppedScore").textContent =
            `Score: ${score} / ${answeredQuestions}`;

    });


// ========================================
// FINISH QUIZ
// ========================================

function finishQuiz() {

    document.getElementById("quizScreen").style.display =
        "none";


    document.getElementById("completeScreen").style.display =
        "block";


    const percentage =
        answeredQuestions > 0
            ? Math.round(
                (score / answeredQuestions) * 100
            )
            : 0;


    document.getElementById("finalScore").textContent =
        `Score: ${score} / ${answeredQuestions}`;


    document.getElementById("finalPercentage").textContent =
        `${percentage}%`;

}


// ========================================
// RETAKE QUIZ
// ========================================

document
    .getElementById("retakeButton")
    .addEventListener("click", function () {

        startQuiz(
            selectedQuiz,
            selectedQuizName
        );

    });


// ========================================
// RETURN TO MENU
// ========================================

function returnToMenu() {

    questions = [];

    currentQuestion = 0;

    score = 0;

    answeredQuestions = 0;

    selectedQuiz = "";

    selectedQuizName = "";


    document.getElementById("quizScreen").style.display =
        "none";


    document.getElementById("checkpoint").style.display =
        "none";


    document.getElementById("stoppedScreen").style.display =
        "none";


    document.getElementById("completeScreen").style.display =
        "none";


    document.getElementById("menu").style.display =
        "block";


    loadQuizList();

}


// ========================================
// COMPLETION SCREEN → MENU
// ========================================

document
    .getElementById("completeMenuButton")
    .addEventListener("click", returnToMenu);


// ========================================
// STOPPED SCREEN → MENU
// ========================================

document
    .getElementById("returnMenuButton")
    .addEventListener("click", returnToMenu);


// ========================================
// INITIAL LOAD
// ========================================

loadQuizList();
```
