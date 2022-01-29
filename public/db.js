let db;

const request = indexedDB.open("budget", 1);

request.onupgradeneeded = ({target}) => { //Create offline storage
  db = target.result;
  db.createObjectStore("offlineStore", { autoIncrement: true });
};

request.onerror = function ({target}) { //Error log
  console.log(target.errorCode);
};

request.onsuccess = (event) => { //When back online, update database if necessary
  if (navigator.onLine) {
    checkDB();
  }
};

const saveRecord = (record) => { //Save to offline storage
  const transaction = db.transaction(["offlineStore"], "readwrite");
  const store = transaction.objectStore("offlineStore");
  store.add(record);
};

function checkDB() { //Gets offline storage data (bulk) and adds it to database
  const transaction = db.transaction(["offlineStore"], "readwrite");
  const store = transaction.objectStore("offlineStore");
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          return response.json();
        })
        .then(() => {
          const transaction = db.transaction(["offlineStore"], "readwrite");
          const store = transaction.objectStore("offlineStore");

          store.clear();
        });
    }
  };
}

window.addEventListener("online", checkDB);