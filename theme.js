// Load theme
const savedTheme = localStorage.getItem('cardapio-theme');

if (savedTheme) {
    const theme = savedTheme === 'auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : savedTheme;
    document.documentElement.classList.add(theme);
} else {
    const defaultTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.classList.add(defaultTheme);
}
