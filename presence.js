// presence.js — Sistema de Presença Online Universal com Firebase

/**
 * Sistema de Presença Online Universal
 * Gerencia usuários online/offline através do Firebase Realtime Database
 * Funciona de forma global entre todos os computadores
 */

// Verificar se Firebase está disponível
if (typeof firebase === 'undefined' || typeof window.firebaseDb === 'undefined') {
    console.error('Firebase não está disponível. Verifique se firebase.js foi carregado corretamente.');
} else {
    console.log('✅ Sistema de presença online iniciando...');
}

// Sistema de presença global
const PresenceSystem = {
    currentUserData: null,
    presenceRef: null,
    userStatusRef: null,
    connectedRef: null,
    onlineUsersListener: null,
    isInitialized: false,
    
    /**
     * Inicializar o sistema de presença
     * @param {object} userData - Dados do usuário logado
     */
    init(userData) {
        if (!userData || !userData.user) {
            console.warn('PresenceSystem: Usuário não informado');
            return;
        }
        
        if (!this.isFirebaseAvailable()) {
            console.warn('PresenceSystem: Firebase não disponível, usando modo offline');
            this.updateOnlineCountLocal(1);
            return;
        }
        
        this.currentUserData = userData;
        this.setupPresenceTracking();
        this.setupOnlineUsersListener();
        this.isInitialized = true;
        
        console.log(`✅ Sistema de presença ativo para: ${userData.nome}`);
    },
    
    /**
     * Verificar se Firebase está disponível
     * @returns {boolean}
     */
    isFirebaseAvailable() {
        return typeof firebase !== 'undefined' && 
               typeof window.firebaseDb !== 'undefined' && 
               window.firebaseDb !== null;
    },
    
    /**
     * Configurar rastreamento de presença do usuário
     */
    setupPresenceTracking() {
        try {
            const db = window.firebaseDb;
            const userId = this.currentUserData.user;
            
            // Referência para o nó de presença global
            this.presenceRef = db.ref('presence');
            this.userStatusRef = db.ref('presence/' + userId);
            
            // Referência para status de conexão
            this.connectedRef = db.ref('.info/connected');
            
            // Quando a conexão é estabelecida
            this.connectedRef.on('value', (snap) => {
                if (snap.val() === true) {
                    // Usuário conectado
                    this.updateUserPresence(true);
                    
                    // Configurar remoção automática ao desconectar
                    this.userStatusRef.onDisconnect().remove();
                }
            });
            
            // Configurar evento beforeunload para garantir remoção
            window.addEventListener('beforeunload', () => {
                this.handleUserDisconnect();
            });
            
            // Atualizar periodicamente (a cada 30 segundos)
            setInterval(() => {
                this.updateUserPresence(true);
            }, 30000);
            
        } catch (error) {
            console.error('Erro ao configurar rastreamento de presença:', error);
            this.updateOnlineCountLocal(1);
        }
    },
    
    /**
     * Atualizar presença do usuário no Firebase
     * @param {boolean} isOnline - Status online/offline
     */
    updateUserPresence(isOnline) {
        if (!this.isFirebaseAvailable() || !this.currentUserData) {
            return;
        }
        
        try {
            const userData = {
                nome: this.currentUserData.nome,
                role: this.currentUserData.role || 'OPERADOR',
                turno: this.currentUserData.turno || 'Diurno',
                userId: this.currentUserData.user,
                isOnline: isOnline,
                lastActivity: firebase.database.ServerValue.TIMESTAMP,
                mood: this.getCurrentUserMood(),
                moodStatus: this.getMoodStatusText(this.getCurrentUserMood()),
                connectionTime: new Date().toISOString()
            };
            
            this.userStatusRef.set(userData);
            
            console.log(`👤 Presença atualizada: ${this.currentUserData.nome} (${isOnline ? 'Online' : 'Offline'})`);
            
        } catch (error) {
            console.error('Erro ao atualizar presença:', error);
        }
    },
    
    /**
     * Configurar listener para usuários online
     */
    setupOnlineUsersListener() {
        if (!this.isFirebaseAvailable()) {
            console.warn('Não foi possível configurar listener de usuários online - Firebase não disponível');
            this.updateOnlineCountLocal(1);
            return;
        }
        
        try {
            const db = window.firebaseDb;
            const onlineUsersRef = db.ref('presence');
            
            // Escutar mudanças na lista de usuários online
            this.onlineUsersListener = onlineUsersRef.on('value', (snapshot) => {
                this.processOnlineUsers(snapshot);
            }, (error) => {
                console.error('Erro no listener de usuários online:', error);
                this.updateOnlineCountLocal(1);
            });
            
        } catch (error) {
            console.error('Erro ao configurar listener:', error);
            this.updateOnlineCountLocal(1);
        }
    },
    
    /**
     * Processar lista de usuários online
     * @param {object} snapshot - Snapshot do Firebase
     */
    processOnlineUsers(snapshot) {
        const users = [];
        const data = snapshot.val();
        
        if (data) {
            const agora = Date.now();
            
            Object.keys(data).forEach(userId => {
                const userData = data[userId];
                
                if (userData && userData.isOnline === true) {
                    // Verificar se a atividade é recente (últimos 2 minutos)
                    const lastActivity = userData.lastActivity || 0;
                    const diferencaMinutos = (agora - lastActivity) / (1000 * 60);
                    
                    if (diferencaMinutos < 2) {
                        users.push({
                            ...userData,
                            userId: userId,
                            lastActivity: new Date(lastActivity).toISOString(),
                            minutesAgo: Math.floor(diferencaMinutos)
                        });
                    }
                }
            });
        }
        
        // Atualizar interface
        this.updateOnlineCount(users.length);
        this.updateOnlineUsersList(users);
    },
    
    /**
     * Atualizar contador de usuários online
     * @param {number} count - Número de usuários online
     */
    updateOnlineCount(count) {
        const onlineCount = document.getElementById('online-count');
        if (!onlineCount) return;
        
        if (count === 0) {
            onlineCount.textContent = '0';
            onlineCount.style.color = '#e74c3c';
        } else if (count === 1) {
            onlineCount.textContent = '1 (apenas você)';
            onlineCount.style.color = '#f39c12';
        } else {
            onlineCount.textContent = count;
            onlineCount.style.color = '#2ecc71';
        }
    },
    
    /**
     * Atualizar contador local (fallback)
     * @param {number} count - Número de usuários online
     */
    updateOnlineCountLocal(count) {
        const onlineCount = document.getElementById('online-count');
        if (!onlineCount) return;
        
        onlineCount.textContent = count === 1 ? '1 (apenas você)' : count;
        onlineCount.style.color = count === 1 ? '#f39c12' : '#2ecc71';
        
        // Se estiver no modo local, atualizar lista vazia
        if (count <= 1) {
            this.updateOnlineUsersList([]);
        }
    },
    
    /**
     * Atualizar lista de usuários online na interface
     * @param {array} users - Array de usuários online
     */
    updateOnlineUsersList(users) {
        const list = document.getElementById('online-users-list');
        if (!list) return;
        
        // Ordenar: admin primeiro, depois por nome
        const sortedUsers = [...users].sort((a, b) => {
            if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
            if (b.role === 'ADMIN' && a.role !== 'ADMIN') return 1;
            if (a.userId === this.currentUserData?.user && b.userId !== this.currentUserData?.user) return -1;
            if (b.userId === this.currentUserData?.user && a.userId !== this.currentUserData?.user) return 1;
            return a.nome.localeCompare(b.nome);
        });
        
        // Renderizar lista
        this.renderOnlineUsersList(sortedUsers, list);
    },
    
    /**
     * Renderizar lista de usuários online
     * @param {array} users - Usuários online
     * @param {HTMLElement} container - Container da lista
     */
    renderOnlineUsersList(users, container) {
        if (users.length === 0) {
            container.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #666;">
                    <i class="fas fa-user-slash" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Nenhum operador online</p>
                    <small style="font-size: 0.8rem;">Você está conectado, mas não há outros operadores ativos.</small>
                </div>
            `;
            return;
        }
        
        let html = '';
        users.forEach(user => {
            const isCurrentUser = user.userId === this.currentUserData?.user;
            const moodColor = this.getMoodColor(user.mood);
            const statusTime = user.minutesAgo === 0 ? 'Agora mesmo' : 
                              user.minutesAgo === 1 ? 'Há 1 minuto' : 
                              `Há ${user.minutesAgo} minutos`;
            
            html += `
                <div class="online-user-item">
                    <div class="online-user-avatar" style="background: ${moodColor}; color: ${user.mood === '😐' ? '#333' : 'white'};">
                        ${user.mood || '😐'}
                    </div>
                    <div class="online-user-info">
                        <div class="online-user-name">
                            ${user.nome.split(' ')[0]}
                            ${user.role === 'ADMIN' ? ' 👑' : ''}
                            ${isCurrentUser ? '<span style="color: #3498db; font-size: 0.8rem;"> (Você)</span>' : ''}
                        </div>
                        <div class="online-user-role">
                            ${user.moodStatus || 'Online'}
                            <div style="font-size: 0.7rem; color: #888; margin-top: 2px;">
                                <i class="far fa-clock"></i> ${statusTime}
                            </div>
                        </div>
                    </div>
                    <div class="online-status" style="background: ${isCurrentUser ? '#3498db' : '#2ecc71'};"></div>
                </div>
            `;
        });
        
        // Adicionar rodapé
        html += `
            <div style="padding: 10px 15px; text-align: center; font-size: 0.8rem; color: #666; 
                        border-top: 1px solid #eee; background: #f8f9fa; border-radius: 0 0 10px 10px;">
                <i class="fas fa-users"></i> 
                ${users.length} operador${users.length > 1 ? 'es' : ''} online
                <br>
                <small style="font-size: 0.7rem; color: #999;">
                    Atualizado: ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                </small>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    /**
     * Obter humor atual do usuário
     * @returns {string} Emoji do humor
     */
    getCurrentUserMood() {
        if (!this.currentUserData) return '😐';
        
        try {
            const hojeISO = new Date().toISOString().split('T')[0];
            const moods = JSON.parse(localStorage.getItem('porter_moods') || '[]');
            const moodHoje = moods.find(m => m.user === this.currentUserData.user && m.dataISO === hojeISO);
            
            return moodHoje ? moodHoje.moodStatus.split(' ')[0] : '😐';
        } catch (error) {
            return '😐';
        }
    },
    
    /**
     * Obter texto do status do humor
     * @param {string} mood - Emoji do humor
     * @returns {string} Texto do status
     */
    getMoodStatusText(mood) {
        const statusMap = {
            '😠': 'Zangado hoje',
            '😔': 'Triste hoje', 
            '😐': 'Neutro hoje',
            '🙂': 'Feliz hoje',
            '😄': 'Radiante hoje'
        };
        return statusMap[mood] || 'Não avaliado';
    },
    
    /**
     * Obter cor baseada no humor
     * @param {string} mood - Emoji do humor
     * @returns {string} Cor em hexadecimal
     */
    getMoodColor(mood) {
        const cores = {
            '😠': '#ffeaa7',
            '😔': '#fd79a8', 
            '😐': '#dfe6e9',
            '🙂': '#a29bfe',
            '😄': '#55efc4'
        };
        return cores[mood] || '#e8f4fc';
    },
    
    /**
     * Lidar com desconexão do usuário
     */
    handleUserDisconnect() {
        if (this.isFirebaseAvailable() && this.userStatusRef) {
            try {
                this.userStatusRef.remove();
            } catch (error) {
                console.error('Erro ao remover usuário do Firebase:', error);
            }
        }
    },
    
    /**
     * Limpar recursos ao fazer logout
     */
    cleanup() {
        // Remover listener
        if (this.onlineUsersListener && this.presenceRef) {
            this.presenceRef.off('value', this.onlineUsersListener);
        }
        
        // Remover usuário do Firebase
        this.handleUserDisconnect();
        
        // Limpar dados
        this.currentUserData = null;
        this.presenceRef = null;
        this.userStatusRef = null;
        this.connectedRef = null;
        this.onlineUsersListener = null;
        this.isInitialized = false;
        
        console.log('🔄 Sistema de presença limpo');
    }
};

// Integração com o sistema principal
window.PresenceSystem = PresenceSystem;

// Integrar com app.js quando disponível
if (typeof app !== 'undefined') {
    // Sobrescrever função showApp para incluir presença
    const originalShowApp = app.showApp;
    app.showApp = function() {
        originalShowApp.call(this);
        
        // Inicializar sistema de presença
        if (this.currentUser) {
            setTimeout(() => {
                PresenceSystem.init(this.currentUser);
            }, 1000);
        }
    };
    
    // Sobrescrever função logout para limpar presença
    const originalLogout = app.logout;
    app.logout = function() {
        PresenceSystem.cleanup();
        originalLogout.call(this);
    };
    
    // Sobrescrever função registrarLogoff
    const originalRegistrarLogoff = app.registrarLogoff;
    app.registrarLogoff = function() {
        PresenceSystem.cleanup();
        originalRegistrarLogoff.call(this);
    };
}

console.log('✅ Sistema de presença online carregado');
