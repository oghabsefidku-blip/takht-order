<!doctype html>
<html lang="fa">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>منوی تخت جمشید</title>
  <style>
    body{font-family:tahoma;background:#0f1520;color:#fff;margin:0;padding:16px}
    .box{max-width:900px;margin:0 auto}
    .top{display:flex;justify-content:space-between;align-items:center;gap:12px}
    .pill{background:#1c2637;border:1px solid #2a3a55;border-radius:14px;padding:10px 12px}
    .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}
    @media (max-width:700px){.grid{grid-template-columns:1fr}}
    .card{background:#151f2f;border:1px solid #2a3a55;border-radius:16px;padding:12px;display:flex;gap:12px}
    .img{width:90px;height:90px;border-radius:12px;background:#0b0f18;object-fit:cover;border:1px solid #2a3a55}
    .title{font-weight:700}
    .price{opacity:.9;margin-top:6px}
    .qty{display:flex;align-items:center;gap:8px;margin-top:10px}
    button{cursor:pointer;border:none;border-radius:10px;padding:8px 10px;background:#2e8b57;color:#fff;font-weight:700}
    button.secondary{background:#26344c}
    .cart{margin-top:16px;background:#111a28;border:1px solid #2a3a55;border-radius:16px;padding:12px}
    .row{display:flex;justify-content:space-between;gap:10px;margin:6px 0}
    .muted{opacity:.8}
    .danger{background:#b23b3b}
  </style>
</head>
<body>
  <div class="box">
    <div class="top">
      <div>
        <div style="font-size:22px;font-weight:800">منوی تخت جمشید</div>
        <div class="muted" id="who"></div>
      </div>
      <div class="pill">
        <span class="muted">مجموع:</span>
        <b id="total">0</b>
      </div>
    </div>

    <div id="menu" class="grid"></div>

    <div class="cart">
      <div style="font-weight:800;margin-bottom:8px">سبد شما</div>
      <div id="cartItems" class="muted">هیچی انتخاب نشده.</div>
      <div style="display:flex;gap:8px;margin-top:10px;justify-content:flex-end">
        <button class="secondary" id="clear">پاک کردن</button>
        <button id="send">ثبت سفارش</button>
      </div>
      <div id="msg" class="muted" style="margin-top:10px"></div>
    </div>
  </div>

<script>
  const name = localStorage.getItem('customer_name') || '';
  const phone = localStorage.getItem('customer_phone') || '';
  document.getElementById('who').innerText = `نام: ${name} | شماره: ${phone}`;

  let menu = [];
  let cart = {}; // id -> {id,title,price,qty}

  function money(x){
    return (Number(x)||0).toLocaleString();
  }

  function renderMenu(){
    const el = document.getElementById('menu');
    el.innerHTML = '';
    menu.forEach(item=>{
      const card = document.createElement('div');
      card.className = 'card';

      const img = document.createElement('img');
      img.className = 'img';
      img.src = item.image ? item.image : 'https://via.placeholder.com/90';
      img.alt = item.title;

      const right = document.createElement('div');
      right.style.flex = '1';

      const t = document.createElement('div');
      t.className = 'title';
      t.innerText = item.title;

      const p = document.createElement('div');
      p.className = 'price';
      p.innerText = `قیمت: ${money(item.price)}`;

      const qty = document.createElement('div');
      qty.className = 'qty';

      const minus = document.createElement('button');
      minus.className = 'secondary';
      minus.innerText = '-';
      minus.onclick = ()=>addToCart(item, -1);

      const count = document.createElement('b');
      count.innerText = (cart[item.id]?.qty || 0);

      const plus = document.createElement('button');
      plus.innerText = '+';
      plus.onclick = ()=>addToCart(item, +1);

      qty.appendChild(minus);
      qty.appendChild(count);
      qty.appendChild(plus);

      right.appendChild(t);
      right.appendChild(p);
      right.appendChild(qty);

      card.appendChild(img);
      card.appendChild(right);

      el.appendChild(card);

      // keep count synced
      item._countEl = count;
    });
  }

  function addToCart(item, delta){
    const current = cart[item.id]?.qty || 0;
    const next = Math.max(0, current + delta);
    if(next === 0){
      delete cart[item.id];
    }else{
      cart[item.id] = { id:item.id, title:item.title, price:Number(item.price), qty:next };
    }
    if(item._countEl) item._countEl.innerText = next;
    renderCart();
  }

  function renderCart(){
    const list = Object.values(cart);
    const cartEl = document.getElementById('cartItems');
    if(list.length === 0){
      cartEl.innerText = 'هیچی انتخاب نشده.';
      document.getElementById('total').innerText = '0';
      return;
    }
    cartEl.innerHTML = '';
    let total = 0;
    list.forEach(it=>{
      total += it.price * it.qty;
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<span>${it.title} × ${it.qty}</span><b>${money(it.price * it.qty)}</b>`;
      cartEl.appendChild(row);
    });
    document.getElementById('total').innerText = money(total);
  }

  async function loadMenu(){
    const res = await fetch('/api/menu');
    const data = await res.json();
    if(!data.ok){
      document.getElementById('msg').innerText = 'خطا در دریافت منو';
      return;
    }
    menu = data.items;
    renderMenu();
    renderCart();
  }

  document.getElementById('clear').onclick = ()=>{
    cart = {};
    // reset counts
    menu.forEach(it=>{ if(it._countEl) it._countEl.innerText = '0'; });
    renderCart();
    document.getElementById('msg').innerText = '';
  };

  document.getElementById('send').onclick = async ()=>{
    const items = Object.values(cart);
    if(!name || !phone){
      document.getElementById('msg').innerText = 'نام یا شماره ذخیره نشده. برگرد به صفحه ورود.';
      return;
    }
    if(items.length === 0){
      document.getElementById('msg').innerText = 'حداقل یک آیتم انتخاب کن.';
      return;
    }
    document.getElementById('msg').innerText = 'در حال ثبت سفارش...';

    const res = await fetch('/api/order', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name, phone, items })
    });
    const data = await res.json();
    if(!data.ok){
      document.getElementById('msg').innerText = 'ثبت سفارش ناموفق: ' + (data.error || '');
      return;
    }
    document.getElementById('msg').innerText = `✅ سفارش ثبت شد. شماره سفارش: ${data.orderId} | مجموع: ${money(data.total)}`;
  };

  loadMenu();
</script>
</body>
</html>