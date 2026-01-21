// Sistema de presença e status online
const presenceApp = {
    // Atualizar usuários online
    updateOnlineUsers() {
        if (!currentUser) return;
        
        const agora = new Date();
        
        // Buscar usuários realmente online do localStorage
        let usuariosOnline = [];
        
        // Adicionar usuário atual
        const moodAtual = app.getMoodAtual();
        const statusMood = app.getMoodStatusTexto(moodAtual);
        
        usuariosOnline.push({
            ...currentUser,
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
                if (sessao.user !== currentUser.user) {
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
        
        onlineUsers = usuariosOnline;
        
        // Atualizar contador
        const onlineCount = document.getElementById('online-count');
        if (onlineCount) {
            if (onlineUsers.length === 1) {
                onlineCount.textContent = '1 (apenas você)';
                onlineCount.style.color = '#f39c12';
            } else {
                onlineCount.textContent = onlineUsers.length;
                onlineCount.style.color = '#2ecc71';
            }
        }
        
        // Se a lista estiver visível, atualizar
        const onlineList = document.getElementById('online-users-list');
        if (onlineList && onlineList.style.display === 'block') {
            presenceApp.renderOnlineUsersList();
        }
        
        app.salvarSessao();
    },
    
    // Renderizar lista de usuários online
    renderOnlineUsersList() {
        const list = document.getElementById('online-users-list');
        if (!list) return;
        
        // Limpar lista anterior
        list.innerHTML = '';
        
        if (onlineUsers.length === 0) {
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
        const usuariosOrdenados = [...onlineUsers].sort((a, b) => {
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
                presenceApp.formatarTempoAtivo(new Date(user.lastActivity)) : 
                'Agora mesmo';
            
            // Definir cor do status baseado no humor
            const statusColor = app.getCorPorMood(user.mood);
            
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
            ${onlineUsers.length} operador${onlineUsers.length > 1 ? 'es' : ''} online
            <br>
            <small style="font-size: 0.7rem; color: #999;">
                Atualizado: ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
            </small>
        `;
        
        list.appendChild(rodape);
    },
    
    // Alternar visibilidade da lista de usuários online
    toggleOnlineUsers() {
        const list = document.getElementById('online-users-list');
        if (!list) return;
        
        const estaVisivel = list.style.display === 'block';
        
        // Fechar notificações se estiverem abertas
        document.getElementById('notifications-panel').classList.remove('show');
        
        if (estaVisivel) {
            list.style.display = 'none';
        } else {
            // Atualizar lista ANTES de mostrar
            presenceApp.updateOnlineUsers();
            
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
            presenceApp.renderOnlineUsersList();
        }
    },
    
    // Formatar tempo desde a última atividade
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
    
    // Configurar tracking de usuários online
    setupOnlineTracking() {
        // Atualizar a cada 30 segundos
        onlineInterval = setInterval(() => {
            if (currentUser) {
                presenceApp.updateOnlineUsers();
            }
        }, 30000);
        
        // Inicializar imediatamente
        presenceApp.updateOnlineUsers();
    },
    
    // Registrar logoff
    registrarLogoff() {
        if (!currentUser) return;
        
        const logoffs = JSON.parse(localStorage.getItem('porter_logoffs') || '[]');
        const logoffData = {
            user: currentUser.user,
            nome: currentUser.nome,
            data: new Date().toLocaleDateString('pt-BR'),
            hora: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
            timestamp: new Date().toISOString(),
            turno: currentUser.turno
        };
        
        logoffs.unshift(logoffData);
        if (logoffs.length > 200) logoffs.pop();
        localStorage.setItem('porter_logoffs', JSON.stringify(logoffs));
        
        lastLogoffTime = new Date().toISOString();
        localStorage.setItem('porter_last_logoff', lastLogoffTime);
        
        // Limpar intervalos
        if (chatInterval) {
            clearInterval(chatInterval);
            chatInterval = null;
        }
        
        if (moodInterval) {
            clearInterval(moodInterval);
            moodInterval = null;
        }
        
        if (onlineInterval) {
            clearInterval(onlineInterval);
            onlineInterval = null;
        }
        
        // Limpar sessão do usuário atual
        localStorage.removeItem('porter_last_session');
    },
    
    // Salvar sessão atual
    salvarSessao() {
        if (!currentUser) return;
        
        const sessionData = {
            user: currentUser.user,
            nome: currentUser.nome,
            lastActivity: new Date().toISOString(),
            turno: currentUser.turno,
            role: currentUser.role
        };
        
        localStorage.setItem('porter_last_session', JSON.stringify(sessionData));
    }
};
