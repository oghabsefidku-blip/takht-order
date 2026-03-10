async function renderOrders() {
  const boxNew = document.getElementById("ordersNew");
  const boxDone = document.getElementById("ordersDone");

  boxNew.innerHTML = `<div class="muted">در حال دریافت...</div>`;
  boxDone.innerHTML = `<div class="muted">در حال دریافت...</div>`;

  const news = await api("/api/orders?status=new");
  const dones = await api("/api/orders?status=done");

  boxNew.innerHTML = news.length ? news.map(o => orderCard(o, true)).join("") : `<div class="muted">سفارش جدیدی نیست.</div>`;
  boxDone.innerHTML = dones.length ? dones.map(o => orderCard(o, false)).join("") : `<div class="muted">چیزی در آرشیو نیست.</div>`;
}

function orderCard(o, canDone) {
  const itemsText = o.items.map(it => `${esc(it.title)} ×${Number(it.qty||1)}`).join(" • ");
  return `
    <div class="card" style="margin:0 0 12px 0">
      <div class="p">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center">
          <div>
            <b>سفارش #${o.id}</b>
            <span class="badge">زبان: ${esc(o.lang)}</span>
          </div>
          <div class="muted" style="font-size:12px">${esc(o.created_at || "")}</div>
        </div>

        <div class="muted" style="margin-top:8px">
          نام: ${esc(o.customer_name)} • شماره: ${esc(o.customer_phone)}
          ${o.ref ? ` • منبع: ${esc(o.ref)}` : ""}
        </div>

        ${o.note ? `<div class="muted" style="margin-top:6px">یادداشت: ${esc(o.note)}</div>` : ""}

        <hr/>
        <div>${itemsText}</div>
        <hr/>

        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
          <b>جمع: ${money(o.subtotal, "KD")}</b>
          ${canDone ? `<button class="btn ok" onclick="markDone(${o.id})">انجام شد</button>` : `<span class="muted">آرشیو</span>`}
        </div>
      </div>
    </div>
  `;
}

async function markDone(id) {
  await api(`/api/orders/${id}/done`, "POST");
  await renderOrders();
}

document.getElementById("refreshBtn").onclick = renderOrders;

(async () => {
  await renderOrders();
  const socket = io();
  socket.on("orders:new", renderOrders);
  socket.on("orders:updated", renderOrders);
})();