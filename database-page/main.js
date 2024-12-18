const saveBtn = document.querySelector('.save-btn');
const spinner = document.querySelector('.spinner');
const select = document.querySelector('.select');
const section = document.querySelector('.itens');
const addBtn = document.querySelector('.add-item-btn');

const CLIENT_ID = '293531894729-htvn6ikdidqnbt83stj818k8mmh2u3ov.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAEOb_1iv4NXFeV7OQph2FW5UpqCUiGMcc';
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient;
let gapiInited = false;
let gisInited = false;

let menu;

select.addEventListener('change', () => loadCards(select.value));
addBtn.addEventListener('click', () => {
    databaseIndex = select.value === 'merenda' ? 0 : 1;
    manageItem('add', databaseIndex);
});

// Callback after api.js is loaded.
function gapiLoaded() {
    spinner.style.display = 'block';
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

        spinner.style.display = 'none';      
        
        menu = transpose(response.result.values);  
        loadCards(select.value);
        getAuth();
    } catch (err) {
        console.error(err.message);
    }
}

// Save data in server
async function postData(range, array) {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: '1X1p6laul5yRw330M1ROaP8F4T70asWE7IieVsT1Qb7c',
            resource: {
                data: { range: range, values: transpose(array) },
                valueInputOption: 'RAW'
            },
        });

        if (!response.status === 200) alert('Erro ao alterar dados!');
    } catch (err) {
        console.error("Erro:", err.message);
        alert('Erro ao alterar dados!');
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
        alert('Erro ao deletar dados!');
    }
}

// Função for transpor (convert rows to columns)
function transpose(matrix) {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

// Loads cards for change data
function loadCards(type) {
    section.innerHTML = '';

    let items = [];
    sortMenu();

    if (type === 'merenda' || type === 0) items = menu[0];
    else if (type === 'almoco' || type === 1) items = menu[1];

    items.forEach(item => {
        if (item != undefined && item !== '') {
            const name = item.split('/')[0];
            const id = item.split('/')[1];
            section.appendChild(elementItem(name, id));
        }
    });
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
        sortMenu();

        const snack = clearArray(menu[0]);
        const lunch = clearArray(menu[1]);
        const data = [snack, lunch];
        
        postData('admin!D:E', data);

        deleteData("D", snack.length + 1);
        deleteData("E", lunch.length + 1);

        loadCards(databaseIndex);
    }
}

// Load a dialog to add and edit item to the server
async function manageItem(action, databaseIndex, itemIndex) {
    const isEdit = action === 'edit';

    let initialValues = {
        title: isEdit ? "Editar Item" : "Adicionar",
        name: "",
        calories: "",
        lactose: false,
        type: databaseIndex === 0 ? "merenda" : "almoco"
    };

    if (isEdit) {
        const item = menu[databaseIndex][itemIndex].split('/');
        initialValues = {
            ...initialValues,
            name: item[0],
            calories: item[2],
            lactose: item[3] === 'true',
        };
    }

    const { value: formValues } = await Swal.fire({
        title: initialValues.title,
        html: `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;">
                <label for="swal-input1">Nome</label>
                <input type="text" id="swal-input1" class="inp" value="${initialValues.name}">
                <label for="swal-input2">Calorias</label>
                <input type="number" id="swal-input2" class="inp" value="${initialValues.calories}">
                <div style="display: flex; width: 100%; justify-content: center;">
                    <label for="swal-input3">Lactose</label>
                    <input type="checkbox" id="swal-input3" class="inp" style="width: 20px" ${initialValues.lactose ? 'checked' : ''}>
                </div>
            </div>
        `,
        focusConfirm: false,
        preConfirm: () => {
            const name = document.getElementById("swal-input1").value.trim();
            const calories = document.getElementById("swal-input2").value.trim();

            if (!name || !calories) {
                Swal.showValidationMessage("Os campos 'Nome' e 'Calorias' são obrigatórios.");
                return false;
            }

            return {
                name,
                calories,
                lactose: document.getElementById("swal-input3").checked,
                type: document.querySelector(".select-type")?.value || initialValues.type
            };
        }
    });

    if (formValues) {
        const { name, calories, lactose, type } = formValues;

        if (isEdit) {
            const item = menu[databaseIndex][itemIndex].split('/');
            menu[databaseIndex][itemIndex] = `${name}/${item[1]}/${calories}/${lactose}`;

            const snack = clearArray(menu[0]);
            const lunch = clearArray(menu[1]);
            sortMenu();
            postData('admin!D:E', [snack, lunch]);
            loadCards(databaseIndex);
        } else {
            const itemData = `${name}/${generateUniqueId()}/${calories}/${lactose}`;
            const menuIndex = type === 'merenda' ? 0 : 1;
            const range = type === 'merenda' ? 'admin!D1:E' : 'admin!E1:F';

            menu[menuIndex].push(itemData);
            sortMenu();
            postData(range, [menu[menuIndex]]);
            loadCards(databaseIndex);
        }
    }
}

// Make a random ID
function generateUniqueId() {
    return Math.floor(Date.now() * Math.random()).toString(36);
}

// Clear arrays
function clearArray(array) {
    return array.filter(elemento => elemento !== undefined && elemento !== '');
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
    
    deleteBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        deleteItem(databaseIndex, itemIndex);
    });

    div.appendChild(name);
    div.appendChild(deleteBtn);

    div.addEventListener('click', () => manageItem('edit', databaseIndex, itemIndex));

    return div;
}

function sortMenu() {
    menu.forEach((item) => {
        item.sort((a, b) => {
            const nameA = a.split('/')[0].toLowerCase();
            const nameB = b.split('/')[0].toLowerCase();
            return nameA.localeCompare(nameB);
        });
    });
}
