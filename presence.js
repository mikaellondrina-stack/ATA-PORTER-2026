// presence.js — Sistema de Presença Online Global
// COMPATÍVEL com seu site Porter

console.log('🔧 presence.js carregado');

// Classe principal de gerenciamento de presença
class PresenceManager {
    constructor() {
        this.currentUser = null;
        this.userRef = null;
        this.statusRef = null;
        this.onlineUsers = {};
        this.initialized = false;
        
        // Espera Firebase carregar
        setTimeout(() => this.initialize(), 1000);
    }
    
    initialize() {
        if (typeof db === 'undefined' || !db) {
            console.error('❌ Firebase Database não está disponível');
            setTimeout(() => this.initialize(), 2000); // Tenta novamente
            return;
        }
        
        console.log('✅ Firebase Database disponível, configurando presença...');
        this.setupConnectionListener();
        this.initialized = true;
    }
    
    // Inicializa para um usuário específico (chamado após login)
    initUser(userName, userEmail, turno) {
        if (!this.initialized) {
            console.warn('⚠️ PresenceManager ainda não inicializado');
            setTimeout(() => this.initUser(userName, userEmail, turno), 1000);
            return;
        }
        
        // Gera ID único baseado no email/nome
        const userId = this.generateUserId(userEmail, userName);
        
        this.currentUser = {
            id: userId,
            name: userName,
            email: userEmail,
            turno: turno,
            loginTime: new Date().toISOString()
        };
        
        console.log(`👤 Usuário inicializado: ${userName} (${userId})`);
        
        // Configura presença do usuário
        this.setupUserPresence(userId);
        
        // Começa a monitorar outros usuários
        this.startMonitoring();
        
        // Atualiza UI
        this.updateOnlineUI();
    }
    
    generateUserId(email, name) {
        if (email && email.includes('@')) {
            return 'user_' + email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
        }
        if (name) {
            return 'user_' + name.replace(/\s+/g, '_').toLowerCase();
        }
        return 'guest_' + Math.random().toString(36).substr(2, 9);
    }
    
    setupConnectionListener() {
        const connectedRef = db.ref('.info/connected');
        
        connectedRef.on('value', (snap) => {
            const isConnected = snap.val() === true;
            console.log(isConnected ? '✅ Online' : '❌ Offline');
            
            if (this.currentUser && isConnected) {
                this.updateUserStatus(true);
            }
        });
    }
    
    setupUserPresence(userId) {
        this.userRef = db.ref('users/' + userId);
        this.statusRef = db.ref('status/' + userId);
        
        // Salva informações do usuário
        this.userRef.set({
            name: this.currentUser.name,
            email: this.currentUser.email,
            turno: this.currentUser.turno,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
        
        // Configura status online
        this.updateUserStatus(true);
        
        // Configura desconexão automática
        this.statusRef.onDisconnect().set({
            online: false,
            name: this.currentUser.name,
            turno: this.currentUser.turno,
            lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
    }
    
    updateUserStatus(isOnline) {
        if (!this.statusRef) return;
        
        this.statusRef.set({
            online: isOnline,
            name: this.currentUser.name,
            turno: this.currentUser.turno,
            lastSeen: firebase.database.ServerValue.TIMESTAMP,
            userId: this.currentUser.id
        });
    }
    
    startMonitoring() {
        const statusRef = db.ref('status');
        
        statusRef.on('value', (snapshot) => {
            const users = [];
            const data = snapshot.val() || {};
            
            Object.keys(data).forEach(userId => {
                const user = data[userId];
                if (user.online && userId !== this.currentUser?.id) {
                    users.push({
                        id: userId,
                        name: user.name,
                        turno: user.turno,
                        lastSeen: user.lastSeen
                    });
                }
            });
            
            // Armazena usuários online
            this.onlineUsers = data;
            
            // Atualiza interface
            this.updateOnlineUI(users);
        });
    }
    
    updateOnlineUI(users = []) {
        // Atualiza contador
        const countElement = document.getElementById('online-count');
        if (countElement) {
            countElement.textContent = users.length;
        }
        
        // Atualiza lista dropdown
        const listElement = document.getElementById('online-users-list');
        if (listElement) {
            if (users.length === 0) {
                listElement.innerHTML = `
                    <div class="online-user-item" style="color: #666;">
                        <i class="fas fa-users"></i> Nenhum operador online
                    </div>
                `;
                return;
            }
            
            listElement.innerHTML = users.map(user => `
                <div class="online-user-item">
                    <i class="fas fa-user-circle" style="color: #27ae60;"></i>
                    <div style="flex: 1;">
                        <strong>${user.name}</strong>
                        <div style="font-size: 0.8rem; color: #666;">Turno: ${user.turno}</div>
                    </div>
                </div>
            `).join('');
        }
        
        // Atualiza badge do chat
        const chatBadge = document.getElementById('chat-badge');
        if (chatBadge && users.length > 0) {
            chatBadge.textContent = users.length;
            chatBadge.style.display = 'inline-block';
        }
    }
    
    // Método para logout
    logout() {
        if (this.currentUser) {
            console.log(`👋 ${this.currentUser.name} está saindo...`);
            
            if (this.statusRef) {
                this.statusRef.set({
                    online: false,
                    name: this.currentUser.name,
                    turno: this.currentUser.turno,
                    lastSeen: firebase.database.ServerValue.TIMESTAMP
                });
            }
            
            this.currentUser = null;
            this.userRef = null;
            this.statusRef = null;
        }
    }
    
    // Obtém lista de usuários online
    getOnlineUsers() {
        return Object.values(this.onlineUsers).filter(user => user.online);
    }
    
    // Verifica se usuário está online
    isUserOnline(userId) {
        return this.onlineUsers[userId] && this.onlineUsers[userId].online === true;
    }
}

// Instância global
window.presenceManager = new PresenceManager();

// Configura evento de logout global
window.addEventListener('beforeunload', function() {
    if (window.presenceManager && window.presenceManager.currentUser) {
        window.presenceManager.logout();
    }
});

// Helper functions
function updateOnlineCount(count) {
    const el = document.getElementById('online-count');
    if (el) el.textContent = count;
}

function showOnlineUsers(users) {
    const list = document.getElementById('online-users-list');
    if (!list) return;
    
    list.innerHTML = users.map(user => `
        <div class="online-user">
            <i class="fas fa-user"></i> ${user.name} (${user.turno})
        </div>
    `).join('');
}

console.log('✅ Presence Manager pronto para uso');
