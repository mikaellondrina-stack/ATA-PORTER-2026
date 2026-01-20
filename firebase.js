// firebase.js
// Configuração e inicialização do Firebase Realtime Database v8

// Configuração do Firebase - CDN v8 (Compatível)
const firebaseConfig = {
  apiKey: "AIzaSyAzfPWTcBtJk3UyOYdLIeSK3PlfjYKJAHI",
  authDomain: "site-universal-29a2b.firebaseapp.com",
  databaseURL: "https://site-universal-29a2b-default-rtdb.firebaseio.com",
  projectId: "site-universal-29a2b",
  storageBucket: "site-universal-29a2b.appspot.com", // Único storageBucket correto
  messagingSenderId: "793824632619",
  appId: "1:793824632619:web:e035c64e33969a40932f6e"
};

// Verificar se Firebase está carregado (CDN)
try {
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase não foi carregado. Verifique o CDN no HTML.');
    throw new Error('Firebase não encontrado. CDN pode não ter carregado.');
  }
  
  // Inicializar Firebase
  firebase.initializeApp(firebaseConfig);
  console.log('✅ Firebase inicializado com sucesso');
  
  // Exportar instâncias principais para uso global
  window.db = firebase.database();           // Database principal
  window.firebaseAuth = firebase.auth();     // Autenticação (se necessário)
  window.firebaseApp = firebase.app();       // App instance
  
  // Verificar conexão
  const connectedRef = window.db.ref('.info/connected');
  connectedRef.on('value', (snap) => {
    if (snap.val() === true) {
      console.log('✅ Conectado ao Firebase Realtime Database');
    } else {
      console.log('⚠️ Desconectado do Firebase');
    }
  });
  
  // Monitorar erros de conexão
  window.db.ref('.info/connected').on('value', (snapshot) => {
    if (snapshot.val() === true) {
      console.log('📡 Conexão Firebase: ATIVA');
    }
  });
  
  window.db.ref('.info/connected').on('disconnect', () => {
    console.warn('⚠️ Firebase desconectado');
  });
  
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase:', error);
  
  // Fallback: Criar objeto db simulado para evitar erros
  window.db = {
    ref: () => ({ 
      set: () => Promise.reject('Firebase não inicializado'),
      update: () => Promise.reject('Firebase não inicializado'),
      remove: () => Promise.reject('Firebase não inicializado'),
      on: () => console.warn('Firebase não inicializado'),
      off: () => {},
      once: () => Promise.reject('Firebase não inicializado')
    }),
    // Métodos comuns
    goOffline: () => {},
    goOnline: () => {}
  };
  
  console.warn('⚠️ Usando fallback para Firebase (modo offline)');
}

// 🔥 Funções auxiliares para uso em outros arquivos
window.firebaseHelpers = {
  
  // Verificar se Firebase está disponível
  isFirebaseAvailable() {
    return typeof window.db !== 'undefined' && 
           typeof window.db.ref === 'function' &&
           !window.db.ref().set.toString().includes('Firebase não inicializado');
  },
  
  // Testar conexão
  testConnection() {
    if (!this.isFirebaseAvailable()) {
      return Promise.resolve(false);
    }
    
    return new Promise((resolve) => {
      const testRef = window.db.ref('connection_test');
      const testKey = 'test_' + Date.now();
      
      testRef.child(testKey).set({
        timestamp: Date.now(),
        test: true
      })
      .then(() => {
        // Limpar teste
        testRef.child(testKey).remove();
        resolve(true);
      })
      .catch(() => {
        resolve(false);
      });
    });
  },
  
  // Obter timestamp do servidor Firebase
  getServerTimestamp() {
    if (this.isFirebaseAvailable()) {
      return firebase.database.ServerValue.TIMESTAMP;
    }
    return Date.now();
  },
  
  // Criar referência segura para usuários
  getUserRef(userId) {
    if (!this.isFirebaseAvailable()) return null;
    
    // Sanitizar userId para evitar problemas
    const safeUserId = String(userId || '')
      .replace(/[.#$\[\]]/g, '_')
      .substring(0, 100);
    
    return window.db.ref('users/' + safeUserId);
  },
  
  // Criar referência para presença online
  getPresenceRef() {
    if (!this.isFirebaseAvailable()) return null;
    return window.db.ref('presence');
  },
  
  // Método para limpar todas as referências (útil no logout)
  cleanup() {
    if (window.db && typeof window.db.goOffline === 'function') {
      window.db.goOffline();
    }
  }
};

// Adicionar evento para reconexão
if (window.db && typeof window.db.goOnline === 'function') {
  window.addEventListener('online', () => {
    console.log('🌐 Reconectando ao Firebase...');
    window.db.goOnline();
  });
  
  window.addEventListener('offline', () => {
    console.warn('📴 Sem conexão - Firebase offline');
    window.db.goOffline();
  });
}

// Log para debugging
console.log('🔧 firebase.js carregado:', {
  config: firebaseConfig.projectId ? 'OK' : 'FALHA',
  db: typeof window.db !== 'undefined' ? 'DISPOSTÍVEL' : 'INDISPONÍVEL',
  helpers: typeof window.firebaseHelpers !== 'undefined' ? 'OK' : 'FALHA',
  timestamp: new Date().toISOString()
});

// Exportar para módulos (se necessário)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    firebaseConfig,
    db: window.db,
    firebaseHelpers: window.firebaseHelpers
  };
}
