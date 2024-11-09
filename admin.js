const CLIENT_ID = '293531894729-htvn6ikdidqnbt83stj818k8mmh2u3ov.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAEOb_1iv4NXFeV7OQph2FW5UpqCUiGMcc';
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient;
let gapiInited = false;
let gisInited = false;

let menu = [];

document.getElementById('authorize_button').style.display = 'none';
document.getElementById('signout_button').style.display = 'none';

document.querySelector('.btn-salvar').addEventListener('click', () => salvarServer('admin!A1:B', [menu[0], menu[1]]));
document.querySelector('.btn-adicionar').addEventListener('click', () => adicionarItem());

document.querySelectorAll('.select-merenda').forEach((element) => element.addEventListener('change', () => alterarMerenda(element)));
document.querySelectorAll('.select-almoco').forEach((element) => element.addEventListener('change', () => alterarAlmoco(element)));

// Callback after api.js is loaded.
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

// Callback after the API client is loaded. Loads the discovery doc to initialize the API.
async function initializeGapiClient() {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        maybeEnableButtons();
        obterDados();
    } catch (error) {
        console.error("Error loading GAPI client:", error);
    }
}

// Callback after Google Identity Services are loaded.
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '',
    });
    gisInited = true;
    maybeEnableButtons();
}

async function obterDados() {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: '1X1p6laul5yRw330M1ROaP8F4T70asWE7IieVsT1Qb7c',
            range: 'admin!A:E',
        });
        
        menu = transpose(response.result.values);
        printOptions();
    } catch (err) {
        console.error(err.message);
    }
}

function printOptions() {
    const selectElements = {
        merenda: document.querySelectorAll('.select-merenda'),
        almoco: document.querySelectorAll('.select-almoco')
    };

    ['merenda', 'almoco'].forEach((meal, index) => {
        selectElements[meal].forEach((element, i) => {
            menu[index + 3].forEach(item => {
                if (item) {
                    const [text, value] = item.split('/');
                    const option = new Option(text, value);
                    element.appendChild(option);

                    if (value === menu[index][i]) element.value = value;
                }
            });
        });
    });
}

// Enables user interaction after all libraries are loaded and checks if token exists in localStorage.
function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        const storedToken = localStorage.getItem('access_token');
        if (storedToken) {
            gapi.client.setToken({ access_token: storedToken });
            document.getElementById('signout_button').style.display = 'inline';
        } else {
            document.getElementById('authorize_button').style.display = 'inline';
        }
    }
}

// Exibi o botão de salvar
function exibirSalvar() {
    document.querySelector('.btn-salvar').style.display = 'block';
}

// Oculta o botão de salvar
function ocultarSalvar() {
    document.querySelector('.btn-salvar').style.display = 'none';
}

// Sign in the user upon button click and store the token in localStorage.
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) throw (resp);

        // Save the token in localStorage
        const token = gapi.client.getToken();
        localStorage.setItem('access_token', token.access_token);
        document.getElementById('signout_button').style.display = 'inline';
        document.getElementById('authorize_button').style.display = 'none';
    };

    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
        // Use token from localStorage if available
        gapi.client.setToken({ access_token: storedToken });
        tokenClient.callback({ access_token: storedToken });
    } else {
        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }
    }
}

// Sign out the user upon button click and remove token from localStorage.
function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        localStorage.removeItem('access_token');
        document.getElementById('signout_button').style.display = 'none';
        location.reload();
    }
}

function alterarMerenda(element) {    
    menu[0].splice(element.dataset.day, 1, element.value);
    exibirSalvar();
}

function alterarAlmoco(element) {
    menu[1].splice(element.dataset.day, 1, element.value);
    exibirSalvar();
}

function salvarServer(range, array) {
    try {
        gapi.client.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: '1X1p6laul5yRw330M1ROaP8F4T70asWE7IieVsT1Qb7c',
            resource: { data: { range: range, values: transpose(array) }, valueInputOption: 'RAW' },
        }).then(() => {
            ocultarSalvar();
            alert('Cardápio alterado com sucesso!');
        });
    } catch (err) {
        console.error(err.message);
    }
}

// Função para transpor (converter linhas em colunas)
function transpose(matrix) {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

async function adicionarItem() {
    const { value: formValues } = await Swal.fire({
        title: "Adicionar",
        html: `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;">
                <select class="select" id="select">
                    <option value="merenda" selected>Merenda</option>
                    <option value="almoco" selected>Almoço</option>
                </select>
                <label for="swal-input1">Nome</label>
                <input type="text" id="swal-input1" class="inp">
                <label for="swal-input2">Calorias</label>
                <input type="number" id="swal-input2" class="inp">
                <div style="display: flex; width: 100%; justify-content: center;">
                    <label for="swal-input3">Lactose</label>
                    <input type="checkbox" id="swal-input3" class="inp" style="width: 20px">
                </div>
            </div>
        `,
        focusConfirm: false,
        preConfirm: () => {
        return [
            document.getElementById("swal-input1").value,
            document.getElementById("swal-input2").value,
            document.getElementById("swal-input3").checked,
            document.getElementById("select").value
        ];
        }
    });

    if (formValues[3] === 'merenda') {
        menu[3].push(`${formValues[0]}/${Math.floor(Date.now() * Math.random()).toString(36)}/${formValues[1]}/${formValues[2]}`);
        salvarServer('admin!D1:E', [menu[3]]);
    } else if (formValues[3] === 'almoco') {
        menu[4].push(`${formValues[0]}/${Math.floor(Date.now() * Math.random()).toString(36)}/${formValues[1]}/${formValues[2]}`);
        salvarServer('admin!E1:F', [menu[4]]);
    }
    window.location.reload();
}
