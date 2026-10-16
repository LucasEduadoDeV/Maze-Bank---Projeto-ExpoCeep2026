document.addEventListener('DOMContentLoaded', () => {

    const URL = 'http://localhost:3000/login'
    const loginForm = document.getElementById('loginForm');
    const inputEmail = document.getElementById('loginEmail');
    const emailWrapper = document.querySelector('.email-suffix-wrapper');
    const inputPassword = document.getElementById('loginPassword');

    function setFieldError(inputElement, errorSpanId, message, wrapperElement = null) {
        inputElement.classList.add('input-error');
        if (wrapperElement) wrapperElement.classList.add('input-error');
        const errSpan = document.getElementById(errorSpanId);
        if (errSpan) {
            errSpan.textContent = message;
        }
    }

    function clearErrors() {
        document.querySelectorAll('.input-group input').forEach(input => {
            input.classList.remove('input-error');
        });
        if (emailWrapper) emailWrapper.classList.remove('input-error');
        document.querySelectorAll('.error-msg').forEach(span => {
            span.textContent = '';
        });
    }

    // Olhinho da senha
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            const eyeIcon = button.querySelector('.eye-icon');

            if (targetInput.type === 'password') {
                targetInput.type = 'text';
                eyeIcon.textContent = '🙈';
            } else {
                targetInput.type = 'password';
                eyeIcon.textContent = '👁️';
            }
        });
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        // Tratamento inteligente na hora do envio igual ao register:
        let userInput = inputEmail.value.trim();
        if (userInput.includes('@')) {
            userInput = userInput.split('@')[0];
            inputEmail.value = userInput; // Atualiza visualmente para o usuário ver o ajuste
        }

        const password = inputPassword.value;

        let hasError = false;

        if (!userInput) {
            setFieldError(inputEmail, 'errEmail', 'Informe o seu usuário de e-mail', emailWrapper);
            hasError = true;
        }

        if (!password) {
            setFieldError(inputPassword, 'errPassword', 'Informe sua senha');
            hasError = true;
        }

        if (hasError) return;

        // E-mail final completo pronto para envio ao backend:
        const fullEmail = `${userInput}@gmail.com`.toLowerCase();

        try {
            const response = await fetch(URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: fullEmail,
                    password: password
                })
            });

            
        }
        catch (err) {
            console.error('Erro na requisição:', err);
        }
    });
});