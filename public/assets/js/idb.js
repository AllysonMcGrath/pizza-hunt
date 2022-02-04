// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'pizza_hunt' and set it to version 1
const request = indexedDB.open('pizza_hunt', 1);
// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event) {
    //save reference to database
    const db = event.target.result;
    //create an object store(table) called 'new_pizza', set it to have an auto incr primary key
    db.createObjectStore('new_pizza', { autoIncrement: true });
};

request.onsuccess = function(event) {
    db = event.target.result;

    if (navigator.online) {
        uploadPizza();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new pizza and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_pizza'], 'readwrite');

    // access the object store for `new_pizza`
    const pizzaObjectStore = transaction.objectStore('new_pizza');
    
    //add record to store with add method
    pizzaObjectStore.add(record);
};

function uploadPizza() {
    //open a transaction on your db
    const transaction = db.transaction(['new_pizza'], readwrite);

    //access your object store
    const pizzaObjectStore = transaction.objectStore('new_pizza');

    //gets all records from store and set to a variable
    const getAll = pizzaObjectStore.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch('/api/pizzas', {
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
                const transaction = db.transaction(['new_pizza'], 'readwrite');
                const pizzaObjectStore = transaction.objectStore('new_pizza');
                pizzaObjectStore.clear();

                alert('All saved pizzas have been submitted!');
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
};

window.addEventListener('online', uploadPizza);