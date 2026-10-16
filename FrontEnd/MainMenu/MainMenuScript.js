// ====== MAPEAMENTO DOS COMPONENTES ======
const bankApp = document.getElementById('bankApp');
const presentationControls = document.getElementById('presentationControls');
const btnToggleLayout = document.getElementById('btnToggleLayout');

// Abas de navegação
const navInicio = document.getElementById('navInicio');
const navAjustes = document.getElementById('navAjustes');
const screenInicio = document.getElementById('screenInicio');
const screenAjustes = document.getElementById('screenAjustes');

// Recursos internos
const btnHideBalance = document.getElementById('btnHideBalance');
const balanceText = document.getElementById('balanceText');
const btnDarkMode = document.getElementById('btnDarkMode');

// 🔒 REQUISITO: O saldo já inicia tampado por padrão (true)
let isBalanceHidden = true;
// Deixei essa variável pronta: no back-end você substituirá essa string pelo dado vindo do banco de dados
let actualBalance = "R$ 0,00"; 


// ====== 1. SISTEMA DE NAVEGAÇÃO ENTRE ABAS ======
navInicio.addEventListener('click', (e) => {
    e.preventDefault();
    navAjustes.classList.remove('active');
    navInicio.classList.add('active');
    screenAjustes.classList.add('hidden');
    screenInicio.classList.remove('hidden');
});

navAjustes.addEventListener('click', (e) => {
    e.preventDefault();
    navInicio.classList.remove('active');
    navAjustes.classList.add('active');
    screenInicio.classList.add('hidden');
    screenAjustes.classList.remove('hidden');
});


// ====== 2. CONTROLE INTELIGENTE DE DETECÇÃO DE TELA ======
function verificarDispositivo() {
    if (window.innerWidth >= 600) {
        bankApp.classList.add('simulated-smartphone');
        presentationControls.classList.remove('hidden');
    } else {
        bankApp.classList.remove('simulated-smartphone', 'expanded-desktop');
        presentationControls.classList.add('hidden');
    }
}

verificarDispositivo();

btnToggleLayout.addEventListener('click', () => {
    if (bankApp.classList.contains('simulated-smartphone')) {
        bankApp.classList.remove('simulated-smartphone');
        bankApp.classList.add('expanded-desktop');
        btnToggleLayout.textContent = "📱 Mudar para Visualização Smartphone";
    } else {
        bankApp.classList.remove('expanded-desktop');
        bankApp.classList.add('simulated-smartphone');
        btnToggleLayout.textContent = "💻 Mudar para Visualização Computador";
    }
});


// ====== 3. MOSTRAR / ESCONDER SALDO (INVERTIDO) ======
btnHideBalance.addEventListener('click', () => {
    isBalanceHidden = !isBalanceHidden;
    if (isBalanceHidden) {
        balanceText.textContent = "••••••";
        btnHideBalance.textContent = "Mostrar";
    } else {
        balanceText.textContent = actualBalance;
        btnHideBalance.textContent = "Esconder";
    }
});


// ====== 4. MODO ESCURO ======
btnDarkMode.addEventListener('click', () => {
    bankApp.classList.toggle('dark-theme');
    
    if (bankApp.classList.contains('dark-theme')) {
        btnDarkMode.textContent = "Desativar";
        btnDarkMode.style.backgroundColor = "#bc1e22";
    } else {
        btnDarkMode.textContent = "Ativar";
        btnDarkMode.style.backgroundColor = "";
    }
});
