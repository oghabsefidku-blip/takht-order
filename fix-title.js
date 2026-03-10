const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.db");

db.run(
  `UPDATE menu
   SET title =
     CASE
       WHEN title LIKE '"%"' THEN trim(title, '"')
       WHEN title LIKE '''%''' THEN trim(title, '''')
       ELSE title
     END
  `,
  function (err) {
    if (err) console.error(err);
    else console.log("Done. Rows updated:", this.changes);
    db.close();
  }
);