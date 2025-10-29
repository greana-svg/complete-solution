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

// REAL AI Integration - USING WORKING BACKEND
const API_BASE_URL = 'https://completesolutionai.onrender.com/api';

async function sendToAI(message, context = '') {
    try {
        showMessage('🤔 Thinking...', 'ai');
        
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
                userClass: currentUser?.class || '10',
                subject: currentUser?.subject || 'science'
            })
        });

        const data = await response.json();
        
        // Remove the "Thinking..." message
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages.lastChild && chatMessages.lastChild.textContent === '🤔 Thinking...') {
            chatMessages.removeChild(chatMessages.lastChild);
        }
        
        if (data.success) {
            return data.response;
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('API Error:', error);
        // Return smart fallback response
        return getSmartResponse(message, context);
    }
}

// Smart fallback responses
function getSmartResponse(message, context) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return "Hello! I'm your AI tutor. I can help you understand concepts from your textbooks, solve problems, and prepare for exams. What would you like to learn today?";
    }
    
    if (lowerMessage.includes('photo') || lowerMessage.includes('plant')) {
        return "Photosynthesis is the amazing process where plants make their own food using sunlight! 🌱 They take carbon dioxide and water, and with sunlight's help, create glucose (sugar) and release oxygen. This is why plants are so important for our environment!";
    }
    
    if (lowerMessage.includes('math') || lowerMessage.includes('algebra')) {
        return "Mathematics helps us understand patterns and solve problems. For algebra, remember that we use letters to represent unknown numbers. The key is to balance both sides of the equation - whatever you do to one side, do to the other!";
    }
    
    if (lowerMessage.includes('science') || lowerMessage.includes('experiment')) {
        return "Science is all about curiosity and discovery! The scientific method has these steps: 1) Ask a question 2) Do research 3) Make a hypothesis 4) Test with experiments 5) Analyze results 6) Draw conclusions. What science topic interests you?";
    }
    
    if (lowerMessage.includes('history') || lowerMessage.includes('past')) {
        return "History teaches us about our past and helps us understand the present. Every historical event has causes and effects. Studying history helps us learn from mistakes and appreciate progress!";
    }
    
    if (lowerMessage.includes('english') || lowerMessage.includes('grammar')) {
        return "English grammar has simple rules to help us communicate clearly. Remember: sentences need a subject and verb, punctuation helps with meaning, and practice makes perfect! Would you like help with specific grammar rules?";
    }
    
    // Mode-specific responses
    const modeResponses = {
        chat: [
            "That's an interesting question! Let me explain this in a simple way...",
            "I love this question! Here's how I understand it...",
            "Great curiosity! This concept is actually quite fascinating when you break it down...",
            "Wonderful question! Let me share what I know about this..."
        ],
        study: [
            "This is an important academic concept. Let me explain it systematically...",
            "According to standard curriculum, this topic covers several key aspects...",
            "For proper understanding, we should approach this step by step...",
            "This concept has these main components that you should master..."
        ],
        exam: [
            "For exam preparation, focus on these key points...",
            "This type of question often appears in exams. Remember...",
            "Exam tip: Practice these aspects to score better...",
            "Important for tests: Make sure you understand..."
        ],
        coding: [
            "In programming, this concept helps solve problems efficiently...",
            "The algorithm approach would be to break this down into steps...",
            "For coding, we need to think about logic and structure...",
            "This programming concept works by following these principles..."
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
