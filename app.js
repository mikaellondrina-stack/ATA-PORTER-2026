        // Inicializar sistema de e-mail
        setTimeout(() => {
            emailApp.init();
            if (typeof emailApp !== 'undefined') {
                emailApp.init();
            }
        }, 500);
    },

@@ -128,7 +130,7 @@ const app = {
            }
        }, 30000);

        // Inicializar imediamente
        // Inicializar imediatamente
        this.updateOnlineUsers();
    },

@@ -185,46 +187,15 @@ const app = {
                                isCurrentUser: false,
                                turno: sessao.turno || 'Diurno'
                            });
             try {
    // ... seu código que preenche usuariosOnline ...
    
    this.onlineUsers = usuariosOnline;

    // ------------------ ATUALIZA LISTA DE USUÁRIOS ONLINE ------------------
    const onlineUsersListEl = document.getElementById("online-users-list");
    const onlineCountEl = document.getElementById("online-count");

    function getUserNameFromId(userId) {
        if (userId.startsWith("user_")) {
            const id = userId.replace("user_", "");
            if (window.currentUser && window.currentUser.uid === id) {
                return window.currentUser.name || id;
                        }
                    }
                }
            }
            if (id.startsWith("guest_")) return id;
            return id;
        } catch (e) {
            console.log('Erro ao buscar sessões:', e);
        }
        return userId;
    }

    // Limpa e atualiza a lista
    onlineUsersListEl.innerHTML = "";
    let count = 0;
    for (const key in usuariosOnline) {
        if (usuariosOnline[key].online) {
            count++;
            const userEl = document.createElement("div");
            userEl.className = "online-user";
            userEl.textContent = getUserNameFromId(key);
            onlineUsersListEl.appendChild(userEl);
        }
    }
    onlineCountEl.textContent = count;
    // ------------------ FIM DA ATUALIZAÇÃO ------------------

} catch (e) {
    console.log('Erro ao buscar sessões:', e);
}

        
        this.onlineUsers = usuariosOnline;

        // Atualizar contador
        const onlineCount = document.getElementById('online-count');
@@ -245,7 +216,7 @@ const app = {
        }

        this.salvarSessao();
    }
    },

    // 📋 FUNÇÃO ATUALIZADA: renderOnlineUsersList CORRIGIDA
    renderOnlineUsersList() {
@@ -551,11 +522,14 @@ const app = {
            el.classList.remove('selected');
        });

        document.querySelector(`.mood-option[data-id="${moodId}"]`).classList.add('selected');
        document.getElementById('mood-status').innerHTML = `
            <i class="fas fa-check-circle" style="color: ${document.querySelector(`.mood-option[data-id="${moodId}"]`).style.color}"></i>
            <span>Selecionado: <strong>${this.selectedMood.status}</strong></span>
        `;
        const selectedEl = document.querySelector(`.mood-option[data-id="${moodId}"]`);
        if (selectedEl) {
            selectedEl.classList.add('selected');
            document.getElementById('mood-status').innerHTML = `
                <i class="fas fa-check-circle" style="color: ${selectedEl.style.color}"></i>
                <span>Selecionado: <strong>${this.selectedMood.status}</strong></span>
            `;
        }

        document.getElementById('mood-submit-btn').disabled = false;
    },
@@ -813,7 +787,6 @@ const app = {
        const atas = JSON.parse(localStorage.getItem('porter_atas') || '[]');
        const fixas = atas.filter(a => a.tipo && a.tipo.includes('Informações Fixas'));
        const os = JSON.parse(localStorage.getItem('porter_os') || '[]');
        const chat = JSON.parse(localStorage.getItem('porter_chat') || '[]');

        document.getElementById('tab-count-ata').textContent = atas.length;
        document.getElementById('tab-count-fixas').textContent = fixas.length;
@@ -2689,6 +2662,4 @@ E-mail automático - Não responda
// Inicializar o sistema
window.onload = () => {
    app.init();

};
