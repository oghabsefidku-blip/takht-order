async function uploadImage(file){
  const fd = new FormData();
  fd.append("image", file);
  const r = await fetch("/api/upload", { method: "POST", body: fd });
  if(!r.ok) throw new Error(await r.text());
  return await r.json();
}

function rowInput(id, key){
  return document.querySelector(`[data-id="${id}"][data-k="${key}"]`);
}

function categoryOptions(selectedValue = "سایر"){
  const categories = [
    "کباب",
    "خورشت",
    "برنج",
    "سالاد",
    "نوشیدنی",
    "دسر",
    "پیش‌غذا",
    "سایر"
  ];

  return categories.map(cat => `
    <option value="${cat}" ${selectedValue === cat ? "selected" : ""}>${cat}</option>
  `).join("");
}

async function loadList(){
  const el = document.getElementById("list");

  try{
    const items = await api("/api/menu/all");

    if(!items.length){
      el.innerHTML = `<div class="muted">هنوز آیتمی ثبت نشده.</div>`;
      return;
    }

    el.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>عکس</th>
            <th>FA</th>
            <th>EN</th>
            <th>AR</th>
            <th>دسته</th>
            <th>قیمت</th>
            <th>ترتیب</th>
            <th>فعال</th>
            <th>عملیات</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(it => `
            <tr>
              <td>
                ${it.image_url
                  ? `<img src="${esc(it.image_url)}" style="width:44px;height:44px;border-radius:12px;object-fit:cover">`
                  : `<span class="muted">—</span>`}
                <div style="margin-top:8px">
                  <input type="file" accept="image/*" data-id="${it.id}" data-k="imgfile"/>
                </div>
              </td>

              <td><input value="${esc(it.title_fa || "")}" data-id="${it.id}" data-k="title_fa"></td>
              <td><input value="${esc(it.title_en || "")}" data-id="${it.id}" data-k="title_en"></td>
              <td><input value="${esc(it.title_ar || "")}" data-id="${it.id}" data-k="title_ar"></td>

              <td>
                <select data-id="${it.id}" data-k="category">
                  ${categoryOptions(it.category || "سایر")}
                </select>
              </td>

              <td><input type="number" step="0.001" value="${Number(it.price || 0)}" data-id="${it.id}" data-k="price"></td>
              <td><input type="number" step="1" value="${Number(it.sort_order || 0)}" data-id="${it.id}" data-k="sort_order"></td>

              <td>
                <select data-id="${it.id}" data-k="is_active">
                  <option value="1" ${Number(it.is_active) === 1 ? "selected" : ""}>1</option>
                  <option value="0" ${Number(it.is_active) === 0 ? "selected" : ""}>0</option>
                </select>
              </td>

              <td style="white-space:nowrap">
                <button class="btn ok" onclick='saveItem(${it.id}, ${JSON.stringify(it.image_url || "")})'>ذخیره</button>
                <button class="btn bad" onclick="delItem(${it.id})">حذف</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }catch(err){
    console.error(err);
    el.innerHTML = `<div class="muted">خطا در دانلود منو: ${err.message}</div>`;
  }
}

async function saveItem(id, currentImageUrl){
  try{
    let image_url = currentImageUrl || "";

    const fileInput = rowInput(id, "imgfile");
    if(fileInput && fileInput.files && fileInput.files[0]){
      const up = await uploadImage(fileInput.files[0]);
      image_url = up.url;
    }

    const body = {
      title_fa: rowInput(id, "title_fa").value.trim(),
      title_en: rowInput(id, "title_en").value.trim(),
      title_ar: rowInput(id, "title_ar").value.trim(),
      category: rowInput(id, "category").value,
      price: Number(rowInput(id, "price").value || 0),
      sort_order: Number(rowInput(id, "sort_order").value || 0),
      is_active: Number(rowInput(id, "is_active").value || 1),
      image_url
    };

    await api(`/api/menu/${id}`, "PUT", body);

    document.getElementById("msg").textContent = "ذخیره شد ✅";
    setTimeout(() => {
      document.getElementById("msg").textContent = "";
    }, 1200);

    await loadList();
  }catch(err){
    console.error(err);
    document.getElementById("msg").textContent = "خطا: " + err.message;
  }
}

async function delItem(id){
  try{
    await api(`/api/menu/${id}`, "DELETE");
    await loadList();
  }catch(err){
    console.error(err);
    document.getElementById("msg").textContent = "خطا: " + err.message;
  }
}

document.getElementById("addBtn").onclick = async () => {
  try{
    const title_fa = document.getElementById("fa").value.trim();
    const title_en = document.getElementById("en").value.trim();
    const title_ar = document.getElementById("ar").value.trim();
    const category = document.getElementById("category").value;
    const price = Number(document.getElementById("price").value || 0);
    const sort_order = Number(document.getElementById("sort").value || 0);
    const is_active = Number(document.getElementById("active").value || 1);

    let image_url = "";
    const file = document.getElementById("img").files[0];
    if(file){
      const up = await uploadImage(file);
      image_url = up.url;
    }

    await api("/api/menu", "POST", {
      title_fa,
      title_en,
      title_ar,
      category,
      price,
      image_url,
      is_active,
      sort_order
    });

    document.getElementById("fa").value = "";
    document.getElementById("en").value = "";
    document.getElementById("ar").value = "";
    document.getElementById("category").value = "کباب";
    document.getElementById("price").value = "";
    document.getElementById("sort").value = "0";
    document.getElementById("active").value = "1";
    document.getElementById("img").value = "";

    document.getElementById("msg").textContent = "اضافه شد ✅";
    setTimeout(() => {
      document.getElementById("msg").textContent = "";
    }, 1200);

    await loadList();
  }catch(err){
    console.error(err);
    document.getElementById("msg").textContent = "خطا: " + err.message;
  }
};

document.getElementById("refreshBtn").onclick = loadList;

(async () => {
  await loadList();
  const socket = io();
  socket.on("menu:updated", loadList);
})();