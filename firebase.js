// firebase.js - CONFIGURAÇÃO CORRIGIDA
console.log('🔧 Iniciando configuração do Firebase...');

// Sua configuração Firebase (use SUAS credenciais reais)
const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    databaseURL: "https://SEU_PROJETO.firebaseio.com",
    projectId: "SEU_PROJETO",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID"
};

// Variável global para controle
let firebaseInitialized = false;
let database = null;

try {
    // Verificar se Firebase está disponível
    if (typeof firebase === 'undefined') {
        console.warn('⚠️ Firebase não encontrado. Verifique se o script foi carregado.');
        throw new Error('Firebase não disponível');
    }

    // Inicializar Firebase APENAS com App e Database
    console.log('🚀 Inicializando Firebase App...');
    firebase.initializeApp(firebaseConfig);
    
    // Inicializar APENAS Database (não auth)
    console.log('🚀 Inicializando Firebase Database...');
    database = firebase.database();
    
    firebaseInitialized = true;
    console.log('✅ Firebase inicializado com sucesso!');
    
} catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error);
    console.warn('⚠️ Usando fallback para Firebase (modo offline)');
    firebaseInitialized = false;
}

// Funções utilitárias
function isFirebaseReady() {
    return firebaseInitialized && database !== null;
}

function getDatabase() {
    if (!isFirebaseReady()) {
        console.warn('⚠️ Firebase não disponível, retornando null');
        return null;
    }
    return database;
}

// Função para testar conexão
function testFirebaseConnection() {
    if (!isFirebaseReady()) {
        console.log('🔌 Firebase não inicializado');
        return Promise.resolve(false);
    }
    
    return new Promise((resolve) => {
        const testRef = database.ref('.info/connected');
        testRef.on('value', (snap) => {
            if (snap.val() === true) {
                console.log('✅ Conectado ao Firebase em tempo real');
                resolve(true);
            } else {
                console.log('⚠️ Firebase desconectado');
                resolve(false);
            }
            testRef.off(); // Remove listener após teste
        });
        
        // Timeout após 3 segundos
        setTimeout(() => {
            console.log('⏰ Timeout na conexão Firebase');
            resolve(false);
        }, 3000);
    });
}

// Exportar para uso global
window.firebaseApp = {
    isReady: isFirebaseReady,
    getDb: getDatabase,
    testConnection: testFirebaseConnection,
    config: firebaseInitialized ? firebaseConfig : null
};

console.log('🔧 firebase.js carregado:', window.firebaseApp);

// Testar conexão automaticamente
if (isFirebaseReady()) {
    setTimeout(() => {
        testFirebaseConnection().then(connected => {
            if (connected) {
                console.log('🎉 Sistema global pronto!');
                // Disparar evento para presence.js saber que Firebase está pronto
                const event = new CustomEvent('firebase-ready', { detail: { connected: true } });
                window.dispatchEvent(event);
            }
        });
    }, 1000);
}
