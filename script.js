// ==========================
// DATI
// ==========================

let workout365 = null;

async function loadWorkout365() {
    try {
        const response = await fetch("workout365.json");

        if (!response.ok) {
            throw new Error("Impossibile caricare workout365.json");
        }

        workout365 = await response.json();

console.log("FILE CARICATO");
console.log(workout365);
console.log("TIPO:", typeof workout365);
console.log("CHIAVI:", Object.keys(workout365));

    } catch (error) {
        console.error("Errore caricamento workout365:", error);
        workout365 = null;
    }
}

let targets =
    JSON.parse(
        localStorage.getItem("targets")
    ) || [];

let progressDays =
    JSON.parse(
        localStorage.getItem("progressDays")
    ) || {};

let workoutCompleted =
    JSON.parse(
        localStorage.getItem("workoutCompleted")
    ) || {};

let calendarDate = new Date();


// ==========================
// IMPOSTAZIONI
// ==========================

const FIREWORK_COUNT = 16;


// =========================================================
// HOME
// =========================================================

function showHome() {

    const content =
        document.getElementById("content");

    content.innerHTML = `

        <h2>I miei target</h2>

        <div id="targets-container"></div>

    `;

    renderTargets();

}


// =========================================================
// MOSTRA TARGET
// =========================================================

function renderTargets() {

    const container =
        document.getElementById("targets-container");

    if (!container) {
        return;
    }

    container.innerHTML = "";


    // ==========================
    // DATA ODIERNA
    // ==========================

    const today = new Date();

    today.setHours(0, 0, 0, 0);


    // ==========================
    // CONTROLLA SCADENZE
    // ==========================

    targets.forEach(target => {

        if (!target.createdAt || !target.days) {
            return;
        }

        const startDate = new Date(target.createdAt);

        startDate.setHours(0, 0, 0, 0);

        // Il primo giorno è DOMANI
        const firstDay = new Date(startDate);

        firstDay.setDate(
            firstDay.getDate() + 1
        );

        // Ultimo giorno compreso
        const lastDay = new Date(firstDay);

        lastDay.setDate(
            lastDay.getDate() +
            Number(target.days) -
            1
        );

        // Dal giorno successivo alla scadenza
        // il target è terminato
        target.expired =
            today > lastDay;

    });


    saveTargets();


    // ==========================
    // TARGET ATTIVI
    // ==========================

    const activeTargets =
        targets.filter(target => {

            return (
                target.progress < target.goal &&
                !target.expired
            );

        });


    if (activeTargets.length === 0) {

        container.innerHTML = `

            <p class="no-targets">
                Non hai target attivi.
            </p>

        `;

    } else {

        activeTargets.forEach(target => {

            const index =
                targets.indexOf(target);

            createTargetCard(
                target,
                index,
                container,
                false
            );

        });

    }


    // ==========================
    // TARGET CONCLUSI / SCADUTI
    // ==========================

    const completedTargets =
        targets.filter(target => {

            return (
                target.progress >= target.goal ||
                target.expired === true
            );

        });


    if (completedTargets.length > 0) {

        const completedSection =
            document.createElement("div");

        completedSection.className =
            "completed-section";


        completedSection.innerHTML = `

            <button
                class="completed-header"
                onclick="toggleCompletedTargets()"
            >

                <span>
                    Target conclusi
                </span>

                <span
                    id="completed-arrow"
                    class="completed-arrow"
                >
                    ▼
                </span>

            </button>


            <div
                id="completed-targets"
                class="completed-targets"
            ></div>

        `;


        container.appendChild(
            completedSection
        );


        const completedContainer =
            completedSection.querySelector(
                "#completed-targets"
            );


        completedTargets.forEach(target => {

            const index =
                targets.indexOf(target);

            createTargetCard(
                target,
                index,
                completedContainer,
                true
            );

        });

    }

}


// =========================================================
// CREA CARD TARGET
// =========================================================

function createTargetCard(
    target,
    index,
    container,
    completed = false
) {

    if (
        typeof target.progress !==
        "number"
    ) {

        target.progress = 0;

    }


    const percentage =
        Math.min(
            (
                target.progress /
                target.goal
            ) * 100,
            100
        );


    const targetElement =
        document.createElement(
            "div"
        );


    targetElement.className =
        "target-card";


    if (completed) {

        targetElement.classList.add(
            "completed-target"
        );

    } else {

        targetElement.classList.add(
            "clickable-target"
        );

    }


    targetElement.innerHTML = `

        <button
            class="delete-target"
            aria-label="Cancella target"
            type="button"
        >
            ×
        </button>


        <div class="gauge">

            <svg viewBox="0 0 180 150">

                <path
                    class="gauge-background"
                    d="M 29.4 125
                       A 70 70 0 1 1 29.4 55"
                    pathLength="100"
                />


                <path
                    class="gauge-progress"
                    d="M 29.4 125
                       A 70 70 0 1 1 29.4 55"
                    pathLength="100"
                    style="
                        stroke: ${target.color};
                        stroke-dasharray: 100;
                        stroke-dashoffset: ${100 - percentage};
                    "
                />

            </svg>


            <div class="gauge-text">

                <div class="gauge-percentage">
                    ${Math.round(percentage)}%
                </div>

                <div class="gauge-progress-number">
                    ${target.progress} / ${target.goal}
                </div>

            </div>

        </div>


        <div class="target-name">
            ${target.name}
        </div>


        ${
            completed
            ?
            `
                <div class="completed-label">
                    ✓ COMPLETATO
                </div>
            `
            :
            ""
        }

    `;


    container.appendChild(
        targetElement
    );


    // ==========================
    // CLICK TARGET
    // ==========================

    if (!completed) {

        targetElement.addEventListener(
            "click",
            function(event) {

                if (
                    event.target.closest(
                        ".delete-target"
                    )
                ) {
                    return;
                }

                openProgressModal(
                    index
                );

            }
        );

    }


    // ==========================
    // DELETE
    // ==========================

    const deleteButton =
        targetElement.querySelector(
            ".delete-target"
        );


    deleteButton.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

            deleteTarget(index);

        }
    );

}


// =========================================================
// TARGET CONCLUSI
// =========================================================

function toggleCompletedTargets() {

    const section =
        document.getElementById(
            "completed-targets"
        );

    const arrow =
        document.getElementById(
            "completed-arrow"
        );


    if (!section) {
        return;
    }


    if (
        section.style.display ===
        "none"
    ) {

        section.style.display =
            "grid";

        if (arrow) {
            arrow.textContent =
                "▼";
        }

    } else {

        section.style.display =
            "none";

        if (arrow) {
            arrow.textContent =
                "▶";
        }

    }

}


// =========================================================
// CANCELLA TARGET
// =========================================================

function deleteTarget(index) {

    const target =
        targets[index];


    if (!target) {
        return;
    }


    const conferma =
        confirm(
            `Vuoi davvero cancellare il target "${target.name}"?`
        );


    if (!conferma) {
        return;
    }


    targets.splice(
        index,
        1
    );


    saveTargets();

    renderTargets();

}


// =========================================================
// APRI PROGRESSO TARGET
// =========================================================

function openProgressModal(index) {

    const target =
        targets[index];


    if (!target) {
        return;
    }


    if (
        target.progress >=
        target.goal
    ) {
        return;
    }


    const today =
        new Date();


    const todayString =
        today.getFullYear() +
        "-" +
        String(
            today.getMonth() + 1
        ).padStart(2, "0") +
        "-" +
        String(
            today.getDate()
        ).padStart(2, "0");


    const remaining =
        target.goal -
        target.progress;


    const modal =
        document.createElement(
            "div"
        );


    modal.className =
        "progress-modal";


    modal.innerHTML = `

        <div class="progress-modal-content">

            <h2 class="progress-modal-title">
                ${target.name}
            </h2>


            <p class="progress-modal-subtitle">
                Registra il tuo progresso
            </p>


            <div class="progress-form">

                <label>
                    Quanto hai fatto?
                </label>


                <input
                    type="number"
                    id="progress-amount"
                    value="1"
                    min="0.01"
                    max="${remaining}"
                    step="any"
                    inputmode="decimal"
                >


                <small>
                    Rimanente: ${remaining}
                </small>


                <label>
                    Data
                </label>


                <input
                    type="date"
                    id="progress-date"
                    value="${todayString}"
                >


                <label>
                    Nota
                </label>


                <textarea
                    id="progress-note"
                    placeholder="Scrivi una nota..."
                ></textarea>


                <label>
                    Foto
                </label>


                <input
                    type="file"
                    id="progress-photo"
                    accept="image/*"
                >


                <div class="progress-modal-buttons">

                    <button
                        class="progress-cancel"
                        type="button"
                        onclick="closeProgressModal()"
                    >
                        ANNULLA
                    </button>


                    <button
                        class="progress-save"
                        type="button"
                        onclick="saveProgress(${index})"
                    >
                        SALVA
                    </button>

                </div>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    const amountInput =
        document.getElementById(
            "progress-amount"
        );


    if (amountInput) {

        amountInput.focus();

        amountInput.select();

    }

}


// =========================================================
// CHIUDI PROGRESSO
// =========================================================

function closeProgressModal() {

    const modal =
        document.querySelector(
            ".progress-modal"
        );


    if (modal) {
        modal.remove();
    }

}


// =========================================================
// SALVA PROGRESSO
// =========================================================

function saveProgress(index) {

    const target =
        targets[index];


    if (!target) {
        return;
    }


    const amountInput =
        document.getElementById(
            "progress-amount"
        );


    const amount =
        Number(
            amountInput.value
        );


    const date =
        document
            .getElementById(
                "progress-date"
            )
            .value;


    const note =
        document
            .getElementById(
                "progress-note"
            )
            .value
            .trim();


    const photoInput =
        document.getElementById(
            "progress-photo"
        );


    if (
        !amount ||
        amount <= 0
    ) {

        alert(
            "Inserisci una quantità valida."
        );

        return;

    }


    if (!date) {

        alert(
            "Seleziona una data."
        );

        return;

    }


    const remaining =
        target.goal -
        target.progress;


    if (amount > remaining) {

        alert(
            `Puoi aggiungere al massimo ${remaining}.`
        );

        return;

    }


    if (
        photoInput.files &&
        photoInput.files.length > 0
    ) {

        const file =
            photoInput.files[0];


        const reader =
            new FileReader();


        reader.onload =
            function(event) {

                completeProgress(
                    index,
                    amount,
                    date,
                    note,
                    event.target.result
                );

            };


        reader.readAsDataURL(
            file
        );

    } else {

        completeProgress(
            index,
            amount,
            date,
            note,
            null
        );

    }

}


// =========================================================
// COMPLETA PROGRESSO
// =========================================================

function completeProgress(
    index,
    amount,
    date,
    note,
    photo
) {

    const target =
        targets[index];


    if (!target) {
        return;
    }


    if (
        target.progress >=
        target.goal
    ) {
        return;
    }


    target.progress +=
        amount;


    if (
        target.progress >
        target.goal
    ) {

        target.progress =
            target.goal;

    }


    const completed =
        target.progress >=
        target.goal;


    if (!progressDays[date]) {

        progressDays[date] = [];

    }


    progressDays[date].push({

        target:
            target.name,

        color:
            target.color,

        amount:
            amount,

        note:
            note,

        photo:
            photo

    });


    saveTargets();


    localStorage.setItem(
        "progressDays",
        JSON.stringify(
            progressDays
        )
    );


    closeProgressModal();

    renderTargets();


    if (completed) {

        launchFireworks(
            target.color
        );

    }

}


// =========================================================
// FUOCHI D'ARTIFICIO
// =========================================================

function launchFireworks(color) {

    const container =
        document.createElement(
            "div"
        );


    container.className =
        "fireworks-container";


    document.body.appendChild(
        container
    );


    createFirework(
        container,
        "30%",
        "35%",
        color
    );


    setTimeout(
        () => {

            createFirework(
                container,
                "70%",
                "40%",
                color
            );

        },
        300
    );


    setTimeout(
        () => {

            container.remove();

        },
        1800
    );

}


// =========================================================
// CREA FUOCO
// =========================================================

function createFirework(
    container,
    x,
    y,
    color
) {

    const firework =
        document.createElement(
            "div"
        );


    firework.className =
        "firework";


    firework.style.left =
        x;


    firework.style.top =
        y;


    container.appendChild(
        firework
    );


    for (
        let i = 0;
        i < FIREWORK_COUNT;
        i++
    ) {

        const particle =
            document.createElement(
                "div"
            );


        particle.className =
            "firework-particle";


        particle.style.background =
            color;


        particle.style.boxShadow =
            `0 0 8px ${color}`;


        particle.style.setProperty(
            "--angle",
            `${i * (360 / FIREWORK_COUNT)}deg`
        );


        firework.appendChild(
            particle
        );

    }

}


// =========================================================
// NUOVO TARGET
// =========================================================

function showAddTarget() {

    document.getElementById(
        "content"
    ).innerHTML = `

        <h2>Nuovo Target</h2>


        <div class="form">

            <label>
                Nome
            </label>


            <input
                type="text"
                id="target-name"
                placeholder="Es. Palestra"
            >


            <label>
                Obiettivo
            </label>


            <input
                type="number"
                id="target-goal"
                placeholder="Es. 100"
                min="1"
                step="any"
            >


            <label>
                In quanti giorni?
            </label>


            <input
                type="number"
                id="target-days"
                placeholder="Es. 150"
                min="1"
            >


            <label>
                Colore
            </label>


            <input
                type="color"
                id="target-color"
                value="#6c9d6c"
            >


            <button
                class="create-button"
                onclick="createTarget()"
            >
                CREA TARGET
            </button>

        </div>

    `;

}


// =========================================================
// CREA TARGET
// =========================================================

function createTarget() {

    const name =
        document
            .getElementById(
                "target-name"
            )
            .value
            .trim();


    const goal =
        Number(
            document
                .getElementById(
                    "target-goal"
                )
                .value
        );


    const days =
        Number(
            document
                .getElementById(
                    "target-days"
                )
                .value
        );


    const color =
        document
            .getElementById(
                "target-color"
            )
            .value;


    if (
        !name ||
        goal <= 0 ||
        days <= 0
    ) {

        alert(
            "Compila correttamente tutti i campi."
        );

        return;

    }


    const newTarget = {

        name:
            name,

        goal:
            goal,

        days:
            days,

        color:
            color,

        progress:
            0,

        createdAt:
            new Date().toISOString()

    };


    targets.push(
        newTarget
    );


    saveTargets();

    showHome();

}


// =========================================================
// SALVA TARGET
// =========================================================

function saveTargets() {

    localStorage.setItem(
        "targets",
        JSON.stringify(
            targets
        )
    );

}


// =========================================================
// CALENDARIO
// =========================================================

function showCalendar() {

    document.getElementById(
        "content"
    ).innerHTML = `

        <div class="calendar">

            <div class="calendar-header">

                <button
                    class="calendar-nav"
                    onclick="previousMonth()"
                >
                    ‹
                </button>


                <div
                    id="calendar-title"
                    class="calendar-title"
                ></div>


                <button
                    class="calendar-nav"
                    onclick="nextMonth()"
                >
                    ›
                </button>

            </div>


            <div class="calendar-weekdays">

                <div class="calendar-weekday">
                    LUN
                </div>

                <div class="calendar-weekday">
                    MAR
                </div>

                <div class="calendar-weekday">
                    MER
                </div>

                <div class="calendar-weekday">
                    GIO
                </div>

                <div class="calendar-weekday">
                    VEN
                </div>

                <div class="calendar-weekday">
                    SAB
                </div>

                <div class="calendar-weekday">
                    DOM
                </div>

            </div>


            <div
                id="calendar-days"
                class="calendar-days"
            ></div>

        </div>

    `;


    renderCalendar();

}


// =========================================================
// DISEGNA CALENDARIO
// =========================================================

function renderCalendar() {

    const year =
        calendarDate.getFullYear();


    const month =
        calendarDate.getMonth();


    const monthNames = [

        "Gennaio",
        "Febbraio",
        "Marzo",
        "Aprile",
        "Maggio",
        "Giugno",
        "Luglio",
        "Agosto",
        "Settembre",
        "Ottobre",
        "Novembre",
        "Dicembre"

    ];


    const title =
        document.getElementById(
            "calendar-title"
        );


    const container =
        document.getElementById(
            "calendar-days"
        );


    if (
        !title ||
        !container
    ) {
        return;
    }


    title.textContent =
        monthNames[month] +
        " " +
        year;


    container.innerHTML = "";


    let firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();


    firstDay =
        (firstDay + 6) % 7;


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "calendar-day empty";


        container.appendChild(
            empty
        );

    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const dayElement =
            document.createElement(
                "div"
            );


        dayElement.className =
            "calendar-day";


        const dayNumber =
            document.createElement(
                "div"
            );


        dayNumber.className =
            "calendar-day-number";


        dayNumber.textContent =
            day;


        dayElement.appendChild(
            dayNumber
        );


        const dateKey =
            year +
            "-" +
            String(
                month + 1
            ).padStart(2, "0") +
            "-" +
            String(
                day
            ).padStart(2, "0");


        const today =
            new Date();


        if (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        ) {

            dayElement.classList.add(
                "today"
            );

        }


        const dotsContainer =
            document.createElement(
                "div"
            );


        dotsContainer.className =
            "calendar-dots";


        // ==========================
        // TARGET
        // ==========================

        if (
            progressDays[dateKey]
        ) {

            progressDays[dateKey].forEach(
                item => {

                    const dot =
                        document.createElement(
                            "div"
                        );


                    dot.className =
                        "calendar-dot";


                    dot.style.backgroundColor =
                        item.color;


                    dotsContainer.appendChild(
                        dot
                    );

                }
            );

        }


        // ==========================
        // ALLENAMENTO
        // ==========================

        const workoutDate =
            getWorkoutCompletionForDate(
                dateKey
            );


        if (workoutDate) {

            const workoutDot =
                document.createElement(
                    "div"
                );


            workoutDot.className =
                "calendar-dot workout-calendar-dot";


            workoutDot.style.backgroundColor =
                "#6c9d6c";


            dotsContainer.appendChild(
                workoutDot
            );

        }


        dayElement.appendChild(
            dotsContainer
        );


        dayElement.addEventListener(
            "click",
            () => {

                openDayModal(
                    dateKey
                );

            }
        );


        container.appendChild(
            dayElement
        );

    }

}


// =========================================================
// TROVA ALLENAMENTO COMPLETATO PER DATA
// =========================================================

function getWorkoutCompletionForDate(
    dateKey
) {

    const keys =
        Object.keys(
            workoutCompleted
        );


    for (
        const key of keys
    ) {

        const data =
            workoutCompleted[key];


        if (
            !data ||
            data.completed !== true
        ) {
            continue;
        }


        if (
            data.date === dateKey
        ) {

            return data;

        }

    }


    return null;

}


// =========================================================
// APRI GIORNATA
// =========================================================

function openDayModal(dateKey) {

    const activities =
        progressDays[dateKey] || [];


    const workout =
        getWorkoutCompletionForDate(
            dateKey
        );


    if (
        activities.length === 0 &&
        !workout
    ) {

        return;

    }


    const parts =
        dateKey.split("-");


    const date =
        new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );


    const dateText =
        date.toLocaleDateString(
            "it-IT",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );


    const modal =
        document.createElement(
            "div"
        );


    modal.className =
        "day-modal";


    modal.innerHTML = `

        <div class="day-modal-content">

            <button
                class="day-modal-close"
                onclick="closeDayModal()"
            >
                ×
            </button>


            <h2>
                ${dateText}
            </h2>


            ${
                workout
                ?
                `

                    <div class="day-workout">

                        <div
                            class="day-workout-color"
                            style="
                                background: #6c9d6c;
                            "
                        ></div>


                        <div
                            class="day-workout-content"
                        >

                            <h3>
                                🏋️ Allenamento
                            </h3>


                            <div class="day-workout-day">
                                Giorno ${workout.day} / 365
                            </div>


                            <div class="day-workout-focus">
                                ${workout.focus}
                            </div>


                            <div class="day-workout-circuits">
                                🔄 ${workout.circuits}
                                ${
                                    workout.circuits === 1
                                    ? "circuito completo"
                                    : "circuiti completi"
                                }
                            </div>


                            ${
                                workout.exercises &&
                                workout.exercises.length > 0
                                ?
                                `
                                    <div class="day-workout-exercises">

                                        <strong>
                                            Esercizi
                                        </strong>

                                        <ul>

                                            ${
                                                workout.exercises
                                                    .map(
                                                        exercise =>
                                                            `
                                                                <li>
                                                                    ${exercise}
                                                                </li>
                                                            `
                                                    )
                                                    .join("")
                                            }

                                        </ul>

                                    </div>
                                `
                                :
                                ""
                            }

                        </div>

                    </div>

                `
                :
                ""
            }


            ${
                activities.length > 0
                ?
                `

                    <div class="day-activities">

                        ${
                            activities.map(
                                item => `

                                    <div
                                        class="day-activity"
                                    >

                                        <div
                                            class="day-activity-color"
                                            style="
                                                background: ${item.color};
                                            "
                                        ></div>


                                        <div
                                            class="day-activity-content"
                                        >

                                            <h3>
                                                ${item.target}
                                            </h3>


                                            ${
                                                item.amount !== undefined
                                                ?
                                                `
                                                    <div
                                                        class="day-activity-amount"
                                                    >
                                                        +${item.amount}
                                                    </div>
                                                `
                                                :
                                                ""
                                            }


                                            ${
                                                item.note
                                                ?
                                                `
                                                    <div
                                                        class="day-activity-note"
                                                    >
                                                        ${item.note}
                                                    </div>
                                                `
                                                :
                                                ""
                                            }


                                            ${
                                                item.photo
                                                ?
                                                `
                                                    <img
                                                        class="day-activity-photo"
                                                        src="${item.photo}"
                                                        onclick="openPhoto('${item.photo}')"
                                                    >
                                                `
                                                :
                                                ""
                                            }

                                        </div>

                                    </div>

                                `
                            ).join("")
                        }

                    </div>

                `
                :
                ""
            }

        </div>

    `;


    document.body.appendChild(
        modal
    );

}


// =========================================================
// CHIUDI GIORNATA
// =========================================================

function closeDayModal() {

    const modal =
        document.querySelector(
            ".day-modal"
        );


    if (modal) {
        modal.remove();
    }

}


// =========================================================
// APRI FOTO
// =========================================================

function openPhoto(photo) {

    const modal =
        document.createElement(
            "div"
        );


    modal.className =
        "photo-modal";


    modal.innerHTML = `

        <div
            class="photo-modal-content"
        >

            <button
                class="photo-modal-close"
                onclick="this.parentElement.parentElement.remove()"
            >
                ×
            </button>


            <img
                src="${photo}"
            >

        </div>

    `;


    document.body.appendChild(
        modal
    );

}


// =========================================================
// MESE PRECEDENTE
// =========================================================

function previousMonth() {

    calendarDate.setMonth(
        calendarDate.getMonth() - 1
    );


    renderCalendar();

}


// =========================================================
// MESE SUCCESSIVO
// =========================================================

function nextMonth() {

    calendarDate.setMonth(
        calendarDate.getMonth() + 1
    );


    renderCalendar();

}

// =========================================================
// AVVIA PROGRAMMA
// =========================================================

function startWorkoutProgram() {

    const alreadyStarted =
        localStorage.getItem("workoutStartDate");

    if (alreadyStarted) {
        return;
    }

    const today =
        new Date();

    const dateKey =
        today.getFullYear() +
        "-" +
        String(today.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(today.getDate()).padStart(2, "0");

    localStorage.setItem(
        "workoutStartDate",
        dateKey
    );

    showWorkout();

}

// =========================================================
// GIORNO DELL'ANNO
// =========================================================

function getDayOfYear() {

    const startDate =
        localStorage.getItem("workoutStartDate");

    // Programma non ancora avviato
    if (!startDate) {
        return 0;
    }

    const start =
        new Date(startDate);

    const today =
        new Date();

    // Ignora ore/minuti/secondi
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diff =
        today - start;

    return (
        Math.floor(
            diff /
            (1000 * 60 * 60 * 24)
        ) + 1
    );

}


// =========================================================
// TROVA ALLENAMENTO DEL GIORNO
// =========================================================

function getWorkoutForToday() {

    if (!workout365) {

        console.error("workout365 non caricato");

        return null;

    }

    const day = getDayOfYear();

    console.log("GIORNO CERCATO:", day);
console.log("WORKOUT365:", workout365);


    // =====================================================
    // FORMATO CON WEEKS
    // =====================================================

    if (Array.isArray(workout365.weeks)) {

        for (const week of workout365.weeks) {

            if (!Array.isArray(week.days)) {
                continue;
            }

            const workout =
                week.days.find(
                    item =>
                        Number(item.day) === day
                );

            if (workout) {

                return {

                    ...workout,

                    week:
                        week.week,

                    weekFocus:
                        week.focus

                };

            }

        }

    }


    // =====================================================
    // FORMATO DIRETTO ARRAY
    // =====================================================

    if (Array.isArray(workout365)) {

        const workout =
            workout365.find(
                item =>
                    Number(item.day) === day
            );

        if (workout) {
            return workout;
        }

    }


    // =====================================================
    // FORMATO OBJECT DAYS
    // =====================================================

    if (Array.isArray(workout365.days)) {

        const workout =
            workout365.days.find(
                item =>
                    Number(item.day) === day
            );

        if (workout) {
            return workout;
        }

    }


    console.error(
        "Allenamento non trovato per il giorno:",
        day
    );

    return null;

}

// =========================================================
// FORMATTA ESERCIZIO
// =========================================================

function getExercisePrescription(
    exercise
) {

    if (
        exercise.reps !== undefined
    ) {

        let text =
            exercise.reps +
            " ripetizioni";

        if (
            exercise.per_side === true
        ) {

            text +=
                " per lato";

        }

        return text;

    }


    if (
        exercise.seconds !== undefined
    ) {

        return (
            exercise.seconds +
            " secondi"
        );

    }


    if (
        exercise.duration_seconds !== undefined
    ) {

        return (
            exercise.duration_seconds +
            " secondi"
        );

    }


    if (
        exercise.prescription
    ) {

        return exercise.prescription;

    }


    return "";

}


// =========================================================
// MOSTRA ALLENAMENTO
// =========================================================

function showWorkout() {

    const content =
        document.getElementById(
            "content"
        );


    if (!content) {
        return;
    }


const day =
    getDayOfYear();


// =====================================================
// PROGRAMMA NON ANCORA AVVIATO
// =====================================================

if (day === 0) {

    content.innerHTML = `

        <div class="workout-header">

            <div class="workout-day">
                PROGRAMMA 365 GIORNI
            </div>

            <h2 class="workout-title">
                Inizia il tuo percorso
            </h2>

            <div class="workout-subtitle">
                Premi il pulsante per iniziare dal Giorno 1.
            </div>

        </div>


        <button
            class="workout-start"
            onclick="startWorkoutProgram()"
        >
            AVVIA PROGRAMMA
        </button>

    `;

    return;

}


const workout =
    getWorkoutForToday();


// =====================================================
// ALLENAMENTO NON TROVATO
// =====================================================

if (!workout) {

        content.innerHTML = `

            <div class="workout-header">

                <div class="workout-day">
                    GIORNO ${day} / 365
                </div>

                <h2 class="workout-title">
                    Allenamento non disponibile
                </h2>

                <div class="workout-subtitle">
                    Nessun allenamento trovato per il giorno ${day}.
                </div>

            </div>

        `;

        return;

    }


    // =====================================================
    // COMPLETATO?
    // =====================================================

    const completed =
        workoutCompleted[day] &&
        workoutCompleted[day].completed === true;


    // =====================================================
    // ESERCIZI
    // =====================================================

    const exercisesHTML =
        workout.exercises
            .map(
                (exercise, index) => {

                    const prescription =
                        getExercisePrescription(
                            exercise
                        );


                    return `

                        <div
                            class="workout-card"
                            data-exercise-index="${index}"
                        >

                            <div
                                class="workout-card-header"
                            >

                                <div
                                    class="workout-exercise"
                                >
                                    ${exercise.name}
                                </div>

                                <div
                                    class="workout-prescription"
                                >
                                    ${prescription}
                                </div>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    // =====================================================
    // PAGINA
    // =====================================================

    content.innerHTML = `

        <div class="workout-header">

            <div class="workout-day">
                GIORNO ${day} / 365
            </div>

            <h2 class="workout-title">
                ${workout.focus}
            </h2>

            <div class="workout-subtitle">

                ${
                    workout.equipment
                    ? workout.equipment
                    : ""
                }

                ${
                    workout.weight_kg
                    ? " · " +
                      workout.weight_kg +
                      " kg"
                    : ""
                }

            </div>

        </div>


        <div class="workout-progress">

            <div class="workout-progress-bar">

                <div
                    class="workout-progress-fill"
                    style="
                        width: ${(day / 365) * 100}%;
                    "
                ></div>

            </div>

            <div class="workout-progress-text">
                ${day} / 365 giorni
            </div>

        </div>


        <div class="workout-structure">

            8 MIN · AMRAP ·
            ${workout.exercises.length}
            ESERCIZI

        </div>


        <div
            id="workout-exercises"
        >

            ${exercisesHTML}

        </div>


        ${
            completed

            ?

            `

                <button
                    class="workout-completed"
                    disabled
                >
                    ✓ ALLENAMENTO COMPLETATO
                </button>

            `

            :

            `

                <button
                    class="workout-start"
                    onclick="startWorkout()"
                >
                    INIZIA ALLENAMENTO · 8 MIN
                </button>

            `

        }

    `;

}


// =========================================================
// AVVIA ALLENAMENTO
// =========================================================

function startWorkout() {

    const workout =
        getWorkoutForToday();


    if (!workout) {

        alert(
            "Allenamento non disponibile."
        );

        return;

    }


    // Se esiste già un timer

    if (
        window.workoutTimer
    ) {

        clearInterval(
            window.workoutTimer
        );

    }


    let seconds =
        8 * 60;


    const day =
        getDayOfYear();


    const content =
        document.getElementById(
            "content"
        );


    content.innerHTML = `

        <div class="workout-header">

            <div class="workout-day">
                GIORNO ${day} / 365
            </div>

            <h2 class="workout-title">
                ${workout.focus}
            </h2>

            <div class="workout-subtitle">
                ${workout.equipment || ""}
            </div>

        </div>


        <div
            class="workout-timer"
            id="workout-timer"
        >
            08:00
        </div>


        <div
            class="workout-active-exercises"
        >

            <div class="workout-active-title">
                ESERCIZI
            </div>


            <div id="active-exercises-list">

                ${
                    workout.exercises
                        .map(
                            (exercise, index) => `

                                <div
                                    class="active-exercise"
                                    id="active-exercise-${index}"
                                >

                                    <div
                                        class="active-exercise-number"
                                    >
                                        ${index + 1}
                                    </div>

                                    <div
                                        class="active-exercise-info"
                                    >

                                        <div
                                            class="active-exercise-name"
                                        >
                                            ${exercise.name}
                                        </div>

                                        <div
                                            class="active-exercise-prescription"
                                        >
                                            ${getExercisePrescription(exercise)}
                                        </div>

                                    </div>

                                </div>

                            `
                        )
                        .join("")
                }

            </div>

        </div>


        <div class="workout-rest">

            Completa gli esercizi
            a rotazione per 8 minuti.

        </div>


        <button
            class="workout-finish"
            onclick="finishWorkout()"
        >
            TERMINA ALLENAMENTO
        </button>

    `;


    const timer =
        document.getElementById(
            "workout-timer"
        );


    window.workoutTimer =
        setInterval(
            () => {

                seconds--;


                const minutes =
                    Math.floor(
                        seconds / 60
                    );


                const remainingSeconds =
                    seconds % 60;


                if (timer) {

                    timer.textContent =
                        String(minutes)
                            .padStart(2, "0")
                        +
                        ":"
                        +
                        String(
                            remainingSeconds
                        )
                            .padStart(2, "0");

                }


                if (
                    seconds <= 0
                ) {

                    clearInterval(
                        window.workoutTimer
                    );

                    window.workoutTimer =
                        null;


                    finishWorkout();

                }

            },
            1000
        );

}


// =========================================================
// TERMINA ALLENAMENTO
// =========================================================

function finishWorkout() {

    if (
        window.workoutTimer
    ) {

        clearInterval(
            window.workoutTimer
        );

        window.workoutTimer =
            null;

    }


    const day =
        getDayOfYear();


    const workout =
        getWorkoutForToday();


    if (!workout) {
        return;
    }


    // =====================================================
    // CHIEDI CIRCUITI COMPLETI
    // =====================================================

    const circuits =
        prompt(
            "Quanti circuiti completi hai fatto?"
        );


    if (
        circuits === null
    ) {

        // L'utente ha premuto ANNULLA.
        // Non completiamo l'allenamento.

        return;

    }


    const completedCircuits =
        Number(
            circuits
        );


    if (
        !Number.isInteger(
            completedCircuits
        ) ||
        completedCircuits < 0
    ) {

        alert(
            "Inserisci un numero valido di circuiti."
        );

        return;

    }


    // =====================================================
    // DATA AUTOMATICA
    // =====================================================

    const now =
        new Date();


    const dateKey =
        now.getFullYear() +
        "-" +
        String(
            now.getMonth() + 1
        ).padStart(2, "0") +
        "-" +
        String(
            now.getDate()
        ).padStart(2, "0");


    // =====================================================
    // CREA NOTA AUTOMATICA
    // =====================================================

    const exerciseList =
        workout.exercises
            .map(
                exercise => {

                    return (
                        exercise.name +
                        " (" +
                        getExercisePrescription(
                            exercise
                        ) +
                        ")"
                    );

                }
            )
            .join(", ");


    const automaticNote =
        "Allenamento Giorno " +
        day +
        "/365 · " +
        workout.focus +
        " · " +
        completedCircuits +
        " circuiti completi · " +
        exerciseList;


    // =====================================================
    // SALVA COMPLETAMENTO
    // =====================================================

    workoutCompleted[day] = {

        completed:
            true,

        date:
            dateKey,

        circuits:
            completedCircuits,

        exercises:
            workout.exercises.map(
                exercise => ({
                    name:
                        exercise.name,

                    prescription:
                        getExercisePrescription(
                            exercise
                        )
                })
            ),

        note:
            automaticNote

    };


    localStorage.setItem(
        "workoutCompleted",
        JSON.stringify(
            workoutCompleted
        )
    );


    // =====================================================
    // SALVA NEL CALENDARIO
    // =====================================================

    if (
        !progressDays[dateKey]
    ) {

        progressDays[dateKey] = [];

    }


    progressDays[dateKey].push({

        target:
            "Allenamento " +
            day +
            "/365",

        color:
            "#6c9d6c",

        amount:
            completedCircuits,

        note:
            automaticNote,

        workout:
            true,

        day:
            day,

        focus:
            workout.focus,

        circuits:
            completedCircuits,

        exercises:
            workout.exercises.map(
                exercise => ({
                    name:
                        exercise.name,

                    prescription:
                        getExercisePrescription(
                            exercise
                        )
                })
            )

    });


    localStorage.setItem(
        "progressDays",
        JSON.stringify(
            progressDays
        )
    );


    // =====================================================
    // FESTEGGIA
    // =====================================================

    launchFireworks(
        "#6c9d6c"
    );


    // =====================================================
    // TORNA ALL'ALLENAMENTO
    // =====================================================

    showWorkout();

}


// =========================================================
// AVVIO APP
// =========================================================

async function startWorkoutApp() {

    await loadWorkout365();

    showWorkout();

}


startWorkoutApp();