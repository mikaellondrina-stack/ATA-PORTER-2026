// firebase.js - CONFIGURAÇÃO REAL
const firebaseConfig = {
  apiKey: "AIzaSyARRqLJJFdaHpcmUtrSStqmx90ZYm8ERe8",
  authDomain: "ata-porter-2026-new-98c61.firebaseapp.com",
  projectId: "ata-porter-2026-new-98c61",  // ⬅️ SEU PROJETO REAL!
  storageBucket: "ata-porter-2026-new-98c61.firebasestorage.app",
  messagingSenderId: "196023937983",
  appId: "1:196023937983:web:090b010284141d2edecf0a"
};

console.log("🚀 Configurando Firebase com projeto REAL...");

try {
  // Inicializar Firebase se não estiver
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase inicializado com projeto REAL");
  } else {
    console.log("⚠️ Firebase já estava inicializado");
  }
  
  // Configurar Firestore
  window.db = firebase.firestore();
  
  // Configurações importantes
  db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
  });
  
  console.log("🎯 Firestore configurado!");
  console.log("📌 Projeto REAL:", firebase.app().options.projectId);
  
  // Teste automático
  setTimeout(() => {
    console.log("🧪 Testando conexão com projeto REAL...");
    db.collection("teste_real").doc("setup").set({
      projeto: "ata-porter-2026-new-98c61",
      configurado: true,
      data: new Date().toISOString()
    })
    .then(() => console.log("✅ Projeto REAL conectado!"))
    .catch(err => console.error("❌ Erro com projeto REAL:", err.code));
  }, 1000);
  
} catch (error) {
  console.error("💥 ERRO na configuração REAL:", error);
}
