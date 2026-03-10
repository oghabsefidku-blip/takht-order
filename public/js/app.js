// app.js (بدون TEXTS)

function getLang() {
  return localStorage.getItem("lang") || "fa";
}

function setLang(l) {
  localStorage.setItem("lang", l);
  renderText();
}

function renderText() {
  const lang = getLang();
  if (!window.TEXTS || !TEXTS[lang]) return;
  const txt = TEXTS[lang];

  const title = document.getElementById("title");
  const subtitle = document.getElementById("subtitle");
  const nameLabel = document.getElementById("nameLabel");
  const phoneLabel = document.getElementById("phoneLabel");
  const loginBtn = document.getElementById("loginBtn");

  if (title) title.innerText = txt.title;
  if (subtitle) subtitle.innerText = txt.subtitle;
  if (nameLabel) nameLabel.innerText = txt.name;
  if (phoneLabel) phoneLabel.innerText = txt.phone;
  if (loginBtn) loginBtn.innerText = txt.login;
}

function setCustomer(name, phone) {
  localStorage.setItem("customer_name", name);
  localStorage.setItem("customer_phone", phone);
}

document.addEventListener("DOMContentLoaded", () => {
  // دکمه‌ها: اگر id درست نبود، خودش fallback پیدا می‌کنه
  const btnFa = document.getElementById("btnFa") || document.querySelector('[data-lang="fa"]');
  const btnEn = document.getElementById("btnEn") || document.querySelector('[data-lang="en"]');
  const btnAr = document.getElementById("btnAr") || document.querySelector('[data-lang="ar"]');

  if (btnFa) btnFa.addEventListener("click", () => setLang("fa"));
  if (btnEn) btnEn.addEventListener("click", () => setLang("en"));
  if (btnAr) btnAr.addEventListener("click", () => setLang("ar"));

  const loginBtn =
    document.getElementById("loginBtn") ||
    document.querySelector("button[type='submit']") ||
    Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("ورود"));

  if (!loginBtn) {
    alert("دکمه ورود پیدا نشد. باید به دکمه id='loginBtn' بدهیم.");
    return;
  }

  loginBtn.addEventListener("click", () => {
    const nameInput =
      document.getElementById("nameInput") ||
      document.querySelector("input[name='name']") ||
      document.querySelectorAll("input")[0];

    const phoneInput =
      document.getElementById("phoneInput") ||
      document.querySelector("input[name='phone']") ||
      document.querySelectorAll("input")[1];

    const name = nameInput ? nameInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";

    if (!name || !phone) {
      alert("نام و شماره تماس را کامل وارد کنید");
      return;
    }

    setCustomer(name, phone);

    // رفتن به صفحه منو
    window.location.assign("/order.html");
  });

  renderText();
});