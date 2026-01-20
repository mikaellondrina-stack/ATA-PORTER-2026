// SISTEMA DE E-MAIL - ADIÇÃO MODULAR
const emailApp = {
    // Configuração de e-mails da Porter
    EMAIL_CONFIG: {
        // Remetente (sistema Porter)
        FROM_EMAIL: "londrina.operacional@porter.com.br",
        FROM_NAME: "Sistema Porter - Operacional",
        
        // Destinatários técnicos (múltiplos)
        TO_EMAILS: [
            "londrina.tecnica1@porter.com.br",
            "londrina.tecnicaplantao@porter.com.br", 
            "londrina.tecnicaplantao1@porter.com.br"
        ],
        
        // Configuração do EmailJS (para envio real)
        EMAILJS_SERVICE_ID: 'service_porter_operacional',
        EMAILJS_TEMPLATE_ID: 'template_porter_tecnica',
        EMAILJS_PUBLIC_KEY: 'c99DBcA6cuFkXU2xZ' // Chave pública exemplo - substitua pela sua
    },
    
    // Status e estado
    isInitialized: false,
    emailjsAvailable: false,
    
    init() {
        console.log('🔄 Inicializando sistema de e-mail Porter...');
        
        // Verificar se EmailJS está disponível
        this.emailjsAvailable = typeof emailjs !== 'undefined';
        
        if (this.emailjsAvailable) {
            try {
                emailjs.init(this.EMAIL_CONFIG.EMAILJS_PUBLIC_KEY);
                console.log('✅ EmailJS inicializado com sucesso');
            } catch (error) {
                console.warn('⚠️ EmailJS não pôde ser inicializado:', error);
                this.emailjsAvailable = false;
            }
        } else {
            console.log('ℹ️ EmailJS não detectado - usando modo simulação');
        }
        
        // Configurar botão de e-mail
        this.setupEmailButton();
        
        // Gerar CAPTCHA inicial
        this.generateCaptcha();
        
        this.isInitialized = true;
        console.log('✅ Sistema de e-mail Porter inicializado');
    },
    
    setupEmailButton() {
        const emailButton = document.getElementById('email-button');
        if (emailButton) {
            emailButton.onclick = () => this.openEmailModal();
            emailButton.title = "Abrir formulário de e-mail";
        } else {
            console.warn('⚠️ Botão de e-mail não encontrado');
        }
    },
    
    generateCaptcha() {
        try {
            const questions = [
                { question: "Quanto é 3 + 4?", answer: "7" },
                { question: "Quanto é 5 + 2?", answer: "7" },
                { question: "Quanto é 8 - 1?", answer: "7" },
                { question: "Quanto é 10 - 3?", answer: "7" },
                { question: "Digite o número sete por extenso", answer: "sete" },
                { question: "Ano atual? (apenas últimos 2 números)", answer: "26" },
                { question: "Quantas letras tem 'PORTER'?", answer: "6" }
            ];
            
            const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
            const captchaElement = document.getElementById('captcha-question');
            
            if (captchaElement) {
                captchaElement.textContent = randomQuestion.question;
                captchaElement.dataset.answer = randomQuestion.answer.toLowerCase();
                captchaElement.dataset.question = randomQuestion.question;
            }
        } catch (error) {
            console.error('Erro ao gerar CAPTCHA:', error);
        }
    },
    
    openEmailModal() {
        try {
            // Fechar outros modais abertos
            document.querySelectorAll('.modal.show').forEach(modal => {
                modal.classList.remove('show');
            });
            
            const modal = document.getElementById('email-modal');
            if (!modal) {
                console.error('Modal de e-mail não encontrado');
                return;
            }
            
            // Preencher nome automaticamente se usuário estiver logado
            const nameField = document.getElementById('email-sender-name');
            if (nameField) {
                nameField.value = app.currentUser ? app.currentUser.nome : '';
            }
            
            // Preencher condomínio se houver filtro ativo
            const condoField = document.getElementById('email-condominio');
            if (condoField && app.currentCondoFilter) {
                condoField.value = app.currentCondoFilter;
            } else if (condoField) {
                condoField.value = '';
            }
            
            // Limpar outros campos
            const subjectField = document.getElementById('email-subject');
            const messageField = document.getElementById('email-message');
            const captchaField = document.getElementById('captcha-answer');
            
            if (subjectField) subjectField.value = '';
            if (messageField) messageField.value = '';
            if (captchaField) captchaField.value = '';
            
            // Resetar status
            this.resetEmailStatus();
            
            // Gerar novo CAPTCHA
            this.generateCaptcha();
            
            // Mostrar modal
            modal.classList.add('show');
            
            // Focar no primeiro campo
            setTimeout(() => {
                if (nameField && !nameField.value) {
                    nameField.focus();
                } else if (subjectField) {
                    subjectField.focus();
                }
            }, 300);
            
        } catch (error) {
            console.error('Erro ao abrir modal de e-mail:', error);
            alert('Erro ao abrir formulário de e-mail. Tente novamente.');
        }
    },
    
    resetEmailStatus() {
        const statusDiv = document.getElementById('email-status');
        if (statusDiv) {
            statusDiv.className = 'email-status';
            statusDiv.style.display = 'none';
            statusDiv.innerHTML = '';
        }
    },
    
    closeEmailModal() {
        const modal = document.getElementById('email-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    },
    
    validateEmailForm() {
        try {
            const name = document.getElementById('email-sender-name')?.value.trim() || '';
            const subject = document.getElementById('email-subject')?.value.trim() || '';
            const message = document.getElementById('email-message')?.value.trim() || '';
            const captchaAnswer = document.getElementById('captcha-answer')?.value.trim().toLowerCase() || '';
            const correctAnswer = document.getElementById('captcha-question')?.dataset.answer || '';
            
            // Validações básicas
            if (!name || name.length < 3) {
                this.showStatus('Por favor, digite seu nome completo (mínimo 3 letras).', 'error');
                return false;
            }
            
            if (!subject || subject.length < 5) {
                this.showStatus('Por favor, digite um assunto (mínimo 5 caracteres).', 'error');
                return false;
            }
            
            if (!message || message.length < 10) {
                this.showStatus('Por favor, digite uma mensagem mais detalhada (mínimo 10 caracteres).', 'error');
                return false;
            }
            
            if (!captchaAnswer || captchaAnswer !== correctAnswer) {
                this.showStatus('Resposta de segurança incorreta. Tente novamente.', 'error');
                this.generateCaptcha();
                return false;
            }
            
            return true;
            
        } catch (error) {
            console.error('Erro na validação do formulário:', error);
            this.showStatus('Erro ao validar formulário. Tente novamente.', 'error');
            return false;
        }
    },
    
    showStatus(message, type = 'info') {
        try {
            const statusDiv = document.getElementById('email-status');
            if (!statusDiv) return;
            
            statusDiv.className = `email-status ${type}`;
            
            const icons = {
                'success': 'fa-check-circle',
                'error': 'fa-exclamation-circle',
                'sending': 'fa-spinner fa-spin',
                'info': 'fa-info-circle'
            };
            
            statusDiv.innerHTML = `
                <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
                ${message}
            `;
            statusDiv.style.display = 'block';
            
            // Rolar para mostrar o status
            statusDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            if (type === 'success') {
                setTimeout(() => {
                    this.closeEmailModal();
                }, 3000);
            }
            
        } catch (error) {
            console.error('Erro ao mostrar status:', error);
        }
    },
    
    async sendEmail() {
        // Validar formulário
        if (!this.validateEmailForm()) return;
        
        try {
            const name = document.getElementById('email-sender-name').value.trim();
            const condominio = document.getElementById('email-condominio').value.trim();
            const subject = document.getElementById('email-subject').value.trim();
            const message = document.getElementById('email-message').value.trim();
            
            // Obter informações adicionais
            const userInfo = app.currentUser ? `
Operador: ${app.currentUser.nome}
Turno: ${app.currentUser.turno}
Data/Hora: ${new Date().toLocaleString('pt-BR')}
            ` : `
Remetente: ${name}
Data/Hora: ${new Date().toLocaleString('pt-BR')}
            `;
            
            const condominioInfo = condominio ? `Condomínio: ${condominio}\n` : '';
            
            // Construir mensagem completa
            const fullMessage = `${message}

----------------------------------------
INFORMAÇÕES ADICIONAIS:
${condominioInfo}${userInfo}
----------------------------------------
* E-mail enviado via Sistema Porter Operacional *
            `;
            
            // Mostrar status de envio
            this.showStatus('Enviando e-mail para a equipe técnica...', 'sending');
            
            // Desabilitar botão
            const sendBtn = document.getElementById('email-send-btn');
            if (!sendBtn) throw new Error('Botão de envio não encontrado');
            
            const originalText = sendBtn.innerHTML;
            const originalDisabled = sendBtn.disabled;
            
            sendBtn.disabled = true;
            sendBtn.innerHTML = '<div class="loading"></div> Enviando...';
            
            // Enviar e-mail
            if (this.emailjsAvailable) {
                await this.sendWithEmailJS(name, condominio, subject, fullMessage);
            } else {
                await this.sendSimulation(name, condominio, subject, fullMessage);
            }
            
            // Registrar no sistema de notificações
            this.registerEmailNotification(name, subject, condominio);
            
        } catch (error) {
            console.error('Erro no processo de envio:', error);
            this.showStatus('❌ Erro ao enviar e-mail. Tente novamente.', 'error');
            
            // Salvar como falha no histórico
            this.saveEmailToHistory({
                status: 'error',
                error: error.message
            });
            
        } finally {
            // Reabilitar botão
            const sendBtn = document.getElementById('email-send-btn');
            if (sendBtn) {
                sendBtn.disabled = false;
                sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar E-mail';
            }
            
            // Gerar novo CAPTCHA
            this.generateCaptcha();
        }
    },
    
    async sendWithEmailJS(name, condominio, subject, fullMessage) {
        console.log('📤 Enviando e-mail via EmailJS...');
        
        const sendPromises = this.EMAIL_CONFIG.TO_EMAILS.map(toEmail => {
            const templateParams = {
                from_name: name,
                from_email: this.EMAIL_CONFIG.FROM_EMAIL,
                to_name: "Equipe Técnica Porter",
                to_email: toEmail,
                subject: `[PORTER] ${subject}`,
                message: fullMessage,
                condominio: condominio || 'Não informado',
                data_envio: new Date().toLocaleString('pt-BR'),
                reply_to: this.EMAIL_CONFIG.FROM_EMAIL
            };
            
            return emailjs.send(
                this.EMAIL_CONFIG.EMAILJS_SERVICE_ID,
                this.EMAIL_CONFIG.EMAILJS_TEMPLATE_ID,
                templateParams
            );
        });
        
        // Aguardar todos os envios
        const results = await Promise.allSettled(sendPromises);
        
        // Verificar resultados
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        if (failed > 0) {
            console.warn(`⚠️ ${failed} de ${this.EMAIL_CONFIG.TO_EMAILS.length} e-mails falharam`);
        }
        
        if (successful > 0) {
            this.showStatus(`✅ E-mail enviado para ${successful} destinatário(s)!${failed > 0 ? ` (${failed} falhas)` : ''}`, 'success');
        } else {
            throw new Error('Todos os envios falharam');
        }
        
        // Salvar no histórico
        this.saveEmailToHistory({
            name: name,
            condominio: condominio,
            subject: subject,
            message: fullMessage,
            to_emails: this.EMAIL_CONFIG.TO_EMAILS,
            from_email: this.EMAIL_CONFIG.FROM_EMAIL,
            date: new Date().toLocaleString('pt-BR'),
            status: 'sent',
            user: app.currentUser?.nome || 'Visitante',
            sent_count: successful,
            failed_count: failed
        });
    },
    
    async sendSimulation(name, condominio, subject, fullMessage) {
        console.log('📤 Simulando envio de e-mail...');
        
        // Simular atraso de rede
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Registrar no localStorage para histórico
        this.saveEmailToHistory({
            name: name,
            condominio: condominio,
            subject: subject,
            message: fullMessage,
            to_emails: this.EMAIL_CONFIG.TO_EMAILS,
            from_email: this.EMAIL_CONFIG.FROM_EMAIL,
            date: new Date().toLocaleString('pt-BR'),
            status: 'sent_simulation',
            user: app.currentUser?.nome || 'Visitante'
        });
        
        // Log para demonstração
        console.log('📧 E-mail simulado:', {
            from: this.EMAIL_CONFIG.FROM_EMAIL,
            to: this.EMAIL_CONFIG.TO_EMAILS,
            subject: `[PORTER] ${subject}`,
            message: fullMessage.substring(0, 200) + '...'
        });
        
        this.showStatus(`✅ E-mail registrado! (Modo simulação) Seria enviado para ${this.EMAIL_CONFIG.TO_EMAILS.length} destinatário(s).`, 'success');
    },
    
    saveEmailToHistory(emailData) {
        try {
            let emailsHistory = JSON.parse(localStorage.getItem('porter_emails_history') || '[]');
            
            const historyEntry = {
                id: Date.now(),
                ...emailData,
                timestamp: new Date().toISOString()
            };
            
            emailsHistory.unshift(historyEntry);
            
            // Manter apenas os últimos 100 e-mails
            if (emailsHistory.length > 100) {
                emailsHistory = emailsHistory.slice(0, 100);
            }
            
            localStorage.setItem('porter_emails_history', JSON.stringify(emailsHistory));
            
        } catch (error) {
            console.error('Erro ao salvar e-mail no histórico:', error);
        }
    },
    
    registerEmailNotification(senderName, subject, condominio) {
        try {
            const notification = {
                id: Date.now(),
                condo: condominio || 'Sistema Porter',
                tipo: 'email',
                desc: `E-mail enviado por ${senderName}: ${subject.substring(0, 50)}${subject.length > 50 ? '...' : ''}`,
                data: new Date().toLocaleDateString('pt-BR'),
                hora: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
                timestamp: new Date().toISOString(),
                lida: false
            };
            
            let notificacoes = JSON.parse(localStorage.getItem('porter_notificacoes') || '[]');
            notificacoes.unshift(notification);
            
            if (notificacoes.length > 50) notificacoes.pop();
            localStorage.setItem('porter_notificacoes', JSON.stringify(notificacoes));
            
            // Atualizar notificações no sistema principal
            if (typeof app !== 'undefined' && app.loadNotifications) {
                app.loadNotifications();
                app.updateNotificationBadges();
            }
            
        } catch (error) {
            console.error('Erro ao registrar notificação:', error);
        }
    },
    
    // Métodos auxiliares para debug
    debugInfo() {
        return {
            initialized: this.isInitialized,
            emailjsAvailable: this.emailjsAvailable,
            config: {
                fromEmail: this.EMAIL_CONFIG.FROM_EMAIL,
                toEmailsCount: this.EMAIL_CONFIG.TO_EMAILS.length,
                hasEmailjsKey: !!this.EMAIL_CONFIG.EMAILJS_PUBLIC_KEY
            }
        };
    },
    
    // Limpar histórico
    clearHistory() {
        if (confirm('Tem certeza que deseja limpar todo o histórico de e-mails?')) {
            localStorage.removeItem('porter_emails_history');
            console.log('Histórico de e-mails limpo');
            return true;
        }
        return false;
    }
};
