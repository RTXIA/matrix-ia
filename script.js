// ==========================================
// 1. CONFIGURATION ET CONNEXION SUPABASE
// ==========================================
const SUPABASE_URL = "https://ueopcdlrejiugbvkqhrq.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_xpIySwVbCAVaFWyuZuQobw_V52DK3UP"; 

// Initialisation du client global Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 2. DESIGN & ANIMATIONS (CURSEUR + MATRIX CANVAS)
// ==========================================
const customCursor = document.querySelector('.custom-cursor');
const glow = document.getElementById('mouse-glow');

window.addEventListener('mousemove', (e) => {
    if (customCursor) {
        customCursor.style.left = e.clientX + 'px';
        customCursor.style.top = e.clientY + 'px';
    }
    if (glow) {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    }
});

const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function initCanvas() { 
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight; 
    particles = []; 
    for(let i=0; i<80; i++) {
        particles.push({ 
            x: Math.random() * canvas.width, 
            y: Math.random() * canvas.height, 
            vx: (Math.random() - 0.5) * 1.5, 
            vy: (Math.random() - 0.5) * 1.5 
        }); 
    }
}

window.addEventListener('resize', initCanvas); 
initCanvas();

function drawNetwork() {
    ctx.fillStyle = "rgba(10, 10, 10, 0.15)"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(0, 255, 102, 0.15)"; 
    ctx.fillStyle = "#00ff66";
    
    particles.forEach((p, i) => {
        p.x += p.vx; 
        p.y += p.vy;
        if(p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if(p.y < 0 || p.y > canvas.height) p.vy *= -1;
        
        ctx.beginPath(); 
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); 
        ctx.fill();
        
        for(let j=i+1; j<particles.length; j++) {
            let d = Math.hypot(p.x - particles[j].x, p.y - particles[j].y);
            if(d < 150) { 
                ctx.beginPath(); 
                ctx.moveTo(p.x, p.y); 
                ctx.lineTo(particles[j].x, particles[j].y); 
                ctx.stroke(); 
            }
        }
    });
    requestAnimationFrame(drawNetwork);
}
drawNetwork();

// ==========================================
// 3. SÉLECTION DES ÉLÉMENTS HTML & NAVIGATION
// ==========================================
const homePage = document.getElementById('home-page');
const chatPage = document.getElementById('chat-page');
const langPage = document.getElementById('lang-page');
const startBtn = document.getElementById('start-chat-btn');
const backBtn = document.getElementById('back-btn');
const clearBtn = document.getElementById('clear-btn');
const langPageBtn = document.getElementById('lang-page-btn');
const confirmLangBtn = document.getElementById('confirm-lang-btn');
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const currentLangTxt = document.getElementById('current-lang-txt');
const langBoxes = document.querySelectorAll('.lang-grid .lang-box');

const statusBar = document.getElementById('chat-status-bar');
const statusDot = statusBar.querySelector('.indicator-dot');
const statusText = document.getElementById('status-text');

let messageTimestamps = []; 
let globalUpdateInterval = null;
let selectedLanguage = "fr"; 
let selectedLabel = "FR";

const RECHARGE_TIME = 3.5 * 60 * 1000; 

const systemPrompts = {
    fr: "Tu es Matrix IA. Tu dois impérativement et exclusivement répondre en français, peu importe la langue de l'utilisateur.",
    en: "You are Matrix IA. You must strictly and exclusively respond in English, regardless of the language used.",
    es: "Eres Matrix IA. Debes responder estricta y exclusivement en español, independientemente del idioma.",
    ar: "أنتِ Matrix IA. يجب عليكِ الرد باللغة العربية فقط وبشكل صارم."
};

startBtn.addEventListener('click', () => {
    homePage.classList.remove('active');
    chatPage.classList.add('active');
    loadChatHistory();
    startStatusLoop();
    setTimeout(() => { userInput.focus(); }, 500);
});

backBtn.addEventListener('click', () => {
    chatPage.classList.remove('active');
    homePage.classList.add('active');
    clearInterval(globalUpdateInterval);
});

langPageBtn.addEventListener('click', () => {
    chatPage.classList.remove('active');
    langPage.classList.add('active');
});

langBoxes.forEach(box => {
    box.addEventListener('click', () => {
        langBoxes.forEach(b => b.classList.remove('selected'));
        box.classList.add('selected');
        selectedLanguage = box.getAttribute('data-lang');
        selectedLabel = box.getAttribute('data-label');
    });
});

confirmLangBtn.addEventListener('click', () => {
    currentLangTxt.innerText = selectedLabel;
    langPage.classList.remove('active');
    chatPage.classList.add('active');
    setTimeout(() => { userInput.focus(); }, 300);
});

clearBtn.addEventListener('click', () => {
    localStorage.removeItem('matrix_ia_db');
    messageTimestamps = []; 
    updateSystemStatus();
    loadChatHistory();
});

// ==========================================
// 4. GESTION DE L'HISTORIQUE LOCAL
// ==========================================
function saveMessageToDB(sender, text) {
    let history = JSON.parse(localStorage.getItem('matrix_ia_db')) || [];
    history.push({ sender, text });
    localStorage.setItem('matrix_ia_db', JSON.stringify(history));
}

function loadChatHistory() {
    chatBox.innerHTML = '';
    let history = JSON.parse(localStorage.getItem('matrix_ia_db')) || [];
    if (history.length === 0) {
        appendMessage('bot', 'Bonjour ! Je suis Matrix IA.\nPose-moi tes questions, le système est entièrement opérationnel.');
    } else {
        history.forEach(msg => {
            appendMessage(msg.sender, msg.text);
        });
    }
}

function cleanBotText(rawText) {
    let cleaned = rawText.replace(/\*/g, '');
    cleaned = cleaned.replace(/^\[|\]$/g, '');
    return cleaned.trim();
}

function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    msgDiv.innerText = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ==========================================
// 5. ENREGISTREMENT SUPABASE ET SÉCURISATION Webhook
// ==========================================
async function generateBotResponse(userText) {
    try {
        // Envoi du message à Supabase.
        // Ta clé API Google n'est plus du tout écrite ici ! Elle est stockée de manière 100% sécurisée sur le tableau de bord Supabase.
        const { error: dbError } = await supabaseClient
            .from('Matriix IIAA')
            .insert([{ maatrixxx: userText }]);

        if (dbError) {
            console.error("Erreur de transmission Supabase :", dbError);
            throw dbError;
        }

        console.log("Message envoyé de manière 100% sécurisée ! Le Webhook gère l'IA en arrière-plan.");

    } catch (error) {
        console.error(error);
        appendMessage('bot', "Connexion réseau impossible avec les serveurs sécurisés.");
        userInput.value = userText; 
    }
}

// ==========================================
// 6. LIMITATEUR DE MESSAGES
// ==========================================
function updateSystemStatus() {
    const now = Date.now();
    messageTimestamps = messageTimestamps.filter(timestamp => now - timestamp < RECHARGE_TIME);
    const messagesUsed = messageTimestamps.length;
    const currentAvailable = 3 - messagesUsed;

    if (currentAvailable > 0) {
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.classList.remove('rate-limited');
        statusBar.classList.remove('limited');
        statusDot.className = "indicator-dot status-ok";
        
        if (messagesUsed > 0) {
            const oldestActiveTimestamp = messageTimestamps[0];
            const nextRechargeTime = oldestActiveTimestamp + RECHARGE_TIME;
            const timeLeft = nextRechargeTime - now;
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            statusText.innerText = `${currentAvailable} message${currentAvailable > 1 ? 's' : ''} disponible${currentAvailable > 1 ? 's' : ''} • Recharge dans : ${minutes}m ${seconds}s`;
            userInput.placeholder = "Demande-moi ce que tu veux...";
        } else {
            statusText.innerText = "3 messages disponibles • Réservoir plein";
            userInput.placeholder = "Demande-moi ce que tu veux...";
        }
    } else {
        userInput.disabled = true;
        sendBtn.disabled = true;
        userInput.classList.add('rate-limited');
        statusBar.classList.add('limited');
        statusDot.className = "indicator-dot status-limited";
        
        const oldestTimestamp = messageTimestamps[0];
        const expiryTime = oldestTimestamp + RECHARGE_TIME;
        const timeLeft = expiryTime - now;

        if (timeLeft > 0) {
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            statusText.innerText = `0 message disponible • Nouveau crédit dans : ${minutes}m ${seconds}s`;
            userInput.placeholder = `Veuillez patienter... (${minutes}m ${seconds}s)`;
            userInput.value = '';
        }
    }
}

function handleSendMessage() {
    const text = userInput.value.trim();
    if (text === '' || userInput.disabled) return;

    const now = Date.now();
    messageTimestamps = messageTimestamps.filter(timestamp => now - timestamp < RECHARGE_TIME);

    if (messageTimestamps.length >= 3) {
        updateSystemStatus();
        return;
    }

    messageTimestamps.push(now);
    appendMessage('user', text);
    saveMessageToDB('user', text);
    userInput.value = '';
    
    updateSystemStatus(); 
    generateBotResponse(text);
}

function startStatusLoop() {
    clearInterval(globalUpdateInterval);
    updateSystemStatus();
    globalUpdateInterval = setInterval(updateSystemStatus, 1000);
}

sendBtn.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendMessage();
});