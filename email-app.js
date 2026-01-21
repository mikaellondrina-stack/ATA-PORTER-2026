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
        if (currentUser) {
            document.getElementById('email-sender-name').value = currentUser.nome;
        } else {
            document.getElementById('email-sender-name').value = '';
        }
        
        // Limpar outros campos
        document.getElementById('email-condominio').value = '';
        document.getElementById('email-subject').value = '';
        document.getElementById('email-message').value = '';
        document.getElementById('captcha-answer').value = '';
