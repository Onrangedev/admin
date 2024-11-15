const saveBtn = document.querySelector('.save-btn');
const select = document.querySelector('.select');
const section = document.querySelector('.itens');

const CLIENT_ID = '293531894729-htvn6ikdidqnbt83stj818k8mmh2u3ov.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAEOb_1iv4NXFeV7OQph2FW5UpqCUiGMcc';
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient;
let gapiInited = false;
let gisInited = false;

let menu;

select.addEventListener('change', () => loadCards(select.value));

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
        getData();
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
}

// try to authenticate from localstorage
function getAuth() {
    console.log(gisInited, gapiInited);
    if (gapiInited && gisInited) {
        const storedToken = localStorage.getItem('access_token');
        if (storedToken) gapi.client.setToken({ access_token: storedToken });
    }
}

// Get data in server
async function getData() {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: '1X1p6laul5yRw330M1ROaP8F4T70asWE7IieVsT1Qb7c',
            range: 'admin!D:E',
        });
        
        menu = transpose(response.result.values);        
        loadCards(select.value);
        getAuth();
    } catch (err) {
        console.error(err.message);
    }
}

// Save data in server
function postData(range, array) {
    try {
        gapi.client.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: '1X1p6laul5yRw330M1ROaP8F4T70asWE7IieVsT1Qb7c',
            resource: { data: { range: range, values: transpose(array) }, valueInputOption: 'RAW' },
        }).then();
    } catch (err) {
        console.error(err.message);
    }
}

// Delete data in server
async function deleteData(column, startRow) {
    try {
        gapi.client.sheets.spreadsheets.values.clear({
            spreadsheetId: '1X1p6laul5yRw330M1ROaP8F4T70asWE7IieVsT1Qb7c',
            range: `admin!${column}${startRow}:${column}`,
        }).then();
    } catch (err) {
        console.error(err.message);
    }
}

// Função for transpor (convert rows to columns)
function transpose(matrix) {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

// Loads cards for change data
function loadCards(type) {
    section.innerHTML = '';

    if (type === 'merenda' || type === 0) {
        menu[0].forEach(item => {
            if (item != undefined && item !== '') {
                const name = item.split('/')[0];
                const id = item.split('/')[1];
                section.appendChild(elementItem(name, id));
            }
        });
    } else if (type === 'almoco' || type === 1) {
        menu[1].forEach(item => {
            if (item != undefined && item !== '') {
                const name = item.split('/')[0];
                const id = item.split('/')[1];
                section.appendChild(elementItem(name, id));
            }
        });
    }
}

// Make a container for the manager a data in server
function elementItem(text, id) {    
    const div = document.createElement('div');
    const name = document.createElement('span');
    const deleteBtn = document.createElement('span');

    name.classList.add('name');
    deleteBtn.classList.add('delete');

    div.dataset.id = id;

    name.textContent = text;
    deleteBtn.textContent = 'x';

    const [databaseIndex, itemIndex] = locateItemIndex(div.dataset.id);
    
    deleteBtn.addEventListener('click', () => deleteItem(databaseIndex, itemIndex));

    div.appendChild(name);
    div.appendChild(deleteBtn);

    return div;
}

// locate a item with id
function locateItemIndex(id) {
    let databaseIndex;
    let itemIndex;

    menu.forEach((database, index) => {
        database.forEach((item, itemIn) => {
            if (item && item.split('/')[1] === id) {
                databaseIndex = index;
                itemIndex = itemIn;
            }
        });
    });
    
    return [databaseIndex, itemIndex];
}

// Delete item with index from local database and server
function deleteItem(databaseIndex, itemIndex) {
    const name = menu[databaseIndex][itemIndex].split('/')[0];
    const confirmation = window.confirm(`Você realmente deseja APAGAR o item '${name}'`);

    if (confirmation) {
        menu[databaseIndex].splice(itemIndex, 1);

        console.log(menu);
        
        const snack = clearArray(menu[0]);
        const lunch = clearArray(menu[1]);
        const data = [snack, lunch]
        
        postData('admin!D:E', data);

        deleteData("D", snack.length+1);
        deleteData("E", lunch.length+1);

        loadCards(databaseIndex);
    }
}

// Clear arrays
function clearArray(array) {
    return array.filter(elemento => elemento !== undefined && elemento !== '');
}
