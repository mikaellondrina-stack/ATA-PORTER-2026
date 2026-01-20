const firebaseConfig = {
// firebase.js

// Configuração do Firebase
var firebaseConfig = {
  apiKey: "AIzaSyAzfPWTcBtJk3UyOYdLIeSK3PlfjYKJAHI",
  authDomain: "site-universal-29a2b.firebaseapp.com",
  databaseURL: "https://site-universal-29a2b-default-rtdb.firebaseio.com",
  projectId: "site-universal-29a2b",
  storageBucket: "site-universal-29a2b.firebasestorage.app",
  storageBucket: "site-universal-29a2b.appspot.com",
  messagingSenderId: "793824632619",
  appId: "1:793824632619:web:e035c64e33969a40932f6e"
};

// Inicializa Firebase (SEM import/const)
firebase.initializeApp(firebaseConfig);

// Cria db no escopo global
window.db = firebase.database();
