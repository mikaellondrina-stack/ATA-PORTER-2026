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
    
    init() {
        // Inicializar EmailJS
        if (typeof emailjs !== 'undefined') {
            emailjs.init(this.EMAIL_CONFIG.EMAILJS_PUBLIC_KEY);
        }
        
        // Configurar botão de e-mail
        this.setupEmailButton();
        
        // Gerar CAPTCHA inicial
        this.generateCaptcha();
        
        console.log('Sistema de e-mail Porter inicializado');
    },
    
    setupEmailButton() {
        const emailButton = document.getElementById('email-button');
        if (emailButton) {
            emailButton.onclick = () => this.openEmailModal();
        }
    },
    
    generateCaptcha() {
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
        
        if (document.getElementById('captcha-question')) {
            document.getElementById('captcha-question').textContent = randomQuestion.question;
            document.getElementById('captcha-question').dataset.answer = randomQuestion.answer.toLowerCase();
        }
    },
    
    openEmailModal() {
        // Fechar outros modais abertos
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
        
        // Preencher nome automaticamente se usuário estiver logado
        if (app.currentUser) {
            document.getElementById('email-sender-name').value = app.currentUser.nome;
        } else {
            document.getElementById('email-sender-name').value = '';
        }
        
        // Limpar outros campos
        document.getElementById('email-condominio').value = '';
        document.getElementById('email-subject').value = '';
        document.getElementById('email-message').value = '';
        document.getElementById('captcha-answer').value = '';
        
        // Resetar status
        const statusDiv = document.getElementById('email-status');
        statusDiv.className = 'email-status';
        statusDiv.style.display = 'none';
        statusDiv.innerHTML = '';
        
        // Gerar novo CAPTCHA
        this.generateCaptcha();
        
        // Mostrar modal
        document.getElementById('email-modal').classList.add('show');
        
        // Focar no primeiro campo
        setTimeout(() => {
            const nameField = document.getElementById('email-sender-name');
            if (nameField && !nameField.value) {
                nameField.focus();
            } else {
                document.getElementById('email-subject').focus();
            }
        }, 300);
    },
    
    closeEmailModal() {
        document.getElementById('email-modal').classList.remove('show');
    },
    
    validateEmailForm() {
        const name = document.getElementById('email-sender-name').value.trim();
        const subject = document.getElementById('email-subject').value.trim();
        const message = document.getElementById('email-message').value.trim();
        const captchaAnswer = document.getElementById('captcha-answer').value.trim().toLowerCase();
        const correctAnswer = document.getElementById('captcha-question').dataset.answer;
        
        // Validações básicas
        if (!name || name.length < 3) {
            this.showStatus('Por favor, digite seu nome completo.', 'error');
            return false;
        }
        
        if (!subject || subject.length < 5) {
            this.showStatus('Por favor, digite um assunto.', 'error');
            return false;
        }
        
        if (!message || message.length < 10) {
            this.showStatus('Por favor, digite uma mensagem mais detalhada.', 'error');
            return false;
        }
        
        if (!captchaAnswer || captchaAnswer !== correctAnswer) {
            this.showStatus('Resposta de segurança incorreta. Tente novamente.', 'error');
            this.generateCaptcha();
            return false;
        }
        
        return true;
    },
    
    showStatus(message, type) {
        const statusDiv = document.getElementById('email-status');
        statusDiv.className = `email-status ${type}`;
        
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'sending': 'fa-spinner fa-spin'
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
    },
    
    async sendEmail() {
        // Validar formulário
        if (!this.validateEmailForm()) return;
        
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
        const originalText = sendBtn.innerHTML;
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<div class="loading"></div> Enviando...';
        
        try {
            // Tentar usar EmailJS para envio real
            if (typeof emailjs !== 'undefined' && this.EMAIL_CONFIG.EMAILJS_PUBLIC_KEY) {
                // Enviar para cada destinatário técnico
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
                await Promise.all(sendPromises);
                
                this.showStatus(`✅ E-mail enviado com sucesso para ${this.EMAIL_CONFIG.TO_EMAILS.length} destinatário(s)!`, 'success');
                
            } else {
                // Fallback: Simulação de envio (para demonstração)
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Registrar no localStorage para histórico
                this.saveEmailToHistory({
                    name: name,
                    condominio: condominio,
                    subject: subject,
                    message: message,
                    to_emails: this.EMAIL_CONFIG.TO_EMAILS,
                    from_email: this.EMAIL_CONFIG.FROM_EMAIL,
                    date: new Date().toLocaleString('pt-BR'),
                    status: 'sent_simulation',
                    user: app.currentUser?.nome || 'Visitante'
                });
                
                this.showStatus(`✅ E-mail registrado! (Modo simulação) Seria enviado para ${this.EMAIL_CONFIG.TO_EMAILS.length} destinatário(s).`, 'success');
                
                // Log para demonstração
                console.log('📧 E-mail simulado:', {
                    from: this.EMAIL_CONFIG.FROM_EMAIL,
                    to: this.EMAIL_CONFIG.TO_EMAILS,
                    subject: `[PORTER] ${subject}`,
                    message: fullMessage
                });
            }
            
            // Registrar no sistema de notificações
            this.registerEmailNotification(name, subject, condominio);
            
        } catch (error) {
            console.error('Erro ao enviar e-mail:', error);
            
            // Salvar como falha no histórico
            this.saveEmailToHistory({
                name: name,
                condominio: condominio,
                subject: subject,
                message: message,
                to_emails: this.EMAIL_CONFIG.TO_EMAILS,
                from_email: this.EMAIL_CONFIG.FROM_EMAIL,
                date: new Date().toLocaleString('pt-BR'),
                status: 'error',
                error: error.message,
                user: app.currentUser?.nome || 'Visitante'
            });
            
            this.showStatus('❌ Erro ao enviar e-mail. Tente novamente ou contate o administrador.', 'error');
            
        } finally {
            // Reabilitar botão
            sendBtn.disabled = false;
            sendBtn.innerHTML = originalText;
            
            // Gerar novo CAPTCHA
            this.generateCaptcha();
        }
    },
    
    saveEmailToHistory(emailData) {
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
    },
    
    registerEmailNotification(senderName, subject, condominio) {
        const notification = {
            id: Date.now(),
            condo: condominio || 'Sistema Porter',
            tipo: 'email',
            desc: `E-mail enviado por ${senderName}: ${subject}`,
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
        if (app.loadNotifications) {
            app.loadNotifications();
            app.updateNotificationBadges();
        }
    }
};