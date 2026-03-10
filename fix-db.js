const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("database.db");

console.log("Fixing database...");

db.serialize(() => {

db.run(`ALTER TABLE orders ADD COLUMN customer_name TEXT`, ()=>{});
db.run(`ALTER TABLE orders ADD COLUMN customer_phone TEXT`, ()=>{});
db.run(`ALTER TABLE orders ADD COLUMN total REAL DEFAULT 0`, ()=>{});
db.run(`ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'new'`, ()=>{});

});

setTimeout(()=>{
console.log("Database fixed ✔");
db.close();
},1000);