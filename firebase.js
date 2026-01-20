// firebase.js - VERSÃO FUNCIONAL
console.log('🔧 Configurando Firebase...');

// 1. USE ESTAS CREDENCIAIS DE TESTE (já configuradas)
const firebaseConfig = {
    apiKey: "AIzaSyCkDvRxOqPBiwhkKT3sB5nVAsZvQ9zYbNY",
    authDomain: "porter-system.firebaseapp.com",
    databaseURL: "https://porter-system-default-rtdb.firebaseio.com",
    projectId: "porter-system",
    storageBucket: "porter-system.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef123456"
};

// 2. INICIALIZAÇÃO SIMPLES
let db = null;
let firebaseReady = false;

try {
    if (typeof firebase === 'undefined') {
        console.warn('⚠️ Firebase scripts não carregados');
    } else {
        // Inicializa
        const app = firebase.initializeApp(firebaseConfig);
        db = firebase.database(app);
        firebaseReady = true;
        console.log('✅ Firebase pronto!');
    }
} catch (error) {
    console.warn('⚠️ Firebase em modo offline:', error.message);
}

// 3. EXPORTAÇÃO SIMPLES
window.firebaseDB = {
    isReady: () => firebaseReady && db !== null,
    getDB: () => db
};

console.log('📦 Firebase configurado');
