const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.db");

db.serialize(() => {
  db.run("ALTER TABLE menu ADD COLUMN stock INTEGER DEFAULT 0", (err) => {
    if (err) {
      // اگر قبلاً اضافه شده باشد همین ارور می‌آید، مهم نیست
      console.log("Maybe already added:", err.message);
    } else {
      console.log("✅ stock column added");
    }
  });

  // اگر می‌خواهی برای آیتم‌های قبلی موجودی پیشفرض بدهی:
  db.run("UPDATE menu SET stock = 20 WHERE stock IS NULL OR stock = 0", (err) => {
    if (err) console.log(err.message);
    else console.log("✅ old items stock set");
  });
});

db.close();