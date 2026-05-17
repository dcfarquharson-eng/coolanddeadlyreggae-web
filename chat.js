import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: 'AIzaSyDRWqzJSuElywTj-6Zf2ED1NuCUZNtI2bQ',
    appId: '1:605957563521:web:d2e3f4g5h6j7k8l9', // Placeholder web id, Firebase JS SDK often falls back fine with just project ID or android app ID
    messagingSenderId: '605957563521',
    projectId: 'cool-and-deadly-reggae',
    storageBucket: 'cool-and-deadly-reggae.firebasestorage.app'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');

let currentUserUid = "";
let currentNickname = localStorage.getItem('chat_nickname') || null;
let isDJ = localStorage.getItem('chat_is_dj') === 'true';

// Sign in anonymously
signInAnonymously(auth).then((userCredential) => {
    currentUserUid = userCredential.user.uid;
    listenForMessages();
}).catch((error) => {
    console.error("Firebase auth error:", error);
    chatMessages.innerHTML = `<div class="message"><span class="user" style="color: red;">Error:</span> Could not connect to chat.</div>`;
});

function promptForNickname() {
    let name = prompt("Enter your nickname to join the chat:");
    if (!name || name.trim() === "") return false;
    
    name = name.trim();
    
    // DJ Secret Passcode Check
    if (name === 'DJ_Digital_123') {
        name = 'DJ Digital';
        isDJ = true;
    } else if (name === 'Father_Copper_123') {
        name = 'Father Copper';
        isDJ = true;
    } else if (name === 'DJ_Ilaw_123') {
        name = 'DJ Ilaw';
        isDJ = true;
    } else {
        isDJ = false;
    }
    
    currentNickname = name;
    localStorage.setItem('chat_nickname', currentNickname);
    localStorage.setItem('chat_is_dj', isDJ);
    return true;
}

function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    if (!currentNickname) {
        if (!promptForNickname()) return;
    }

    chatInput.value = "";

    addDoc(collection(db, "chat_messages"), {
        text: text,
        sender_name: currentNickname,
        sender_uid: currentUserUid,
        is_dj: isDJ,
        timestamp: serverTimestamp()
    }).catch(err => {
        console.error("Error sending message:", err);
        alert("Failed to send message. Please try again.");
    });
}

chatSendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function listenForMessages() {
    const q = query(collection(db, "chat_messages"), orderBy("timestamp", "desc"), limit(50));
    
    onSnapshot(q, (snapshot) => {
        chatMessages.innerHTML = ""; // clear loading
        const docs = snapshot.docs.reverse(); // we want oldest at top, newest at bottom

        docs.forEach((docSnap) => {
            const data = docSnap.data();
            const isMe = data.sender_uid === currentUserUid;
            const messageIsDJ = data.is_dj;
            const docId = docSnap.id;
            
            const div = document.createElement('div');
            div.className = "message";
            div.style.marginBottom = "1rem";
            div.style.borderBottom = "1px dashed #333";
            div.style.paddingBottom = "0.5rem";
            
            let timeStr = "";
            if (data.timestamp) {
                const timestamp = data.timestamp.toDate();
                let hours = timestamp.getHours();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12; 
                const minutes = timestamp.getMinutes().toString().padStart(2, '0');
                timeStr = ` • ${hours}:${minutes} ${ampm}`;
            }

            let userHtml = "";
            if (messageIsDJ) {
                userHtml = `<span class="user" style="color: var(--color-gold); font-weight: bold;">🎤 ${data.sender_name || 'Anonymous'}</span>`;
            } else {
                userHtml = `<span class="user" style="color: #aaa; font-weight: bold;">${isMe ? 'You' : (data.sender_name || 'Anonymous')}</span>`;
            }

            let timeHtml = `<span style="color: #666; font-size: 0.8rem; margin-left: 6px;">${timeStr}</span>`;
            let textHtml = `<span style="color: #fff; margin-left: 8px;">: ${data.text || ''}</span>`;

            // DJ Delete Button
            let deleteBtnHtml = "";
            if (isDJ) {
                deleteBtnHtml = `<span style="color: red; cursor: pointer; font-size: 0.8rem; float: right; margin-left: 10px;" data-id="${docId}" class="delete-msg-btn">Delete</span>`;
            }

            div.innerHTML = userHtml + timeHtml + textHtml + deleteBtnHtml;
            chatMessages.appendChild(div);
        });
        
        // Auto scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Attach delete listeners
        if (isDJ) {
            document.querySelectorAll('.delete-msg-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    if (confirm("Delete this message?")) {
                        deleteDoc(doc(db, "chat_messages", id));
                    }
                });
            });
        }
    });
}

// Allow changing nickname by clicking the input if already set
chatInput.addEventListener('dblclick', () => {
    if (confirm("Do you want to change your chat nickname?")) {
        currentNickname = null;
        isDJ = false;
        localStorage.removeItem('chat_nickname');
        localStorage.removeItem('chat_is_dj');
        promptForNickname();
    }
});
