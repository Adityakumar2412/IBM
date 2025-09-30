// Data storage
let students = JSON.parse(localStorage.getItem('students')) || [];
let enrollments = JSON.parse(localStorage.getItem('enrollments')) || [];
let libraryRecords = JSON.parse(localStorage.getItem('libraryRecords')) || [];

// DOM Elements
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

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    updateStudentDropdowns();
    renderStudentTable();
    renderEnrollmentTable();
    renderLibraryTable();
    updateDashboardStats();
    initializeAttendanceChart();
    
    // Add demo data if empty
    if (students.length === 0) {
        addDemoData();
    }
});

// Theme Toggle
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

// Navigation
navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        
        // Update active nav link
        navLinks.forEach(navLink => navLink.classList.remove('active'));
        this.classList.add('active');
        
        // Show target tab
        tabContents.forEach(tab => tab.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
        
        // Update charts when dashboard is shown
        if (targetId === 'dashboard') {
            updateDashboardStats();
            updateAttendanceChart();
        }
    });
});

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
        attendance: 100 // Start with 100% attendance
    };
    
    students.push(newStudent);
    saveData();
    renderStudentTable();
    updateStudentDropdowns();
    updateDashboardStats();
    
    // Reset form
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
        saveData();
        renderStudentTable();
        updateDashboardStats();
        updateAttendanceChart();
    }
}

function deleteStudent(studentId) {
    if (confirm('Are you sure you want to delete this student?')) {
        students = students.filter(student => student.id !== studentId);
        enrollments = enrollments.filter(enrollment => enrollment.studentId !== studentId);
        saveData();
        renderStudentTable();
        renderEnrollmentTable();
        updateStudentDropdowns();
        updateDashboardStats();
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
    saveData();
    renderEnrollmentTable();
    updateDashboardStats();
    
    // Reset form
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
        saveData();
        renderEnrollmentTable();
        updateDashboardStats();
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
    saveData();
    renderLibraryTable();
    updateDashboardStats();
    
    // Reset form
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

function saveData() {
    localStorage.setItem('students', JSON.stringify(students));
    localStorage.setItem('enrollments', JSON.stringify(enrollments));
    localStorage.setItem('libraryRecords', JSON.stringify(libraryRecords));
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
    
    attendanceChart = new Chart(ctx, {
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

// Demo Data
function addDemoData() {
    // Add demo students
    const addStudents = [
        { id: '1', name: 'Aditya Kumar', rollNo: '03', class: 'BCA', attendance: 95 },
        { id: '2', name: 'Himashu Kumar', rollNo: '33', class: 'BCA', attendance: 88 },
        { id: '3', name: 'Lekh Raj Soni ', rollNo: '05', class: 'BCA', attendance: 76 },
        { id: '4', name: 'Shreya Shambhavi', rollNo: '52', class: 'BCA', attendance: 92 },
    ];
    
    students.push(...addStudents);
    
    // Add demo enrollments
    const addEnrollments = [
        { id: '1', studentId: '1', course: 'Python Programming', date: '2023-10-01' },
        { id: '2', studentId: '2', course: 'Web Development', date: '2023-10-02' },
        { id: '3', studentId: '3', course: 'Data Science', date: '2023-10-03' },
        { id: '4', studentId: '4', course: 'Machine Learning', date: '2023-10-04' },
        { id: '5', studentId: '1', course: 'Web Development', date: '2023-10-05' }
    ];
    
    enrollments.push(...addEnrollments);
    
    // Add demo library records
    const addLibraryRecords = [
        { id: '1', studentId: '1', studentName: 'Aditya Kumar', studentRollNo: '03', bookTitle: 'Introduction to Python', status: 'Issued', date: '2025-10-01' },
        { id: '2', studentId: '2', studentName: 'Himanshu Kumar', studentRollNo: '33', bookTitle: 'Web Development Basics', status: 'Issued', date: '2025-10-02' },
        { id: '3', studentId: '3', studentName: 'Lekh Raj soni ', studentRollNo: '05', bookTitle: 'Data Science Fundamentals', status: 'Returned', date: '2025-10-03' },
        { id: '4', studentId: '4', studentName: 'Shreya Shambhavi', studentRollNo: '52', bookTitle: 'Machine Learning Guide', status: 'Issued', date: '2025-10-04' }
    ];
    
    libraryRecords.push(...addLibraryRecords);
    
    saveData();
    renderStudentTable();
    renderEnrollmentTable();
    renderLibraryTable();
    updateStudentDropdowns();
    updateDashboardStats();
    updateAttendanceChart();
}

function initializeDashboard() {
    // Set initial theme based on user preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-mode');
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light Mode';
    }
}