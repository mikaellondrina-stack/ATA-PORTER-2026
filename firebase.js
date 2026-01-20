// firebase.js - MODO OFFLINE (GARANTIDO)
console.log('🔧 Firebase em modo offline para testes');

// Simula Firebase pronto mas offline
window.firebaseDB = {
    isReady: () => true,  // Sempre diz que está pronto
    getDB: () => ({
        ref: (path) => ({
            set: () => Promise.resolve(),
            update: () => Promise.resolve(),
                            remove: () => Promise.resolve(),
            on: () => {},
            off: () => {},
            once: () => Promise.resolve({ val: () => null })
        })
    })
};

console.log('✅ Firebase simulado - Sistema funcionará localmente');
