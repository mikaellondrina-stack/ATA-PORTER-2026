// Sistema principal
const app = {
    currentUser: null,
    selectedMood: null,
    currentCondoFilter: '',
    notifications: [],
    lastLogoffTime: null,
    chatInterval: null,
    moodInterval: null,
    onlineInterval: null,
    onlineUsers: [],
    firebaseEnabled: false, // 🆕 Controle do Firebase
    filtrosAtas: { condo: '', dataInicio: '', dataFim: '', tipo: '', status: '' },
    filtrosPresenca: { operador: '', dataInicio: '', dataFim: '', turno: '' },
    
    init() {
        // TESTAR FIREBASE PRIMEIRO
        this.verificarFirebase();
        
        // GARANTIR que começa na tela de login
        if (document.getElementById('login-screen')) {
            document.getElementById('login-screen').classList.remove('hidden');
        }
        if (document.getElementById('main-content')) {
            document.getElementById('main-content').classList.add('hidden');
        }
        
        // Limpar auto-preenchimento dos campos de login
        setTimeout(() => {
            if (document.getElementById('login-user')) {
                document.getElementById('login-user').value = '';
            }
            if (document.getElementById('login-pass')) {
                document.getElementById('login-pass').value = '';
            }
            if (document.getElementById('login-turno')) {
                document.getElementById('login-turno').value = 'Diurno';
            }
        }, 100);
        
        this.loadCondos();
        this.loadFiltros();
        this.loadNotifications();
        this.setupEventListeners();
        this.setupAutoSave();
        this.setupOSPreview();
        this.setupResponsive();
        
        // Configurar datas padrão
        const hoje = new Date();
        const umaSemanaAtras = new Date();
        umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);
        
        if (document.getElementById('filter-data-inicio')) {
            document.getElementById('filter-data-inicio').value = umaSemanaAtras.toISOString().split('T')[0];
        }
        if (document.getElementById('filter-data-fim')) {
            document.getElementById('filter-data-fim').value = hoje.toISOString().split('T')[0];
        }
        if (document.getElementById('filter-presenca-inicio')) {
            document.getElementById('filter-presenca-inicio').value = umaSemanaAtras.toISOString().split('T')[0];
        }
        if (document.getElementById('filter-presenca-fim')) {
            document.getElementById('filter-presenca-fim').value = hoje.toISOString().split('T')[0];
        }
        if (document.getElementById('os-data')) {
            document.getElementById('os-data').value = hoje.toISOString().split('T')[0];
        }
        
        // Preencher datas do relatório
        if (document.getElementById('report-data-inicio')) {
            document.getElementById('report-data-inicio').value = umaSemanaAtras.toISOString().split('T')[0];
        }
        if (document.getElementById('report-data-fim')) {
            document.getElementById('report-data-fim').value = hoje.toISOString().split('T')[0];
        }
        
        this.carregarFiltrosSalvos();
        
        // Configurar clique fora da lista de online
        document.addEventListener('click', (e) => {
            const onlineList = document.getElementById('online-users-list');
            const onlineDropdown = document.getElementById('online-users');
            if (onlineList && onlineList.style.display === 'block' && 
                !onlineDropdown.contains(e.target) && 
                !onlineList.contains(e.target)) {
                onlineList.style.display = 'none';
            }
        });
        
        // Configurar clique fora das notificações
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.notification-bell') && !e.target.closest('.notifications-panel')) {
                const panel = document.getElementById('notifications-panel');
                if (panel) panel.classList.remove('show');
            }
        });
        
        // Inicializar sistema de e-mail se existir
        setTimeout(() => {
            if (typeof emailApp !== 'undefined' && emailApp.init) {
                emailApp.init();
            }
        }, 500);
        
        // 🔧 ADICIONAR BOTÃO DE SINCRONIZAÇÃO VERCEL
        setTimeout(() => {
            this.adicionarBotaoSincronizacaoVercel();
        }, 1000);
        
        // 🔧 CORRIGIR DADOS EXISTENTES
        setTimeout(() => {
            this.corrigirDadosExistentes();
        }, 1500);
    },
    
    // 🔧 FUNÇÃO PARA CORRIGIR DADOS EXISTENTES
    corrigirDadosExistentes() {
        console.log("🔧 Corrigindo dados existentes...");
        
        // Corrigir ATAs
        const atas = JSON.parse(localStorage.getItem('porter_atas') || '[]');
        if (atas.length > 0) {
            const atasCorrigidas = atas.map((ata, index) => {
                // Garantir campos obrigatórios
                return {
                    id: ata.id || `vercel_${Date.now()}_${index}`,
                    condo: ata.condo || "Não especificado",
                    cidade: ata.cidade || "",
                    tipo: ata.tipo || "Ocorrência",
                    status: ata.status || "Em andamento",
                    desc: ata.desc || "",
                    operador: ata.operador || "Operador desconhecido",
                    user: ata.user || "anonimo",
                    turno: ata.turno || "Diurno",
                    data: ata.data || new Date().toLocaleDateString('pt-BR'),
                    dataISO: ata.dataISO || new Date().toISOString().split('T')[0],
                    hora: ata.hora || new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
                    timestamp: ata.timestamp || new Date().toISOString(),
                    comentarios: Array.isArray(ata.comentarios) ? ata.comentarios : [],
                    fixa: ata.fixa || false
                };
            });
            
            localStorage.setItem('porter_atas', JSON.stringify(atasCorrigidas));
            console.log(`✅ ${atasCorrigidas.length} ATAs corrigidas`);
        }
        
        // Corrigir Chat
        const chat = JSON.parse(localStorage.getItem('porter_chat') || '[]');
        if (chat.length > 0) {
            const chatCorrigido = chat.map((msg, index) => {
                return {
                    id: msg.id || `chat_${Date.now()}_${index}`,
                    sender: msg.sender || msg.nome || "Usuário",
                    senderRole: msg.senderRole || msg.role || "OPERADOR",
                    senderMood: msg.senderMood || msg.mood || "😐",
                    senderUser: msg.senderUser || msg.user || "anonimo",
                    message: msg.message || "(mensagem vazia)",
                    time: msg.time || new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
                    timestamp: msg.timestamp || new Date().toISOString(),
                    date: msg.date || new Date().toLocaleDateString('pt-BR')
                };
            });
            
            localStorage.setItem('porter_chat', JSON.stringify(chatCorrigido));
            console.log(`✅ ${chatCorrigido.length} mensagens de chat corrigidas`);
        }
    },
    
    // 🔧 FUNÇÃO PARA ADICIONAR BOTÃO DE SINCRONIZAÇÃO VERCEL
    adicionarBotaoSincronizacaoVercel() {
        // Remover botão antigo se existir
        const btnAntigo = document.getElementById('btn-sync-vercel');
        if (btnAntigo) btnAntigo.remove();
        
        // Criar novo botão
        const btnSync = document.createElement('button');
        btnSync.id = 'btn-sync-vercel';
        btnSync.innerHTML = '🔄 Sincronizar Agora';
        btnSync.title = 'Atualizar dados com servidor central Vercel';
        
        btnSync.style.cssText = `
            position: fixed;
            bottom: 120px;
            right: 20px;
            background: linear-gradient(135deg, #00b09b 0%, #96c93d 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 30px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            font-family: 'Arial', sans-serif;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        // Efeitos hover
        btnSync.onmouseover = () => {
            btnSync.style.transform = 'scale(1.05)';
            btnSync.style.boxShadow = '0 8px 25px rgba(0,0,0,0.4)';
        };
        
        btnSync.onmouseout = () => {
            btnSync.style.transform = 'scale(1)';
            btnSync.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
        };
        
        // Ação do botão
        btnSync.onclick = () => {
            if (confirm("🔄 SINCRONIZAR COM SERVIDOR CENTRAL?\n\nIsso atualizará todos os dados com as informações mais recentes da equipe.")) {
                // Mostrar loading
                btnSync.innerHTML = '⏳ Sincronizando...';
                btnSync.disabled = true;
                
                // Sincronizar com Firebase se disponível
                if (typeof db !== 'undefined') {
                    Promise.all([
                        db.collection("atas").get(),
                        db.collection("chat_messages").orderBy("timestamp", "desc").limit(50).get(),
                        db.collection("ordens_servico").get()
                    ])
                    .then(([atasSnapshot, chatSnapshot, osSnapshot]) => {
                        // Atualizar ATAs
                        const atasServidor = [];
                        atasSnapshot.forEach(doc => {
                            const data = doc.data();
                            atasServidor.push({ 
                                id: doc.id, 
                                ...data,
                                // Garantir campos obrigatórios
                                condo: data.condo || "Não especificado",
                                desc: data.desc || "",
                                operador: data.operador || "Operador desconhecido"
                            });
                        });
                        localStorage.setItem('porter_atas', JSON.stringify(atasServidor));
                        
                        // Atualizar Chat
                        const chatServidor = [];
                        chatSnapshot.forEach(doc => {
                            const data = doc.data();
                            chatServidor.push({ 
                                id: doc.id, 
                                ...data,
                                // Garantir campos obrigatórios
                                sender: data.sender || "Usuário",
                                message: data.message || "(mensagem vazia)"
                            });
                        });
                        localStorage.setItem('porter_chat', JSON.stringify(chatServidor));
                        
                        // Atualizar OS
                        const osServidor = [];
                        osSnapshot.forEach(doc => {
                            osServidor.push({ id: doc.id, ...doc.data() });
                        });
                        localStorage.setItem('porter_os', JSON.stringify(osServidor));
                        
                        console.log(`✅ ${atasServidor.length} ATAs, ${chatServidor.length} mensagens e ${osServidor.length} OS sincronizadas`);
                        
                        // Recarregar dados
                        if (typeof app !== 'undefined') {
                            if (typeof app.renderAta === 'function') app.renderAta();
                            if (typeof app.loadChat === 'function') app.loadChat();
                            if (typeof app.renderOS === 'function') app.renderOS();
                        }
                        
                        // Restaurar botão
                        setTimeout(() => {
                            btnSync.innerHTML = '🔄 Sincronizado!';
                            setTimeout(() => {
                                btnSync.innerHTML = '🔄 Sincronizar Agora';
                                btnSync.disabled = false;
                            }, 2000);
                        }, 500);
                    })
                    .catch(err => {
                        console.error("❌ Erro na sincronização:", err);
                        btnSync.innerHTML = '❌ Erro!';
                        setTimeout(() => {
                            btnSync.innerHTML = '🔄 Sincronizar Agora';
                            btnSync.disabled = false;
                        }, 2000);
                    });
                } else {
                    // Se não houver Firebase, apenas recarrega a página
                    console.log("ℹ️ Firebase não disponível, recarregando página...");
                    location.reload();
                }
            }
        };
        
        document.body.appendChild(btnSync);
        console.log("✅ Botão de sincronização Vercel adicionado");
    },
    
    // 🆕 VERIFICAR SE FIREBASE ESTÁ FUNCIONANDO
    verificarFirebase() {
        if (window.db && typeof db.collection === 'function') {
            this.firebaseEnabled = true;
            console.log("✅ Firebase está habilitado!");
            
            // Testar conexão
            db.collection("conexao_teste").doc("teste").set({
                teste: "Conexão estabelecida",
                hora: new Date().toISOString()
            }).then(() => {
                console.log("✅ Conexão Firestore confirmada!");
                
                // Mostrar indicador visual
                const indicator = document.createElement('div');
                indicator.id = 'firebase-status';
                indicator.style.cssText = `
                    position: fixed;
                    bottom: 10px;
                    right: 10px;
                    background: #27ae60;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                `;
                indicator.innerHTML = '<i class="fas fa-cloud"></i> Online';
                document.body.appendChild(indicator);
                
                // 🔧 CONFIGURAR SINCRONIZAÇÃO AUTOMÁTICA
                this.configurarSincronizacaoAutomatica();
            }).catch(error => {
                console.warn("⚠️ Firebase conectado mas com erro:", error);
                this.firebaseEnabled = false;
            });
        } else {
            console.warn("⚠️ Firebase NÃO disponível. Usando localStorage.");
            this.firebaseEnabled = false;
        }
    },
    
    // 🔧 CONFIGURAR SINCRONIZAÇÃO AUTOMÁTICA
    configurarSincronizacaoAutomatica() {
        console.log("⚡ Configurando sincronização automática...");
        
        // Sincronizar a cada 2 minutos
        setInterval(() => {
            if (this.firebaseEnabled && navigator.onLine && this.currentUser) {
                console.log("🔄 Sincronização automática em andamento...");
                
                // Sincronizar ATAs
                db.collection("atas")
                    .orderBy("timestamp", "desc")
                    .limit(50)
                    .get()
                    .then(snapshot => {
                        const atasAtualizadas = [];
                        snapshot.forEach(doc => {
                            atasAtualizadas.push({ id: doc.id, ...doc.data() });
                        });
                        
                        localStorage.setItem('porter_atas', JSON.stringify(atasAtualizadas));
                        
                        // Atualizar interface se necessário
                        if (typeof app.renderAta === 'function') {
                            setTimeout(() => app.renderAta(), 500);
                        }
                    })
                    .catch(err => console.log("⚠️ Erro ao sincronizar ATAs:", err));
                    
                // Sincronizar Chat
                db.collection("chat_messages")
                    .orderBy("timestamp", "desc")
                    .limit(50)
                    .get()
                    .then(snapshot => {
                        const chatAtualizado = [];
                        snapshot.forEach(doc => {
                            chatAtualizado.push({ id: doc.id, ...doc.data() });
                        });
                        
                        localStorage.setItem('porter_chat', JSON.stringify(chatAtualizado));
                        
                        // Atualizar interface se necessário
                        if (typeof app.loadChat === 'function') {
                            setTimeout(() => app.loadChat(), 500);
                        }
                    })
                    .catch(err => console.log("⚠️ Erro ao sincronizar chat:", err));
            }
        }, 120000); // 2 minutos
        
        console.log("✅ Sincronização automática configurada (a cada 2 minutos)");
    },
    
    setupEventListeners() {
        // Enter no login
        const loginPass = document.getElementById('login-pass');
        if (loginPass) {
            loginPass.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.login();
            });
        }
        
        // Enter no chat
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendChatMessage();
                }
            });
        }
        
        // Salvar logoff quando a página for fechada
        window.addEventListener('beforeunload', () => {
            if (this.currentUser) {
                this.registrarLogoff();
            }
        });
        
        // Operadores online
        const onlineUsers = document.getElementById('online-users');
        if (onlineUsers) {
            onlineUsers.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleOnlineUsers();
            });
        }
    },
    
    setupAutoSave() {
        setInterval(() => {
            if (this.currentUser) {
                this.salvarSessao();
            }
        }, 30000);
    },
    
    setupResponsive() {
        window.addEventListener('resize', () => {
            if (this.currentUser) {
                const sidebar = document.getElementById('sidebar');
                if (sidebar) {
                    if (window.innerWidth > 1200) {
                        sidebar.style.display = 'block';
                        sidebar.classList.remove('show');
                    } else {
                        sidebar.style.display = 'none';
                    }
                }
            }
        });
    },
    
    setupOnlineTracking() {
        // Atualizar a cada 30 segundos
        this.onlineInterval = setInterval(() => {
            if (this.currentUser) {
                this.updateOnlineUsers();
            }
        }, 30000);
        
        // Inicializar imediamente
        this.updateOnlineUsers();
    },
    
    getMoodStatusTexto(mood) {
        const statusMap = {
            '😠': 'Zangado hoje',
            '😔': 'Triste hoje', 
            '😐': 'Neutro hoje',
            '🙂': 'Feliz hoje',
            '😄': 'Radiante hoje'
        };
        return statusMap[mood] || 'Não avaliado';
    },
    
    // 📋 FUNÇÃO ATUALIZADA: updateOnlineUsers CORRIGIDA - MOSTRA APENAS USUÁRIOS REAIS
    updateOnlineUsers() {
        if (!this.currentUser) return;
        
        const agora = new Date();
        
        // Buscar usuários realmente online do localStorage
        let usuariosOnline = [];
        
        // Adicionar usuário atual
        const moodAtual = this.getMoodAtual();
        const statusMood = this.getMoodStatusTexto(moodAtual);
        
        usuariosOnline.push({
            ...this.currentUser,
            lastActivity: agora.toISOString(),
            mood: moodAtual,
            moodStatus: statusMood,
            isCurrentUser: true
        });
        
        // Verificar se há outros usuários com sessão ativa (últimos 5 minutos)
        try {
            const sessaoSalva = localStorage.getItem('porter_last_session');
            if (sessaoSalva) {
                const sessao = JSON.parse(sessaoSalva);
                if (sessao.user !== this.currentUser.user) {
                    const tempoSessao = new Date(sessao.lastActivity);
                    const diferencaMinutos = (agora - tempoSessao) / (1000 * 60);
                    
                    if (diferencaMinutos < 5) {
                        // Este é um usuário que está "online"
                        const outroUsuario = DATA.funcionarios.find(f => f.user === sessao.user);
                        if (outroUsuario) {
                            usuariosOnline.push({
                                ...outroUsuario,
                                lastActivity: sessao.lastActivity,
                                mood: '😐', // Mood padrão para usuários não ativos
                                moodStatus: 'Online há ' + Math.floor(diferencaMinutos) + ' min',
                                isCurrentUser: false,
                                turno: sessao.turno || 'Diurno'
                            });
                        }
                    }
                }
            }
        } catch (e) {
            console.log('Erro ao buscar sessões:', e);
        }
        
        // 🔧 BUSCAR USUÁRIOS ONLINE DO FIREBASE
        if (this.firebaseEnabled) {
            this.buscarUsuariosOnlineFirebase().then(firebaseUsers => {
                firebaseUsers.forEach(fbUser => {
                    // Verificar se já está na lista
                    const jaExiste = usuariosOnline.some(u => u.user === fbUser.user);
                    if (!jaExiste) {
                        usuariosOnline.push({
                            ...fbUser,
                            isCurrentUser: fbUser.user === this.currentUser.user,
                            lastActivity: fbUser.lastActivity || new Date().toISOString()
                        });
                    }
                });
                
                this.onlineUsers = usuariosOnline;
                this.atualizarListaOnline();
            });
        } else {
            this.onlineUsers = usuariosOnline;
            this.atualizarListaOnline();
        }
        
        this.salvarSessao();
        
        // 🆕 SINCRONIZAR COM FIREBASE SE ESTIVER HABILITADO
        if (this.firebaseEnabled && this.currentUser) {
            this.sincronizarOnlineFirebase();
        }
    },
    
    // 🔧 BUSCAR USUÁRIOS ONLINE DO FIREBASE
    buscarUsuariosOnlineFirebase() {
        return new Promise((resolve) => {
            if (!this.firebaseEnabled) {
                resolve([]);
                return;
            }
            
            try {
                db.collection("operadores_online")
                    .where("online", "==", true)
                    .get()
                    .then(snapshot => {
                        const usuarios = [];
                        const agora = new Date();
                        
                        snapshot.forEach(doc => {
                            const data = doc.data();
                            // Verificar se está online há menos de 10 minutos
                            const lastActivity = data.lastActivity?.toDate ? data.lastActivity.toDate() : new Date();
                            const diferencaMinutos = (agora - lastActivity) / (1000 * 60);
                            
                            if (diferencaMinutos < 10) {
                                usuarios.push({
                                    user: data.user,
                                    nome: data.nome,
                                    role: data.role,
                                    turno: data.turno,
                                    mood: data.mood || '😐',
                                    lastActivity: lastActivity.toISOString(),
                                    online: true
                                });
                            }
                        });
                        
                        resolve(usuarios);
                    })
                    .catch(() => resolve([]));
            } catch (error) {
                console.warn("⚠️ Erro ao buscar usuários online do Firebase:", error);
                resolve([]);
            }
        });
    },
    
    // 🔧 ATUALIZAR LISTA ONLINE
    atualizarListaOnline() {
        // Atualizar contador
        const onlineCount = document.getElementById('online-count');
        if (onlineCount) {
            const usuariosReais = this.onlineUsers.filter(u => u.user !== this.currentUser?.user);
            if (usuariosReais.length === 0) {
                onlineCount.textContent = '1 (apenas você)';
                onlineCount.style.color = '#f39c12';
            } else {
                onlineCount.textContent = this.onlineUsers.length;
                onlineCount.style.color = '#2ecc71';
            }
        }
        
        // Se a lista estiver visível, atualizar
        const onlineList = document.getElementById('online-users-list');
        if (onlineList && onlineList.style.display === 'block') {
            this.renderOnlineUsersList();
        }
    },
    
    // 🆕 SINCRONIZAR STATUS ONLINE COM FIREBASE
    sincronizarOnlineFirebase() {
        if (!this.firebaseEnabled || !this.currentUser) return;
        
        try {
            const operadorRef = db.collection("operadores_online").doc(this.currentUser.user);
            
            operadorRef.set({
                nome: this.currentUser.nome,
                role: this.currentUser.role,
                user: this.currentUser.user,
                turno: this.currentUser.turno,
                mood: this.getMoodAtual(),
                online: true,
                lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
                loginDate: this.currentUser.loginDate,
                loginHour: this.currentUser.loginHour
            }, { merge: true }).then(() => {
                console.log("✅ Status online sincronizado com Firebase");
            }).catch(error => {
                console.warn("⚠️ Erro ao sincronizar status online:", error);
            });
        } catch (error) {
            console.warn("⚠️ Erro no Firebase durante sincronização:", error);
        }
    },
    
    // 📋 FUNÇÃO ATUALIZADA: renderOnlineUsersList CORRIGIDA
    renderOnlineUsersList() {
        const list = document.getElementById('online-users-list');
        if (!list) return;
        
        // Limpar lista anterior
        list.innerHTML = '';
        
        if (this.onlineUsers.length === 0) {
            list.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #666;">
                    <i class="fas fa-user-slash" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Nenhum operador online</p>
                    <small style="font-size: 0.8rem;">Você está conectado, mas não há outros operadores ativos.</small>
                </div>
            `;
            return;
        }
        
        // Ordenar: admin primeiro, depois por nome
        const usuariosOrdenados = [...this.onlineUsers].sort((a, b) => {
            if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
            if (b.role === 'ADMIN' && a.role !== 'ADMIN') return 1;
            if (a.isCurrentUser && !b.isCurrentUser) return -1;
            if (!a.isCurrentUser && b.isCurrentUser) return 1;
            return a.nome.localeCompare(b.nome);
        });
        
        usuariosOrdenados.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'online-user-item';
            
            // Calcular tempo desde última atividade
            const tempoAtivo = user.lastActivity ? 
                this.formatarTempoAtivo(new Date(user.lastActivity)) : 
                'Agora mesmo';
            
            // Definir cor do status baseado no humor
            const statusColor = this.getCorPorMood(user.mood);
            
            userItem.innerHTML = `
                <div class="online-user-avatar" style="background: ${statusColor}; color: ${user.mood === '😐' ? '#333' : 'white'};">
                    ${user.mood || '😐'}
                </div>
                <div class="online-user-info">
                    <div class="online-user-name">
                        ${user.nome.split(' ')[0]}
                        ${user.role === 'ADMIN' ? ' 👑' : ''}
                        ${user.isCurrentUser ? '<span style="color: #3498db; font-size: 0.8rem;"> (Você)</span>' : ''}
                    </div>
                    <div class="online-user-role">
                        ${user.moodStatus || 'Online'}
                        <div style="font-size: 0.7rem; color: #888; margin-top: 2px;">
                            <i class="far fa-clock"></i> ${tempoAtivo}
                        </div>
                    </div>
                </div>
                <div class="online-status" style="background: ${user.isCurrentUser ? '#3498db' : '#2ecc71'};"></div>
            `;
            
            list.appendChild(userItem);
        });
        
        // Adicionar rodapé
        const rodape = document.createElement('div');
        rodape.style.cssText = `
            padding: 10px 15px;
            text-align: center;
            font-size: 0.8rem;
            color: #666;
            border-top: 1px solid #eee;
            background: #f8f9fa;
            border-radius: 0 0 10px 10px;
        `;
        rodape.innerHTML = `
            <i class="fas fa-users"></i> 
            ${this.onlineUsers.length} operador${this.onlineUsers.length > 1 ? 'es' : ''} online
            <br>
            <small style="font-size: 0.7rem; color: #999;">
                Atualizado: ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                ${this.firebaseEnabled ? '<br><i class="fas fa-cloud" style="color:#27ae60"></i> Sincronizado' : '<br><i class="fas fa-laptop" style="color:#f39c12"></i> Local'}
            </small>
        `;
        
        list.appendChild(rodape);
    },
    
    // 📋 FUNÇÃO ATUALIZADA: toggleOnlineUsers CORRIGIDA
    toggleOnlineUsers() {
        const list = document.getElementById('online-users-list');
        if (!list) return;
        
        const estaVisivel = list.style.display === 'block';
        
        // Fechar notificações se estiverem abertas
        const notificationsPanel = document.getElementById('notifications-panel');
        if (notificationsPanel) notificationsPanel.classList.remove('show');
        
        if (estaVisivel) {
            list.style.display = 'none';
        } else {
            // Atualizar lista ANTES de mostrar
            this.updateOnlineUsers();
            
            // Posicionar corretamente
            const dropdown = document.getElementById('online-users');
            if (dropdown) {
                const rect = dropdown.getBoundingClientRect();
                list.style.top = `${rect.bottom + 5}px`;
                list.style.right = '10px';
                list.style.left = 'auto';
                list.style.width = '300px';
            }
            
            list.style.display = 'block';
            list.style.zIndex = '10000';
            
            // Garantir que o conteúdo será renderizado
            this.renderOnlineUsersList();
        }
    },
    
    formatarTempoAtivo(dataAtividade) {
        const agora = new Date();
        const diferenca = agora - new Date(dataAtividade);
        const minutos = Math.floor(diferenca / (1000 * 60));
        
        if (minutos < 1) return 'Agora mesmo';
        if (minutos === 1) return 'Há 1 minuto';
        if (minutos < 60) return `Há ${minutos} minutos`;
        
        const horas = Math.floor(minutos / 60);
        if (horas === 1) return 'Há 1 hora';
        return `Há ${horas} horas`;
    },
    
    getCorPorMood(mood) {
        const cores = {
            '😠': '#ffeaa7',
            '😔': '#fd79a8', 
            '😐': '#dfe6e9',
            '🙂': '#a29bfe',
            '😄': '#55efc4'
        };
        return cores[mood] || '#e8f4fc';
    },
    
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.toggle('show');
    },
    
    registrarLogoff() {
        if (!this.currentUser) return;
        
        const logoffs = JSON.parse(localStorage.getItem('porter_logoffs') || '[]');
        const logoffData = {
            user: this.currentUser.user,
            nome: this.currentUser.nome,
            data: new Date().toLocaleDateString('pt-BR'),
            hora: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
            timestamp: new Date().toISOString(),
            turno: this.currentUser.turno
        };
        
        logoffs.unshift(logoffData);
        if (logoffs.length > 200) logoffs.pop();
        localStorage.setItem('porter_logoffs', JSON.stringify(logoffs));
        
        this.lastLogoffTime = new Date().toISOString();
        localStorage.setItem('porter_last_logoff', this.lastLogoffTime);
        
        // 🆕 REGISTRAR LOGOFF NO FIREBASE
        if (this.firebaseEnabled) {
            try {
                const operadorRef = db.collection("operadores_online").doc(this.currentUser.user);
                operadorRef.update({
                    online: false,
                    lastLogoff: firebase.firestore.FieldValue.serverTimestamp(),
                    logoffTime: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})
                }).catch(error => {
                    console.warn("⚠️ Erro ao registrar logoff no Firebase:", error);
                });
            } catch (error) {
                console.warn("⚠️ Erro no Firebase durante logoff:", error);
            }
        }
        
        // Limpar intervalos
        if (this.chatInterval) {
            clearInterval(this.chatInterval);
            this.chatInterval = null;
        }
        
        if (this.moodInterval) {
            clearInterval(this.moodInterval);
            this.moodInterval = null;
        }
        
        if (this.onlineInterval) {
            clearInterval(this.onlineInterval);
            this.onlineInterval = null;
        }
        
        // Limpar sessão do usuário atual
        localStorage.removeItem('porter_last_session');
    },
    
    salvarSessao() {
        if (!this.currentUser) return;
        
        const sessionData = {
            user: this.currentUser.user,
            nome: this.currentUser.nome,
            lastActivity: new Date().toISOString(),
            turno: this.currentUser.turno,
            role: this.currentUser.role
        };
        
        localStorage.setItem('porter_last_session', JSON.stringify(sessionData));
    },
    
    loadCondos() {
        const sidebarList = document.getElementById('condo-list');
        if (!sidebarList) return;
        
        sidebarList.innerHTML = '';
        
        const ataSelect = document.getElementById('ata-condo');
        const osSelect = document.getElementById('os-condo');
        const filterSelect = document.getElementById('filter-condo');
        const reportSelect = document.getElementById('report-condo');
        
        if (ataSelect) ataSelect.innerHTML = '<option value="">Selecione um condomínio...</option>';
        if (osSelect) osSelect.innerHTML = '<option value="">Selecione um condomínio...</option>';
        if (filterSelect) filterSelect.innerHTML = '<option value="">Todos os condomínios</option>';
        if (reportSelect) reportSelect.innerHTML = '<option value="">Todos os condomínios</option>';
        
        if (!DATA.condominios || !Array.isArray(DATA.condominios)) {
            console.error("❌ DATA.condominios não está definido ou não é um array");
            return;
        }
        
        DATA.condominios.sort((a,b) => a.n.localeCompare(b.n)).forEach(c => {
            const condoItem = document.createElement('div');
            condoItem.className = 'condo-item';
            condoItem.dataset.condo = c.n;
            condoItem.onclick = () => this.filtrarPorCondominio(c.n);
            
            condoItem.innerHTML = `
                <div class="condo-name">${c.n}</div>
                <div class="condo-badge" id="badge-${c.n.replace(/\s+/g, '-')}">0</div>
            `;
            sidebarList.appendChild(condoItem);
            
            [ataSelect, osSelect, filterSelect, reportSelect].forEach(select => {
                if (select) {
                    const opt = document.createElement('option');
                    opt.value = c.n;
                    opt.textContent = c.n;
                    select.appendChild(opt);
                }
            });
        });
    },
    
    loadFiltros() {
        const filterOperador = document.getElementById('filter-presenca-operador');
        if (!filterOperador) return;
        
        filterOperador.innerHTML = '<option value="">Todos os operadores</option>';
        
        if (!DATA.funcionarios || !Array.isArray(DATA.funcionarios)) {
            console.error("❌ DATA.funcionarios não está definido ou não é um array");
            return;
        }
        
        DATA.funcionarios.sort((a,b) => a.nome.localeCompare(b.nome)).forEach(f => {
            let opt = document.createElement('option');
            opt.value = f.nome;
            opt.textContent = f.nome;
            filterOperador.appendChild(opt);
        });
    },
    
    carregarMoodOptions() {
        const container = document.getElementById('mood-options');
        if (!container) return;
        
        const MOOD_OPTIONS = [
            { id: 1, label: "Zangado", color: "#e74c3c", status: "😠 Zangado", description: "Raiva ou tristeza profunda" },
            { id: 2, label: "Triste", color: "#e67e22", status: "😔 Triste", description: "Desânimo ou insatisfação" },
            { id: 3, label: "Neutro", color: "#f1c40f", status: "😐 Neutro", description: "Indiferente ou tédio" },
            { id: 4, label: "Feliz", color: "#2ecc71", status: "🙂 Feliz", description: "Bem-estar e satisfação" },
            { id: 5, label: "Radiante", color: "#27ae60", status: "😄 Radiante", description: "Felicidade plena e euforia" }
        ];
        
        container.innerHTML = '';
        
        MOOD_OPTIONS.forEach(mood => {
            const moodElement = document.createElement('div');
            moodElement.className = 'mood-option';
            moodElement.dataset.id = mood.id;
            moodElement.style.color = mood.color;
            moodElement.onclick = () => this.selecionarMood(mood.id);
            
            let svgContent = '';
            switch(mood.id) {
                case 1: svgContent = `<circle cx="18" cy="18" r="3" fill="${mood.color}" /><circle cx="32" cy="18" r="3" fill="${mood.color}" /><path d="M15 35 Q25 25 35 35" stroke="${mood.color}" stroke-width="3" fill="none" />`; break;
                case 2: svgContent = `<circle cx="18" cy="18" r="3" fill="${mood.color}" /><circle cx="32" cy="18" r="3" fill="${mood.color}" /><path d="M15 32 Q25 28 35 32" stroke="${mood.color}" stroke-width="3" fill="none" />`; break;
                case 3: svgContent = `<circle cx="18" cy="18" r="3" fill="${mood.color}" /><circle cx="32" cy="18" r="3" fill="${mood.color}" /><line x1="15" y1="30" x2="35" y2="30" stroke="${mood.color}" stroke-width="3" />`; break;
                case 4: svgContent = `<circle cx="18" cy="18" r="3" fill="${mood.color}" /><circle cx="32" cy="18" r="3" fill="${mood.color}" /><path d="M15 28 Q25 33 35 28" stroke="${mood.color}" stroke-width="3" fill="none" />`; break;
                case 5: svgContent = `<circle cx="18" cy="18" r="3" fill="${mood.color}" /><circle cx="32" cy="18" r="3" fill="${mood.color}" /><path d="M12 25 Q25 40 38 25" stroke="${mood.color}" stroke-width="3" fill="none" />`; break;
            }
            
            moodElement.innerHTML = `
                <div class="mood-face" style="border-color: ${mood.color}">
                    <svg viewBox="0 0 50 50">${svgContent}</svg>
                </div>
                <div class="mood-label">${mood.label}</div>
                <div class="mood-description">${mood.description}</div>
            `;
            container.appendChild(moodElement);
        });
    },
    
    selecionarMood(moodId) {
        const MOOD_OPTIONS = [
            { id: 1, status: "😠 Zangado" },
            { id: 2, status: "😔 Triste" },
            { id: 3, status: "😐 Neutro" },
            { id: 4, status: "🙂 Feliz" },
            { id: 5, status: "😄 Radiante" }
        ];
        
        this.selectedMood = MOOD_OPTIONS.find(m => m.id === moodId);
        
        document.querySelectorAll('.mood-option').forEach(el => {
            el.classList.remove('selected');
        });
        
        const selectedElement = document.querySelector(`.mood-option[data-id="${moodId}"]`);
        if (selectedElement) {
            selectedElement.classList.add('selected');
        }
        
        const moodStatus = document.getElementById('mood-status');
        if (moodStatus) {
            moodStatus.innerHTML = `
                <i class="fas fa-check-circle" style="color: ${selectedElement ? selectedElement.style.color : '#000'}"></i>
                <span>Selecionado: <strong>${this.selectedMood.status}</strong></span>
            `;
        }
        
        const submitBtn = document.getElementById('mood-submit-btn');
        if (submitBtn) submitBtn.disabled = false;
    },
    
    enviarMood() {
        if (!this.selectedMood || !this.currentUser) return;
        
        const hoje = new Date();
        const dataISO = hoje.toISOString().split('T')[0];
        
        let moods = JSON.parse(localStorage.getItem('porter_moods') || '[]');
        const indexExistente = moods.findIndex(m => m.user === this.currentUser.user && m.dataISO === dataISO);
        
        const moodData = {
            user: this.currentUser.user,
            nome: this.currentUser.nome,
            moodStatus: this.selectedMood.status,
            data: hoje.toLocaleDateString('pt-BR'),
            dataISO: dataISO,
            hora: hoje.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
            turno: this.currentUser.turno,
            timestamp: hoje.toISOString()
        };
        
        if (indexExistente !== -1) {
            moods[indexExistente] = moodData;
        } else {
            moods.unshift(moodData);
        }
        
        if (moods.length > 500) moods = moods.slice(0, 500);
        localStorage.setItem('porter_moods', JSON.stringify(moods));
        
        // 🆕 SINCRONIZAR COM FIREBASE
        if (this.firebaseEnabled) {
            this.sincronizarMoodFirebase(moodData);
        }
        
        const resultDiv = document.getElementById('mood-result');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <strong>Sentimento registrado com sucesso!</strong>
                <span>${this.selectedMood.status}</span>
            `;
            resultDiv.classList.remove('hidden');
        }
        
        const submitBtn = document.getElementById('mood-submit-btn');
        if (submitBtn) submitBtn.disabled = true;
        
        // Atualizar lista de online
        this.updateOnlineUsers();
        
        // Atualizar a área do usuário
        this.updateUserInfo();
        
        setTimeout(() => {
            if (resultDiv) resultDiv.classList.add('hidden');
            this.verificarMoodHoje();
        }, 5000);
    },
    
    // 🆕 SINCRONIZAR MOOD COM FIREBASE
    sincronizarMoodFirebase(moodData) {
        if (!this.firebaseEnabled) return;
        
        try {
            const moodRef = db.collection("moods").doc(`${moodData.user}_${moodData.dataISO}`);
            
            moodRef.set({
                ...moodData,
                firebaseTimestamp: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }).then(() => {
                console.log("✅ Mood sincronizado com Firebase");
            }).catch(error => {
                console.warn("⚠️ Erro ao sincronizar mood:", error);
            });
        } catch (error) {
            console.warn("⚠️ Erro no Firebase durante sincronização do mood:", error);
        }
    },
    
    verificarMoodHoje() {
        if (!this.currentUser) return;
        
        const hojeISO = new Date().toISOString().split('T')[0];
        const moods = JSON.parse(localStorage.getItem('porter_moods') || '[]');
        const jaAvaliouHoje = moods.some(m => m.user === this.currentUser.user && m.dataISO === hojeISO);
        
        if (jaAvaliouHoje) {
            setTimeout(() => {
                const moodContainer = document.getElementById('mood-check-container');
                if (moodContainer) moodContainer.classList.add('hidden');
            }, 2000);
        }
    },
    
    getMoodAtual() {
        if (!this.currentUser) return '😐';
        
        const hojeISO = new Date().toISOString().split('T')[0];
        const moods = JSON.parse(localStorage.getItem('porter_moods') || '[]');
        const moodHoje = moods.find(m => m.user === this.currentUser.user && m.dataISO === hojeISO);
        
        return moodHoje ? moodHoje.moodStatus.split(' ')[0] : '😐';
    },
    
    updateCity() {
        const condoName = document.getElementById('ata-condo').value;
        const condo = DATA.condominios.find(c => c.n === condoName);
        const cidadeInput = document.getElementById('ata-cidade');
        if (cidadeInput) cidadeInput.value = condo ? condo.c : "";
    },
    
    updateCityOS() {
        const condoName = document.getElementById('os-condo').value;
        const condo = DATA.condominios.find(c => c.n === condoName);
        const cidadeInput = document.getElementById('os-cidade');
        if (cidadeInput) cidadeInput.value = condo ? condo.c : "";
    },
    
    login() {
        const u = document.getElementById('login-user').value.trim();
        const p = document.getElementById('login-pass').value;
        const t = document.getElementById('login-turno').value;

        if (!DATA.funcionarios || !Array.isArray(DATA.funcionarios)) {
            alert('Erro no sistema: Dados de funcionários não disponíveis.');
            return;
        }

        const user = DATA.funcionarios.find(f => f.user === u && f.pass === p);

        if (user) {
            this.currentUser = { 
                ...user, 
                turno: t, 
                loginTime: new Date().toLocaleString('pt-BR'),
                loginTimestamp: new Date().toISOString(),
                loginDate: new Date().toLocaleDateString('pt-BR'),
                loginHour: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})
            };
            localStorage.setItem('porter_session', JSON.stringify(this.currentUser));
            
            // Registrar login
            let presencas = JSON.parse(localStorage.getItem('porter_presencas') || '[]');
            presencas.unshift({
                nome: user.nome,
                turno: t,
                data: new Date().toLocaleDateString('pt-BR'),
                hora: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
                timestamp: new Date().toISOString(),
                dataISO: new Date().toISOString().split('T')[0],
                tipo: 'login'
            });
            
            if (presencas.length > 100) presencas = presencas.slice(0, 100);
            localStorage.setItem('porter_presencas', JSON.stringify(presencas));
            
            this.showApp();
        } else {
            alert('Credenciais inválidas! Verifique usuário e senha.');
        }
    },
    
    showApp() {
        // Transição suave
        const loginScreen = document.getElementById('login-screen');
        const mainContent = document.getElementById('main-content');
        
        if (loginScreen) loginScreen.classList.add('hidden');
        if (mainContent) mainContent.classList.remove('hidden');
        
        // MOSTRAR SIDEBAR APÓS LOGIN
        const sidebar = document.getElementById('sidebar');
        if (sidebar && window.innerWidth > 1200) {
            sidebar.style.display = 'block';
        }
        
        this.updateUserInfo();
        
        this.carregarMoodOptions();
        const jaAvaliou = this.jaAvaliouHoje();
        if (!jaAvaliou) {
            const moodContainer = document.getElementById('mood-check-container');
            if (moodContainer) moodContainer.classList.remove('hidden');
        }
        
        this.renderAll();
        this.updateNotificationBadges();
        this.salvarSessao();
        
        // 🆕 ATUALIZAR OPERADORES ONLINE IMEDIATAMENTE
        this.updateOnlineUsers();
        
        // Se for admin, mostrar controles
        const adminControls = document.getElementById('admin-controls');
        if (adminControls && this.currentUser.role === 'ADMIN') {
            adminControls.style.display = 'flex';
        }
        
        // Iniciar chat
        this.loadChat();
        this.chatInterval = setInterval(() => this.loadChat(), 5000);
        
        // Iniciar tracking de online
        this.setupOnlineTracking();
        
        // 🆕 Inicializar visto por
        this.registrarVisualizacaoChat();
        
        // 🔧 CORRIGIR DADOS DE ATAS SE NECESSÁRIO
        setTimeout(() => {
            this.corrigirDadosAtas();
        }, 2000);
    },
    
    // 🔧 CORRIGIR DADOS DE ATAS
    corrigirDadosAtas() {
        console.log("🔧 Corrigindo dados de ATAs...");
        
        try {
            const atas = JSON.parse(localStorage.getItem('porter_atas') || '[]');
            
            if (atas.length > 0) {
                const atasCorrigidas = atas.map((ata, index) => {
                    // Garantir que cada ATA tenha todos os campos obrigatórios
                    const ataCorrigida = {
                        id: ata.id || `vercel_${Date.now()}_${index}`,
                        condo: ata.condo || "Não especificado",
                        cidade: ata.cidade || "",
                        tipo: ata.tipo || "Ocorrência",
                        status: ata.status || "Em andamento",
                        desc: ata.desc || "",
                        operador: ata.operador || "Operador desconhecido",
                        user: ata.user || JSON.parse(localStorage.getItem('porter_session') || '{}').user || "admin",
                        turno: ata.turno || "Diurno",
                        data: ata.data || new Date().toLocaleDateString('pt-BR'),
                        dataISO: ata.dataISO || new Date().toISOString().split('T')[0],
                        hora: ata.hora || new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
                        timestamp: ata.timestamp || new Date().toISOString(),
                        comentarios: Array.isArray(ata.comentarios) ? ata.comentarios : [],
                        fixa: ata.fixa || false
                    };
                    
                    // Copiar outros campos
                    Object.keys(ata).forEach(key => {
                        if (!ataCorrigida.hasOwnProperty(key)) {
                            ataCorrigida[key] = ata[key];
                        }
                    });
                    
                    return ataCorrigida;
                });
                
                localStorage.setItem('porter_atas', JSON.stringify(atasCorrigidas));
                console.log(`✅ ${atasCorrigidas.length} ATAs corrigidas`);
                
                // Renderizar ATAs novamente
                if (typeof this.renderAta === 'function') {
                    setTimeout(() => this.renderAta(), 500);
                }
            }
        } catch (error) {
            console.error("❌ Erro ao corrigir ATAs:", error);
        }
    },
    
    updateUserInfo() {
        const userInfo = document.getElementById('user-info');
        if (userInfo && this.currentUser) {
            const moodAtual = this.getMoodAtual();
            userInfo.innerHTML = `
                <div class="user-info-name">
                    <span style="font-size: 1.2rem; margin-right: 5px;">${moodAtual}</span>
                    <strong>${this.currentUser.nome.split(' ')[0]}</strong>
                </div>
                <div class="user-info-time">
                    <i class="far fa-calendar"></i> ${this.currentUser.loginDate}
                    <i class="far fa-clock"></i> ${this.currentUser.loginHour}
                </div>
                <div class="user-info-role">
                    ${this.currentUser.turno} | ${this.currentUser.role}
                </div>
            `;
        }
    },
    
    jaAvaliouHoje() {
        if (!this.currentUser) return true;
        
        const hojeISO = new Date().toISOString().split('T')[0];
        const moods = JSON.parse(localStorage.getItem('porter_moods') || '[]');
        return moods.some(m => m.user === this.currentUser.user && m.dataISO === hojeISO);
    },
    
    logout() {
        if (confirm('Deseja realmente sair do sistema?')) {
            this.registrarLogoff();
            
            // Limpar intervalos primeiro
            if (this.chatInterval) {
                clearInterval(this.chatInterval);
                this.chatInterval = null;
            }
            
            if (this.moodInterval) {
                clearInterval(this.moodInterval);
                this.moodInterval = null;
            }
            
            if (this.onlineInterval) {
                clearInterval(this.onlineInterval);
                this.onlineInterval = null;
            }
            
            // Limpar sessão
            localStorage.removeItem('porter_session');
            localStorage.removeItem('porter_last_session');
            
            this.currentUser = null;
            
            // Esconder aplicação
            const mainContent = document.getElementById('main-content');
            if (mainContent) mainContent.classList.add('hidden');
            
            // Mostrar login com transição suave
            const loginScreen = document.getElementById('login-screen');
            if (loginScreen) loginScreen.classList.remove('hidden');
            
            // Resetar formulário de login
            const loginUser = document.getElementById('login-user');
            const loginPass = document.getElementById('login-pass');
            if (loginUser) loginUser.value = '';
            if (loginPass) loginPass.value = '';
            
            this.showMessage('Logoff realizado com sucesso!', 'success');
        }
    },
    
    switchTab(tabId, btn) {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        const tabElement = document.getElementById(tabId);
        if (tabElement) tabElement.classList.remove('hidden');
        if (btn) btn.classList.add('active');
        
        // Se for a aba de chat, carregar mensagens e marcar como visualizado
        if (tabId === 'tab-chat') {
            this.loadChat();
            this.marcarChatComoVisualizado();
        }
    },
    
    updateTabCounts() {
        const atas = JSON.parse(localStorage.getItem('porter_atas') || '[]');
        const fixas = atas.filter(a => a.tipo && a.tipo.includes('Informações Fixas'));
        const os = JSON.parse(localStorage.getItem('porter_os') || '[]');
        
        const tabCountAta = document.getElementById('tab-count-ata');
        const tabCountFixas = document.getElementById('tab-count-fixas');
        const tabCountOs = document.getElementById('tab-count-os');
        
        if (tabCountAta) tabCountAta.textContent = atas.length;
        if (tabCountFixas) tabCountFixas.textContent = fixas.length;
        if (tabCountOs) tabCountOs.textContent = os.length;
        
        // 🆕 Usar função atualizarBadgeChat
        this.atualizarBadgeChat();
    },
    
    atualizarBadgeChat() {
        const chat = JSON.parse(localStorage.getItem('porter_chat') || '[]');
        const ultimaVisualizacao = localStorage.getItem('porter_chat_last_view') || '0';
        const ultimaVisualizacaoTime = parseInt(ultimaVisualizacao);
        
        const mensagensNaoVisualizadas = chat.filter(msg => {
            if (!msg.timestamp) return false;
            const msgTime = new Date(msg.timestamp).getTime();
            return msgTime > ultimaVisualizacaoTime;
        }).length;
        
        const badge = document.getElementById('chat-badge');
        
        if (badge) {
            if (mensagensNaoVisualizadas > 0) {
                badge.textContent = mensagensNaoVisualizadas > 99 ? '99+' : mensagensNaoVisualizadas;
                badge.style.display = 'inline-block';
                
                const chatTab = document.querySelector('.chat-tab');
                if (chatTab) {
                    chatTab.classList.add('has-new-message');
                }
            } else {
                badge.textContent = '0';
                badge.style.display = 'none';
                const chatTab = document.querySelector('.chat-tab');
                if (chatTab) {
                    chatTab.classList.remove('has-new-message');
                }
            }
        }
        
        return mensagensNaoVisualizadas;
    },
    
    marcarChatComoVisualizado() {
        localStorage.setItem('porter_chat_last_view', Date.now().toString());
        this.atualizarBadgeChat();
        this.registrarVisualizacaoChat();
    },
    
    registrarVisualizacaoChat() {
        if (!this.currentUser) return;
        
        const visualizacoes = JSON.parse(localStorage.getItem('porter_chat_views') || '{}');
        const agora = Date.now();
        
        visualizacoes[this.currentUser.user] = {
            nome: this.currentUser.nome,
            hora: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
            data: new Date().toLocaleDateString('pt-BR'),
            timestamp: agora,
            mood: this.getMoodAtual()
        };
        
        Object.keys(visualizacoes).forEach(user => {
            if (agora - visualizacoes[user].timestamp > 60 * 60 * 1000) {
                delete visualizacoes[user];
            }
        });
        
        localStorage.setItem('porter_chat_views', JSON.stringify(visualizacoes));
    },

    obterVisualizacoesRecentes() {
        const visualizacoes = JSON.parse(localStorage.getItem('porter_chat_views') || '{}');
        const agora = Date.now();
        const cincoMinutos = 5 * 60 * 1000;
        
        const visualizacoesRecentes = Object.entries(visualizacoes)
            .filter(([user, data]) => agora - data.timestamp <= cincoMinutos)
            .map(([user, data]) => ({
                user,
                ...data
            }));
        
        return visualizacoesRecentes;
    },
    
    aplicarFiltrosAtas() {
        this.filtrosAtas = {
            condo: document.getElementById('filter-condo')?.value || '',
            dataInicio: document.getElementById('filter-data-inicio')?.value || '',
            dataFim: document.getElementById('filter-data-fim')?.value || '',
            tipo: document.getElementById('filter-tipo')?.value || '',
            status: document.getElementById('filter-status')?.value || ''
        };
        
        localStorage.setItem('porter_filtros_atas', JSON.stringify(this.filtrosAtas));
        this.mostrarFiltrosAtivosAtas();
        this.renderAta();
    },
    
    limparFiltrosAtas() {
        const hoje = new Date();
        const umaSemanaAtras = new Date();
        umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);
        
        const filterCondo = document.getElementById('filter-condo');
        const filterDataInicio = document.getElementById('filter-data-inicio');
        const filterDataFim = document.getElementById('filter-data-fim');
        const filterTipo = document.getElementById('filter-tipo');
        const filterStatus = document.getElementById('filter-status');
        
        if (filterCondo) filterCondo.value = '';
        if (filterDataInicio) filterDataInicio.value = umaSemanaAtras.toISOString().split('T')[0];
        if (filterDataFim) filterDataFim.value = hoje.toISOString().split('T')[0];
        if (filterTipo) filterTipo.value = '';
        if (filterStatus) filterStatus.value = '';
        
        this.filtrosAtas = { condo: '', dataInicio: '', dataFim: '', tipo: '', status: '' };
        localStorage.removeItem('porter_filtros_atas');
        this.mostrarFiltrosAtivosAtas();
        this.renderAta();
        this.showMessage('Filtros limpos!', 'success');
    },
    
    filtrarPorCondominio(condoName) {
        const filterCondo = document.getElementById('filter-condo');
        if (filterCondo) filterCondo.value = condoName;
        this.currentCondoFilter = condoName;
        this.aplicarFiltrosAtas();
        
        // Destacar item na sidebar
        document.querySelectorAll('.condo-item').forEach(item => {
            item.classList.remove('active');
        });
        const condoItem = document.querySelector(`.condo-item[data-condo="${condoName}"]`);
        if (condoItem) {
            condoItem.classList.add('active');
        }
        
        // Fechar sidebar em mobile
        if (window.innerWidth <= 1200) {
            this.toggleSidebar();
        }
    },
    
    aplicarFiltrosPresenca() {
        this.filtrosPresenca = {
            operador: document.getElementById('filter-presenca-operador')?.value || '',
            dataInicio: document.getElementById('filter-presenca-inicio')?.value || '',
            dataFim: document.getElementById('filter-presenca-fim')?.value || '',
            turno: document.getElementById('filter-presenca-turno')?.value || ''
        };
        
        localStorage.setItem('porter_filtros_presenca', JSON.stringify(this.filtrosPresenca));
        this.renderPresenca();
    },
    
    limparFiltrosPresenca() {
        const hoje = new Date();
        const umaSemanaAtras = new Date();
        umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);
        
        const filterOperador = document.getElementById('filter-presenca-operador');
        const filterInicio = document.getElementById('filter-presenca-inicio');
        const filterFim = document.getElementById('filter-presenca-fim');
        const filterTurno = document.getElementById('filter-presenca-turno');
        
        if (filterOperador) filterOperador.value = '';
        if (filterInicio) filterInicio.value = umaSemanaAtras.toISOString().split('T')[0];
        if (filterFim) filterFim.value = hoje.toISOString().split('T')[0];
        if (filterTurno) filterTurno.value = '';
        
        this.filtrosPresenca = { operador: '', dataInicio: '', dataFim: '', turno: '' };
        localStorage.removeItem('porter_filtros_presenca');
        this.renderPresenca();
        this.showMessage('Filtros limpos!', 'success');
    },
    
    carregarFiltrosSalvos() {
        const filtrosAtasSalvos = localStorage.getItem('porter_filtros_atas');
        if (filtrosAtasSalvos) {
            this.filtrosAtas = JSON.parse(filtrosAtasSalvos);
            const filterCondo = document.getElementById('filter-condo');
            const filterDataInicio = document.getElementById('filter-data-inicio');
            const filterDataFim = document.getElementById('filter-data-fim');
            const filterTipo = document.getElementById('filter-tipo');
            const filterStatus = document.getElementById('filter-status');
            
            if (filterCondo) filterCondo.value = this.filtrosAtas.condo || '';
            if (filterDataInicio) filterDataInicio.value = this.filtrosAtas.dataInicio || '';
            if (filterDataFim) filterDataFim.value = this.filtrosAtas.dataFim || '';
            if (filterTipo) filterTipo.value = this.filtrosAtas.tipo || '';
            if (filterStatus) filterStatus.value = this.filtrosAtas.status || '';
        }
        
        const filtrosPresencaSalvos = localStorage.getItem('porter_filtros_presenca');
        if (filtrosPresencaSalvos) {
            this.filtrosPresenca = JSON.parse(filtrosPresencaSalvos);
            const filterOperador = document.getElementById('filter-presenca-operador');
            const filterInicio = document.getElementById('filter-presenca-inicio');
            const filterFim = document.getElementById('filter-presenca-fim');
            const filterTurno = document.getElementById('filter-presenca-turno');
            
            if (filterOperador) filterOperador.value = this.filtrosPresenca.operador || '';
            if (filterInicio) filterInicio.value = this.filtrosPresenca.dataInicio || '';
            if (filterFim) filterFim.value = this.filtrosPresenca.dataFim || '';
            if (filterTurno) filterTurno.value = this.filtrosPresenca.turno || '';
        }
    },
    
    mostrarFiltrosAtivosAtas() {
        const container = document.getElementById('filtros-ativos-ata');
        if (!container) return;
        
        const filtros = [];
        
        if (this.filtrosAtas.condo) filtros.push(`Condomínio: ${this.filtrosAtas.condo}`);
        if (this.filtrosAtas.dataInicio) filtros.push(`De: ${this.formatarDataBR(this.filtrosAtas.dataInicio)}`);
        if (this.filtrosAtas.dataFim) filtros.push(`Até: ${this.formatarDataBR(this.filtrosAtas.dataFim)}`);
        if (this.filtrosAtas.tipo) filtros.push(`Tipo: ${this.filtrosAtas.tipo}`);
        if (this.filtrosAtas.status) filtros.push(`Status: ${this.filtrosAtas.status}`);
        
        if (filtros.length > 0) {
            container.innerHTML = `<strong>Filtros ativos:</strong> ${filtros.join(' | ')}`;
        } else {
            container.innerHTML = 'Nenhum filtro ativo';
        }
    },
    
    formatarDataBR(dataISO) {
        if (!dataISO) return '';
        const [ano, mes, dia] = dataISO.split('-');
        return `${dia}/${mes}/${ano}`;
    },
    
    setupOSPreview() {
        const gravidadeSelect = document.getElementById('os-gravidade');
        if (gravidadeSelect) {
            gravidadeSelect.addEventListener('change', function() {
                app.atualizarPreviewGravidade(this.value);
            });
            this.atualizarPreviewGravidade(gravidadeSelect.value);
        }
    },
    
    atualizarPreviewGravidade(gravidade) {
        const previewDiv = document.getElementById('os-preview-prioridade');
        if (!previewDiv) return;
        
        const previewTexto = document.getElementById('os-preview-gravidade');
        const previewIcone = document.getElementById('os-preview-icone');
        const previewPrazo = document.getElementById('os-preview-prazo');
        
        const configs = {
            'Baixa': {
                texto: '🟢 GRAVIDADE BAIXA',
                icone: 'fa-info-circle',
                cor: '#27ae60',
                prazo: 'Prazo: 7 dias úteis'
            },
            'Média': {
                texto: '🟡 GRAVIDADE MÉDIA', 
                icone: 'fa-exclamation-circle',
                cor: '#f39c12',
                prazo: 'Prazo: 3 dias úteis'
            },
            'Alta': {
                texto: '🔴 GRAVIDADE ALTA',
                icone: 'fa-exclamation-triangle',
                cor: '#e74c3c',
                prazo: 'Prazo: 24 horas'
            },
            'Emergência': {
                texto: '🚨 EMERGÊNCIA',
                icone: 'fa-bell',
                cor: '#8b0000',
                prazo: 'Prazo: 4 horas - ATENÇÃO MÁXIMA'
            }
        };
        
        const config = configs[gravidade] || configs['Média'];
        
        if (previewTexto) previewTexto.textContent = config.texto;
        if (previewTexto) previewTexto.style.color = config.cor;
        if (previewIcone) previewIcone.innerHTML = `<i class="fas ${config.icone}" style="color: ${config.cor}"></i>`;
        if (previewPrazo) previewPrazo.textContent = config.prazo;
        previewDiv.style.display = 'block';
        previewDiv.style.borderLeft = `4px solid ${config.cor}`;
    },
    
    calcularPrazoPorGravidade(gravidade) {
        const prazos = {
            'Baixa': '7 dias úteis',
            'Média': '3 dias úteis', 
            'Alta': '24 horas',
            'Emergência': '4 horas'
        };
        return prazos[gravidade] || '3 dias úteis';
    },

    getCorGravidade(gravidade) {
        const cores = {
            'Baixa': '#27ae60',
            'Média': '#f39c12',
            'Alta': '#e74c3c',
            'Emergência': '#8b0000'
        };
        return cores[gravidade] || '#666';
    },

    getIconeGravidade(gravidade) {
        const icones = {
            'Baixa': 'fa-info-circle',
            'Média': 'fa-exclamation-circle',
            'Alta': 'fa-exclamation-triangle',
            'Emergência': 'fa-bell'
        };
        return icones[gravidade] || 'fa-circle';
    },
    
    saveAta() {
        const condo = document.getElementById('ata-condo')?.value;
        const desc = document.getElementById('ata-desc')?.value.trim();
        const tipo = document.getElementById('ata-tipo')?.value;
        
        if (!condo || !desc) {
            alert('Preencha todos os campos obrigatórios! (Condomínio e Descrição)');
            return;
        }

        const novaAta = {
            id: Date.now(),
            condo,
            cidade: document.getElementById('ata-cidade')?.value || "",
            tipo: tipo || "Ocorrência",
            status: document.getElementById('ata-status')?.value || "Em andamento",
            desc,
            operador: this.currentUser.nome,
            user: this.currentUser.user,
            turno: this.currentUser.turno,
            data: new Date().toLocaleDateString('pt-BR'),
            dataISO: new Date().toISOString().split('T')[0],
            hora: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
            timestamp: new Date().toISOString(),
            comentarios: [],
            fixa: tipo && tipo.includes('Informações Fixas')
        };

        let atas = JSON.parse(localStorage.getItem('porter_atas') || '[]');
        atas.unshift(novaAta);
        if (atas.length > 200) atas = atas.slice(0, 200);
        localStorage.setItem('porter_atas', JSON.stringify(atas));
        
        // 🆕 SINCRONIZAR COM FIREBASE
        if (this.firebaseEnabled) {
            this.sincronizarAtaFirebase(novaAta);
        }
        
        this.criarNotificacao(condo, tipo, desc);
        
        // Limpar formulário
        const ataDesc = document.getElementById('ata-desc');
        const ataCondo = document.getElementById('ata-condo');
        const ataCidade = document.getElementById('ata-cidade');
        if (ataDesc) ataDesc.value = "";
        if (ataCondo) ataCondo.value = "";
        if (ataCidade) ataCidade.value = "";
        
        this.showMessage('Registro salvo com sucesso!', 'success');
        this.renderAll();
        this.updateNotificationBadges();
    },
    
    // 🆕 SINCRONIZAR ATA COM FIREBASE
    sincronizarAtaFirebase(ataData) {
        if (!this.firebaseEnabled) return;
        
        try {
            const ataRef = db.collection("atas").doc(ataData.id.toString());
            
            const firebaseAta = {
                ...ataData,
                firebaseTimestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Remover o campo id para evitar duplicação
            delete firebaseAta.id;
            
            ataRef.set(firebaseAta, { merge: true }).then(() => {
                console.log("✅ ATA sincronizada com Firebase");
            }).catch(error => {
                console.warn("⚠️ Erro ao sincronizar ATA:", error);
            });
        } catch (error) {
            console.warn("⚠️ Erro no Firebase durante sincronização da ATA:", error);
        }
    },
    
    criarNotificacao(condo, tipo, desc) {
        const notificacao = {
            id: Date.now(),
            condo: condo || "Não especificado",
            tipo: tipo || "Ocorrência",
            desc: desc ? (desc.length > 100 ? desc.substring(0, 100) + '...' : desc) : "Sem descrição",
            data: new Date().toLocaleDateString('pt-BR'),
            hora: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
            timestamp: new Date().toISOString(),
            lida: false
        };
        
        let notificacoes = JSON.parse(localStorage.getItem('porter_notificacoes') || '[]');
        notificacoes.unshift(notificacao);
        if (notificacoes.length > 50) notificacoes.pop();
        localStorage.setItem('porter_notificacoes', JSON.stringify(notificacoes));
        
        if (tipo === 'Ordem de Serviço') {
            this.criarNotificacaoChat(`Nova OS criada em ${condo}: ${desc ? desc.substring(0, 80) + '...' : 'Sem descrição'}`);
        }
        
        this.loadNotifications();
    },
    
    criarNotificacaoChat(texto) {
        let notificacoes = JSON.parse(localStorage.getItem('porter_notificacoes') || '[]');
        const notificacao = {
            id: Date.now(),
            condo: 'Chat Geral',
            tipo: 'chat',
            desc: texto || "Nova mensagem no chat",
            data: new Date().toLocaleDateString('pt-BR'),
            hora: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
            timestamp: new Date().toISOString(),
            lida: false
        };
        
        notificacoes.unshift(notificacao);
        if (notificacoes.length > 50) notificacoes.pop();
        localStorage.setItem('porter_notificacoes', JSON.stringify(notificacoes));
        this.loadNotifications();
    },
    
    criarNotificacaoChatComAcao(chatMessage) {
        const notificacao = {
            id: Date.now(),
            condo: 'Chat Geral',
            tipo: 'chat_mensagem',
            desc: `Nova mensagem de ${chatMessage.sender}: ${chatMessage.message ? (chatMessage.message.substring(0, 50) + (chatMessage.message.length > 50 ? '...' : '')) : 'Sem mensagem'}`,
            data: new Date().toLocaleDateString('pt-BR'),
            hora: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
            timestamp: new Date().toISOString(),
            lida: false,
            acao: {
                tipo: 'ir_para_chat',
                mensagemId: chatMessage.id,
                sender: chatMessage.sender
            },
            destaque: true
        };
        
        let notificacoes = JSON.parse(localStorage.getItem('porter_notificacoes') || '[]');
        notificacoes.unshift(notificacao);
        
        if (notificacoes.length > 50) notificacoes.pop();
        localStorage.setItem('porter_notificacoes', JSON.stringify(notificacoes));
        
        this.loadNotifications();
        this.updateNotificationBadges();
        this.atualizarBadgeChat();
    },
    
    loadNotifications() {
        const notificacoes = JSON.parse(localStorage.getItem('porter_notificacoes') || '[]');
        this.notifications = notificacoes;
        
        const list = document.getElementById('notifications-list');
        if (!list) return;
        
        list.innerHTML = '';
        
        if (notificacoes.length === 0) {
            list.innerHTML = `
                <div class="notification-item">
                    <div style="text-align: center; color: var(--gray); padding: 2rem;">
                        <i class="fas fa-bell-slash" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                        <p>Nenhuma notificação</p>
                    </div>
                </div>
            `;
            return;
        }
        
        notificacoes.forEach(notif => {
            const item = document.createElement('div');
            item.className = `notification-item ${notif.lida ? '' : 'unread'} ${notif.destaque ? 'destaque' : ''}`;
            item.dataset.tipo = notif.tipo;
            
            item.onclick = (e) => {
                e.stopPropagation();
                this.processarNotificacao(notif);
            };
            
            let icon = '📝';
            if (notif.tipo === 'chat_mensagem') icon = '💬';
            if (notif.tipo && notif.tipo.includes('Ocorrência')) icon = '⚠️';
            if (notif.tipo && notif.tipo.includes('Incidente')) icon = '🚨';
            if (notif.tipo && notif.tipo.includes('Fixas')) icon = '📌';
            if (notif.tipo === 'chat') icon = '💬';
            if (notif.tipo === 'Ordem de Serviço') icon = '🔧';
            if (notif.tipo === 'email') icon = '📧';
            
            const acaoRapida = notif.tipo === 'chat_mensagem' && notif.acao?.mensagemId ? 
                `<button class="btn btn-sm btn-success" style="margin-top: 8px; padding: 4px 10px; font-size: 0.8rem;" 
                        onclick="app.irParaChatAgora(event, ${notif.acao.mensagemId})">
                    <i class="fas fa-comment"></i> Ver no Chat
                </button>` : '';
            
            item.innerHTML = `
                <div class="notification-condo">${icon} ${notif.condo || 'Não especificado'}</div>
                <div style="margin: 5px 0;">${notif.desc || 'Sem descrição'}</div>
                <div class="notification-time">${notif.data || ''} ${notif.hora || ''}</div>
                ${acaoRapida}
            `;
            list.appendChild(item);
        });
        
        this.updateNotificationBadges();
    },
    
    processarNotificacao(notificacao) {
        this.marcarNotificacaoComoLida(notificacao.id);
        
        if (notificacao.acao) {
            switch(notificacao.acao.tipo) {
                case 'ir_para_chat':
                    this.irParaChat(notificacao.acao.mensagemId);
                    break;
            }
        }
        
        const panel = document.getElementById('notifications-panel');
        if (panel) panel.classList.remove('show');
    },
    
    irParaChat(mensagemId = null) {
        const chatTabBtn = document.querySelector('.chat-tab');
        if (chatTabBtn) {
            this.switchTab('tab-chat', chatTabBtn);
        } else {
            const chatTab = document.querySelector('.tab-btn.chat-tab');
            if (chatTab) {
                this.switchTab('tab-chat', chatTab);
            }
        }
        
        this.loadChat();
        this.marcarChatComoVisualizado();
        
        if (mensagemId) {
            setTimeout(() => {
                this.destacarMensagemChat(mensagemId);
            }, 500);
        }
        
        setTimeout(() => {
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                chatInput.focus();
            }
        }, 300);
    },
    
    irParaChatAgora(event, mensagemId) {
        event.stopPropagation();
        event.preventDefault();
        this.irParaChat(mensagemId);
    },
    
    updateNotificationBadges() {
        const notificacoes = JSON.parse(localStorage.getItem('porter_notificacoes') || '[]');
        const naoLidas = notificacoes.filter(n => !n.lida).length;
        
        const badge = document.getElementById('notification-count');
        if (badge) {
            if (naoLidas > 0) {
                badge.textContent = naoLidas > 99 ? '99+' : naoLidas;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
        
        // Atualizar badges dos condomínios
        if (DATA.condominios && Array.isArray(DATA.condominios)) {
            DATA.condominios.forEach(condo => {
                const condoNotificacoes = notificacoes.filter(n => n.condo === condo.n && !n.lida);
                const condoBadge = document.getElementById(`badge-${condo.n.replace(/\s+/g, '-')}`);
                if (condoBadge) {
                    if (condoNotificacoes.length > 0) {
                        condoBadge.textContent = condoNotificacoes.length > 9 ? '9+' : condoNotificacoes.length;
                        condoBadge.classList.add('has-notification');
                    } else {
                        condoBadge.classList.remove('has-notification');
                    }
                }
            });
        }
        
        this.updateTabCounts();
    },
    
    toggleNotifications() {
        const panel = document.getElementById('notifications-panel');
        if (!panel) return;
        
        const estaAberto = panel.classList.contains('show');
        
        if (!estaAberto) {
            this.marcarTodasNotificacoesComoLidas();
        }
        
        panel.classList.toggle('show');
    },
    
    marcarTodasNotificacoesComoLidas() {
        let notificacoes = JSON.parse(localStorage.getItem('porter_notificacoes') || '[]');
        notificacoes = notificacoes.map(notif => ({ ...notif, lida: true }));
        localStorage.setItem('porter_notificacoes', JSON.stringify(notificacoes));
        this.loadNotifications();
    },
    
    marcarNotificacaoComoLida(id) {
        let notificacoes = JSON.parse(localStorage.getItem('porter_notificacoes') || '[]');
        const index = notificacoes.findIndex(n => n.id === id);
        if (index !== -1) {
            notificacoes[index].lida = true;
            localStorage.setItem('porter_notificacoes', JSON.stringify(notificacoes));
            this.loadNotifications();
        }
    },
    
    clearNotifications() {
        localStorage.removeItem('porter_notificacoes');
        this.loadNotifications();
    },
    
    adicionarComentario(ataId, texto) {
        if (!texto.trim()) return;
        
        let atas = JSON.parse(localStorage.getItem('porter_atas') || '[]');
        const index = atas.findIndex(a => a.id === ataId);
        
        if (index !== -1) {
            if (!atas[index].comentarios) atas[index].comentarios = [];
            
            atas[index].comentarios.unshift({
                id: Date.now(),
                autor: this.currentUser.nome,
                user: this.currentUser.user,
                texto: texto,
                data: new Date().toLocaleDateString('pt-BR'),
                hora: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
                timestamp: new Date().toISOString()
            });
            
            localStorage.setItem('porter_atas', JSON.stringify(atas));
            this.renderAta();
            this.renderFixas();
            this.showMessage('Comentário adicionado!', 'success');
        }
    },
    
    abrirComentarios(ataId) {
        let atas = JSON.parse(localStorage.getItem('porter_atas') || '[]');
        const ata = atas.find(a => a.id === ataId);
        
        if (!ata) return;
        
        const modalContent = document.getElementById('comments-modal-content');
        if (!modalContent) return;
        
        modalContent.innerHTML = `
            <h4><i class="fas fa-building"></i> ${ata.condo || 'Não especificado'} - ${ata.data || ''} ${ata.hora || ''}</h4>
            <div style="margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 8px; border-left: 4px solid var(--accent);">
                <strong><i class="fas fa-align-left"></i> Descrição:</strong>
                <p style="white-space: pre-wrap; margin-top: 8px; padding: 10px; background: white; border-radius: 6px;">${ata.desc || 'Sem descrição'}</p>
            </div>
            
            <div class="comment-form">
                <h5><i class="fas fa-edit"></i> Adicionar Comentário</h5>
                <textarea 
                    id="novo-comentario-texto" 
                    placeholder="Digite seu comentário aqui..." 
                    rows="4"
                    data-ata-id="${ataId}"
                ></textarea>
                <button class="btn btn-primary" onclick="app.adicionarComentarioModal(${ataId})" style="align-self: flex-end;">
                    <i class="fas fa-paper-plane"></i> Enviar Comentário
                </button>
            </div>
            
            <div class="comments-title" style="margin-top: 2rem;">
                <i class="fas fa-comments"></i> Comentários (${ata.comentarios ? ata.comentarios.length : 0})
            </div>
            
            <div class="comment-list" id="modal-comment-list">
                ${ata.comentarios && ata.comentarios.length > 0 ? 
                    ata.comentarios.map(c => `
                        <div class="comment-item">
                            <div class="comment-header">
                                <span class="comment-author">
                                    <i class="fas fa-user"></i> ${c.autor || 'Usuário'}
                                </span>
                                <span class="comment-time">${c.data || ''} ${c.hora || ''}</span>
                            </div>
                            <div class="comment-text">${c.texto || ''}</div>
                        </div>
                    `).join('') : 
                    '<p style="text-align: center; color: var(--gray); padding: 2rem; background: #f8f9fa; border-radius: 8px;">Nenhum comentário ainda. Seja o primeiro a comentar!</p>'
                }
            </div>
        `;
        
        const modal = document.getElementById('comments-modal');
        if (modal) modal.classList.add('show');
        
        setTimeout(() => {
            const campoTexto = document.getElementById('novo-comentario-texto');
            if (campoTexto) campoTexto.focus();
        }, 300);
    },
    
    adicionarComentarioModal(ataId) {
        const textoInput = document.getElementById('novo-comentario-texto');
        if (!textoInput) return;
        
        const texto = textoInput.value.trim();
        if (!texto) {
            alert('Por favor, digite um comentário antes de enviar!');
            textoInput.focus();
            return;
        }
        
        this.adicionarComentario(ataId, texto);
        textoInput.value = '';
        this.closeCommentsModal();
        setTimeout(() => {
            this.abrirComentarios(ataId);
        }, 300);
    },
    
    closeCommentsModal() {
        const modal = document.getElementById('comments-modal');
        if (modal) modal.classList.remove('show');
    },
    
    renderFixas() {
        const list = document.getElementById('fixas-lista');
        if (!list) return;
        
        const atas = JSON.parse(localStorage.getItem('porter_atas') || '[]');
        const fixas = atas.filter(a => a.fixa);
        
        if (fixas.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-thumbtack"></i>
                    <h3>Nenhuma informação fixa</h3>
                    <p>Para criar uma informação fixa, selecione "Informações Fixas" no tipo de registro.</p>
                </div>
            `;
            return;
        }
        
        list.innerHTML = '';
        
        fixas.forEach(a => {
            const podeExcluir = this.currentUser && (this.currentUser.role === 'ADMIN' || a.user === this.currentUser.user);
            const card = document.createElement('div');
            card.className = 'ata-card fixed fade-in';
            card.innerHTML = `
                <div class="ata-header">
                    <span><i class="far fa-calendar"></i> ${a.data || ''} | <i class="far fa-clock"></i> ${a.hora || ''} | <i class="fas fa-user-clock"></i> Turno: ${a.turno || ''}</span>
                    <span class="status-badge status-fixo">
                        <i class="fas fa-thumbtack"></i> FIXA
                    </span>
                </div>
                <div class="ata-condo"><i class="fas fa-building"></i> ${a.condo || ''} ${a.cidade ? `(${a.cidade})` : ''}</div>
                <div class="ata-type fixed"><i class="fas fa-tag"></i> ${a.tipo || ''}</div>
                <div style="white-space: pre-wrap; margin: 15px 0; padding: 15px; background: #fff3cd30; border-radius: 6px; line-height: 1.5;">
                    ${a.desc || ''}
                </div>
                <div style="font-size: 0.85rem; color: #666; border-top: 1px solid #eee; padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <i class="fas fa-user-edit"></i> Operador: ${a.operador || ''}
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-info" onclick="app.abrirComentarios(${a.id})">
                            <i class="fas fa-comments"></i> Comentários (${a.comentarios ? a.comentarios.length : 0})
                        </button>
                        ${podeExcluir ? 
                            `<button class="btn btn-danger" onclick="app.deleteAta(${a.id})">
                                <i class="fas fa-trash"></i> Excluir
                            </button>` : 
                            '<span style="font-size: 0.8rem; color: var(--gray);"><i class="fas fa-lock"></i> Apenas autor/Admin</span>'
                        }
                    </div>
                </div>
            `;
            list.appendChild(card);
        });
    },
    
    saveOS() {
        const condo = document.getElementById('os-condo')?.value;
        const desc = document.getElementById('os-desc')?.value.trim();
        const gravidade = document.getElementById('os-gravidade')?.value;
        const data = document.getElementById('os-data')?.value;
        const emailsInput = document.getElementById('os-emails')?.value || '';
        
        if (!condo || !desc || !data) {
            alert('Preencha todos os campos obrigatórios! (Condomínio, Descrição e Data)');
            return;
        }

        const emails = emailsInput
            .split(',')
            .map(email => email.trim())
            .filter(email => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return email && emailRegex.test(email);
            });

        const novaOS = {
            id: Date.now(),
            condo,
            cidade: document.getElementById('os-cidade')?.value || "",
            gravidade: gravidade || "Média",
            desc,
            dataOS: data,
            data: new Date().toLocaleDateString('pt-BR'),
            dataISO: new Date().toISOString().split('T')[0],
            hora: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
            operador: this.currentUser.nome,
            user: this.currentUser.user,
            turno: this.currentUser.turno,
            emails: emails,
            status: 'Pendente',
            timestamp: new Date().toISOString(),
            prazoResposta: this.calcularPrazoPorGravidade(gravidade),
            corGravidade: this.getCorGravidade(gravidade),
            notificacoesEnviadas: 0
        };

        let osList = JSON.parse(localStorage.getItem('porter_os') || '[]');
        osList.unshift(novaOS);
        if (osList.length > 100) osList = osList.slice(0, 100);
        localStorage.setItem('porter_os', JSON.stringify(osList));
        
        // 🆕 SINCRONIZAR COM FIREBASE
        if (this.firebaseEnabled) {
            this.sincronizarOSFirebase(novaOS);
        }
        
        this.criarNotificacao(condo, 'Ordem de Serviço', `Nova OS: ${gravidade} - ${desc.substring(0, 50)}...`);
        
        const osDesc = document.getElementById('os-desc');
        const osCondo = document.getElementById('os-condo');
        const osCidade = document.getElementById('os-cidade');
        const osData = document.getElementById('os-data');
        const osEmails = document.getElementById('os-emails');
        
        if (osDesc) osDesc.value = "";
        if (osCondo) osCondo.value = "";
        if (osCidade) osCidade.value = "";
        if (osData) osData.value = new Date().toISOString().split('T')[0];
        if (osEmails) osEmails.value = "";
        
        this.showMessage('Ordem de Serviço salva com sucesso!', 'success');
        this.renderOS();
        this.updateNotificationBadges();
        
        if (emails.length > 0) {
            this.registrarEnvioDetalhadoOS(novaOS, emails);
            
            setTimeout(() => {
                this.showMessage(`✅ OS registrada! ${emails.length} e-mail(s) agendado(s)`, 'success');
                this.mostrarDetalhesEmailOS(novaOS, emails);
            }, 500);
        }
    },
    
    // 🆕 SINCRONIZAR OS COM FIREBASE
    sincronizarOSFirebase(osData) {
        if (!this.firebaseEnabled) return;
        
        try {
            const osRef = db.collection("ordens_servico").doc(osData.id.toString());
            
            const firebaseOS = {
                ...osData,
                firebaseTimestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Remover o campo id para evitar duplicação
            delete firebaseOS.id;
            
            osRef.set(firebaseOS, { merge: true }).then(() => {
                console.log("✅ OS sincronizada com Firebase");
            }).catch(error => {
                console.warn("⚠️ Erro ao sincronizar OS:", error);
            });
        } catch (error) {
            console.warn("⚠️ Erro no Firebase durante sincronização da OS:", error);
        }
    },
    
    registrarEnvioDetalhadoOS(osData, emails) {
        let historico = JSON.parse(localStorage.getItem('porter_os_emails') || '[]');
        
        const registro = {
            id: Date.now(),
            os_id: osData.id,
            data: new Date().toLocaleString('pt-BR'),
            destinatarios: emails,
            condo: osData.condo,
            gravidade: osData.gravidade,
            operador: this.currentUser.nome,
            assunto: `OS: ${osData.condo} - ${osData.gravidade} - ${osData.data}`,
            corpo: this.gerarCorpoEmailOS(osData)
        };
        
        historico.unshift(registro);
        if (historico.length > 50) historico.pop();
        localStorage.setItem('porter_os_emails', JSON.stringify(historico));
    },
    
    gerarCorpoEmailOS(osData) {
        return `========================================
ORDEM DE SERVIÇO - PORTER 2026
========================================

📋 INFORMAÇÕES DA OS
----------------------------------------
• Condomínio: ${osData.condo}
• Cidade: ${osData.cidade}
• Gravidade: ${osData.gravidade}
• Prazo: ${osData.prazoResposta || '3 dias úteis'}
• Data OS: ${new Date(osData.dataOS).toLocaleDateString('pt-BR')}

📅 DATAS E HORÁRIOS
----------------------------------------
• Criada em: ${osData.data} às ${osData.hora}
• Turno: ${osData.turno}

👤 RESPONSÁVEL
----------------------------------------
• Operador: ${osData.operador}
• Status: ${osData.status}

📝 DESCRIÇÃO DO SERVIÇO
----------------------------------------
${osData.desc}

========================================
ATA OPERACIONAL PORTER - 2026
E-mail automático - Não responda
========================================`;
    },
    
    mostrarDetalhesEmailOS(osData, emails) {
        const corpoEmail = this.gerarCorpoEmailOS(osData);
        
        const modalContent = `
            <div style="padding: 20px; max-width: 800px;">
                <h3><i class="fas fa-envelope"></i> Detalhes do E-mail da OS</h3>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <strong><i class="fas fa-paper-plane"></i> De:</strong> sistema@porter.com<br>
                    <strong><i class="fas fa-users"></i> Para:</strong> ${emails.join(', ')}<br>
                    <strong><i class="fas fa-tag"></i> Assunto:</strong> [PORTER OS] ${osData.gravidade} - ${osData.condo}
                </div>
                
                <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; 
                            margin: 15px 0; font-family: monospace; white-space: pre-wrap; 
                            max-height: 300px; overflow-y: auto;">
                    ${corpoEmail}
                </div>
                
                <div style="background: #e8f4fc; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <i class="fas fa-info-circle"></i> <strong>Nota:</strong> 
                    Em produção, este e-mail seria enviado automaticamente para todos os destinatários.
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button class="btn btn-primary" onclick="app.copiarConteudoEmail()">
                        <i class="fas fa-copy"></i> Copiar Conteúdo
                    </button>
                    <button class="btn btn-success" onclick="app.abrirClienteEmail('${osData.condo}', '${emails.join(',')}')">
                        <i class="fas fa-envelope-open"></i> Abrir no Cliente de E-mail
                    </button>
                    <button class="btn btn-clear" onclick="app.fecharModalEmail()">
                        Fechar
                    </button>
                </div>
            </div>
        `;
        
        this.criarModal('Detalhes do E-mail', modalContent);
    },
    
    criarModal(titulo, conteudo) {
        this.fecharModalEmail();
        
        const modal = document.createElement('div');
        modal.id = 'modal-email-detalhes';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); display: flex; align-items: center;
            justify-content: center; z-index: 9999; padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 12px; max-width: 900px;
                        width: 100%; max-height: 90vh; overflow-y: auto;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                <div style="padding: 20px; border-bottom: 1px solid #eee;">
                    <h3 style="margin: 0; display: flex; justify-content: space-between; align-items: center;">
                        ${titulo}
                        <button onclick="app.fecharModalEmail()" style="background: none; border: none;
                                font-size: 1.5rem; cursor: pointer; color: #666;">&times;</button>
                    </h3>
                </div>
                <div>${conteudo}</div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    fecharModalEmail() {
        const modal = document.getElementById('modal-email-detalhes');
        if (modal) modal.remove();
    },
    
    copiarConteudoEmail() {
        const modal = document.getElementById('modal-email-detalhes');
        const conteudo = modal?.querySelector('pre, .conteudo-email')?.innerText || '';
        
        if (conteudo) {
            navigator.clipboard.writeText(conteudo)
                .then(() => this.showMessage('Conteúdo copiado!', 'success'))
                .catch(() => {
                    const textarea = document.createElement('textarea');
                    textarea.value = conteudo;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    this.showMessage('Conteúdo copiado!', 'success');
                });
        }
    },
    
    abrirClienteEmail(condo, emails) {
        const assunto = encodeURIComponent(`[PORTER OS] ${condo}`);
        const corpo = encodeURIComponent(`Prezado,\n\nSegue Ordem de Serviço do condomínio ${condo}.\n\nAtenciosamente,\nSistema Porter`);
        
        window.open(`mailto:${emails}?subject=${assunto}&body=${corpo}`, '_blank');
        this.showMessage('Cliente de e-mail aberto! Preencha o corpo com os detalhes da OS.', 'info');
    },
    
    filtrarOSTodas() {
        this.renderOS();
    },
    
    filtrarOSGravidade(gravidade) {
        const osList = JSON.parse(localStorage.getItem('porter_os') || '[]');
        const filtradas = osList.filter(os => os.gravidade === gravidade);
        this.renderOSList(filtradas, `Filtradas por gravidade: ${gravidade}`);
    },
    
    renderOSList(osList, titulo = '') {
        const list = document.getElementById('os-lista');
        if (!list) return;
        
        if (osList.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tools"></i>
                    <h3>${titulo ? titulo : 'Nenhuma Ordem de Serviço'}</h3>
                    <p>${titulo ? 'Nenhuma OS encontrada com este filtro.' : 'Use o formulário acima para criar uma nova OS.'}</p>
                </div>
            `;
            return;
        }
        
        list.innerHTML = '';
        
        osList.forEach(os => {
            const podeExcluir = this.currentUser && (this.currentUser.role === 'ADMIN' || os.user === this.currentUser.user);
            const card = document.createElement('div');
            card.className = 'ata-card os fade-in';
            card.innerHTML = `
                <div class="ata-header">
                    <span><i class="far fa-calendar"></i> ${os.data || ''} | <i class="far fa-clock"></i> ${os.hora || ''}</span>
                    <span class="status-badge status-os" style="background: ${os.corGravidade || '#d6eaf8'};">
                        <i class="fas ${this.getIconeGravidade(os.gravidade)}"></i> ${os.gravidade || ''}
                    </span>
                </div>
                <div class="ata-condo"><i class="fas fa-building"></i> ${os.condo || ''} ${os.cidade ? `(${os.cidade})` : ''}</div>
                <div class="ata-type os">
                    <i class="fas fa-business-time"></i> Prazo: ${os.prazoResposta || '3 dias úteis'}
                </div>
                
                <div style="margin: 10px 0; padding: 8px 15px; background: ${os.corGravidade || '#d6eaf8'}20; 
                            border-left: 4px solid ${os.corGravidade || '#d6eaf8'}; border-radius: 6px;">
                    <strong><i class="fas fa-${this.getIconeGravidade(os.gravidade)}"></i> 
                    GRAVIDADE: ${(os.gravidade || '').toUpperCase()}</strong>
                    <div style="font-size: 0.85rem; margin-top: 5px;">
                        <i class="far fa-clock"></i> Prazo máximo: ${os.prazoResposta || ''}
                    </div>
                </div>
                
                ${os.emails && os.emails.length > 0 ? `
                    <div style="margin: 10px 0; padding: 10px; background: #e8f4fc; border-radius: 6px; 
                                border-left: 4px solid #3498db;">
                        <i class="fas fa-envelope"></i> <strong>E-mails agendados:</strong> 
                        ${os.emails.length} destinatário(s)
                        <button class="btn btn-sm btn-info" onclick="app.verDetalhesEmailOS(${os.id})" 
                                style="margin-left: 10px; padding: 2px 8px; font-size: 0.8rem;">
                            <i class="fas fa-eye"></i> Ver detalhes
                        </button>
                    </div>
                ` : ''}
                
                <div style="white-space: pre-wrap; margin: 15px 0; padding: 15px; background: #d6eaf820; border-radius: 6px; line-height: 1.5;">
                    ${os.desc || ''}
                </div>
                <div style="font-size: 0.85rem; color: #666; border-top: 1px solid #eee; padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <i class="fas fa-user-edit"></i> Operador: ${os.operador || ''}
                        ${os.emails && os.emails.length > 0 ? `<br><i class="fas fa-envelope"></i> ${os.emails.length} destinatário(s)` : ''}
                    </div>
                    ${podeExcluir ? 
                        `<button class="btn btn-danger" onclick="app.deleteOS(${os.id})">
                            <i class="fas fa-trash"></i> Excluir
                        </button>` : 
                        ''
                    }
                </div>
            `;
            list.appendChild(card);
        });
    },
    
    renderOS() {
        const osList = JSON.parse(localStorage.getItem('porter_os') || '[]');
        this.renderOSList(osList);
    },
    
    verDetalhesEmailOS(osId) {
        let osList = JSON.parse(localStorage.getItem('porter_os') || '[]');
        let historico = JSON.parse(localStorage.getItem('porter_os_emails') || '[]');
        
        const os = osList.find(o => o.id === osId);
        
        if (!os) return;
        
        const corpoEmail = this.gerarCorpoEmailOS(os);
        const emails = os.emails || [];
        
        const modalContent = `
            <div style="padding: 20px;">
                <h3><i class="fas fa-envelope"></i> E-mail da OS - ${os.condo || ''}</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                        <h4><i class="fas fa-info-circle"></i> Informações</h4>
                        <p><strong>Destinatários:</strong> ${emails.length}</p>
                        <p><strong>Gravidade:</strong> ${os.gravidade || ''}</p>
                        <p><strong>Data:</strong> ${os.data || ''} ${os.hora || ''}</p>
                    </div>
                    
                    <div style="background: #e8f4fc; padding: 15px; border-radius: 8px;">
                        <h4><i class="fas fa-users"></i> Destinatários</h4>
                        <div style="max-height: 100px; overflow-y: auto;">
                            ${emails.map(email => `<div>📧 ${email}</div>`).join('')}
                        </div>
                    </div>
                </div>
                
                <div style="margin: 20px 0;">
                    <h4><i class="fas fa-file-alt"></i> Conteúdo do E-mail</h4>
                    <div style="background: white; border: 1px solid #ddd; padding: 15px; 
                                border-radius: 6px; font-family: monospace; white-space: pre-wrap;
                                max-height: 300px; overflow-y: auto; margin-top: 10px;">
                        ${corpoEmail}
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button class="btn btn-primary" onclick="app.copiarConteudoEmail()">
                        <i class="fas fa-copy"></i> Copiar Conteúdo
                    </button>
                    <button class="btn btn-success" onclick="app.abrirClienteEmail('${os.condo}', '${emails.join(',')}')">
                        <i class="fas fa-envelope-open"></i> Abrir no Cliente de E-mail
                    </button>
                    <button class="btn btn-clear" onclick="app.fecharModalEmail()">
                        Fechar
                    </button>
                </div>
            </div>
        `;
        
        this.criarModal(`E-mail da OS - ${os.condo}`, modalContent);
    },
    
    deleteOS(id) {
        let osList = JSON.parse(localStorage.getItem('porter_os') || '[]');
        const os = osList.find(o => o.id === id);
        
        if (!os) {
            alert('Ordem de Serviço não encontrada.');
            return;
        }
        
        const ehAutor = os.user === this.currentUser.user;
        const ehAdmin = this.currentUser.role === 'ADMIN';
        
        if (!ehAdmin && !ehAutor) {
            alert('Apenas o autor ou administradores podem excluir esta Ordem de Serviço.');
            return;
        }
        
        if (confirm('Tem certeza que deseja excluir esta Ordem de Serviço?')) {
            osList = osList.filter(os => os.id !== id);
            localStorage.setItem('porter_os', JSON.stringify(osList));
            this.renderOS();
            this.showMessage('Ordem de Serviço excluída!', 'success');
        }
    },
    
    deleteAta(id) {
        let atas = JSON.parse(localStorage.getItem('porter_atas') || '[]');
        const ata = atas.find(a => a.id === id);
        
        if (!ata) {
            alert('Registro não encontrado.');
            return;
        }
        
        const ehAutor = ata.user === this.currentUser.user;
        const ehAdmin = this.currentUser.role === 'ADMIN';
        
        if (!ehAdmin && !ehAutor) {
            alert('Apenas o autor ou administradores podem excluir este registro.');
            return;
        }
        
        if (confirm('Tem certeza que deseja excluir este registro permanentemente?')) {
            let remocoes = JSON.parse(localStorage.getItem('porter_remocoes') || '[]');
            remocoes.unshift({
                id: Date.now(),
                tipo: ata.fixa ? 'Ata Fixa' : 'Ata',
                dados: ata,
                removidoPor: this.currentUser.nome,
                data: new Date().toLocaleDateString('pt-BR'),
                hora: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('porter_remocoes', JSON.stringify(remocoes));
            
            atas = atas.filter(a => a.id !== id);
            localStorage.setItem('porter_atas', JSON.stringify(atas));
            this.renderAll();
            this.showMessage('Registro excluído com sucesso!', 'success');
        }
    },
    
    openReportModal() {
        const modal = document.getElementById('report-modal');
        if (modal) modal.classList.add('show');
    },
    
    closeReportModal() {
        const modal = document.getElementById('report-modal');
        if (modal) modal.classList.remove('show');
    },
    
    generatePDF() {
        const condo = document.getElementById('report-condo')?.value || '';
        const dataInicio = document.getElementById('report-data-inicio')?.value || '';
        const dataFim = document.getElementById('report-data-fim')?.value || '';
        const tipo = document.getElementById('report-tipo')?.value || '';
        
        let dados = [];
        let titulo = '';
        
        if (tipo === 'atas' || tipo === 'all') {
            let atas = JSON.parse(localStorage.getItem('porter_atas') || '[]');
            if (condo) atas = atas.filter(a => a.condo === condo);
            if (dataInicio) atas = atas.filter(a => a.dataISO >= dataInicio);
            if (dataFim) atas = atas.filter(a => a.dataISO <= dataFim);
            
            if (tipo === 'atas') {
                dados = atas;
                titulo = 'Relatório de Ocorrências';
            } else {
                dados = dados.concat(atas.map(a => ({...a, tipoRegistro: 'Ocorrência'})));
            }
        }
        
        if (tipo === 'fixas' || tipo === 'all') {
            let atas = JSON.parse(localStorage.getItem('porter_atas') || '[]');
            let fixas = atas.filter(a => a.fixa);
            if (condo) fixas = fixas.filter(a => a.condo === condo);
            if (dataInicio) fixas = fixas.filter(a => a.dataISO >= dataInicio);
            if (dataFim) fixas = fixas.filter(a => a.dataISO <= dataFim);
            
            if (tipo === 'fixas') {
                dados = fixas;
                titulo = 'Relatório de Informações Fixas';
            } else {
                dados = dados.concat(fixas.map(a => ({...a, tipoRegistro: 'Informação Fixa'})));
            }
        }
        
        if (tipo === 'os' || tipo === 'all') {
            let osList = JSON.parse(localStorage.getItem('porter_os') || '[]');
            if (condo) osList = osList.filter(os => os.condo === condo);
            if (dataInicio) osList = osList.filter(os => os.dataISO >= dataInicio);
            if (dataFim) osList = osList.filter(os => os.dataISO <= dataFim);
            
            if (tipo === 'os') {
                dados = osList;
                titulo = 'Relatório de Ordens de Serviço';
            } else {
                dados = dados.concat(osList.map(os => ({...os, tipoRegistro: 'Ordem de Serviço'})));
            }
        }
        
        if (tipo === 'all') {
            titulo = 'Relatório Completo';
        }
        
        if (dados.length === 0) {
            alert('Nenhum registro encontrado para os filtros selecionados.');
            return;
        }
        
        // Verificar se jsPDF está disponível
        if (typeof jsPDF === 'undefined') {
            alert('Biblioteca de PDF não carregada. Recarregue a página.');
            return;
        }
        
        const doc = new jsPDF();
        
        // Cabeçalho
        doc.setFillColor(26, 58, 95);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text('PORTER', 105, 15, { align: 'center' });
        doc.setFontSize(12);
        doc.text('Ata Operacional - 2026', 105, 22, { align: 'center' });
        
        // Título do relatório
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.text(titulo, 105, 40, { align: 'center' });
        
        // Filtros aplicados
        doc.setFontSize(10);
        let filtrosTexto = `Condomínio: ${condo || 'Todos'} | Período: ${dataInicio || 'Início'} a ${dataFim || 'Fim'}`;
        doc.text(filtrosTexto, 105, 50, { align: 'center' });
        
        // Data de geração
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 105, 55, { align: 'center' });
        
        // Conteúdo
        let y = 70;
        dados.forEach((item, index) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(`${index + 1}. ${item.condo || ''}`, 10, y);
            doc.setFont(undefined, 'normal');
            
            y += 7;
            doc.setFontSize(10);
            doc.text(`Data: ${item.data || ''} ${item.hora || ''} | Tipo: ${item.tipoRegistro || item.tipo || ''}`, 10, y);
            y += 5;
            
            if (item.gravidade) {
                doc.text(`Gravidade: ${item.gravidade} | Prazo: ${item.prazoResposta || ''}`, 10, y);
                y += 5;
            }
            
            doc.text(`Operador: ${item.operador || ''} | Status: ${item.status || ''}`, 10, y);
            y += 5;
            
            const desc = item.desc || '';
            const descLines = doc.splitTextToSize(desc, 190);
            doc.text('Descrição:', 10, y);
            y += 5;
            descLines.forEach(line => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(line, 15, y);
                y += 5;
            });
            
            y += 10;
            
            if (index < dados.length - 1) {
                doc.setDrawColor(200, 200, 200);
                doc.line(10, y, 200, y);
                y += 5;
            }
        });
        
        // Rodapé
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Total de registros: ${dados.length}`, 105, 285, { align: 'center' });
        doc.text('Porter - Ata Operacional 2026', 105, 290, { align: 'center' });
        
        doc.save(`relatorio-porter-${new Date().toISOString().slice(0, 10)}.pdf`);
        this.closeReportModal();
        this.showMessage('Relatório gerado com sucesso!', 'success');
    },
    
    renderAll() {
        this.renderAta();
        this.renderFixas();
        this.renderOS();
        this.renderPresenca();
    },
    
    // 🔧 FUNÇÃO RENDERATA MELHORADA E DEFINITIVA
    renderAta() {
        console.log("🎯 Executando renderAta definitiva...");
        
        try {
            // Obter dados
            const atas = JSON.parse(localStorage.getItem('porter_atas') || '[]');
            
            // Filtrar apenas ATAs normais (não fixas)
            const atasNormais = atas.filter(a => !a.fixa);
            
            // Aplicar filtros
            let atasFiltradas = [...atasNormais];
            
            if (this.filtrosAtas.condo) {
                atasFiltradas = atasFiltradas.filter(a => a.condo === this.filtrosAtas.condo);
            }
            
            if (this.filtrosAtas.dataInicio) {
                atasFiltradas = atasFiltradas.filter(a => a.dataISO >= this.filtrosAtas.dataInicio);
            }
            
            if (this.filtrosAtas.dataFim) {
                atasFiltradas = atasFiltradas.filter(a => a.dataISO <= this.filtrosAtas.dataFim);
            }
            
            if (this.filtrosAtas.tipo) {
                atasFiltradas = atasFiltradas.filter(a => a.tipo === this.filtrosAtas.tipo);
            }
            
            if (this.filtrosAtas.status) {
                atasFiltradas = atasFiltradas.filter(a => a.status === this.filtrosAtas.status);
            }
            
            // Encontrar ou criar container
            let container = document.getElementById('ata-lista');
            
            if (!container) {
                console.log("📦 Container de ATAs não encontrado, criando...");
                container = document.createElement('div');
                container.id = 'ata-lista';
                container.className = 'ata-lista';
                
                // Adicionar onde for apropriado
                const atasSection = document.getElementById('tab-ata');
                if (atasSection) {
                    atasSection.appendChild(container);
                } else {
                    document.body.appendChild(container);
                }
            }
            
            // Atualizar informações
            const info = document.getElementById('resultados-info-ata');
            if (info) {
                const totalAtas = atasNormais.length;
                info.innerHTML = `
                    <div class="active-filters">
                        <i class="fas fa-chart-bar"></i> 
                        Mostrando ${atasFiltradas.length} de ${totalAtas} registros
                        ${this.filtrosAtas.condo ? `<span>Condomínio: ${this.filtrosAtas.condo}</span>` : ''}
                        ${this.filtrosAtas.dataInicio || this.filtrosAtas.dataFim ? `<span>Período: ${this.formatarDataBR(this.filtrosAtas.dataInicio)} a ${this.formatarDataBR(this.filtrosAtas.dataFim)}</span>` : ''}
                        ${this.filtrosAtas.tipo ? `<span>Tipo: ${this.filtrosAtas.tipo}</span>` : ''}
                        ${this.filtrosAtas.status ? `<span>Status: ${this.filtrosAtas.status}</span>` : ''}
                    </div>
                `;
            }
            
            // Se não há ATAs
            if (atasFiltradas.length === 0) {
                container.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-search"></i>
                        <h3>Nenhum registro encontrado</h3>
                        <p>${atasNormais.length === 0 ? 'Comece criando seu primeiro registro.' : 'Nenhum registro corresponde aos filtros aplicados.'}</p>
                    </div>
                `;
                return;
            }
            
            // Renderizar ATAs
            container.innerHTML = '';
            
            atasFiltradas.forEach(ata => {
                const podeExcluir = this.currentUser && (this.currentUser.role === 'ADMIN' || ata.user === this.currentUser.user);
                const card = document.createElement('div');
                card.className = 'ata-card fade-in';
                
                // Garantir dados seguros
                const ataSegura = {
                    condo: ata.condo || "Não especificado",
                    cidade: ata.cidade || "",
                    data: ata.data || "Data não informada",
                    hora: ata.hora || "",
                    tipo: ata.tipo || "Não especificado",
                    status: ata.status || "Ativo",
                    desc: ata.desc || "",
                    operador: ata.operador || "Operador desconhecido",
                    turno: ata.turno || "",
                    id: ata.id || Date.now(),
                    comentarios: ata.comentarios || []
                };
                
                card.innerHTML = `
                    <div class="ata-header">
                        <span><i class="far fa-calendar"></i> ${ataSegura.data} | <i class="far fa-clock"></i> ${ataSegura.hora} | <i class="fas fa-user-clock"></i> Turno: ${ataSegura.turno}</span>
                        <span class="status-badge ${ataSegura.status === 'Finalizado' ? 'status-finalizado' : 'status-andamento'}">
                            <i class="fas fa-${ataSegura.status === 'Finalizado' ? 'check-circle' : 'sync-alt'}"></i> ${ataSegura.status}
                        </span>
                    </div>
                    <div class="ata-condo"><i class="fas fa-building"></i> ${ataSegura.condo} ${ataSegura.cidade ? `(${ataSegura.cidade})` : ''}</div>
                    <div class="ata-type"><i class="fas fa-tag"></i> ${ataSegura.tipo}</div>
                    <div style="white-space: pre-wrap; margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 6px; line-height: 1.5;">
                        ${ataSegura.desc}
                    </div>
                    <div style="font-size: 0.85rem; color: #666; border-top: 1px solid #eee; padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <i class="fas fa-user-edit"></i> Operador: ${ataSegura.operador}
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-info" onclick="app.abrirComentarios(${ataSegura.id})">
                                <i class="fas fa-comments"></i> Comentários (${ataSegura.comentarios.length})
                            </button>
                            ${podeExcluir ? 
                                `<button class="btn btn-danger" onclick="app.deleteAta(${ataSegura.id})" title="Apenas autor ou admin pode excluir">
                                    <i class="fas fa-trash"></i> Excluir
                                </button>` : 
                                ''
                            }
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
            
            console.log(`✅ ${atasFiltradas.length} ATAs renderizadas`);
            this.mostrarFiltrosAtivosAtas();
            
        } catch (error) {
            console.error('❌ Erro em renderAta:', error);
            
            // Fallback
            const container = document.getElementById('ata-lista') || document.body;
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <h3>📋 ATAS DA EQUIPE</h3>
                    <p>${JSON.parse(localStorage.getItem('porter_atas') || '[]').filter(a => !a.fixa).length} ATAs disponíveis</p>
                    <p style="color: #f44336;">⚠️ Erro ao renderizar lista detalhada</p>
                    <button onclick="location.reload()" style="
                        background: #4CAF50;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        margin: 10px;
                    ">
                        🔄 Recarregar Página
                    </button>
                </div>
            `;
        }
    },
    
    renderPresenca() {
        const list = document.getElementById('presenca-lista');
        if (!list) return;
        
        let presencas = JSON.parse(localStorage.getItem('porter_presencas') || '[]');
        let logoffs = JSON.parse(localStorage.getItem('porter_logoffs') || '[]');
        
        let historico = [];
        
        presencas.forEach(p => {
            historico.push({
                ...p,
                tipo: 'login',
                tipoDisplay: 'Login'
            });
        });
        
        logoffs.forEach(l => {
            historico.push({
                ...l,
                tipo: 'logoff',
                tipoDisplay: 'Logoff'
            });
        });
        
        historico.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        if (this.filtrosPresenca.operador) {
            historico = historico.filter(p => p.nome === this.filtrosPresenca.operador);
        }
        
        if (this.filtrosPresenca.dataInicio) {
            historico = historico.filter(p => p.dataISO >= this.filtrosPresenca.dataInicio);
        }
        
        if (this.filtrosPresenca.dataFim) {
            historico = historico.filter(p => p.dataISO <= this.filtrosPresenca.dataFim);
        }
        
        if (this.filtrosPresenca.turno) {
            historico = historico.filter(p => p.turno === this.filtrosPresenca.turno);
        }
        
        historico = historico.slice(0, 50);
        
        if (historico.length === 0) {
            list.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 3rem; color: #888;">
                        <i class="fas fa-history" style="font-size: 2rem; display: block; margin-bottom: 1rem; color: #ddd;"></i>
                        Nenhum registro de histórico encontrado
                    </td>
                </tr>
            `;
            return;
        }
        
        list.innerHTML = historico.map(p => `
            <tr>
                <td><i class="fas fa-user-circle"></i> ${p.nome || ''}</td>
                <td><span style="padding: 4px 10px; background: ${p.turno === 'Diurno' ? '#fff3cd' : '#e8f4fc'}; border-radius: 4px;">${p.turno || ''}</span></td>
                <td>${p.data || ''}</td>
                <td>${p.tipo === 'login' ? `<i class="fas fa-sign-in-alt" style="color: #27ae60;"></i> ${p.hora || ''}` : ''}</td>
                <td>${p.tipo === 'logoff' ? `<i class="fas fa-sign-out-alt" style="color: #e74c3c;"></i> ${p.hora || ''}` : ''}</td>
            </tr>
        `).join('');
    },
    
    // 🔧 FUNÇÃO SENDCHATMESSAGE CORRIGIDA
    sendChatMessage() {
        const input = document.getElementById('chat-input');
        const message = input?.value.trim();
        
        if (!message) return;
        if (!this.currentUser) {
            alert('Você precisa estar logado para enviar mensagens.');
            return;
        }

        const sendBtn = document.getElementById('chat-send-btn');
        const originalHTML = sendBtn?.innerHTML || '';
        if (sendBtn) {
            sendBtn.innerHTML = '<div class="loading"></div>';
            sendBtn.disabled = true;
        }
        
        const chatMessage = {
            id: Date.now(),
            sender: this.currentUser.nome,
            senderRole: this.currentUser.role,
            senderMood: this.getMoodAtual(),
            senderUser: this.currentUser.user,
            message: message,
            time: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('pt-BR')
        };
        
        // ✅ SEMPRE salvar no localStorage primeiro
        let chat = JSON.parse(localStorage.getItem('porter_chat') || '[]');
        chat.unshift(chatMessage);
        if (chat.length > 100) chat = chat.slice(0, 100);
        localStorage.setItem('porter_chat', JSON.stringify(chat));
        
        // ✅ TENTAR salvar no Firebase também
        if (this.firebaseEnabled) {
            this.sincronizarChatFirebase(chatMessage)
                .then(() => {
                    console.log("✅ Mensagem sincronizada com Firebase");
                })
                .catch(error => {
                    console.log("⚠️ Mensagem salva apenas localmente:", error);
                });
        }
        
        this.criarNotificacaoChatComAcao(chatMessage);
        if (input) input.value = '';
        
        setTimeout(() => {
            if (sendBtn) {
                sendBtn.innerHTML = originalHTML;
                sendBtn.disabled = false;
            }
        }, 500);
        
        this.loadChat();
        this.updateTabCounts();
    },
    
    // 🔧 SINCRONIZAR CHAT COM FIREBASE (CORRIGIDO)
    sincronizarChatFirebase(chatMessage) {
        if (!this.firebaseEnabled) return Promise.reject("Firebase não habilitado");
        
        return new Promise((resolve, reject) => {
            try {
                const chatRef = db.collection("chat_messages").doc(chatMessage.id.toString());
                
                const firebaseMessage = {
                    ...chatMessage,
                    firebaseTimestamp: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                chatRef.set(firebaseMessage, { merge: true })
                    .then(() => {
                        resolve();
                    })
                    .catch(error => {
                        reject(error);
                    });
            } catch (error) {
                reject(error);
            }
        });
    },
    
    // 🔧 FUNÇÃO LOADCHAT CORRIGIDA
    loadChat() {
        const container = document.getElementById('chat-messages');
        if (!container) {
            console.log("❌ Container de chat não encontrado");
            return;
        }
        
        const chat = JSON.parse(localStorage.getItem('porter_chat') || '[]');
        
        // Corrigir dados do chat se necessário
        const chatCorrigido = chat.map(msg => {
            // Garantir que todos os campos obrigatórios existam
            return {
                id: msg.id || `chat_${Date.now()}`,
                sender: msg.sender || "Usuário",
                senderRole: msg.senderRole || "OPERADOR",
                senderMood: msg.senderMood || "😐",
                senderUser: msg.senderUser || "anonimo",
                message: msg.message || "(mensagem vazia)",
                time: msg.time || new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
                timestamp: msg.timestamp || new Date().toISOString(),
                date: msg.date || new Date().toLocaleDateString('pt-BR')
            };
        });
        
        // Atualizar localStorage com dados corrigidos
        localStorage.setItem('porter_chat', JSON.stringify(chatCorrigido));
        
        if (this.currentUser && this.currentUser.role === 'ADMIN') {
            const adminControls = document.getElementById('chat-admin-controls');
            if (adminControls) adminControls.style.display = 'flex';
        }
        
        if (chatCorrigido.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--gray);">
                    <i class="fas fa-comment-slash" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Nenhuma mensagem ainda. Seja o primeiro a enviar uma mensagem!</p>
                </div>
            `;
            
            this.mostrarVistoPor(container);
            return;
        }
        
        const chatOrdenado = [...chatCorrigido].sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
        );
        
        container.innerHTML = '';
        
        chatOrdenado.forEach(msg => {
            const isSent = msg.senderUser === this.currentUser?.user;
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${isSent ? 'sent' : 'received'}`;
            messageDiv.dataset.id = msg.id;
            
            messageDiv.innerHTML = `
                <div class="chat-message-header">
                    <span class="chat-message-sender">
                        <span style="font-size: 1.1rem; margin-right: 5px;">${msg.senderMood || '😐'}</span>
                        ${msg.sender} ${msg.senderRole === 'ADMIN' ? ' 👑' : ''}
                    </span>
                    <span class="chat-message-time">${msg.date} ${msg.time}</span>
                </div>
                <div class="chat-message-text">${msg.message}</div>
                ${this.currentUser && this.currentUser.role === 'ADMIN' && !isSent ? 
                    `<div style="margin-top: 5px; text-align: right;">
                        <button class="btn btn-danger btn-sm" onclick="app.deleteChatMessage(${msg.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>` : 
                    ''
                }
            `;
            
            container.appendChild(messageDiv);
        });
        
        this.mostrarVistoPor(container);
        container.scrollTop = container.scrollHeight;
        this.registrarVisualizacaoChat();
        this.atualizarBadgeChat();
        
        // 🔧 SINCRONIZAR COM FIREBASE
        if (this.firebaseEnabled) {
            this.sincronizarChatDoFirebase();
        }
    },
    
    // 🔧 SINCRONIZAR CHAT DO FIREBASE (CORRIGIDO)
    sincronizarChatDoFirebase() {
        if (!this.firebaseEnabled) return;
        
        try {
            db.collection("chat_messages")
                .orderBy("firebaseTimestamp", "desc")
                .limit(50)
                .get()
                .then(snapshot => {
                    if (snapshot.empty) {
                        return;
                    }
                    
                    let chatLocal = JSON.parse(localStorage.getItem('porter_chat') || '[]');
                    let atualizou = false;
                    
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        const msgId = parseInt(doc.id);
                        
                        // Verificar se já existe localmente
                        const existeLocal = chatLocal.some(msg => msg.id === msgId);
                        
                        if (!existeLocal && data.sender && data.message) {
                            // Adicionar mensagem do Firebase
                            chatLocal.unshift({
                                id: msgId,
                                sender: data.sender,
                                senderRole: data.senderRole,
                                senderMood: data.senderMood,
                                senderUser: data.senderUser,
                                message: data.message,
                                time: data.time,
                                date: data.date,
                                timestamp: data.timestamp || data.firebaseTimestamp?.toDate?.()?.toISOString() || new Date().toISOString()
                            });
                            atualizou = true;
                        }
                    });
                    
                    if (atualizou) {
                        // Manter limite de 100 mensagens
                        if (chatLocal.length > 100) {
                            chatLocal = chatLocal.slice(0, 100);
                        }
                        
                        localStorage.setItem('porter_chat', JSON.stringify(chatLocal));
                        console.log("🔄 Chat sincronizado com Firebase");
                        
                        // Atualizar interface
                        setTimeout(() => {
                            if (typeof this.loadChat === 'function') {
                                this.loadChat();
                            }
                        }, 500);
                    }
                })
                .catch(error => {
                    console.warn("⚠️ Erro ao sincronizar chat do Firebase:", error);
                });
        } catch (error) {
            console.warn("⚠️ Erro no Firebase durante sincronização do chat:", error);
        }
    },

    mostrarVistoPor(container) {
        const vistoPorDiv = document.createElement('div');
        vistoPorDiv.className = 'chat-visto-por';
        vistoPorDiv.style.cssText = `
            margin-top: 20px;
            padding: 10px 15px;
            background: #f8f9fa;
            border-radius: 8px;
            font-size: 0.85rem;
            color: #666;
            text-align: center;
            border-top: 1px solid #e0e0e0;
        `;
        
        const visualizacoes = this.obterVisualizacoesRecentes();
        
        if (visualizacoes.length > 0) {
            visualizacoes.sort((a, b) => b.timestamp - a.timestamp);
            
            const usuarios = visualizacoes.map(v => 
                `${v.nome.split(' ')[0]} ${v.mood}`
            ).join(', ');
            
            const ultimaVisualizacao = visualizacoes[0];
            const tempoUltima = this.formatarTempoAtivo(new Date(ultimaVisualizacao.timestamp));
            
            vistoPorDiv.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 5px;">
                    <i class="fas fa-eye" style="color: #3498db;"></i> 
                    <strong style="color: #1a3a5f;">Visto por:</strong>
                    <span>${usuarios}</span>
                </div>
                <div style="font-size: 0.75rem; color: #888;">
                    <i class="far fa-clock"></i> Última visualização: ${tempoUltima}
                    ${this.firebaseEnabled ? '<br><i class="fas fa-cloud" style="color:#27ae60"></i> Sincronizado' : '<br><i class="fas fa-laptop" style="color:#f39c12"></i> Local'}
                </div>
            `;
        } else {
            vistoPorDiv.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <i class="fas fa-eye-slash" style="color: #999;"></i> 
                    <span style="color: #999;">Ninguém viu o chat recentemente</span>
                </div>
            `;
        }
        
        container.appendChild(vistoPorDiv);
    },
    
    destacarMensagemChat(mensagemId) {
        const mensagens = document.querySelectorAll('.chat-message');
        mensagens.forEach(msg => {
            msg.classList.remove('mensagem-destacada');
            
            if (msg.dataset.id === String(mensagemId)) {
                msg.classList.add('mensagem-destacada');
                msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                setTimeout(() => {
                    msg.classList.remove('mensagem-destacada');
                }, 5000);
            }
        });
    },
    
    deleteChatMessage(id) {
        if (!this.currentUser || this.currentUser.role !== 'ADMIN') {
            alert('Apenas administradores podem excluir mensagens.');
            return;
        }
        
        if (confirm('Tem certeza que deseja excluir esta mensagem?')) {
            let chat = JSON.parse(localStorage.getItem('porter_chat') || '[]');
            chat = chat.filter(msg => msg.id !== id);
            localStorage.setItem('porter_chat', JSON.stringify(chat));
            this.loadChat();
            this.updateTabCounts();
        }
    },
    
    clearChat() {
        if (!this.currentUser || this.currentUser.role !== 'ADMIN') {
            alert('Apenas administradores podem limpar o chat.');
            return;
        }
        
        if (confirm('Tem certeza que deseja limpar todas as mensagens do chat?')) {
            localStorage.removeItem('porter_chat');
            this.loadChat();
            this.updateTabCounts();
            this.showMessage('Chat limpo com sucesso!', 'success');
        }
    },
    
    openAdminPanel() {
        const modalContent = document.getElementById('admin-modal-content');
        if (!modalContent) return;
        
        const sessions = JSON.parse(localStorage.getItem('porter_last_session') ? 
            [JSON.parse(localStorage.getItem('porter_last_session'))] : []);
        const operadoresLogados = DATA.funcionarios.filter(f => 
            sessions.some(s => s.user === f.user && 
                (new Date() - new Date(s.lastActivity)) < 300000));
        
        // Carregar histórico de e-mails
        const emailsHistory = JSON.parse(localStorage.getItem('porter_emails_history') || '[]');
        
        modalContent.innerHTML = `
            <h4><i class="fas fa-users"></i> Operadores Logados</h4>
            <div style="margin: 1rem 0; max-height: 200px; overflow-y: auto;">
                ${operadoresLogados.length > 0 ? 
                    operadoresLogados.map(op => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
                            <div>
                                <strong>${op.nome}</strong>
                                <div style="font-size: 0.8rem; color: #666;">${op.role}</div>
                            </div>
                            <button class="btn btn-danger btn-sm" onclick="app.forceLogoff('${op.user}')">
                                <i class="fas fa-sign-out-alt"></i> Deslogar
                            </button>
                        </div>
                    `).join('') : 
                    '<p style="text-align: center; color: #888; padding: 2rem;">Nenhum operador logado</p>'
                }
            </div>
            
            <h4 style="margin-top: 2rem;"><i class="fas fa-history"></i> Histórico de Remoções</h4>
            <div style="margin: 1rem 0; max-height: 200px; overflow-y: auto;">
                ${this.renderHistoricoRemocoes()}
            </div>
            
            <h4 style="margin-top: 2rem;"><i class="fas fa-envelope"></i> Histórico de E-mails Enviados</h4>
            <div style="margin: 1rem 0; max-height: 200px; overflow-y: auto;">
                ${this.renderHistoricoEmails(emailsHistory)}
            </div>
            
            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #eee;">
                <div style="margin-bottom: 15px; padding: 10px; background: ${this.firebaseEnabled ? '#d4edda' : '#f8d7da'}; border-radius: 6px;">
                    <strong>Status Firebase:</strong> ${this.firebaseEnabled ? '<span style="color: #155724;">✅ CONECTADO</span>' : '<span style="color: #721c24;">❌ DESCONECTADO</span>'}
                </div>
                <button class="btn btn-warning" onclick="app.exportBackup()">
                    <i class="fas fa-download"></i> Exportar Backup
                </button>
                <button class="btn btn-danger" onclick="app.clearAllData()" style="margin-left: 10px;">
                    <i class="fas fa-trash"></i> Limpar Todos os Dados
                </button>
            </div>
        `;
        
        const modal = document.getElementById('admin-modal');
        if (modal) modal.classList.add('show');
    },
    
    closeAdminModal() {
        const modal = document.getElementById('admin-modal');
        if (modal) modal.classList.remove('show');
    },
    
    renderHistoricoRemocoes() {
        const remocoes = JSON.parse(localStorage.getItem('porter_remocoes') || '[]');
        
        if (remocoes.length === 0) {
            return '<p style="text-align: center; color: #888; padding: 1rem;">Nenhuma remoção registrada</p>';
        }
        
        return remocoes.slice(0, 10).map(r => `
            <div style="padding: 8px; border-bottom: 1px solid #f0f0f0; font-size: 0.85rem;">
                <div><strong>${r.tipo || ''}</strong> - ${r.dados?.condo || 'N/A'}</div>
                <div style="color: #666;">Removido por: ${r.removidoPor || ''} | ${r.data || ''} ${r.hora || ''}</div>
            </div>
        `).join('');
    },
    
    renderHistoricoEmails(emailsHistory) {
        if (emailsHistory.length === 0) {
            return '<p style="text-align: center; color: #888; padding: 1rem;">Nenhum e-mail enviado</p>';
        }
        
        return emailsHistory.slice(0, 10).map(email => `
            <div style="padding: 8px; border-bottom: 1px solid #f0f0f0; font-size: 0.85rem; 
                        background: ${email.status === 'sent' || email.status === 'sent_simulation' ? '#d4edda' : '#f8d7da'}">
                <div>
                    <strong>${email.subject || 'Sem assunto'}</strong>
                    <span style="float: right; color: ${email.status === 'sent' || email.status === 'sent_simulation' ? '#155724' : '#721c24'}">
                        <i class="fas fa-${email.status === 'sent' || email.status === 'sent_simulation' ? 'check-circle' : 'times-circle'}"></i>
                    </span>
                </div>
                <div style="color: #666;">
                    De: ${email.name || ''} | Para: ${email.to_emails?.length || 0} destinatário(s)
                </div>
                <div style="font-size: 0.8rem; color: #888;">
                    ${email.date || ''} | ${email.condominio ? `Condomínio: ${email.condominio}` : ''}
                </div>
            </div>
        `).join('');
    },
    
    forceLogoff(user) {
        if (confirm(`Tem certeza que deseja deslogar este usuário?`)) {
            const usuario = DATA.funcionarios.find(f => f.user === user);
            if (usuario) {
                const logoffs = JSON.parse(localStorage.getItem('porter_logoffs') || '[]');
                logoffs.unshift({
                    user: usuario.user,
                    nome: usuario.nome,
                    data: new Date().toLocaleDateString('pt-BR'),
                    hora: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
                    timestamp: new Date().toISOString(),
                    turno: 'Forçado',
                    forçado: true,
                    por: this.currentUser.nome
                });
                localStorage.setItem('porter_logoffs', JSON.stringify(logoffs));
            }
            
            localStorage.removeItem('porter_last_session');
            this.showMessage('Usuário deslogado com sucesso!', 'success');
            this.openAdminPanel();
        }
    },
    
    exportBackup() {
        const backup = {
            atas: JSON.parse(localStorage.getItem('porter_atas') || '[]'),
            os: JSON.parse(localStorage.getItem('porter_os') || '[]'),
            presencas: JSON.parse(localStorage.getItem('porter_presencas') || '[]'),
            logoffs: JSON.parse(localStorage.getItem('porter_logoffs') || '[]'),
            moods: JSON.parse(localStorage.getItem('porter_moods') || '[]'),
            notificacoes: JSON.parse(localStorage.getItem('porter_notificacoes') || '[]'),
            chat: JSON.parse(localStorage.getItem('porter_chat') || '[]'),
            remocoes: JSON.parse(localStorage.getItem('porter_remocoes') || '[]'),
            os_emails: JSON.parse(localStorage.getItem('porter_os_emails') || '[]'),
            emails_history: JSON.parse(localStorage.getItem('porter_emails_history') || '[]'),
            exportDate: new Date().toISOString(),
            exportBy: this.currentUser.nome,
            firebaseEnabled: this.firebaseEnabled
        };
        
        const dataStr = JSON.stringify(backup, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `backup-porter-${new Date().toISOString().slice(0, 10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showMessage('Backup exportado com sucesso!', 'success');
    },
    
    clearAllData() {
        if (confirm('ATENÇÃO: Esta ação irá APAGAR TODOS os dados do sistema. Tem certeza?')) {
            const dadosParaManter = {
                condominios: DATA.condominios || [],
                funcionarios: DATA.funcionarios || []
            };
            
            localStorage.clear();
            localStorage.setItem('porter_condominios', JSON.stringify(dadosParaManter.condominios));
            localStorage.setItem('porter_funcionarios', JSON.stringify(dadosParaManter.funcionarios));
            location.reload();
        }
    },
    
    showMessage(text, type) {
        const message = document.createElement('div');
        message.innerHTML = `
            <div style="
                position: fixed; top: 20px; right: 20px; 
                padding: 1rem 1.5rem; border-radius: 8px; 
                background: ${type === 'success' ? '#27ae60' : '#e74c3c'}; 
                color: white; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: flex; align-items: center; gap: 10px; animation: fadeIn 0.3s;
            ">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                ${text}
            </div>
        `;
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 3000);
    }
};

// Inicializar o sistema
window.onload = () => {
    app.init();
};

// ============================================
// 🔧 SISTEMA DE SINCRONIZAÇÃO AUTOMÁTICA
// ============================================

// Adicione isto ao final do seu app.js
(function() {
    'use strict';
    
    console.log('⚡ Sistema Porter Vercel - Carregando sistema de sincronização...');
    
    // Função para criar um arquivo de correções para download
    function criarArquivoCorrecoes() {
        const codigoCompleto = `// 🚀 SISTEMA PORTER VERCEL - CORREÇÕES PERMANENTES
// Cole este código no final do seu app.js

// Sistema de correções automáticas
setTimeout(() => {
    // Corrigir dados de ATAs
    const atas = JSON.parse(localStorage.getItem('porter_atas') || '[]');
    if (atas.length > 0) {
        const atasCorrigidas = atas.map((ata, index) => ({
            id: ata.id || \`vercel_\${Date.now()}_\${index}\`,
            condo: ata.condo || "Não especificado",
            assunto: ata.assunto || "Sem assunto",
            data: ata.data || new Date().toLocaleDateString('pt-BR'),
            participantes: Array.isArray(ata.participantes) ? ata.participantes : [],
            itens: Array.isArray(ata.itens) ? ata.itens : [],
            createdAt: ata.createdAt || new Date().toISOString(),
            user: ata.user || JSON.parse(localStorage.getItem('porter_user') || '{}').user || "admin",
            status: ata.status || "ativo",
            desc: ata.desc || ""
        }));
        localStorage.setItem('porter_atas', JSON.stringify(atasCorrigidas));
    }
    
    // Corrigir dados do Chat
    const chat = JSON.parse(localStorage.getItem('porter_chat') || '[]');
    if (chat.length > 0) {
        const chatCorrigido = chat.map((msg, index) => ({
            id: msg.id || \`chat_\${Date.now()}_\${index}\`,
            sender: msg.sender || msg.nome || "Usuário",
            senderRole: msg.senderRole || msg.role || "OPERADOR",
            senderMood: msg.senderMood || msg.mood || "😐",
            senderUser: msg.senderUser || msg.user || "anonimo",
            message: msg.message || "(mensagem vazia)",
            time: msg.time || new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
            timestamp: msg.timestamp || new Date().toISOString(),
            date: msg.date || new Date().toLocaleDateString('pt-BR')
        }));
        localStorage.setItem('porter_chat', JSON.stringify(chatCorrigido));
    }
    
    console.log('✅ Dados corrigidos automaticamente');
}, 2000);

// Botão de sincronização permanente
setTimeout(() => {
    const btnSync = document.createElement('button');
    btnSync.id = 'btn-sync-permanent';
    btnSync.innerHTML = '🔄 Sincronizar';
    btnSync.title = 'Sincronizar com servidor central';
    
    btnSync.style.cssText = \`
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 25px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        z-index: 9999;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
        font-family: Arial, sans-serif;
    \`;
    
    btnSync.onclick = function() {
        if (confirm('🔄 Sincronizar com servidor?\\n\\nIsso atualizará todos os dados.')) {
            location.reload();
        }
    };
    
    document.body.appendChild(btnSync);
}, 1500);`;

        const blob = new Blob([codigoCompleto], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'correcoes-permanentes-porter.js';
        link.textContent = '📥 Clique para baixar correções permanentes';
        link.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: linear-gradient(135deg, #00b09b 0%, #96c93d 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(link);
        
        link.onclick = function(e) {
            e.preventDefault();
            this.click();
        };
    }
    
    // Executar quando o app carregar
    setTimeout(() => {
        console.log('✅ Sistema de sincronização carregado');
        
    }, 3000);
})();

