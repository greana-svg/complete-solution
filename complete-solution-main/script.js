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

// REAL OCR Functions
async function initializeCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.getElementById('camera-preview');
        video.srcObject = stream;
    } catch (err) {
        console.error('Error accessing camera:', err);
        showMessage('❌ Camera access denied. Please allow camera permissions.', 'ai');
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

// REAL OCR PROCESSING
async function processImage(imageData) {
    showMessage('🔍 Scanning image with OCR...', 'ai');
    
    try {
        // Use Tesseract.js for real OCR
        const { data: { text } } = await Tesseract.recognize(
            imageData,
            'eng+hin', // English + Hindi
            { 
                logger: m => console.log(m) 
            }
        );
        
        // Save scan
        const scan = {
            id: Date.now().toString(),
            text: text,
            timestamp: new Date().toISOString(),
            image: imageData
        };
        
        savedScans.unshift(scan);
        localStorage.setItem('savedScans', JSON.stringify(savedScans));
        updateSavedScansList();
        
        if (text.trim()) {
            showMessage(`✅ Text extracted successfully! Found: "${text.substring(0, 100)}..." How can I help you understand this?`, 'ai');
        } else {
            showMessage('❌ No text detected. Please try with a clearer image or different page.', 'ai');
        }
        
    } catch (error) {
        console.error('OCR Error:', error);
        showMessage('Sorry, I had trouble reading the text. Please try with a clearer image.', 'ai');
    }
}

// REAL AI Integration
const API_BASE_URL = 'http://localhost:5000/api'; // Change this when you deploy

async function sendToAI(message, context = '') {
    try {
        // If backend is not set up, use simulated responses
        if (!localStorage.getItem('backendSetup')) {
            return getSimulatedAIResponse(message);
        }

        const response = await fetch(`${API_BASE_URL}/chat/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                mode: currentMode,
                language: currentLanguage,
                context: context,
                userClass: currentUser?.class,
                subject: currentUser?.subject
            })
        });

        const data = await response.json();
        
        if (data.success) {
            return data.response;
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('API Error:', error);
        return getSimulatedAIResponse(message);
    }
}

// Fallback simulated responses
function getSimulatedAIResponse(userMessage) {
    const responses = {
        chat: [
            "Beta, yeh concept bahut simple hai! Let me explain in simple Hinglish...",
            "Achha sawal hai! Yeh concept aise kaam karta hai...",
            "Don't worry baccha, I'll explain this step by step in easy language."
        ],
        study: [
            `According to your ${currentUser?.board} Class ${currentUser?.class} syllabus, this topic covers important concepts that you should focus on.`,
            "Let me explain this in detail as per your curriculum standards...",
            "This is a key concept for your exams. Here's the detailed explanation..."
        ],
        exam: [
            "Practice Question: Explain this concept in your own words within 5 minutes.",
            "MCQ: Which of the following best describes this concept? A) Option 1 B) Option 2 C) Option 3",
            "Exam Tip: Remember these key points for your test..."
        ],
        coding: [
            "Here's how you can implement this in Python with proper syntax...",
            "Let me explain the algorithm step by step with code examples...",
            "For this programming problem, the optimal solution would be..."
        ]
    };
    
    const modeResponses = responses[currentMode] || responses.chat;
    return modeResponses[Math.floor(Math.random() * modeResponses.length)];
}

// Chat Functions
function initializeEventListeners() {
    // Mode selection
    document.querySelectorAll('.mode-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.mode-option').forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            currentMode = this.dataset.mode;
            showMessage(`🔄 Switched to ${this.querySelector('span:last-child').textContent}. How can I help you?`, 'ai');
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
        showMessage(`🌐 Language changed to ${this.options[this.selectedIndex].text}`, 'ai');
    });
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    showMessage(message, 'user');
    input.value = '';
    
    // Get context from latest scan
    const context = savedScans.length > 0 ? savedScans[0].text : '';
    
    // Get AI response
    const aiResponse = await sendToAI(message, context);
    showMessage(aiResponse, 'ai');
}

function showMessage(text, sender) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.textContent = text;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Saved Scans Functions
function updateSavedScansList() {
    const container = document.getElementById('saved-scans-list');
    container.innerHTML = '';
    
    savedScans.slice(0, 5).forEach(scan => {
        const scanElement = document.createElement('div');
        scanElement.className = 'saved-scan';
        scanElement.innerHTML = `
            <strong>📄 ${new Date(scan.timestamp).toLocaleDateString()}</strong>
            <p>${scan.text.substring(0, 50)}...</p>
        `;
        scanElement.addEventListener('click', () => loadScan(scan));
        container.appendChild(scanElement);
    });
}

function loadScan(scan) {
    showMessage(`📚 Loaded scan from ${new Date(scan.timestamp).toLocaleString()}. What would you like to know about this material?`, 'ai');
}

function showSavedScans() {
    if (savedScans.length === 0) {
        alert('No saved scans yet. Scan some textbook pages first!');
    } else {
        alert(`You have ${savedScans.length} saved scans. Click on them in the sidebar to load.`);
    }
}

// Voice Features (Basic)
document.getElementById('voice-btn').addEventListener('click', function() {
    alert('🎤 Voice feature will be available in the next update!');
});
