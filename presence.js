// presence.js — Presença online/offline com usuário real

// Verifica se o db existe
if (!db) {
  console.error("db não definido. Verifique firebase.js!");
}

// Função para gerar ID do usuário
function getUserId() {
  if (window.currentUser && window.currentUser.uid) {
    return "user_" + window.currentUser.uid;
  } else if (window.currentUser && window.currentUser.name) {
    return "user_" + window.currentUser.name.replace(/\s+/g, "_");
  } else {
    return "guest_" + Math.floor(Math.random() * 1000000);
  }
}

// ID único do usuário
var userId = getUserId();

// Referência geral para presença
var presenceRef = db.ref("presence");

// Nó específico do usuário
var userStatusRef = presenceRef.child(userId);

// Estado online inicial
var isOnline = {
  online: true,
  lastChanged: new Date().toISOString()
};

// Atualiza status quando fecha a aba ou sai
window.addEventListener("beforeunload", function () {
  userStatusRef.set({
    online: false,
    lastChanged: new Date().toISOString()
  });
});

// Inicializa como online
userStatusRef.set(isOnline);

// Escuta conexão do Firebase
var connectedRef = db.ref(".info/connected");
connectedRef.on("value", function (snap) {
  if (snap.val() === true) {
    userStatusRef.set(isOnline);
  } else {
    userStatusRef.set({
      online: false,
      lastChanged: new Date().toISOString()
    });
  }
});

// Opcional: escuta todos os usuários online
presenceRef.on("value", function (snap) {
  console.log("Usuários online/offline:", snap.val());
});
