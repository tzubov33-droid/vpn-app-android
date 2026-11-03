// Импортируем ЛОКАЛЬНЫЕ библиотеки (они уже будут вшиты в APK)
import { initializeApp } from "./firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "./firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBl72H5Xj3vmh2bSIOBMEYg67UdD_P7RBU",
  authDomain: "vpn-app-dcf4b.firebaseapp.com",
  projectId: "vpn-app-dcf4b",
  storageBucket: "vpn-app-dcf4b.firebasestorage.app",
  messagingSenderId: "16126749931",
  appId: "1:16126749931:web:cbbf2bcc6f933dca14e2ae"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- АДМИНКА ---
window.openAdmin = () => document.getElementById('admin-modal').classList.add('active');
window.closeAdmin = () => document.getElementById('admin-modal').classList.remove('active');

window.addServer = async () => {
    const name = document.getElementById('srv-name').value;
    const desc = document.getElementById('srv-desc').value;
    const link = document.getElementById('srv-link').value;

    if (!name || !link) return alert("Заполни название и ссылку!");

    try {
        await addDoc(collection(db, "servers"), {
            name: name, desc: desc, link: link,
            addedByOwner: true, createdAt: new Date()
        });
        document.getElementById('srv-name').value = '';
        document.getElementById('srv-desc').value = '';
        document.getElementById('srv-link').value = '';
    } catch (e) {
        alert("Ошибка: " + e.message);
    }
};

// --- ПАРСЕР ---
window.bulkImport = async () => {
    const text = document.getElementById('bulk-text').value;
    if (!text) return alert("Вставь текст!");

    const linkRegex = /(vless:\/\/|vmess:\/\/|trojan:\/\/|tg:\/\/|ss:\/\/|https:\/\/t\.me\/proxy|https:\/\/t\.me\/socks)[^\s]+/g;
    const links = text.match(linkRegex);

    if (!links) return alert("Ссылок не найдено.");

    let addedCount = 0;
    const serversRef = collection(db, "servers");

    for (let i = 0; i < links.length; i++) {
        let link = links[i];
        if (link.startsWith("https://t.me/proxy")) link = link.replace("https://t.me/proxy", "tg://proxy");
        else if (link.startsWith("https://t.me/socks")) link = link.replace("https://t.me/socks", "tg://socks");

        let typeName = link.split("://")[0].toUpperCase();
        
        try {
            await addDoc(serversRef, {
                name: `${typeName} #${i + 1}`,
                desc: "Импортировано из файла",
                link: link,
                addedByOwner: true,
                createdAt: new Date()
            });
            addedCount++;
        } catch (e) { console.error(e); }
    }
    document.getElementById('bulk-text').value = '';
    alert(`Добавлено: ${addedCount} серверов!`);
};

// --- ВЫВОД ---
const serversList = document.getElementById('servers-list');
const q = query(collection(db, "servers"), orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
    serversList.innerHTML = '';
    if (snapshot.empty) {
        serversList.innerHTML = '<p style="color: #8b93a1;">Серверов пока нет.</p>';
        return;
    }

    snapshot.forEach((doc) => {
        const data = doc.data();
        const card = document.createElement('div');
        card.className = 'card';
        const badge = data.addedByOwner ? `<span class="badge">Добавлено владельцем</span>` : '';
        
        card.innerHTML = `
            ${badge}
            <h3>${data.name}</h3>
            <p>${data.desc}</p>
            <button class="btn-primary" onclick="window.location.href='${data.link}'">Подключиться</button>
        `;
        serversList.appendChild(card);
    });
});