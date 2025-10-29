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

// SMART AI RESPONSES - NO BACKEND NEEDED
async function sendToAI(message, context = '') {
    // Show thinking message
    showMessage('🤔 Thinking...', 'ai');
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Remove the "Thinking..." message
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages.lastChild && chatMessages.lastChild.textContent === '🤔 Thinking...') {
        chatMessages.removeChild(chatMessages.lastChild);
    }
    
    // Return smart response based on the question
    return getSmartAIResponse(message, context);
}

function getSmartAIResponse(message, context) {
    const lowerMessage = message.toLowerCase();
    const lowerContext = context.toLowerCase();

    // SCIENCE QUESTIONS
    if (lowerMessage.includes('photosynthesis') || lowerContext.includes('photosynthesis')) {
        return "Photosynthesis is how plants make food! 🌱 They use sunlight + water + CO2 to create glucose and oxygen. The formula is: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂. Plants are like nature's chefs!";
    }
    
    if (lowerMessage.includes('newton') || lowerContext.includes('newton')) {
        return "Newton's 3 Laws: 1) Objects stay still/move unless pushed (Inertia) 2) Force = mass × acceleration 3) Every action has equal reaction. Example: When you push a wall, it pushes back!";
    }
    
    if (lowerMessage.includes('gravity') || lowerContext.includes('gravity')) {
        return "Gravity is the force that pulls objects toward each other. Earth's gravity keeps us grounded! It's why apples fall from trees. Gravity strength depends on mass and distance.";
    }
    
    if (lowerMessage.includes('water cycle') || lowerContext.includes('water cycle')) {
        return "The water cycle has 4 steps: 1) Evaporation (water→vapor) 2) Condensation (vapor→clouds) 3) Precipitation (rain/snow) 4) Collection (back to oceans). Nature's recycling system! 💧";
    }

    // MATH QUESTIONS
    if (lowerMessage.includes('algebra') || lowerMessage.includes('equation')) {
        return "Algebra uses letters for unknown numbers. Basic rule: What you do to one side, do to the other! Example: If x + 3 = 7, then x = 7 - 3 = 4. Practice makes perfect!";
    }
    
    if (lowerMessage.includes('pythagoras') || lowerMessage.includes('triangle')) {
        return "Pythagorean theorem: a² + b² = c² (for right triangles). If sides are 3 and 4, hypotenuse = √(3² + 4²) = √(9 + 16) = √25 = 5. Easy!";
    }
    
    if (lowerMessage.includes('quadratic') || lowerContext.includes('quadratic')) {
        return "Quadratic formula: x = [-b ± √(b² - 4ac)] ÷ 2a. Solves equations like ax² + bx + c = 0. The ± gives two solutions!";
    }

    // HISTORY QUESTIONS
    if (lowerMessage.includes('independence') || lowerMessage.includes('freedom')) {
        return "India got independence on August 15, 1947 after years of struggle. Key leaders: Gandhi (non-violence), Nehru (first PM), Patel (unification). Remember the sacrifices!";
    }
    
    if (lowerMessage.includes('mughal') || lowerContext.includes('mughal')) {
        return "Mughal Empire ruled India 1526-1857. Famous rulers: Babur (founder), Akbar (greatest), Shah Jahan (built Taj Mahal). They contributed to art, architecture, and culture.";
    }

    // GEOGRAPHY QUESTIONS
    if (lowerMessage.includes('himalaya') || lowerContext.includes('mountain')) {
        return "The Himalayas are the world's highest mountain range! They protect India from cold winds and are source of major rivers like Ganga, Brahmaputra. Home to Mount Everest.";
    }
    
    if (lowerMessage.includes('river') || lowerContext.includes('ganga')) {
        return "Major Indian rivers: Ganga (most sacred), Yamuna, Brahmaputra, Godavari. Rivers provide water, transportation, and are important for agriculture and culture.";
    }

    // GENERAL CONCEPTS
    if (lowerMessage.includes('what is') || lowerMessage.includes('explain')) {
        if (context) {
            return `Based on your scanned text about "${context.substring(0, 40)}...", this is an important concept that involves multiple aspects. The key idea is to understand the fundamental principles and how they apply in different situations. Would you like me to explain any specific part in more detail?`;
        } else {
            return "That's a great question! This concept is fundamental to understanding how things work in a systematic way. It involves key principles that can be applied to solve various problems. Could you tell me which specific aspect you'd like me to focus on?";
        }
    }
    
    if (lowerMessage.includes('how to') || lowerMessage.includes('steps')) {
        return `Here are the steps: 1) Understand the problem 2) Identify what's given 3) Apply the right method 4) Solve step by step 5) Verify your answer. Practice with examples to master it!`;
    }
    
    if (lowerMessage.includes('example') || lowerMessage.includes('example')) {
        return "Let me give you a practical example: Imagine you're facing this situation in real life... [the solution would work like this]. Understanding through examples makes concepts clearer!";
    }

    // MODE-SPECIFIC RESPONSES
    const modeResponses = {
        chat: [
            "That's a wonderful question beta! Let me explain this in simple terms...",
            "Achha sawal hai! Yeh concept actually bahut interesting hai...",
            "Main tumhe ise aasan bhasha mein samjhati hun...",
            "Don't worry baccha, I'll break this down for you step by step!",
            "Yeh concept samajhna asaan hai, bas thoda dhyaan se...",
            "Tumne bahut acha question pucha! Let me explain..."
        ],
        study: [
            "This is an important academic concept. Let me explain it properly...",
            "According to your curriculum, this topic has these key points...",
            "For exam preparation, focus on understanding these aspects...",
            "This concept is fundamental to your subject. Remember...",
            "Let me explain this with proper academic structure...",
            "This topic appears frequently in exams. Key points are..."
        ],
        exam: [
            "Important for exams: Remember these key concepts...",
            "Practice this type of question regularly for exams...",
            "Exam tip: Focus on understanding rather than memorizing...",
            "This concept often comes as 5-mark questions...",
            "For better scores, practice these types of problems...",
            "Time management tip: Practice solving quickly..."
        ],
        coding: [
            "In programming, we solve this by breaking into steps...",
            "The algorithm approach would be: 1) Input 2) Process 3) Output...",
            "For coding, remember to test your logic with examples...",
            "This can be implemented using loops/conditionals/functions...",
            "Good programming practice: Write clean, readable code...",
            "Debugging tip: Check each step carefully..."
        ]
    };

    // GREETINGS & GENERAL
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return "Hello! 👋 I'm your AI tutor! I can help you understand concepts from your textbooks, solve problems, and prepare for exams. What would you like to learn today?";
    }
    
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
        return "You're welcome! 😊 I'm happy to help. Remember, learning is a journey - keep asking questions and practicing! What else would you like to know?";
    }
    
    if (lowerMessage.includes('who are you') || lowerMessage.includes('what are you')) {
        return "I'm Complete Solution AI - your personal tutoring assistant! 🤖 I can help you with subjects like Science, Math, History, and more. Just scan your textbook or ask me anything!";
    }

    // DEFAULT RESPONSES
    const responses = modeResponses[currentMode] || modeResponses.chat;
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    if (context && context.length > 10) {
        return `${randomResponse} Based on your scanned material about "${context.substring(0, 50)}...", this concept relates to what you're studying.`;
    }
    
    return randomResponse;
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
