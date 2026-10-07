

// ========================================
// QUIZ VARIABLES
// ========================================

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

    const quizList =
        document.getElementById("quizList");

    quizList.innerHTML =
        "<p class='loading'>Loading quizzes...</p>";

    try {

        const response = await fetch(
            GITHUB_API_URL,
            {
                headers: {
                    "Accept":
                        "application/vnd.github+json"
                }
            }
        );

        if (!response.ok) {

            throw new Error(
                "Could not load quizzes from GitHub."
            );
        }

        const files =
            await response.json();


        // Only use .txt files

        const quizzes = files.filter(file =>
            file.type === "file" &&
            file.name
                .toLowerCase()
                .endsWith(".txt")
        );


        quizList.innerHTML = "";


        // No quizzes found

        if (quizzes.length === 0) {

            quizList.innerHTML = `
                <div class="error-message">

                    <strong>No quizzes found.</strong>

                    <p>
                        There are no .txt quiz files
                        in the GitHub quizzes folder.
                    </p>

                </div>
            `;

            return;
        }


        // ========================================
        // GROUP QUIZZES
        // ========================================

        const groupedQuizzes = {};


        quizzes.forEach(quiz => {

            const filename =
                quiz.name.toLowerCase();


            // Default category

            let category = "Situational";


            // Files ending in _retention.txt
            // are Retention quizzes

            if (
                filename.endsWith(
                    "_retention.txt"
                )
            ) {

                category = "Retention";
            }


            // Get topic name

            let topic =
                quiz.name.replace(
                    /\.txt$/i,
                    ""
                );


            // Remove _retention

            topic =
                topic.replace(
                    /_retention$/i,
                    ""
                );


            // Replace _ and - with spaces

            topic =
                topic.replace(
                    /[_-]+/g,
                    " "
                );


            // Capitalize words

            topic =
                topic.replace(
                    /\b\w/g,
                    letter =>
                        letter.toUpperCase()
                );


            // Create topic group

            if (!groupedQuizzes[topic]) {

                groupedQuizzes[topic] = {

                    Retention: [],

                    Situational: []

                };
            }


            groupedQuizzes[topic][category]
                .push(quiz);

        });


        // ========================================
        // SORT TOPICS
        // ========================================

        const sortedTopics =
            Object.keys(groupedQuizzes)
                .sort();


        // ========================================
        // CREATE TOPIC CARDS
        // ========================================

        sortedTopics.forEach(topic => {

            const topicData =
                groupedQuizzes[topic];


            // Outer topic card

            const topicSection =
                document.createElement("div");

            topicSection.className =
                "quiz-topic";


            // Topic title

            const topicTitle =
                document.createElement("h2");

            topicTitle.className =
                "quiz-topic-title";

            topicTitle.textContent =
                topic;


            topicSection.appendChild(
                topicTitle
            );


            // Retention / Situational container

            const categoriesContainer =
                document.createElement("div");

            categoriesContainer.className =
                "quiz-categories";


            // Retention

            if (
                topicData.Retention.length > 0
            ) {

                createQuizCategory(
                    categoriesContainer,
                    "Retention",
                    topicData.Retention,
                    "retention"
                );
            }


            // Situational

            if (
                topicData.Situational.length > 0
            ) {

                createQuizCategory(
                    categoriesContainer,
                    "Situational",
                    topicData.Situational,
                    "situational"
                );
            }


            topicSection.appendChild(
                categoriesContainer
            );


            quizList.appendChild(
                topicSection
            );

        });

    }

    catch (error) {

        console.error(error);


        quizList.innerHTML = `

            <div class="error-message">

                <strong>
                    Could not load quizzes.
                </strong>

                <p>
                    The quiz list could not be
                    retrieved from GitHub.
                </p>

                <button
                    id="retryQuizListButton"
                    class="back-button"
                >
                    Try Again
                </button>

            </div>

        `;


        const retryButton =
            document.getElementById(
                "retryQuizListButton"
            );


        if (retryButton) {

            retryButton.addEventListener(
                "click",
                () => {
                    loadQuizList();
                }
            );

        }

    }
}


// ========================================
// CREATE RETENTION / SITUATIONAL CATEGORY
// ========================================

function createQuizCategory(
    parent,
    categoryName,
    quizzes,
    categoryType
) {

    const category =
        document.createElement("div");

    category.className =
        `quiz-category ${categoryType}`;


    // Category title

    const categoryTitle =
        document.createElement("h3");

    categoryTitle.className =
        "quiz-category-title";

    categoryTitle.textContent =
        categoryName;


    category.appendChild(
        categoryTitle
    );


    // Quiz button container

    const quizGrid =
        document.createElement("div");

    quizGrid.className =
        "quiz-grid";


    category.appendChild(
        quizGrid
    );


    // Sort quizzes alphabetically

    quizzes.sort(
        (a, b) =>
            a.name.localeCompare(b.name)
    );


    // Create individual quiz buttons

    quizzes.forEach(quiz => {

        const button =
            document.createElement("button");

        button.className =
            "quiz-button";


        // Keep the actual quiz name
        // inside the box

        button.textContent =
            formatQuizName(
                quiz.name
            );


        button.addEventListener(
            "click",
            () => {

                startQuiz(
                    quiz.download_url,
                    formatQuizName(
                        quiz.name
                    )
                );

            }
        );


        quizGrid.appendChild(
            button
        );

    });


    parent.appendChild(
        category
    );
}


// ========================================
// FORMAT QUIZ NAME
// ========================================

function formatQuizName(filename) {

    let name =
        filename.replace(
            /\.txt$/i,
            ""
        );


    // Remove _retention

    name =
        name.replace(
            /_retention$/i,
            ""
        );


    // Replace _ and - with spaces

    name =
        name.replace(
            /[_-]+/g,
            " "
        );


    // Capitalize words

    name =
        name.replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );


    return name;
}


// ========================================
// START QUIZ
// ========================================

function startQuiz(
    downloadURL,
    quizName
) {

    selectedQuiz =
        downloadURL;

    selectedQuizName =
        quizName;


    questions = [];

    currentQuestion = 0;

    score = 0;

    answeredQuestions = 0;


    // Hide menu

    document
        .getElementById("menu")
        .classList.add("hidden");


    // Hide other screens

    document
        .getElementById("checkpoint")
        .classList.add("hidden");

    document
        .getElementById("stopped")
        .classList.add("hidden");

    document
        .getElementById("complete")
        .classList.add("hidden");


    // Show quiz

    document
        .getElementById("quiz")
        .classList.remove("hidden");


    // Show loading

    document
        .getElementById("question")
        .textContent =
        "Loading quiz...";


    document
        .getElementById("answers")
        .innerHTML = "";


    document
        .getElementById("result")
        .classList.add("hidden");


    document
        .getElementById("nextButton")
        .classList.add("hidden");


    // Load quiz

    loadQuiz(downloadURL);
}


// ========================================
// LOAD QUIZ FILE
// ========================================

async function loadQuiz(downloadURL) {

    try {

        const response =
            await fetch(downloadURL);


        if (!response.ok) {

            throw new Error(
                "Could not load quiz file."
            );
        }


        const text =
            await response.text();


        questions =
            parseQuestions(text);


        if (
            !questions ||
            questions.length === 0
        ) {

            throw new Error(
                "No valid questions found."
            );
        }


        // Randomize question order

        shuffleQuestions();


        currentQuestion = 0;

        score = 0;

        answeredQuestions = 0;


        // Quiz title

        const quizTitle =
            document.querySelector(
                ".quiz-header h2"
            );


        if (quizTitle) {

            quizTitle.textContent =
                selectedQuizName;
        }


        // Display first question

        displayQuestion();

    }

    catch (error) {

        console.error(error);

        showQuizError(
            "Could not load this quiz."
        );

    }
}


// ========================================
// SHOW QUIZ ERROR
// ========================================

function showQuizError(message) {

    document
        .getElementById("quiz")
        .classList.remove("hidden");


    document
        .getElementById("question")
        .innerHTML = `

            <div class="error-message">

                <strong>
                    Quiz Error
                </strong>

                <p>
                    ${message}
                </p>

                <button
                    id="quizErrorBackButton"
                    class="back-button"
                >
                    Go Back
                </button>

            </div>

        `;


    document
        .getElementById("answers")
        .innerHTML = "";


    document
        .getElementById("result")
        .classList.add("hidden");


    document
        .getElementById("nextButton")
        .classList.add("hidden");


    const backButton =
        document.getElementById(
            "quizErrorBackButton"
        );


    if (backButton) {

        backButton.addEventListener(
            "click",
            () => {

                returnToMenu();

            }
        );

    }
}


// ========================================
// PARSE QUESTIONS
// ========================================

function parseQuestions(text) {

    const parsedQuestions = [];


    // Split using END

    const blocks =
        text.split(/\bEND\b/i);


    blocks.forEach(block => {

        block =
            block.trim();


        if (!block) {
            return;
        }


        // Only process MCQ blocks

        if (
            !block
                .toUpperCase()
                .includes("[MCQ]")
        ) {

            return;
        }


        const questionMatch =
            block.match(
                /QUESTION:\s*([\s\S]*?)(?=\nA:)/i
            );


        const aMatch =
            block.match(
                /A:\s*([\s\S]*?)(?=\nB:)/i
            );


        const bMatch =
            block.match(
                /B:\s*([\s\S]*?)(?=\nC:)/i
            );


        const cMatch =
            block.match(
                /C:\s*([\s\S]*?)(?=\nD:)/i
            );


        const dMatch =
            block.match(
                /D:\s*([\s\S]*?)(?=\nANSWER:)/i
            );


        const answerMatch =
            block.match(
                /ANSWER:\s*([A-D])/i
            );


        const rationaleMatch =
            block.match(
                /RATIONALE:\s*([\s\S]*?)$/i
            );


        // Make sure required fields exist

        if (
            !questionMatch ||
            !aMatch ||
            !bMatch ||
            !cMatch ||
            !dMatch ||
            !answerMatch
        ) {

            return;
        }


        const question = {

            type: "MCQ",

            question:
                questionMatch[1].trim(),

            choices: [

                aMatch[1].trim(),

                bMatch[1].trim(),

                cMatch[1].trim(),

                dMatch[1].trim()

            ],

            correctAnswer:
                answerToIndex(
                    answerMatch[1]
                ),

            userAnswer: null,

            isCorrect: false,

            rationale:
                rationaleMatch
                    ? rationaleMatch[1].trim()
                    : ""

        };


        parsedQuestions.push(
            question
        );

    });


    return parsedQuestions;
}


// ========================================
// CONVERT A/B/C/D TO INDEX
// ========================================

function answerToIndex(answer) {

    switch (
        answer
            .trim()
            .toUpperCase()
    ) {

        case "A":
            return 0;

        case "B":
            return 1;

        case "C":
            return 2;

        case "D":
            return 3;

        default:
            return -1;
    }
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
            Math.floor(
                Math.random() * (i + 1)
            );


        [
            questions[i],
            questions[j]
        ] = [

            questions[j],
            questions[i]

        ];

    }
}


// ========================================
// DISPLAY QUESTION
// ========================================

function displayQuestion() {

    if (
        currentQuestion >=
        questions.length
    ) {

        finishQuiz();

        return;
    }


    const question =
        questions[currentQuestion];


    // Update progress

    const progress =
        document.getElementById(
            "progress"
        );


    if (progress) {

        progress.textContent =
            `Question ${
                currentQuestion + 1
            } of ${
                questions.length
            }`;
    }


    // Display question

    document
        .getElementById("question")
        .textContent =
        question.question;


    // Clear answers

    const answers =
        document.getElementById(
            "answers"
        );


    answers.innerHTML = "";


    // Hide result

    document
        .getElementById("result")
        .classList.add("hidden");


    // Hide next

    document
        .getElementById("nextButton")
        .classList.add("hidden");


    // Create answer buttons

    question.choices.forEach(
        (choice, index) => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "answer-option";


            button.textContent =
                `${String.fromCharCode(
                    65 + index
                )}. ${choice}`;


            button.addEventListener(
                "click",
                () => {

                    selectAnswer(
                        index
                    );

                }
            );


            answers.appendChild(
                button
            );

        }
    );
}


// ========================================
// SELECT ANSWER
// ========================================

function selectAnswer(
    selectedAnswer
) {

    const question =
        questions[currentQuestion];


    // Prevent answering twice

    if (
        question.userAnswer !== null
    ) {

        return;
    }


    question.userAnswer =
        selectedAnswer;


    question.isCorrect =
        selectedAnswer ===
        question.correctAnswer;


    answeredQuestions++;


    if (question.isCorrect) {

        score++;

    }


    // Get answer buttons

    const answerButtons =
        document.querySelectorAll(
            ".answer-option"
        );


    // Disable all answers

    answerButtons.forEach(
        (button, index) => {

            button.disabled = true;


            // Correct answer

            if (
                index ===
                question.correctAnswer
            ) {

                button.classList.add(
                    "correct-answer"
                );

            }


            // Wrong selected answer

            if (
                index === selectedAnswer &&
                !question.isCorrect
            ) {

                button.classList.add(
                    "wrong-answer"
                );

            }

        }
    );


    // Show result

    const result =
        document.getElementById(
            "result"
        );


    result.classList.remove(
        "hidden"
    );


    if (question.isCorrect) {

        result.innerHTML = `

            <strong>
                Correct!
            </strong>

            <div id="rationale">
                ${question.rationale}
            </div>

        `;

    }

    else {

        result.innerHTML = `

            <strong>
                Incorrect.
            </strong>

            <div id="rationale">
                ${question.rationale}
            </div>

        `;

    }


    // Show next button

    document
        .getElementById("nextButton")
        .classList.remove("hidden");
}


// ========================================
// NEXT QUESTION
// ========================================

document
    .getElementById("nextButton")
    .addEventListener(
        "click",
        () => {

            currentQuestion++;


            // Checkpoint every 10 questions

            if (
                currentQuestion <
                questions.length &&
                currentQuestion % 10 === 0
            ) {

                showCheckpoint();

                return;
            }


            // End quiz

            if (
                currentQuestion >=
                questions.length
            ) {

                finishQuiz();

                return;
            }


            displayQuestion();

        }
    );


// ========================================
// CHECKPOINT
// ========================================

function showCheckpoint() {

    document
        .getElementById("quiz")
        .classList.add("hidden");


    document
        .getElementById("checkpoint")
        .classList.remove("hidden");


    const checkpointScore =
        document.getElementById(
            "checkpointScore"
        );


    if (checkpointScore) {

        checkpointScore.textContent =
            `Score: ${score}/${answeredQuestions}`;
    }
}


// ========================================
// CONTINUE BUTTON
// ========================================

document
    .getElementById("continueButton")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById("checkpoint")
                .classList.add("hidden");


            document
                .getElementById("quiz")
                .classList.remove("hidden");


            displayQuestion();

        }
    );


// ========================================
// STOP BUTTON
// ========================================

document
    .getElementById("stopButton")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById("checkpoint")
                .classList.add("hidden");


            document
                .getElementById("quiz")
                .classList.add("hidden");


            document
                .getElementById("stopped")
                .classList.remove("hidden");


            const stoppedScore =
                document.getElementById(
                    "stoppedScore"
                );


            if (stoppedScore) {

                stoppedScore.textContent =
                    `Score: ${score}/${answeredQuestions}`;
            }

        }
    );


// ========================================
// FINISH QUIZ
// ========================================

function finishQuiz() {

    document
        .getElementById("quiz")
        .classList.add("hidden");


    document
        .getElementById("checkpoint")
        .classList.add("hidden");


    document
        .getElementById("stopped")
        .classList.add("hidden");


    document
        .getElementById("complete")
        .classList.remove("hidden");


    const finalScore =
        document.getElementById(
            "finalScore"
        );


    if (finalScore) {

        finalScore.textContent =
            `${score} / ${questions.length}`;

    }


    const percentage =
        document.getElementById(
            "percentage"
        );


    if (percentage) {

        const percent =
            Math.round(
                (score /
                    questions.length) *
                100
            );


        percentage.textContent =
            `${percent}%`;
    }
}


// ========================================
// RETAKE QUIZ
// ========================================

document
    .getElementById("retakeButton")
    .addEventListener(
        "click",
        () => {

            startQuiz(
                selectedQuiz,
                selectedQuizName
            );

        }
    );


// ========================================
// RETURN TO MENU
// ========================================

function returnToMenu() {

    // Hide quiz screens

    document
        .getElementById("quiz")
        .classList.add("hidden");


    document
        .getElementById("checkpoint")
        .classList.add("hidden");


    document
        .getElementById("stopped")
        .classList.add("hidden");


    document
        .getElementById("complete")
        .classList.add("hidden");


    // Show menu

    document
        .getElementById("menu")
        .classList.remove("hidden");


    // Reset quiz data

    questions = [];

    currentQuestion = 0;

    score = 0;

    answeredQuestions = 0;

    selectedQuiz = "";

    selectedQuizName = "";
}


// ========================================
// COMPLETION MENU BUTTON
// ========================================

document
    .getElementById(
        "completeMenuButton"
    )
    .addEventListener(
        "click",
        () => {

            returnToMenu();

        }
    );


// ========================================
// STOPPED MENU BUTTON
// ========================================

document
    .getElementById(
        "stoppedMenuButton"
    )
    .addEventListener(
        "click",
        () => {

            returnToMenu();

        }
    );


// ========================================
// INITIAL LOAD
// ========================================

loadQuizList();
