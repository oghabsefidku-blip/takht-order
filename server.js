const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const dbPath = path.join(__dirname, "database.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("DB connection error:", err.message);
  } else {
    console.log("DB connected:", dbPath);
  }
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function tableInfo(tableName) {
  return await all(`PRAGMA table_info(${tableName})`);
}

async function columnExists(tableName, columnName) {
  const cols = await tableInfo(tableName);
  return cols.some((c) => c.name === columnName);
}

async function ensureColumn(tableName, columnName, definitionSql) {
  const exists = await columnExists(tableName, columnName);
  if (!exists) {
    await run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definitionSql}`);
  }
}

function mapOrderRow(order, items = []) {
  return {
    id: order.id,
    orderId: order.id,
    customerName: order.customer_name || "",
    customerPhone: order.customer_phone || "",
    customer_name: order.customer_name || "",
    customer_phone: order.customer_phone || "",
    address: order.customer_address || "",
    tableOrAddress: order.customer_address || "",
    customer_address: order.customer_address || "",
    locationText: order.customer_location || "",
    customer_location: order.customer_location || "",
    notes: order.notes || "",
    total: Number(order.total || 0),
    status: order.status || "new",
    createdAt: order.data || "",
    data: order.data || "",
    items: items.map((item) => ({
      id: item.id,
      menu_item_id: item.id,
      title: item.title,
      name: item.title,
      price: Number(item.price || 0),
      qty: Number(item.qty || 0),
      quantity: Number(item.qty || 0),
      row_total: Number(item.row_total || 0),
      rowTotal: Number(item.row_total || 0),
      image: item.image || "",
      category: item.category || "other"
    }))
  };
}

async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0
    )
  `);

  await ensureColumn("menu_items", "category", `TEXT NOT NULL DEFAULT 'other'`);
  await ensureColumn("menu_items", "image", `TEXT NOT NULL DEFAULT ''`);
  await ensureColumn("menu_items", "sort_order", `INTEGER NOT NULL DEFAULT 0`);

  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT
    )
  `);

  await ensureColumn("orders", "customer_name", `TEXT`);
  await ensureColumn("orders", "customer_phone", `TEXT`);
  await ensureColumn("orders", "customer_address", `TEXT NOT NULL DEFAULT ''`);
  await ensureColumn("orders", "customer_location", `TEXT NOT NULL DEFAULT ''`);
  await ensureColumn("orders", "notes", `TEXT NOT NULL DEFAULT ''`);
  await ensureColumn("orders", "total", `REAL NOT NULL DEFAULT 0`);
  await ensureColumn("orders", "status", `TEXT NOT NULL DEFAULT 'new'`);
  await ensureColumn("orders", "data", `TEXT NOT NULL DEFAULT ''`);

  await run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      menu_item_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      qty INTEGER NOT NULL DEFAULT 1,
      row_total REAL NOT NULL DEFAULT 0,
      image TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'other'
    )
  `);

  const countRow = await get(`SELECT COUNT(*) AS count FROM menu_items`);
  if (!countRow || Number(countRow.count) === 0) {
    await run(
      `INSERT INTO menu_items (name, price, stock, category, image, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ["چلوکباب", 2.5, 20, "food", "", 1]
    );

    await run(
      `INSERT INTO menu_items (name, price, stock, category, image, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ["سالاد شیرازی", 0.5, 15, "yogurt_salad", "", 2]
    );

    await run(
      `INSERT INTO menu_items (name, price, stock, category, image, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ["نوشابه", 0.25, 50, "drinks", "", 3]
    );

    await run(
      `INSERT INTO menu_items (name, price, stock, category, image, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ["باقلوا", 1, 12, "desserts", "", 4]
    );
  }
}

/* -------------------- HEALTH -------------------- */

app.get("/api/health", async (req, res) => {
  res.json({
    ok: true,
    message: "Server is working"
  });
});

/* -------------------- MENU -------------------- */

app.get("/api/menu", async (req, res) => {
  try {
    const rows = await all(`
      SELECT
        id,
        name AS title,
        name,
        price,
        stock,
        COALESCE(category, 'other') AS category,
        COALESCE(image, '') AS image,
        COALESCE(sort_order, 0) AS sort_order
      FROM menu_items
      ORDER BY
        CASE COALESCE(category, 'other')
          WHEN 'food' THEN 1
          WHEN 'yogurt_salad' THEN 2
          WHEN 'drinks' THEN 3
          WHEN 'desserts' THEN 4
          ELSE 5
        END,
        sort_order ASC,
        id ASC
    `);

    res.json({
      ok: true,
      rows
    });
  } catch (err) {
    console.log(err);
    res.json({
      ok: false,
      error: "خطا در دریافت منو"
    });
  }
});

app.post("/api/menu", async (req, res) => {
  try {
    const { name, price, stock, category, image } = req.body;

    if (!name || price === undefined || price === null || price === "") {
      return res.json({
        ok: false,
        error: "نام و قیمت لازم است"
      });
    }

    const maxRow = await get(`SELECT COALESCE(MAX(sort_order), 0) AS maxOrder FROM menu_items`);
    const nextOrder = Number(maxRow?.maxOrder || 0) + 1;

    const result = await run(
      `INSERT INTO menu_items (name, price, stock, category, image, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        String(name).trim(),
        Number(price),
        Number(stock || 0),
        String(category || "other").trim(),
        String(image || "").trim(),
        nextOrder
      ]
    );

    res.json({
      ok: true,
      id: result.lastID
    });
  } catch (err) {
    console.log(err);
    res.json({
      ok: false,
      error: "خطا در افزودن آیتم"
    });
  }
});

app.put("/api/menu/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await get(`SELECT * FROM menu_items WHERE id = ?`, [id]);

    if (!existing) {
      return res.json({
        ok: false,
        error: "آیتم پیدا نشد"
      });
    }

    const name = req.body.name !== undefined ? String(req.body.name).trim() : existing.name;
    const price = req.body.price !== undefined ? Number(req.body.price) : Number(existing.price || 0);
    const stock = req.body.stock !== undefined ? Number(req.body.stock) : Number(existing.stock || 0);
    const category =
      req.body.category !== undefined
        ? String(req.body.category || "other").trim()
        : existing.category || "other";
    const image =
      req.body.image !== undefined ? String(req.body.image || "").trim() : existing.image || "";
    const sortOrder =
      req.body.sort_order !== undefined
        ? Number(req.body.sort_order)
        : Number(existing.sort_order || 0);

    await run(
      `UPDATE menu_items
       SET name = ?, price = ?, stock = ?, category = ?, image = ?, sort_order = ?
       WHERE id = ?`,
      [name, price, stock, category, image, sortOrder, id]
    );

    res.json({
      ok: true
    });
  } catch (err) {
    console.log(err);
    res.json({
      ok: false,
      error: "خطا در ویرایش آیتم"
    });
  }
});

app.delete("/api/menu/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await run(`DELETE FROM menu_items WHERE id = ?`, [id]);

    res.json({
      ok: true
    });
  } catch (err) {
    console.log(err);
    res.json({
      ok: false,
      error: "خطا در حذف آیتم"
    });
  }
});

/* -------------------- ORDER CREATE -------------------- */

app.post("/api/order", async (req, res) => {
  try {
    console.log("ORDER BODY =>", req.body);

    const name = String(req.body.name || req.body.customerName || "").trim();
    const phone = String(req.body.phone || req.body.customerPhone || "").trim();

    const address = String(
      req.body.address ||
        req.body.tableOrAddress ||
        req.body.customerAddress ||
        ""
    ).trim();

    const locationText = String(
      req.body.locationText ||
        req.body.location ||
        req.body.customerLocation ||
        ""
    ).trim();

    const notes = String(
      req.body.notes ||
        req.body.note ||
        req.body.suggestions ||
        ""
    ).trim();

    const items = Array.isArray(req.body.items) ? req.body.items : [];

    if (!name || !phone || items.length === 0) {
      return res.json({
        ok: false,
        error: "اطلاعات سفارش کامل نیست"
      });
    }

    const now = new Date().toISOString();
    const menu = await all(`SELECT * FROM menu_items`);

    let total = 0;
    const normalized = [];

    for (const item of items) {
      const menuItem = menu.find((m) => Number(m.id) === Number(item.id));

      if (!menuItem) {
        return res.json({
          ok: false,
          error: `آیتم با شناسه ${item.id} پیدا نشد`
        });
      }

      const qty = Number(item.qty || item.quantity || 0);

      if (qty <= 0) continue;

      if (Number(menuItem.stock || 0) < qty) {
        return res.json({
          ok: false,
          error: `موجودی ${menuItem.name} کافی نیست`
        });
      }

      const rowTotal = Number(menuItem.price) * qty;
      total += rowTotal;

      normalized.push({
        id: menuItem.id,
        name: menuItem.name,
        price: Number(menuItem.price),
        qty,
        rowTotal,
        image: menuItem.image || "",
        category: menuItem.category || "other"
      });
    }

    if (!normalized.length) {
      return res.json({
        ok: false,
        error: "هیچ آیتم معتبری برای سفارش وجود ندارد"
      });
    }

    const orderResult = await run(
      `INSERT INTO orders
      (customer_name, customer_phone, customer_address, customer_location, notes, total, status, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        phone,
        address,
        locationText,
        notes,
        total,
        "new",
        now
      ]
    );

    const orderId = orderResult.lastID;

    for (const item of normalized) {
      await run(
        `INSERT INTO order_items
        (order_id, menu_item_id, title, price, qty, row_total, image, category)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.id,
          item.name,
          item.price,
          item.qty,
          item.rowTotal,
          item.image,
          item.category
        ]
      );

      await run(
        `UPDATE menu_items
         SET stock = stock - ?
         WHERE id = ?`,
        [item.qty, item.id]
      );
    }

    res.json({
      ok: true,
      orderId,
      id: orderId,
      total
    });
  } catch (err) {
    console.log("ORDER SAVE ERROR:", err);

    res.json({
      ok: false,
      error: "خطا در ثبت سفارش"
    });
  }
});

/* -------------------- ORDERS LIST -------------------- */

app.get("/api/orders", async (req, res) => {
  try {
    const orders = await all(`
      SELECT
        id,
        customer_name,
        customer_phone,
        COALESCE(customer_address, '') AS customer_address,
        COALESCE(customer_location, '') AS customer_location,
        COALESCE(notes, '') AS notes,
        total,
        status,
        data
      FROM orders
      ORDER BY id DESC
    `);

    const result = [];

    for (const order of orders) {
      const items = await all(
        `SELECT
          menu_item_id AS id,
          title,
          price,
          qty,
          row_total,
          image,
          category
         FROM order_items
         WHERE order_id = ?
         ORDER BY id ASC`,
        [order.id]
      );

      result.push(mapOrderRow(order, items));
    }

    res.json({
      ok: true,
      rows: result
    });
  } catch (err) {
    console.log(err);
    res.json({
      ok: false,
      error: "خطا در دریافت سفارش‌ها"
    });
  }
});

/* -------------------- SINGLE ORDER -------------------- */

async function sendSingleOrder(id, res) {
  const order = await get(
    `SELECT
      id,
      customer_name,
      customer_phone,
      COALESCE(customer_address, '') AS customer_address,
      COALESCE(customer_location, '') AS customer_location,
      COALESCE(notes, '') AS notes,
      total,
      status,
      data
    FROM orders
    WHERE id = ?`,
    [id]
  );

  if (!order) {
    return res.status(404).json({
      ok: false,
      error: "سفارش پیدا نشد"
    });
  }

  const items = await all(
    `SELECT
      menu_item_id AS id,
      title,
      price,
      qty,
      row_total,
      image,
      category
    FROM order_items
    WHERE order_id = ?
    ORDER BY id ASC`,
    [id]
  );

  const mapped = mapOrderRow(order, items);

  return res.json({
    ok: true,
    ...mapped,
    order: mapped
  });
}

app.get("/api/order/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await sendSingleOrder(id, res);
  } catch (err) {
    console.log("GET ORDER ERROR:", err);
    res.status(500).json({
      ok: false,
      error: "خطا در دریافت سفارش"
    });
  }
});

app.get("/api/orders/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await sendSingleOrder(id, res);
  } catch (err) {
    console.log("GET ORDER ERROR:", err);
    res.status(500).json({
      ok: false,
      error: "خطا در دریافت سفارش"
    });
  }
});

/* -------------------- ORDER STATUS -------------------- */

app.post("/api/orders/:id/status", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    await run(
      `UPDATE orders SET status = ? WHERE id = ?`,
      [status || "new", id]
    );

    res.json({
      ok: true
    });
  } catch (err) {
    console.log(err);
    res.json({
      ok: false,
      error: "خطا در تغییر وضعیت سفارش"
    });
  }
});

app.delete("/api/orders/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existing = await get(`SELECT id FROM orders WHERE id = ?`, [id]);

    if (!existing) {
      return res.json({
        ok: false,
        error: "سفارش پیدا نشد"
      });
    }

    await run(`DELETE FROM order_items WHERE order_id = ?`, [id]);
    await run(`DELETE FROM orders WHERE id = ?`, [id]);

    res.json({
      ok: true
    });
  } catch (err) {
    console.log("DELETE ORDER ERROR:", err);
    res.json({
      ok: false,
      error: "خطا در حذف سفارش"
    });
  }
});

/* -------------------- START -------------------- */

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB init error:", err.message);
  });