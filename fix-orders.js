const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("database.db");

console.log("Fixing orders table...");

db.serialize(() => {

db.run(`ALTER TABLE orders ADD COLUMN data TEXT DEFAULT CURRENT_TIMESTAMP`, ()=>{});

});

setTimeout(()=>{
console.log("Orders table fixed ✔");
db.close();
},1000);