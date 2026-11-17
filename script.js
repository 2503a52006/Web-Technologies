/* ============================================================
   Smart Attendance - shared script (used by every page)
   Page names:  newindex (login), newdashboard, newstudent,
                newattendance, newreport, newadmin
   ============================================================ */

const LOGIN_PAGE = "newindex.html";
const HOME_PAGE  = "newdashboard.html";

/* current page file name, e.g. "newstudent.html" */
const currentPage =
    window.location.pathname.split("/").pop() || LOGIN_PAGE;


/* ---------- small helpers ---------- */

function showToast(message) {
    let toast = document.getElementById("toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        document.body.appendChild(toast);
    }

    toast.innerText = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () {
        toast.classList.remove("show");
    }, 2500);
}

function goTo(page) {
    window.location.href = page;
}


/* ---------- LOGIN ---------- */

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    /* already logged in? skip the login screen */
    if (localStorage.getItem("loggedIn") === "true") {
        goTo(HOME_PAGE);
    }

    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const email    = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const role     = document.getElementById("role").value;
        const message  = document.getElementById("loginMessage");

        if (email === "" || password === "") {
            message.innerText = "Please enter email and password.";
            return;
        }

        if (role === "") {
            message.innerText = "Please select a role.";
            return;
        }

        /*
            Demo login - any email/password works.
            Later this will be replaced by
            Node.js + Express + MongoDB authentication.
        */
        localStorage.setItem("loggedIn", "true");
        localStorage.setItem("role", role);
        localStorage.setItem("email", email);

        goTo(HOME_PAGE);
    });
}


/* ---------- LOGOUT ---------- */

function logout() {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("role");
    localStorage.removeItem("email");

    goTo(LOGIN_PAGE);
}


/* ---------- PAGE GUARD + NAV (runs on every inner page) ---------- */

if (document.body.hasAttribute("data-protected")) {

    const role = localStorage.getItem("role");

    if (localStorage.getItem("loggedIn") !== "true") {

        /* not logged in -> back to login */
        goTo(LOGIN_PAGE);

    } else if (currentPage === "newadmin.html" && role !== "admin") {

        /* only admins may open the admin page */
        goTo(HOME_PAGE);
    }

    document.addEventListener("DOMContentLoaded", function () {

        /* highlight current sidebar link */
        document.querySelectorAll(".sidebar a").forEach(function (link) {
            if (link.getAttribute("href") === currentPage) {
                link.classList.add("active");
            }
        });

        /* hide admin-only links for non-admins */
        if (role !== "admin") {
            document.querySelectorAll("[data-role='admin']").forEach(function (el) {
                el.style.display = "none";
            });
        }

        /* show who is logged in */
        const who = document.getElementById("whoami");
        if (who) {
            who.innerText =
                (localStorage.getItem("email") || "") +
                (role ? " (" + role + ")" : "");
        }
    });
}


/* ---------- DATA STORE (shared by every page) ----------
   Students and faculty live in localStorage, so a person added or
   removed on the Admin page is also added/removed on the Students
   and Attendance pages. Later this becomes MongoDB.
   -------------------------------------------------------------- */

const DEFAULT_STUDENTS = [
    { roll: "101", name: "Rahul Kumar",  dept: "CSE-AIML", year: "2", section: "A", attendance: "92%" },
    { roll: "102", name: "Arun Kumar",   dept: "CSE-AIML", year: "2", section: "A", attendance: "68%" },
    { roll: "103", name: "Priya Sharma", dept: "CSE-AIML", year: "2", section: "A", attendance: "86%" }
];

const DEFAULT_FACULTY = [
    { id: "F001", name: "Dr. Anita Rao",   dept: "CSE-AIML", subject: "Artificial Intelligence", email: "anita.rao@college.edu" },
    { id: "F002", name: "Prof. Suresh Reddy", dept: "CSE-AIML", subject: "Machine Learning",     email: "suresh.reddy@college.edu" },
    { id: "F003", name: "Dr. Kavitha Nair", dept: "CSE",      subject: "DBMS",                   email: "kavitha.nair@college.edu" }
];

function loadList(key, defaults) {
    try {
        const raw = localStorage.getItem(key);
        if (raw) { return JSON.parse(raw); }
    } catch (e) { /* fall through to defaults */ }

    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults.slice();
}

function saveList(key, list) {
    localStorage.setItem(key, JSON.stringify(list));
}

function getStudents()  { return loadList("students", DEFAULT_STUDENTS); }
function getFaculty()   { return loadList("faculty",  DEFAULT_FACULTY); }
function saveStudents(list) { saveList("students", list); }
function saveFaculty(list)  { saveList("faculty",  list); }

/* add helpers return an error message, or null when it worked */
function addStudentRecord(rec) {
    const list = getStudents();

    if (list.some(function (s) { return s.roll === rec.roll; })) {
        return "Roll number " + rec.roll + " already exists.";
    }

    list.push(rec);
    saveStudents(list);
    return null;
}

function addFacultyRecord(rec) {
    const list = getFaculty();

    if (list.some(function (f) { return f.id.toLowerCase() === rec.id.toLowerCase(); })) {
        return "Faculty ID " + rec.id + " already exists.";
    }

    list.push(rec);
    saveFaculty(list);
    return null;
}

function removeStudentRecord(roll) {
    saveStudents(getStudents().filter(function (s) { return s.roll !== roll; }));
}

function removeFacultyRecord(id) {
    saveFaculty(getFaculty().filter(function (f) { return f.id !== id; }));
}

function makeCell(text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    return cell;
}

function emptyRow(columns, text) {
    const row  = document.createElement("tr");
    const cell = makeCell(text);
    cell.colSpan = columns;
    cell.style.textAlign = "center";
    cell.style.color = "#a8b0c8";
    row.appendChild(cell);
    return row;
}

function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const first = el.querySelector("input");
        if (first) { first.focus({ preventScroll: true }); }
    }
}


/* ---------- STUDENTS PAGE ---------- */

function searchStudents() {

    const filter =
        document.getElementById("studentSearch").value.toLowerCase();

    const rows =
        document.querySelectorAll("#studentTable tbody tr");

    rows.forEach(function (row) {
        row.style.display =
            row.innerText.toLowerCase().includes(filter) ? "" : "none";
    });
}

function buildStudentRow(s) {

    const row = document.createElement("tr");

    [s.roll, s.name, s.dept, s.year, s.section, s.attendance].forEach(function (value) {
        row.appendChild(makeCell(value));
    });

    const actions = document.createElement("td");
    actions.innerHTML =
        '<button class="edit-btn">Edit</button> ' +
        '<button class="delete-btn">Delete</button>';
    row.appendChild(actions);

    return row;
}

function renderStudentTable() {

    const body = document.querySelector("#studentTable tbody");
    if (!body) { return; }

    body.innerHTML = "";

    const list = getStudents();

    if (list.length === 0) {
        body.appendChild(emptyRow(7, "No students registered."));
        return;
    }

    list.forEach(function (s) { body.appendChild(buildStudentRow(s)); });
}

function addStudent() {

    const name = prompt("Enter student name:");
    if (!name) { return; }

    const roll = prompt("Enter roll number:");
    if (!roll) { return; }

    const error = addStudentRecord({
        roll: roll.trim(), name: name.trim(),
        dept: "CSE-AIML", year: "2", section: "A", attendance: "—"
    });

    if (error) {
        showToast(error);
        return;
    }

    renderStudentTable();
    showToast("Student " + name + " added successfully!");
}

/* Edit / Delete buttons */
const studentTable = document.getElementById("studentTable");

if (studentTable) {

    renderStudentTable();

    studentTable.addEventListener("click", function (event) {

        const button = event.target.closest("button");
        if (!button) { return; }

        const row  = button.closest("tr");
        const roll = row.cells[0].innerText.trim();
        const name = row.cells[1].innerText;

        if (button.classList.contains("delete-btn")) {

            if (confirm("Delete " + name + "?")) {
                removeStudentRecord(roll);
                renderStudentTable();
                showToast(name + " deleted.");
            }
        }

        if (button.classList.contains("edit-btn")) {

            const newName = prompt("Edit student name:", name);

            if (newName && newName.trim() !== "") {
                const list = getStudents();
                list.forEach(function (s) {
                    if (s.roll === roll) { s.name = newName.trim(); }
                });
                saveStudents(list);
                renderStudentTable();
                showToast("Student updated.");
            }
        }
    });

    /* open the add dialog straight away when coming from Dashboard */
    if (window.location.hash === "#add") {
        window.addEventListener("load", function () {
            history.replaceState(null, "", currentPage);
            addStudent();
        });
    }
}


/* ---------- ATTENDANCE ---------- */

function renderAttendanceTable() {

    const body = document.querySelector("#attendanceTable tbody");
    if (!body) { return; }

    body.innerHTML = "";

    const list = getStudents();

    if (list.length === 0) {
        body.appendChild(emptyRow(5, "No students registered."));
        return;
    }

    list.forEach(function (s) {

        const row = document.createElement("tr");
        row.appendChild(makeCell(s.roll));
        row.appendChild(makeCell(s.name));

        ["present", "absent", "late"].forEach(function (status) {
            const cell  = document.createElement("td");
            const radio = document.createElement("input");
            radio.type    = "radio";
            radio.name    = "student" + s.roll;
            radio.value   = status;
            radio.checked = (status === "present");
            cell.appendChild(radio);
            row.appendChild(cell);
        });

        body.appendChild(row);
    });
}

renderAttendanceTable();


function saveAttendance() {

    const date = document.getElementById("attendanceDate");

    if (date && date.value === "") {
        showToast("Please select a date first.");
        return;
    }

    const records = [];

    document.querySelectorAll("#attendanceTable tbody tr").forEach(function (row) {
        const checked = row.querySelector("input[type=radio]:checked");
        records.push({
            roll:   row.cells[0].innerText.trim(),
            name:   row.cells[1].innerText.trim(),
            status: checked ? checked.value : "absent"
        });
    });

    const subject = document.getElementById("attendanceSubject");

    /* kept in the browser until the backend exists */
    const saved = JSON.parse(localStorage.getItem("attendanceRecords") || "[]");

    saved.push({
        subject: subject ? subject.value : "",
        date:    date ? date.value : "",
        records: records
    });

    localStorage.setItem("attendanceRecords", JSON.stringify(saved));

    showToast("Attendance saved successfully!");
}


/* ---------- REPORTS ---------- */

function generateReport() {
    showToast("Attendance report generated successfully!");
}

function downloadPDF() {
    /* opens the print dialog -> choose "Save as PDF" */
    window.print();
}

function exportExcel() {

    const table = document.getElementById("classReportTable");
    if (!table) { return; }

    const lines = [];

    table.querySelectorAll("tr").forEach(function (row) {
        const cells = Array.from(row.cells).map(function (cell) {
            return '"' + cell.innerText.trim().replace(/"/g, '""') + '"';
        });
        lines.push(cells.join(","));
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "attendance-report.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    showToast("Report exported (opens in Excel).");
}



/* ---------- ADMIN: register / remove students and faculty ---------- */

function renderAdmin() {

    const studentBody = document.getElementById("adminStudentBody");
    if (!studentBody) { return; }

    const facultyBody = document.getElementById("adminFacultyBody");
    const students    = getStudents();
    const faculty     = getFaculty();

    /* live counts on the stat cards */
    document.getElementById("statStudents").innerText = students.length;
    document.getElementById("statFaculty").innerText  = faculty.length;

    /* students table */
    studentBody.innerHTML = "";

    if (students.length === 0) {
        studentBody.appendChild(emptyRow(6, "No students registered."));
    }

    students.forEach(function (s) {
        const row = document.createElement("tr");
        [s.roll, s.name, s.dept, s.year, s.section].forEach(function (v) {
            row.appendChild(makeCell(v));
        });

        const action = document.createElement("td");
        const btn    = document.createElement("button");
        btn.className = "delete-btn";
        btn.textContent = "Remove";
        btn.dataset.removeStudent = s.roll;
        action.appendChild(btn);
        row.appendChild(action);

        studentBody.appendChild(row);
    });

    /* faculty table */
    facultyBody.innerHTML = "";

    if (faculty.length === 0) {
        facultyBody.appendChild(emptyRow(6, "No faculty registered."));
    }

    faculty.forEach(function (f) {
        const row = document.createElement("tr");
        [f.id, f.name, f.dept, f.subject, f.email].forEach(function (v) {
            row.appendChild(makeCell(v));
        });

        const action = document.createElement("td");
        const btn    = document.createElement("button");
        btn.className = "delete-btn";
        btn.textContent = "Remove";
        btn.dataset.removeFaculty = f.id;
        action.appendChild(btn);
        row.appendChild(action);

        facultyBody.appendChild(row);
    });
}

function registerStudent(event) {

    event.preventDefault();

    const error = addStudentRecord({
        roll:       document.getElementById("sRoll").value.trim(),
        name:       document.getElementById("sName").value.trim(),
        dept:       document.getElementById("sDept").value,
        year:       document.getElementById("sYear").value,
        section:    document.getElementById("sSection").value.trim().toUpperCase(),
        attendance: "—"
    });

    if (error) {
        showToast(error);
        return;
    }

    const name = document.getElementById("sName").value.trim();
    document.getElementById("studentForm").reset();
    renderAdmin();
    showToast("Student " + name + " registered.");
}

function registerFaculty(event) {

    event.preventDefault();

    const error = addFacultyRecord({
        id:      document.getElementById("fId").value.trim().toUpperCase(),
        name:    document.getElementById("fName").value.trim(),
        dept:    document.getElementById("fDept").value,
        subject: document.getElementById("fSubject").value.trim(),
        email:   document.getElementById("fEmail").value.trim()
    });

    if (error) {
        showToast(error);
        return;
    }

    const name = document.getElementById("fName").value.trim();
    document.getElementById("facultyForm").reset();
    renderAdmin();
    showToast("Faculty " + name + " registered.");
}

const adminStudentBody = document.getElementById("adminStudentBody");

if (adminStudentBody) {

    renderAdmin();

    adminStudentBody.addEventListener("click", function (event) {

        const btn = event.target.closest("button[data-remove-student]");
        if (!btn) { return; }

        const roll    = btn.dataset.removeStudent;
        const student = getStudents().find(function (s) { return s.roll === roll; });
        const name    = student ? student.name : roll;

        if (confirm("Remove student " + name + " (roll " + roll + ") from the college?")) {
            removeStudentRecord(roll);
            renderAdmin();
            showToast(name + " removed.");
        }
    });

    document.getElementById("adminFacultyBody").addEventListener("click", function (event) {

        const btn = event.target.closest("button[data-remove-faculty]");
        if (!btn) { return; }

        const id      = btn.dataset.removeFaculty;
        const teacher = getFaculty().find(function (f) { return f.id === id; });
        const name    = teacher ? teacher.name : id;

        if (confirm("Remove faculty " + name + " (" + id + ") from the college?")) {
            removeFacultyRecord(id);
            renderAdmin();
            showToast(name + " removed.");
        }
    });
}