// firebase.js - Sistema de Presença Universal

/**
 * Configuração e inicialização do Firebase Realtime Database
 * Sistema de presença online universal para o Porter
 */

// Configuração do Firebase (Dados sensíveis - uso seguro)
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAzfPWTcBtJk3UyOYdLIeSK3PlfjYKJAHI",
    authDomain: "site-universal-29a2b.firebaseapp.com",
    databaseURL: "https://site-universal-29a2b-default-rtdb.firebaseio.com",
    projectId: "site-universal-29a2b",
    storageBucket: "site-universal-29a2b.appspot.com",
    messagingSenderId: "793824632619",
    appId: "1:793824632619:web:e035c64e33969a40932f6e"
};

// Verificar se Firebase já foi carregado
if (typeof firebase === 'undefined') {
    console.error('Firebase SDK não foi carregado. Verifique se o script do Firebase foi incluído antes deste arquivo.');
} else {
    try {
        // Inicializar Firebase se não estiver inicializado
        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }
        
        // Criar referência global para o banco de dados
        window.firebaseDb = firebase.database();
        
        // Expor o objeto firebase globalmente para outros módulos
        window.firebaseApp = firebase;
        
        console.log('✅ Firebase inicializado com sucesso');
        
        // Testar conexão
        const connectedRef = window.firebaseDb.ref(".info/connected");
        connectedRef.on("value", function(snap) {
            if (snap.val() === true) {
                console.log("🌐 Conectado ao Firebase Realtime Database");
            } else {
                console.log("⚠️ Firebase desconectado");
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
        // Criar objetos simulados para evitar erros
        window.firebaseDb = {
            ref: function() { 
                console.warn('Firebase não disponível - usando modo offline');
                return {
                    set: function() { return Promise.resolve(); },
                    remove: function() { return Promise.resolve(); },
                    on: function() { console.warn('Firebase offline - listener ignorado'); },
                    onDisconnect: function() { return { remove: function() {} }; }
                };
            }
        };
        window.firebaseApp = { database: function() { return window.firebaseDb; } };
    }
}

/**
 * Utilitário para verificar status da conexão Firebase
 * @returns {boolean} True se Firebase estiver disponível e conectado
 */
window.isFirebaseAvailable = function() {
    return typeof firebase !== 'undefined' && 
           typeof window.firebaseDb !== 'undefined' && 
           window.firebaseDb !== null;
};

/**
 * Obter timestamp do servidor Firebase
 * @returns {object} ServerValue.TIMESTAMP
 */
window.getFirebaseTimestamp = function() {
    if (window.isFirebaseAvailable()) {
        return firebase.database.ServerValue.TIMESTAMP;
    }
    return Date.now();
};

// Exportar para uso em outros módulos (compatibilidade)
window.FIREBASE_CONFIG = FIREBASE_CONFIG;
