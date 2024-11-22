const themeSelect = document.querySelector('.theme');

const savedTheme = localStorage.getItem('cardapio-theme');

loadTheme();

// Load theme
function loadTheme() {
    const savedTheme = localStorage.getItem('cardapio-theme');

    if (savedTheme) {
        themeSelect.value = savedTheme;
        const theme = savedTheme === 'auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : savedTheme;
        document.documentElement.classList.add(theme);
    } else {
        const defaultTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.classList.add(defaultTheme);
    }
}

// Wait for change to change theme
themeSelect.addEventListener('change', () => {
    localStorage.setItem('cardapio-theme', themeSelect.value);
    location.reload();
});

// Wait for click on back button to return to home
document.querySelector('.back-home').addEventListener('click', (e) => {
    window.location.href = '../index.html';
    if (e.persisted) window.location.reload();
});

// Wait for click on share button to open share menu or copy website link
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
        setTimeout(() => e.target.innerText = 'Compartilhar', 2000);
    }
});
