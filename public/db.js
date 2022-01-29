let db;

const request = indexedDB.open("budget", 1);

request.onupgradeneeded = ({target}) => {
  db = target.result;
  console.log("upgrade" + db);
  db.createObjectStore("offlineStore", { autoIncrement: true });
};

request.onerror = function ({target}) {
  console.log(target.errorCode);
};

request.onsuccess = (event) => {
  if (navigator.onLine) {
    checkDB();
  }
};

const saveRecord = (record) => {
  const transaction = db.transaction(["offlineStore"], "readwrite");
  const store = transaction.objectStore("offlineStore");
  store.add(record);
};

function checkDB() {
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