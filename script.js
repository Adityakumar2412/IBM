// Firebase Configuration - REPLACE WITH YOUR CONFIG
const firebaseConfig = {
   apiKey: "AIzaSyBbE4o0_EIHGo_ip6qGAJ4Ab4J_WJv-lAU",
  authDomain: "education-center-90c26.firebaseapp.com",
  databaseURL: "https://education-center-90c26-default-rtdb.firebaseio.com",
  projectId: "education-center-90c26",
  storageBucket: "education-center-90c26.firebasestorage.app",
  messagingSenderId: "1028431078413",
  appId: "1:1028431078413:web:8f7d6aeb7eceef5557e144"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Data storage
let students = [];
let enrollments = [];
let libraryRecords = [];

// DOM Elements
const loginContainer = document.getElementById('loginContainer');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const userEmail = document.getElementById('userEmail');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const themeText = document.getElementById('themeText');
const navLinks = document.querySelectorAll('.nav-link');
const tabContents = document.querySelectorAll('.tab-content');

// Student Management Elements
const addStudentForm = document.getElementById('addStudentForm');
const studentTableBody = document.getElementById('studentTableBody');
const noStudentsMessage = document.getElementById('noStudentsMessage');

// Course Enrollment Elements
const enrollStudentForm = document.getElementById('enrollStudentForm');
const enrollStudentSelect = document.getElementById('enrollStudent');
const enrollmentTableBody = document.getElementById('enrollmentTableBody');
const noEnrollmentsMessage = document.getElementById('noEnrollmentsMessage');

// Library Management Elements
const libraryForm = document.getElementById('libraryForm');
const libraryStudentSelect = document.getElementById('libraryStudent');
const libraryTableBody = document.getElementById('libraryTableBody');
const noLibraryRecordsMessage = document.getElementById('noLibraryRecordsMessage');

// Dashboard Elements
const totalStudentsEl = document.getElementById('totalStudents');
const avgAttendanceEl = document.getElementById('avgAttendance');
const totalCoursesEl = document.getElementById('totalCourses');
const issuedBooksEl = document.getElementById('issuedBooks');

// Chart.js Implementation
let attendanceChart;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    
    // Check if user is already logged in
    auth.onAuthStateChanged((user) => {
        if (user) {
            showMainApp(user);
            loadDataFromFirebase();
        } else {
            showLogin();
        }
    });
});

// Firebase Authentication
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            showMainApp(user);
            loadDataFromFirebase();
        })
        .catch((error) => {
            loginMessage.textContent = error.message;
            loginMessage.className = 'message error';
        });
});

function logout() {
    auth.signOut().then(() => {
        showLogin();
    });
}

function showMainApp(user) {
    loginContainer.style.display = 'none';
    mainApp.style.display = 'block';
    userEmail.textContent = user.email;
}

function showLogin() {
    loginContainer.style.display = 'flex';
    mainApp.style.display = 'none';
    students = [];
    enrollments = [];
    libraryRecords = [];
    renderStudentTable();
    renderEnrollmentTable();
    renderLibraryTable();
}

// Firebase Realtime Database Functions
function loadDataFromFirebase() {
    const userId = auth.currentUser.uid;
    
    // Load students
    database.ref('users/' + userId + '/students').on('value', (snapshot) => {
        students = snapshot.val() || [];
        renderStudentTable();
        updateStudentDropdowns();
        updateDashboardStats();
        updateAttendanceChart();
    });
    
    // Load enrollments
    database.ref('users/' + userId + '/enrollments').on('value', (snapshot) => {
        enrollments = snapshot.val() || [];
        renderEnrollmentTable();
        updateDashboardStats();
    });
    
    // Load library records
    database.ref('users/' + userId + '/libraryRecords').on('value', (snapshot) => {
        libraryRecords = snapshot.val() || [];
        renderLibraryTable();
        updateDashboardStats();
    });
}

function saveDataToFirebase(dataType, data) {
    const userId = auth.currentUser.uid;
    return database.ref('users/' + userId + '/' + dataType).set(data);
}

// Student Management
addStudentForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('studentName').value;
    const rollNo = document.getElementById('studentRollNo').value;
    const studentClass = document.getElementById('studentClass').value;
    
    // Check if roll number already exists
    if (students.some(student => student.rollNo === rollNo)) {
        alert('A student with this roll number already exists.');
        return;
    }
    
    const newStudent = {
        id: Date.now().toString(),
        name,
        rollNo,
        class: studentClass,
        attendance: 100
    };
    
    students.push(newStudent);
    saveDataToFirebase('students', students);
    addStudentForm.reset();
});

function renderStudentTable() {
    studentTableBody.innerHTML = '';
    
    if (students.length === 0) {
        noStudentsMessage.style.display = 'block';
        return;
    }
    
    noStudentsMessage.style.display = 'none';
    
    students.forEach(student => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.rollNo}</td>
            <td>${student.class}</td>
            <td>${student.attendance}%</td>
            <td>
                <div class="attendance-controls">
                    <button class="btn-small success" onclick="changeAttendance('${student.id}', 1)">+</button>
                    <button class="btn-small warning" onclick="changeAttendance('${student.id}', -1)">-</button>
                    <button class="btn-small danger" onclick="deleteStudent('${student.id}')">Delete</button>
                </div>
            </td>
        `;
        
        studentTableBody.appendChild(row);
    });
}

function changeAttendance(studentId, change) {
    const student = students.find(s => s.id === studentId);
    if (student) {
        student.attendance = Math.max(0, Math.min(100, student.attendance + change));
        saveDataToFirebase('students', students);
    }
}

function deleteStudent(studentId) {
    if (confirm('Are you sure you want to delete this student?')) {
        students = students.filter(student => student.id !== studentId);
        enrollments = enrollments.filter(enrollment => enrollment.studentId !== studentId);
        saveDataToFirebase('students', students);
        saveDataToFirebase('enrollments', enrollments);
    }
}

// Course Enrollment
enrollStudentForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const studentId = enrollStudentSelect.value;
    const course = document.getElementById('courseSelect').value;
    
    // Check if student is already enrolled in this course
    if (enrollments.some(enrollment => 
        enrollment.studentId === studentId && enrollment.course === course)) {
        alert('This student is already enrolled in this course.');
        return;
    }
    
    const newEnrollment = {
        id: Date.now().toString(),
        studentId,
        course,
        date: new Date().toLocaleDateString()
    };
    
    enrollments.push(newEnrollment);
    saveDataToFirebase('enrollments', enrollments);
    enrollStudentForm.reset();
});

function renderEnrollmentTable() {
    enrollmentTableBody.innerHTML = '';
    
    if (enrollments.length === 0) {
        noEnrollmentsMessage.style.display = 'block';
        return;
    }
    
    noEnrollmentsMessage.style.display = 'none';
    
    enrollments.forEach(enrollment => {
        const student = students.find(s => s.id === enrollment.studentId);
        if (student) {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${student.name}</td>
                <td>${student.rollNo}</td>
                <td>${student.class}</td>
                <td>${enrollment.course}</td>
                <td>
                    <button class="btn-small danger" onclick="unenrollStudent('${enrollment.id}')">Unenroll</button>
                </td>
            `;
            
            enrollmentTableBody.appendChild(row);
        }
    });
}

function unenrollStudent(enrollmentId) {
    if (confirm('Are you sure you want to unenroll this student from the course?')) {
        enrollments = enrollments.filter(enrollment => enrollment.id !== enrollmentId);
        saveDataToFirebase('enrollments', enrollments);
    }
}

// Library Management
libraryForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const studentId = libraryStudentSelect.value;
    const bookTitle = document.getElementById('bookTitle').value;
    const action = document.querySelector('input[name="bookAction"]:checked').value;
    
    const student = students.find(s => s.id === studentId);
    
    const newRecord = {
        id: Date.now().toString(),
        studentId,
        studentName: student.name,
        studentRollNo: student.rollNo,
        bookTitle,
        status: action === 'issue' ? 'Issued' : 'Returned',
        date: new Date().toLocaleDateString()
    };
    
    libraryRecords.push(newRecord);
    saveDataToFirebase('libraryRecords', libraryRecords);
    libraryForm.reset();
    document.getElementById('issueBook').checked = true;
});

function renderLibraryTable() {
    libraryTableBody.innerHTML = '';
    
    if (libraryRecords.length === 0) {
        noLibraryRecordsMessage.style.display = 'block';
        return;
    }
    
    noLibraryRecordsMessage.style.display = 'none';
    
    libraryRecords.forEach(record => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${record.studentName}</td>
            <td>${record.studentRollNo}</td>
            <td>${record.bookTitle}</td>
            <td>${record.status}</td>
            <td>${record.date}</td>
        `;
        
        libraryTableBody.appendChild(row);
    });
}

// Utility Functions
function updateStudentDropdowns() {
    // Update enrollment dropdown
    enrollStudentSelect.innerHTML = '<option value="">-- Select Student --</option>';
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.name} (${student.rollNo})`;
        enrollStudentSelect.appendChild(option);
    });
    
    // Update library dropdown
    libraryStudentSelect.innerHTML = '<option value="">-- Select Student --</option>';
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.name} (${student.rollNo})`;
        libraryStudentSelect.appendChild(option);
    });
}

function updateDashboardStats() {
    // Total students
    totalStudentsEl.textContent = students.length;
    
    // Average attendance
    if (students.length > 0) {
        const totalAttendance = students.reduce((sum, student) => sum + student.attendance, 0);
        const averageAttendance = Math.round(totalAttendance / students.length);
        avgAttendanceEl.textContent = `${averageAttendance}%`;
    } else {
        avgAttendanceEl.textContent = '0%';
    }
    
    // Total courses (unique enrollments)
    totalCoursesEl.textContent = enrollments.length;
    
    // Issued books (currently issued)
    const issuedBooksCount = libraryRecords.filter(record => record.status === 'Issued').length;
    issuedBooksEl.textContent = issuedBooksCount;
}

function initializeAttendanceChart() {
    const ctx = document.getElementById('attendanceChart').getContext('2d');
    
    window.attendanceChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Excellent (90-100%)', 'Good (75-89%)', 'Average (60-74%)', 'Poor (<60%)'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [
                    '#4cc9f0',
                    '#4361ee',
                    '#f8961e',
                    '#f72585'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Student Attendance Distribution'
                }
            }
        }
    });
    
    updateAttendanceChart();
}

function updateAttendanceChart() {
    if (!attendanceChart) return;
    
    const excellent = students.filter(s => s.attendance >= 90).length;
    const good = students.filter(s => s.attendance >= 75 && s.attendance < 90).length;
    const average = students.filter(s => s.attendance >= 60 && s.attendance < 75).length;
    const poor = students.filter(s => s.attendance < 60).length;
    
    attendanceChart.data.datasets[0].data = [excellent, good, average, poor];
    attendanceChart.update();
}

// Theme Toggle and Navigation (Same as before)
themeToggle.addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light Mode';
    } else {
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark Mode';
    }
});

navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        
        navLinks.forEach(navLink => navLink.classList.remove('active'));
        this.classList.add('active');
        
        tabContents.forEach(tab => tab.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
        
        if (targetId === 'dashboard') {
            updateDashboardStats();
            updateAttendanceChart();
        }
    });
});

function initializeDashboard() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-mode');
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light Mode';
    }
}
