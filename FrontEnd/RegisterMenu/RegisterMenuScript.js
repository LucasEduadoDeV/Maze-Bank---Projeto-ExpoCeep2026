document.addEventListener('DOMContentLoaded', () => {

    const URL = 'http://localhost:3000/register'
    const registerForm = document.getElementById('registerForm');
    const inputName = document.getElementById('regName');
    const inputEmail = document.getElementById('regEmail');
    const emailWrapper = document.querySelector('.email-suffix-wrapper');
    const inputCpf = document.getElementById('regCpf');
    const inputPassword = document.getElementById('regPassword');
    const inputConfirmPassword = document.getElementById('regConfirmPassword');

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

    // Máscara de CPF
    inputCpf.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);

        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');

        e.target.value = value;
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const name = inputName.value.trim().toUpperCase();

        // Tratamento inteligente: se o usuário digitar o @, removemos o restante para evitar duplicação
        let userInput = inputEmail.value.trim();
        if (userInput.includes('@')) {
            userInput = userInput.split('@')[0];
            inputEmail.value = userInput; // Atualiza o input visualmente para o usuário ver
        }

        const cpf = inputCpf.value.trim();
        const password = inputPassword.value;
        const confirmPassword = inputConfirmPassword.value;

        let hasError = false;

        if (!name) {
            setFieldError(inputName, 'errName', 'Informe seu nome completo');
            hasError = true;
        }

        if (!userInput) {
            setFieldError(inputEmail, 'errEmail', 'Informe o seu usuário de e-mail', emailWrapper);
            hasError = true;
        }

        if (cpf.length < 14) {
            setFieldError(inputCpf, 'errCpf', 'Informe um CPF válido');
            hasError = true;
        }

        if (password.length < 8) {
            setFieldError(inputPassword, 'errPassword', 'A senha deve ter no mínimo 8 caracteres');
            hasError = true;
        }

        if (confirmPassword.length < 8) {
            setFieldError(inputPassword, 'errPassword', 'A senha deve ter no mínimo 8 caracteres');
            hasError = true;
        }

        if (password !== confirmPassword) {
            setFieldError(inputConfirmPassword, 'errConfirmPassword', 'As senhas não coincidem');
            hasError = true;
        }

        if (hasError) return;

        // E-mail final blindado e limpo para envio:
        const fullEmail = `${userInput}@gmail.com`.toLowerCase();

        try {
            const response = await fetch(URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    email: fullEmail,
                    cpf: cpf,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.field === 'email') {
                    setFieldError(inputEmail, 'errEmail', data.message, emailWrapper);
                    return;
                }

                if (data.field === 'cpf') {
                    setFieldError(inputCpf, 'errCpf', data.message);
                    return;
                }

                const validationMessage = data.errors
                    ?.map(error => error.message)
                    .join('\n');
                throw new Error(validationMessage || data.message || 'Erro ao criar conta');
            }

            // Opcional: Redirecionar para o login
            window.location.href = "/FrontEnd/LoginMenu/LoginMenu.html";
        }
        catch (err) {
            console.error('Erro na requisição:', err);
        }
    });
});