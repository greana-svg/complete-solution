// Application State
let currentUser = null;
let currentMode = 'chat';
let currentLanguage = 'hinglish';
let savedScans = JSON.parse(localStorage.getItem('savedScans')) || [];

// DOM Elements
const screens = {
    auth: document.getElementById('auth-screen'),
    register: document.getElementById('register-screen'),
    app: document.getElementById('app-screen')
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    initializeEventListeners();
    initializeCamera();
});

// Authentication Functions
function checkAuthStatus() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        currentUser = JSON.parse(user);
        showScreen('app-screen');
        updateUserInterface();
    } else {
        showScreen('auth-screen');
    }
}

function showScreen(screenId) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Simulate authentication
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showScreen('app-screen');
        updateUserInterface();
    } else {
        alert('Invalid credentials. Please try again.');
    }
}

function register() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const userClass = document.getElementById('user-class').value;
    const board = document.getElementById('user-board').value;
    const subject = document.getElementById('user-subject').value;
    
    if (!name || !email || !password || !userClass || !board || !subject) {
        alert('Please fill all fields');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    if (users.find(u => u.email === email)) {
        alert('User already exists with this email');
        return;
    }
    
    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        class: userClass,
        board,
        subject,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    showScreen('app-screen');
    updateUserInterface();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showScreen('auth-screen');
}

function updateUserInterface() {
    if (currentUser) {
        document.getElementById('user-class-display').textContent = 
            `Class ${currentUser.class} - ${currentUser.board.toUpperCase()}`;
    }
}

// Camera and OCR Functions
async function initializeCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.getElementById('camera-preview');
        video.srcObject = stream;
    } catch (err) {
        console.error('Error accessing camera:', err);
    }
}

document.getElementById('capture-btn').addEventListener('click', captureImage);
document.getElementById('file-input').addEventListener('change', handleFileUpload);

function captureImage() {
    const video = document.getElementById('camera-preview');
    const canvas = document.getElementById('photo-canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    processImage(canvas.toDataURL('image/png'));
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            processImage(e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

async function processImage(imageData) {
    showMessage('Processing image with OCR...', 'ai');
    
    try {
        // Simulate OCR processing
        const extractedText = await simulateOCR(imageData);
        
        // Save scan
        const scan = {
            id: Date.now().toString(),
            text: extractedText,
            timestamp: new Date().toISOString(),
            image: imageData
        };
        
        savedScans.unshift(scan);
        localStorage.setItem('savedScans', JSON.stringify(savedScans));
        updateSavedScansList();
        
        showMessage(`Text extracted successfully! I found content about "${extractedText.substring(0, 50)}..." How can I help you understand this?`, 'ai');
        
    } catch (error) {
        showMessage('Sorry, I had trouble reading the text. Please try with a clearer image.', 'ai');
    }
}

async function simulateOCR(imageData) {
    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return mock extracted text
    const mockTexts = [
        "Photosynthesis is the process by which plants convert light energy into chemical energy, producing oxygen and organic compounds.",
        "The quadratic formula is used to find the roots of a quadratic equation: x = [-b ± √(b² - 4ac)] / 2a",
        "Newton's Second Law states that the acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass.",
        "The water cycle describes the continuous movement of water on, above, and below the surface of the Earth through processes like evaporation, condensation, and precipitation."
    ];
    
    return mockTexts[Math.floor(Math.random() * mockTexts.length)];
}

// Chat Functions
function initializeEventListeners() {
    // Mode selection
    document.querySelectorAll('.mode-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.mode-option').forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            currentMode = this.dataset.mode;
            showMessage(`Switched to ${this.querySelector('span:last-child').textContent}. How can I help you?`, 'ai');
        });
    });
    
    // Send message
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    document.getElementById('message-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendMessage();
    });
    
    // Language selection
    document.getElementById('language-select').addEventListener('change', function() {
        currentLanguage = this.value;
    });
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    showMessage(message, 'user');
    input.value = '';
    
    // Simulate AI response
    setTimeout(() => generateAIResponse(message), 1000);
}

function showMessage(text, sender) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.textContent = text;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function generateAIResponse(userMessage) {
    const responses = {
        chat: [
            "That's an interesting question! In simple Hinglish, let me explain...",
            "Achha sawal hai! Yeh concept aise kaam karta hai...",
            "I understand this can be confusing. Let me break it down for you step by step."
        ],
        study: [
            `According to your ${currentUser.board} Class ${currentUser.class} ${currentUser.subject} syllabus, this topic covers...`,
            "Let me explain this concept in detail as per your curriculum...",
            "This is an important concept for your exams. Here's the detailed explanation..."
        ],
        exam: [
            "Practice question: Explain this concept in your own words.",
            "MCQ: Which of the following best describes this?",
            "Let me create a quiz to test your understanding..."
        ],
        coding: [
            "Here's how you can implement this in Python...",
            "Let me explain the algorithm step by step...",
            "For this problem, the optimal solution would be..."
        ]
    };
    
    const modeResponses = responses[currentMode] || responses.chat;
    const response = modeResponses[Math.floor(Math.random() * modeResponses.length)];
    
    showMessage(response, 'ai');
}

// Saved Scans Functions
function updateSavedScansList() {
    const container = document.getElementById('saved-scans-list');
    container.innerHTML = '';
    
    savedScans.slice(0, 5).forEach(scan => {
        const scanElement = document.createElement('div');
        scanElement.className = 'saved-scan';
        scanElement.innerHTML = `
            <strong>${new Date(scan.timestamp).toLocaleDateString()}</strong>
            <p>${scan.text.substring(0, 50)}...</p>
        `;
        scanElement.addEventListener('click', () => loadScan(scan));
        container.appendChild(scanElement);
    });
}

function loadScan(scan) {
    showMessage(`Loaded scan from ${new Date(scan.timestamp).toLocaleString()}. What would you like to know about this material?`, 'ai');
}

function showSavedScans() {
    alert(`You have ${savedScans.length} saved scans. This feature will show all your previous scans.`);
}