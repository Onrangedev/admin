const authBtn = document.querySelector('.auth-btn');
const singBtn = document.querySelector('.sing-btn');
const addBtn = document.querySelector('.add-btn');
const databaseBtn = document.querySelector('.database-btn');
const saveBtn = document.querySelector('.save-btn');
const statusSelect = document.querySelector('.status-select');

const msgAuthBtn = document.querySelector('.call-authorize');
const loggedOutMsg = document.querySelector('.logged-out-msg');

const container = document.querySelector('.container');

const CLIENT_ID = '293531894729-htvn6ikdidqnbt83stj818k8mmh2u3ov.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAEOb_1iv4NXFeV7OQph2FW5UpqCUiGMcc';
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient;
let gapiInited = false;
let gisInited = false;

let menu = [];

saveBtn.addEventListener('click', () =>  {
    const date = new Date();
    menu[2][0] = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;    
    saveServer('admin!A1:C', [menu[0], menu[1], menu[2]]);
});

addBtn.addEventListener('click', () => addItem());
statusSelect.addEventListener('change', () => changeStatus());

document.querySelectorAll('.select-merenda').forEach((element) => element.addEventListener('change', () => changeSnack(element)));
document.querySelectorAll('.select-almoco').forEach((element) => element.addEventListener('change', () => changeLunch(element)));

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
        loadButtons();
        getData();
    } catch (err) {
        console.error("Error loading GAPI client:", err);
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
    loadButtons();
}

// Get data from Google Sheets server
async function getData() {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: '1X1p6laul5yRw330M1ROaP8F4T70asWE7IieVsT1Qb7c',
            range: 'admin!A:E',
        });
        
        menu = transpose(response.result.values);
        printMenuOptions();
    } catch (err) {
        if (err.status === 401) signout();
        console.error(err.message);
    }
}

// Print the snack and lunch options on the menu
function printMenuOptions() {
    const selectElements = {
        merenda: document.querySelectorAll('.select-merenda'),
        almoco: document.querySelectorAll('.select-almoco')
    };

    const meals = ['merenda', 'almoco'];

    meals.forEach((meal, mealIndex) => {
        const elements = selectElements[meal];
        const menuItems = menu[mealIndex + 3];
        const defaultValues = menu[mealIndex];

        elements.forEach((element, elementIndex) => {
            menuItems.forEach(item => {
                if (item) {
                    const option = createMenuOption(item);
                    element.appendChild(option);

                    if (option.value === defaultValues[elementIndex]) element.value = option.value;
                }
            });
        });
    });
}

function createMenuOption(item) {
    const [text] = item.split('/');
    return new Option(text, item);
}

// Enables user interaction after all libraries are loaded and checks if token exists in localStorage
function loadButtons() {
    if (gapiInited && gisInited) {
        const storedToken = localStorage.getItem('access_token');
        if (storedToken) {
            gapi.client.setToken({ access_token: storedToken });
            singBtn.style.display = 'inline';
            databaseBtn.style.display = 'inline';
            loadCards();
        } else {
            authBtn.style.display = 'inline';
            loggedOutMsg.style.display = 'block';
        }
    }
}

// Show the button save
function showSaveBtn(value) {
    saveBtn.style.display = value;
}

// Load cards for changing menu
function loadCards() {
    container.style.display = 'flex';
    loggedOutMsg.style.display = 'none';
}

// Sign in the user upon button click and store the token in localStorage
function auth() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) throw (resp);
        const token = gapi.client.getToken();
        localStorage.setItem('access_token', token.access_token);

        singBtn.style.display = 'inline';
        databaseBtn.style.display = 'inline';
        authBtn.style.display = 'none';
        loggedOutMsg.style.display = 'none';

        loadCards();
    };

    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
        gapi.client.setToken({ access_token: storedToken });
        tokenClient.callback({ access_token: storedToken });
    } else {
        if (gapi.client.getToken() === null) tokenClient.requestAccessToken({ prompt: 'consent' });
        else tokenClient.requestAccessToken({ prompt: '' });
    }
}

// Sign out the user upon button click and remove token from localStorage.
function signout() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');

        localStorage.removeItem('access_token');

        singBtn.style.display = 'none';
        databaseBtn.style.display = 'none';

        location.reload();
    }
}

// Change snack
function changeSnack(element) {    
    menu[0].splice(element.dataset.day, 1, element.value);
    showSaveBtn('block');
}

// Change lunch
function changeLunch(element) {
    menu[1].splice(element.dataset.day, 1, element.value);
    showSaveBtn('block');
}

// Change status of app
function changeStatus() {
    const status = statusSelect.value;
    menu[2][1] = status;
    saveServer('admin!C:C', [menu[2]]);
}

// Save of menu in google sheets
function saveServer(range, array) {
    try {
        gapi.client.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: '1X1p6laul5yRw330M1ROaP8F4T70asWE7IieVsT1Qb7c',
            resource: { data: { range: range, values: transpose(array) }, valueInputOption: 'RAW' },
        }).then(() => {
            showSaveBtn('none');
            alert('Cardápio alterado com sucesso!');
        });
    } catch (err) {
        console.error(err.message);
    }
}

// Função para transpor (convert rows to columns)
function transpose(matrix) {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

// Load a dialog to add a new item to the server
async function addItem() {
    const { value: formValues } = await Swal.fire({
        title: "Adicionar",
        html: `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;">
                <select class="select" id="select">
                    <option value="merenda" selected>Merenda</option>
                    <option value="almoco">Almoço</option>
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
            const nome = document.getElementById("swal-input1").value.trim();
            const calorias = document.getElementById("swal-input2").value.trim();

            if (!nome || !calorias) {
                Swal.showValidationMessage("Os campos 'Nome' e 'Calorias' são obrigatórios.");
                return false;
            }

            return {
                nome,
                calorias,
                lactose: document.getElementById("swal-input3").checked,
                tipo: document.getElementById("select").value
            };
        }
    });

    if (formValues) {
        const { nome, calorias, lactose, tipo } = formValues;
        const itemData = `${nome}/${generateUniqueId()}/${calorias}/${lactose}`;
        const menuIndex = tipo === 'merenda' ? 3 : 4;
        const range = tipo === 'merenda' ? 'admin!D1:E' : 'admin!E1:F';

        menu[menuIndex].push(itemData);
        saveServer(range, [menu[menuIndex]]);
        window.location.reload();
    }
}


// Make a random ID
function generateUniqueId() {
    return Math.floor(Date.now() * Math.random()).toString(36);
}
