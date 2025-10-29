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
        const { data: { text } } = await Tesseract.recognize(
            imageData,
            'eng+hin',
            { 
                logger: m => console.log(m) 
            }
        );
        
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
const API_BASE_URL = 'https://complete-solution-backend.onrender.com/api';

async function sendToAI(message, context = '') {
    try {
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
        // Fallback to smart responses
        return getSmartResponse(message, context);
    }
}

// Smart fallback responses based on context
function getSmartResponse(message, context) {
    const lowerMessage = message.toLowerCase();
    const lowerContext = context.toLowerCase();
    
    // Science responses
    if (lowerContext.includes('photosynthesis') || lowerMessage.includes('photosynthesis')) {
        return "Photosynthesis is how plants make their food using sunlight! 🌱☀️ Plants take in carbon dioxide and water, and with sunlight, they create glucose (sugar) and release oxygen. It's like cooking food but with sunlight instead of fire!";
    }
    
    if (lowerContext.includes('newton') || lowerMessage.includes('newton')) {
        return "Newton's laws explain how objects move! First law: Things don't move unless pushed. Second law: Force = mass × acceleration. Third law: Every action has an equal reaction. Like when you push a wall, it pushes back!";
    }
    
    if (lowerContext.includes('quadratic') || lowerMessage.includes('quadratic')) {
        return "Quadratic equations look like: ax² + bx + c = 0. To solve them, use the formula: x = [-b ± √(b² - 4ac)] ÷ 2a. It helps find where a parabola crosses the x-axis!";
    }
    
    if (lowerContext.includes('water cycle') || lowerMessage.includes('water cycle')) {
        return "The water cycle is nature's recycling system! 💧 Water evaporates from oceans, forms clouds, rains down, and flows back to oceans. It's like a never-ending journey of water!";
    }
    
    // General subject responses
    if (lowerMessage.includes('what is') || lowerMessage.includes('explain')) {
        return `Based on your scanned text about "${context.substring(0, 50)}...", this concept is important because... Let me explain it simply: It's about understanding how things work in a systematic way. Would you like me to go deeper into any specific part?`;
    }
    
    if (lowerMessage.includes('how to') || lowerMessage.includes('steps')) {
        return `For "${context.substring(0, 30)}...", here are the steps: 1) Understand the basic concept 2) Identify the key elements 3) Apply the formula/method 4) Practice with examples. Want me to break down each step?`;
    }
    
    if (lowerMessage.includes('example') || lowerMessage.includes('example')) {
        return `Let me give you a real-life example for "${context.substring(0, 40)}..." Imagine you're in this situation... [specific example based on context]. Does this help you understand better?`;
    }
    
    // Mode-specific responses
    const modeResponses = {
        chat: [
            "That's a great question beta! Let me explain this in simple Hinglish...",
            "Achha sawal hai! Yeh concept actually bahut interesting hai...",
            "Don't worry baccha, I'll make this easy for you to understand!",
            "Main tumhe is concept ko step-by-step samjhati hun, thik hai?"
        ],
        study: [
            `According to Class ${currentUser?.class} ${currentUser?.subject} curriculum, this topic has these key points...`,
            "Let me explain this concept in detail with proper academic structure...",
            "This is an important topic for your exams. Focus on these aspects...",
            "The textbook explains this concept with these main ideas..."
        ],
        exam: [
            "Important for exams: Remember these key points...",
            "Practice question: How would you apply this concept?",
            "Exam tip: This concept often appears in these types of questions...",
            "MCQ practice: Which of these best describes the concept?"
        ],
        coding: [
            "In programming, this concept works by...",
            "Here's how to implement this in code...",
            "The algorithm for this would be...",
            "Let me explain this with a code example..."
        ]
    };
    
    const responses = modeResponses[currentMode] || modeResponses.chat;
    return responses[Math.floor(Math.random() * responses.length)];
}

// Chat Functions
function initializeEventListeners() {
    document.querySelectorAll('.mode-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.mode-option').forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            currentMode = this.dataset.mode;
            showMessage(`🔄 Switched to ${this.querySelector('span:last-child').textContent}. How can I help you?`, 'ai');
        });
    });
    
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    document.getElementById('message-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendMessage();
    });
    
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
    
    const context = savedScans.length > 0 ? savedScans[0].text : '';
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

// Voice Features
document.getElementById('voice-btn').addEventListener('click', function() {
    alert('🎤 Voice feature will be available in the next update!');
});
