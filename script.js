const customCursor = document.querySelector('.custom-cursor');
window.addEventListener('mousemove', (e) => {
    customCursor.style.left = e.clientX + 'px';
    customCursor.style.top = e.clientY + 'px';
});

const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
function initCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; particles = []; for(let i=0; i<80; i++) particles.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, vx: (Math.random()-0.5), vy: (Math.random()-0.5) }); }
window.addEventListener('resize', initCanvas); initCanvas();
function drawNetwork() {
    ctx.fillStyle = "rgba(10, 10, 10, 0.15)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(0, 255, 102, 0.2)"; ctx.fillStyle = "#00ff66";
    particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if(p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if(p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI*2); ctx.fill();
        for(let j=i+1; j<particles.length; j++) {
            let d = Math.hypot(p.x - particles[j].x, p.y - particles[j].y);
            if(d < 150) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke(); }
        }
    });
    requestAnimationFrame(drawNetwork);
}
drawNetwork();

// CONFIGURATION APIS
const API_KEY = "AQ.Ab8RN6L6jdQ3_Skw_faipJHgU-9-PWYgTyBVcXPbeRKv4od8_Q"; 
const SUPABASE_URL = "https://ueopcdlrejiugbvkqhrq.supabase.co";
const SUPABASE_KEY = "sb_publishable_xpIySwVbCAVaFWyuZuQobw_V52DK3UP";

const glow = document.getElementById('mouse-glow');
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
    fr: "Tu es Matrix IA. Tu dois impérativement et exclusivement répondre en français, peu importe la langue utilisée par l'utilisateur.",
    en: "You are Matrix IA. You must strictly and exclusively respond in English, regardless of the language used by the user.",
    es: "Eres Matrix IA. Debes responder estricta y exclusivamente en español, independientemente del idioma que utilice el usuario.",
    ar: "أنتِ Matrix IA. يجب عليكِ الرد باللغة العربية فقط وبشكل صارم، بغض النظر عن اللغة التي يستخدمها المستخدم."
};

localStorage.removeItem('matrix_ia_db');

window.addEventListener('mousemove', (e) => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
});

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

// Envoi vers Supabase adapté à tes colonnes "14/06/2026" et "maatrixxx"
async function sendToSupabase(sender, text) {
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/Matriix IIAA`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                "14/06/2026": new Date().toISOString(),
                "maatrixxx": `${sender}: ${text}`
            })
        });
    } catch (err) {
        console.error("Erreur de synchronisation Supabase:", err);
    }
}

function saveMessageToDB(sender, text) {
    let history = JSON.parse(localStorage.getItem('matrix_ia_db')) || [];
    history.push({ sender, text });
    localStorage.setItem('matrix_ia_db', JSON.stringify(history));
    sendToSupabase(sender, text);
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

async function generateBotResponse(userText) {
    const targetUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
    const languageConstraint = systemPrompts[selectedLanguage];

    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ 
                    parts: [{ 
                        text: `${languageConstraint}\n\nUser message: ${userText}` 
                    }] 
                }]
            })
        });
        
        const result = await response.json();
        
        if (result.candidates && result.candidates[0].content.parts[0].text) {
            let botReply = result.candidates[0].content.parts[0].text;
            botReply = cleanBotText(botReply);
            appendMessage('bot', botReply);
            saveMessageToDB('bot', botReply);
        } else {
            if (result.error && result.error.message.includes("high demand")) {
                appendMessage('bot', "Matrix IA est temporairement surchargée par les serveurs Google. Veuillez cliquer à nouveau sur envoyer pour réessayer.");
                userInput.value = userText;
            } else if (result.error) {
                appendMessage('bot', `Désolée, le système indique une erreur : ${result.error.message}`);
                userInput.value = userText;
            } else {
                throw new Error("Erreur de lecture");
            }
        }
    } catch (error) {
        console.error(error);
        appendMessage('bot', "Désolée, une erreur réseau est survenue. Les serveurs de l'API sont peut-être saturés. Réessaye dans un instant !");
        userInput.value = userText; 
    }
}

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
            
            statusText.innerText = `${currentAvailable} message${currentAvailable > 1 ? 's' : ''} disponible${currentAvailable > 1 ? 's' : ''} • Prochain crédit dans : ${minutes}m ${seconds}s`;
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
            statusText.innerText = `0 message disponible • Nouveau message disponible dans : ${minutes}m ${seconds}s`;
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
