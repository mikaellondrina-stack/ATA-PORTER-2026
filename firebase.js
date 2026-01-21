// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC4g7J8N8Fq7c8X9K2vQ5ZzLm1nP2o3r4t5",
    authDomain: "porter-ata-operacional.firebaseapp.com",
    databaseURL: "https://porter-ata-operacional-default-rtdb.firebaseio.com",
    projectId: "porter-ata-operacional",
    storageBucket: "porter-ata-operacional.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// Inicializar Firebase
let firebaseApp, firebaseDb, firebaseAuth;

try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    firebaseDb = firebase.database();
    firebaseAuth = firebase.auth();
    console.log("Firebase inicializado com sucesso!");
} catch (error) {
    console.log("Firebase não inicializado (modo local):", error);
}

// Sistema de sincronização com Firebase
const firebaseSync = {
    // Verificar se Firebase está disponível
    isAvailable() {
        return firebaseDb !== undefined;
    },
    
    // Sincronizar dados locais com Firebase
    async syncLocalData() {
        if (!this.isAvailable()) return;
        
        try {
            // Sincronizar ATAs
            const atas = JSON.parse(localStorage.getItem('porter_atas') || '[]');
            await firebaseDb.ref('atas').set(atas);
            
            // Sincronizar OS
            const os = JSON.parse(localStorage.getItem('porter_os') || '[]');
            await firebaseDb.ref('os').set(os);
            
            // Sincronizar presenças
            const presencas = JSON.parse(localStorage.getItem('porter_presencas') || '[]');
            await firebaseDb.ref('presencas').set(presencas);
            
            // Sincronizar chat
            const chat = JSON.parse(localStorage.getItem('porter_chat') || '[]');
            await firebaseDb.ref('chat').set(chat);
            
            console.log("Dados sincronizados com Firebase!");
        } catch (error) {
            console.error("Erro ao sincronizar com Firebase:", error);
        }
    },
    
    // Carregar dados do Firebase
    async loadFromFirebase() {
        if (!this.isAvailable()) return;
        
        try {
            // Carregar ATAs
            const atasSnapshot = await firebaseDb.ref('atas').once('value');
            const atas = atasSnapshot.val() || [];
            localStorage.setItem('porter_atas', JSON.stringify(atas));
            
            // Carregar OS
            const osSnapshot = await firebaseDb.ref('os').once('value');
            const os = osSnapshot.val() || [];
            localStorage.setItem('porter_os', JSON.stringify(os));
            
            // Carregar presenças
            const presencasSnapshot = await firebaseDb.ref('presencas').once('value');
            const presencas = presencasSnapshot.val() || [];
            localStorage.setItem('porter_presencas', JSON.stringify(presencas));
            
            // Carregar chat
            const chatSnapshot = await firebaseDb.ref('chat').once('value');
            const chat = chatSnapshot.val() || [];
            localStorage.setItem('porter_chat', JSON.stringify(chat));
            
            console.log("Dados carregados do Firebase!");
            
            // Recarregar a aplicação
            if (currentUser) {
                app.renderAll();
            }
        } catch (error) {
            console.error("Erro ao carregar do Firebase:", error);
        }
    },
    
    // Atualizar usuário online no Firebase
    async updateUserOnlineStatus() {
        if (!this.isAvailable() || !currentUser) return;
        
        try {
            const userStatusRef = firebaseDb.ref('online_users/' + currentUser.user);
            
            // Definir como online
            await userStatusRef.set({
                nome: currentUser.nome,
                role: currentUser.role,
                turno: currentUser.turno,
                lastActivity: new Date().toISOString(),
                mood: app.getMoodAtual()
            });
            
            // Remover automaticamente após 5 minutos de inatividade
            await userStatusRef.onDisconnect().remove();
        } catch (error) {
            console.error("Erro ao atualizar status online:", error);
        }
    },
    
    // Obter usuários online do Firebase
    async getOnlineUsersFromFirebase() {
        if (!this.isAvailable()) return [];
        
        try {
            const onlineUsersSnapshot = await firebaseDb.ref('online_users').once('value');
            const users = onlineUsersSnapshot.val() || {};
            
            // Filtrar usuários ativos (últimos 5 minutos)
            const agora = new Date();
            const usuariosAtivos = [];
            
            Object.entries(users).forEach(([userId, userData]) => {
                const lastActivity = new Date(userData.lastActivity);
                const diferencaMinutos = (agora - lastActivity) / (1000 * 60);
                
                if (diferencaMinutos < 5) {
                    usuariosAtivos.push({
                        user: userId,
                        ...userData,
                        isCurrentUser: currentUser && userId === currentUser.user
                    });
                }
            });
            
            return usuariosAtivos;
        } catch (error) {
            console.error("Erro ao obter usuários online:", error);
            return [];
        }
    },
    
    // Enviar mensagem de chat para Firebase
    async sendChatMessageToFirebase(chatMessage) {
        if (!this.isAvailable()) return;
        
        try {
            const chatRef = firebaseDb.ref('chat');
            const newMessageRef = chatRef.push();
            await newMessageRef.set(chatMessage);
        } catch (error) {
            console.error("Erro ao enviar mensagem para Firebase:", error);
        }
    },
    
    // Ouvir novas mensagens do chat em tempo real
    listenToChatMessages(callback) {
        if (!this.isAvailable()) return;
        
        try {
            firebaseDb.ref('chat').on('value', (snapshot) => {
                const chatData = snapshot.val() || {};
                const messages = Object.values(chatData).sort((a, b) => b.timestamp - a.timestamp);
                callback(messages);
            });
        } catch (error) {
            console.error("Erro ao ouvir mensagens do chat:", error);
        }
    }
};

// Inicializar sincronização com Firebase
window.addEventListener('load', () => {
    setTimeout(() => {
        if (firebaseSync.isAvailable()) {
            // Carregar dados do Firebase na inicialização
            firebaseSync.loadFromFirebase();
            
            // Configurar sincronização periódica
            setInterval(() => {
                if (currentUser) {
                    firebaseSync.syncLocalData();
                    firebaseSync.updateUserOnlineStatus();
                }
            }, 30000); // A cada 30 segundos
        }
    }, 1000);
});
