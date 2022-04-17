// creates variable to hold db connection
let db;
// establish a connection to IndexedDB database
const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function (event) {
    // save a reference to the database
    const db = event.target.result;
    // create an object store (table) called 'new_entry', set it to have an auto incrementing primary key of sorts
    db.createObjectStore('new_entry', { autoIncrement: true });
};

request.onsuccess = function(event) {
    // when db is successfully created with its object store or simply established a connection, save reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run uploadEntry() function to send all local db data to api
    if (navigator.onLine) {
        uploadEntry()
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
}

// This function will be executed if we attempt to submit a new pizza and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['new_entry'], 'readwrite');

    // access the object store for `new_entry`
    const budgetObjectStore = transaction.objectStore('new_entry');

    // add record to your store with add method
    budgetObjectStore.add(record);

    alert('Transaction saved to indexDB!')
}

function uploadEntry() {
    // open a transaction on your db
    const transaction = db.transaction(['new_entry'], 'readwrite');

    // access your object store
    const budgetObjectStore = transaction.objectStore('new_entry');

    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    // upon a successsful .getAll() execution, run this function
    getAll.onsuccess = function() {
        // if there was data in indexedDb's store, let's send it to the api server
        if(getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                const transaction = db.transaction(['new_entry'], 'readwrite');

                const budgetObjectStore = transaction.objectStore('new_entry');

                budgetObjectStore.clear();

                alert('All saved transactions have been submitted');
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
};

// listen for app coming back online
window.addEventListener('online', uploadEntry);