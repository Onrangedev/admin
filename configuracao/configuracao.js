// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', () => {
//         navigator.serviceWorker.register('/cardapio/alunos/pwabuilder-sw.js').then((registration) => {
//             console.log('Service Worker registrado com sucesso:', registration);
//         }).catch((error) => {
//             console.log('Falha ao registrar o Service Worker:', error);
//         });
//     });
// }

const themeSelect = document.querySelector('.theme');
const savedTheme = localStorage.getItem('cardapio-theme');
const cardapioImgs = localStorage.getItem('cardapio-imgs-toggle');
const ultimaAlteracao = localStorage.getItem('cardapio-ultima-alteracao');
const savedFrases = localStorage.getItem('cardapio-frase');

// Pega os dados salvos em local storage e carrega o tema
if (savedTheme) {
    themeSelect.value = savedTheme;
    if (savedTheme === 'auto') {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.add('light');
        }
    } else {
        document.documentElement.classList.add(savedTheme);
    }
} else {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.add('light');
    }
}

if (savedFrases) {
    document.querySelector('.checkbox-frase').savedFrases;
}

document.querySelector('.menu-ultima-alteracao').style.display = 'none';

if (ultimaAlteracao) {
    document.querySelector('.menu-ultima-alteracao').style.display = 'block';
    document.querySelector('.dia-ultima-alteracao').textContent = ultimaAlteracao;
}

// Aguarda mudança no switch para alterar o tema
themeSelect.addEventListener('change', () => {
    localStorage.setItem('cardapio-theme', themeSelect.value);
    location.reload();
});

// Aguarda evento de clique no botão de voltar para voltar a pagina inicial
document.querySelector('.back-home').addEventListener('click', (e) => {
    window.location.href = '../index.html';
    if (e.persisted) {
        window.location.reload();
    }
});

// Aguarda evento de clique no botão de compartilhar para abrir o menu de compartilhamento ou copiar o link do site
document.querySelector('.btn-compartilhar').addEventListener('click', async (e) => {
    try {
        await navigator.share({
            title: 'Onrange',
            text: 'Acesse o cardápio da escola de forma simples, rápida e digital!',
            url: 'https://eierick.github.io/cardapio/alunos/',
        });
    } catch (err) {
        navigator.clipboard.writeText('https://eierick.github.io/cardapio/alunos/');
        e.target.innerText = 'Link Copiado!';
        setTimeout(() => {
            e.target.innerText = 'Compartilhar';
        }, 2000);
    }
});

// Exibi o valor de zoom no elemento '.valor-escala'
function exibirZoom(valor) {
    document.querySelector('.valor-escala').textContent = parseInt(valor*100);
}
