/* NESTORA – front-end demo (không có server, dữ liệu lưu trong localStorage) */
(function () {
  "use strict";

  // Đổi số này mỗi khi cập nhật mô hình 3D để trình duyệt tải lại bản mới (tránh cache)
  const ASSET_VERSION = "202611261114";

  /* ---------- Utils ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const money = (n) => n.toLocaleString("vi-VN") + "₫";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const byId = (id) => PRODUCTS.find((p) => p.id === id);
  const store = {
    get(k, d) { try { const v = localStorage.getItem("nestora_" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem("nestora_" + k, JSON.stringify(v)); } catch { /* ignore */ } },
  };

  const ICON = {
    cart: '<svg viewBox="0 0 24 24"><path d="M3 4h2.2l2.2 11h10.4L20 7.5H6.3"/><circle cx="9" cy="19" r="1.3"/><circle cx="17" cy="19" r="1.3"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg>',
    truck: '<svg viewBox="0 0 24 24"><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7"/><circle cx="7" cy="17" r="1.6"/><circle cx="17" cy="17" r="1.6"/></svg>',
    swap: '<svg viewBox="0 0 24 24"><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z"/><path d="m9 12 2 2 4-4"/></svg>',
    filter: '<svg viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    cube: '<svg viewBox="0 0 24 24"><path d="M12 3 4 7.5v9L12 21l8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/></svg>',
    ruler: '<svg viewBox="0 0 24 24"><path d="M3 16 16 3l5 5L8 21z"/><path d="m7 12 2 2M10 9l2 2M13 6l2 2"/></svg>',
  };


  /* ---------- State ---------- */
  let cart = store.get("cart", []);
  let wish = store.get("wish", []);
  let orders = store.get("orders", []);
  let coupon = store.get("coupon", null);
  const COUPONS = { NESTORA10: 0.1, WELCOME: 0.05 };
  const FREE_SHIP = 500000;
  const SHIP_FEE = { standard: 30000, express: 50000 };

  const saveCart = () => { store.set("cart", cart); updateBadges(); renderDrawer(); };
  const cartQty = () => cart.reduce((s, l) => s + l.qty, 0);
  const subtotal = () => cart.reduce((s, l) => s + byId(l.id).price * l.qty, 0);
  const discount = () => (coupon && COUPONS[coupon] ? Math.round(subtotal() * COUPONS[coupon]) : 0);
  function shipping(method = "standard") {
    if (!cart.length) return 0;
    const free = subtotal() - discount() >= FREE_SHIP;
    if (method === "express") return free ? SHIP_FEE.express - SHIP_FEE.standard : SHIP_FEE.express;
    return free ? 0 : SHIP_FEE.standard;
  }

  function addToCart(id, qty = 1, silent) {
    const line = cart.find((l) => l.id === id);
    if (line) line.qty = Math.min(20, line.qty + qty);
    else cart.push({ id, qty });
    saveCart();
    if (!silent) toast(`Đã thêm <b>${esc(byId(id).name)}</b> vào giỏ`, '<a href="#cart">Xem giỏ</a>');
  }
  function setQty(id, qty) {
    const line = cart.find((l) => l.id === id);
    if (!line) return;
    line.qty = Math.max(1, Math.min(20, qty | 0 || 1));
    saveCart();
  }
  function removeLine(id) { cart = cart.filter((l) => l.id !== id); saveCart(); }
  function toggleWish(id) {
    wish = wish.includes(id) ? wish.filter((x) => x !== id) : [...wish, id];
    store.set("wish", wish);
    updateBadges();
    $$(`[data-wish="${id}"]`).forEach((b) => b.classList.toggle("on", wish.includes(id)));
    toast(wish.includes(id) ? "Đã thêm vào danh sách yêu thích" : "Đã bỏ khỏi danh sách yêu thích");
  }
  function updateBadges() {
    const c = $("#cartCount"), w = $("#wishCount");
    c.textContent = cartQty(); c.hidden = cartQty() === 0;
    w.textContent = wish.length; w.hidden = wish.length === 0;
  }

  let toastTimer;
  function toast(html, action = "") {
    const t = $("#toast");
    t.innerHTML = `<span>${html}</span>${action}`;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
  }

  /* ---------- Shared components ---------- */
  const socialLinks = (cls = "") => SOCIALS.map((s) =>
    `<a class="social ${cls}" href="${s.url}" target="_blank" rel="noopener" aria-label="NESTORA trên ${s.name}" title="${s.name}"><svg viewBox="0 0 24 24" aria-hidden="true">${s.svg}</svg></a>`).join("");
  $$("[data-socials]").forEach((el) => (el.innerHTML = socialLinks()));
  const FEEL_TEXT = (p) => p.feel.map((f) => FILTER_LABELS.feel[f])[0];
  function productCard(p) {
    return `
      <article class="card reveal">
        <a class="card-media" href="#product-${p.id}" aria-label="Xem ${esc(p.name)}">
          <img src="${p.img}" alt="Gối ${esc(p.name)}" loading="lazy" />
          <span class="card-tag">${p.collection === "sleep" ? "Sleep" : "Move"}</span>
          <span class="card-3d" title="Có xem 3D và AR">3D</span>
          ${p.badge ? `<span class="card-tag accent">${p.badge}</span>` : ""}
        </a>
        <button class="icon-btn wish-btn ${wish.includes(p.id) ? "on" : ""}" data-wish="${p.id}" aria-label="Yêu thích ${esc(p.name)}">${ICON.heart}</button>
        <div class="card-body">
          <span class="card-code">${p.code} · ${p.category}</span>
          <a href="#product-${p.id}" class="card-title">${esc(p.name)}</a>
          <p class="card-tagline">${esc(p.tagline)}</p>
          <div class="chips">
            <span class="chip">${FEEL_TEXT(p)}</span>
            <span class="chip mist">${FILTER_LABELS.material[p.material]}</span>
            ${p.height[0] ? `<span class="chip clay">Cao ${FILTER_LABELS.height[p.height[0]].toLowerCase()}</span>` : ""}
          </div>
          <div class="card-foot">
            <span class="price">${money(p.price)}</span>
            <div class="card-actions">
              <a class="btn btn-outline btn-sm" href="#product-${p.id}">Chi tiết</a>
              <button class="round-add" data-add="${p.id}" aria-label="Thêm ${esc(p.name)} vào giỏ">${ICON.plus}</button>
            </div>
          </div>
        </div>
      </article>`;
  }
  const crumbs = (items) =>
    `<nav class="breadcrumb" aria-label="Breadcrumb"><a href="#home">Trang chủ</a>${items
      .map(([href, t]) => `<span>/</span>${href ? `<a href="${href}">${t}</a>` : `<span>${t}</span>`}`)
      .join("")}</nav>`;

  /* ---------- Views ---------- */
  const views = {};

  views.home = () => {
    const featured = ["n06", "n02", "n08", "n11"].map(byId);
    return `
    <section class="hero">
      <div class="container">
        <div class="hero-card">
          <div class="hero-content reveal">
            <span class="eyebrow">Nestora</span>
            <h1>Comfort<br><em>in</em> Every Detail.</h1>
            <p class="lead">Comfort is Personal — thoải mái theo cách riêng của bạn.</p>
            <div class="hero-actions">
              <a class="btn btn-primary" href="#quiz">Find Your Pillow ${ICON.arrow}</a>
              <a class="btn btn-light" href="#shop">Xem bộ sưu tập</a>
            </div>
            <div class="hero-stats">
              <div><strong>12</strong>mẫu gối</div>
              <div><strong>2</strong>bộ sưu tập</div>
              <div><strong>7</strong>câu hỏi để tìm gối</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container intro">
        <div class="reveal">
          <span class="eyebrow">Giới thiệu thương hiệu</span>
          <h2>Mỗi chiếc gối là một trải nghiệm riêng.</h2>
          <p>NESTORA mang đến bộ sưu tập sản phẩm được phát triển với sự chú trọng vào chất liệu, cấu trúc và đặc tính sử dụng.</p>
          <p class="muted">Mỗi thiết kế mang đến những trải nghiệm khác nhau về độ êm ái, độ đầy đặn và khả năng nâng đỡ, giúp khách hàng tìm thấy lựa chọn phù hợp với sở thích cá nhân.</p>
          <a class="btn btn-outline" href="#story">Our Story ${ICON.arrow}</a>
        </div>
        <div class="intro-visual">
          <div class="ph a"><img src="assets/img/products/n06.jpg" alt="Gối Cloud Plush" loading="lazy"></div>
          <div class="ph b"><img src="assets/img/products/n05.jpg" alt="Gối Flex Adjustable" loading="lazy"></div>
        </div>
      </div>
    </section>

    <section class="section-sm">
      <div class="container">
        <div class="section-head">
          <div><span class="eyebrow">Discover Nestora</span><h2>Chất lượng từ bên trong.</h2></div>
          <p>NESTORA tập trung vào việc mang đến những sản phẩm gối có chất lượng bên trong được chú trọng, từ chất liệu ruột gối, cấu tạo đến độ đàn hồi và khả năng giữ form.</p>
        </div>
        <div class="values">
          ${[
            ["Quality", "Chất liệu ruột gối, cấu tạo và độ đàn hồi được lựa chọn kỹ lưỡng."],
            ["Personalization", "Nhiều lựa chọn về độ mềm, độ phồng, độ cao và cảm giác sử dụng."],
            ["Transparency", "Thông số rõ ràng cho từng sản phẩm – bạn biết chính xác điều mình nhận được."],
            ["Experience", "Pillow Quiz giúp bạn khám phá chiếc gối phù hợp trước khi mua."],
          ].map(([t, d], i) => `<div class="value reveal" style="animation-delay:${i * 80}ms"><span class="num">0${i + 1}</span><h3>${t}</h3><p>${d}</p></div>`).join("")}
        </div>
      </div>
    </section>

    <section class="section-sm">
      <div class="container tiles">
        <a class="tile plum" href="#shop-sleep"><span class="fold"></span><h3>Modern<br>Tailored Comfort</h3></a>
        <a class="tile mist" href="#journal"><img class="tile-img" src="assets/img/products/n02.jpg" alt=""><h3>Sleep Well.<br>Live Better.</h3></a>
        <a class="tile clay" href="#shop-move"><span class="fold"></span><h3>A Softer<br>Tomorrow</h3></a>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <div><span class="eyebrow">Explore our collection</span><h2>Hai dòng sản phẩm chính.</h2></div>
          <p>NESTORA phát triển hai dòng sản phẩm chính, đáp ứng nhu cầu nghỉ ngơi trong nhiều hoàn cảnh khác nhau.</p>
        </div>
        <div class="collections">
          <a class="collection-card sleep" href="#shop-sleep">
            <div>
              <span class="sub">Bộ sưu tập nghỉ ngơi</span>
              <h3>Sleep Collection</h3>
              <p>Dành cho nhu cầu nghỉ ngơi tại nhà. Chú trọng cảm giác êm ái, độ đầy đặn, chiều cao và khả năng nâng đỡ.</p>
              <ul><li>Gối ngủ</li><li>Gối ôm dài</li></ul>
              <span class="btn btn-light btn-sm">Khám phá ${ICON.arrow}</span>
            </div>
            <div class="stack"><img src="assets/img/products/n07.jpg" alt="" loading="lazy"><img src="assets/img/products/n01.jpg" alt="" loading="lazy"></div>
          </a>
          <a class="collection-card move" href="#shop-move">
            <div>
              <span class="sub">Bộ sưu tập di chuyển</span>
              <h3>Move Collection</h3>
              <p>Dành cho những khoảng nghỉ tại văn phòng và khi di chuyển. Nhỏ gọn, linh hoạt, dễ mang theo.</p>
              <ul><li>Gối chữ U</li><li>Gối du lịch nhỏ gọn</li><li>Gối văn phòng</li></ul>
              <span class="btn btn-primary btn-sm">Khám phá ${ICON.arrow}</span>
            </div>
            <div class="stack"><img src="assets/img/products/n11.jpg" alt="" loading="lazy"><img src="assets/img/products/n12.jpg" alt="" loading="lazy"></div>
          </a>
        </div>
      </div>
    </section>

    <section class="section-sm">
      <div class="container">
        <div class="section-head">
          <div><span class="eyebrow">Được yêu thích</span><h2>Lựa chọn nổi bật</h2></div>
          <a class="btn btn-outline" href="#shop">Xem tất cả ${ICON.arrow}</a>
        </div>
        <div class="grid">${featured.map(productCard).join("")}</div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="quiz-cta">
          <div>
            <span class="eyebrow">Find your perfect pillow</span>
            <h2>Chưa biết chọn gối nào?</h2>
            <p class="muted">Trả lời 7 câu hỏi ngắn về thói quen nghỉ ngơi và sở thích của bạn. NESTORA sẽ gợi ý những mẫu gối phù hợp nhất – kèm lý do vì sao.</p>
            <a class="btn btn-primary" href="#quiz">Bắt đầu Pillow Quiz ${ICON.arrow}</a>
          </div>
          <div class="steps">
            <div class="step"><b>1</b>Mục đích sử dụng &amp; tư thế nằm</div>
            <div class="step"><b>2</b>Cảm giác, chiều cao &amp; độ đầy đặn</div>
            <div class="step"><b>3</b>Tiêu chí chất lượng &amp; ngân sách</div>
            <div class="step"><b>✓</b>Nhận gợi ý phù hợp nhất</div>
          </div>
        </div>
      </div>
    </section>

    <section class="section-sm">
      <div class="container">
        <div class="section-head"><div><span class="eyebrow">Khách hàng nói gì</span><h2>Những giấc ngủ êm hơn</h2></div></div>
        <div class="testimonials">
          ${[
            ["NESTORA made my nights softer and my mornings brighter.", "n06", "Cloud Plush"],
            ["Mình thích nằm gối thấp, Low Profile đúng là chân ái. Không còn mỏi cổ mỗi sáng.", "n04", "Low Profile"],
            ["Gối Move Travel nhẹ, có khóa cài nên không bị tuột khi ngủ trên máy bay.", "n11", "Move Travel"],
          ].map(([q, img, n]) => `<blockquote class="quote reveal"><span class="mark">“</span><p>${q}</p><footer><img src="assets/img/products/${img}.jpg" alt=""><span>— Khách hàng NESTORA<br><b>${n}</b></span></footer></blockquote>`).join("")}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <div><span class="eyebrow">Journal</span><h2>Góc kiến thức</h2></div>
          <a class="btn btn-outline" href="#journal">Tất cả bài viết ${ICON.arrow}</a>
        </div>
        <div class="journal-grid">${ARTICLES.slice(0, 3).map(articleCard).join("")}</div>
      </div>
    </section>`;
  };

  function articleCard(a) {
    return `<a class="article-card reveal" href="#journal-${a.slug}">
      <div class="thumb${a.cover ? " cover" : ""}" style="background:${a.tone}"><img src="${a.img}" alt="" loading="lazy"></div>
      <div class="body"><span class="meta">${a.tag} · ${a.minutes} phút đọc</span><h3>${a.title}</h3><p>${a.excerpt}</p></div>
    </a>`;
  }

  /* ----- Shop ----- */
  const FILTER_KEYS = ["collection", "shape", "material", "feel", "height", "fullness"];
  const FILTER_TITLES = { collection: "Dòng sản phẩm", shape: "Kiểu dáng", material: "Chất liệu", feel: "Cảm giác sử dụng", height: "Chiều cao", fullness: "Độ đầy đặn" };
  const MAX_PRICE = Math.max(...PRODUCTS.map((p) => p.price));
  let shop = null;
  let pendingQuery = "";
  let justPlaced = null;

  function matches(p, f, skipKey) {
    for (const k of FILTER_KEYS) {
      if (k === skipKey || !f[k].length) continue;
      const v = p[k];
      const ok = Array.isArray(v) ? v.some((x) => f[k].includes(x)) : f[k].includes(v);
      if (!ok) return false;
    }
    if (p.price > f.maxPrice) return false;
    if (f.q) {
      const hay = (p.name + " " + p.category + " " + p.fill + " " + p.tagline + " " + FILTER_LABELS.material[p.material]).toLowerCase();
      if (!f.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  }

  views.shop = (params, query) => {
    shop = { collection: [], shape: [], material: [], feel: [], height: [], fullness: [], maxPrice: MAX_PRICE, sort: "featured", q: pendingQuery };
    pendingQuery = "";
    if (params[0] === "sleep" || params[0] === "move") shop.collection = [params[0]];
    const coll = shop.collection.length === 1 ? shop.collection[0] : null;
    return `
    <section class="page-hero"><div class="container">
      ${crumbs([[null, "Shop"]])}
      <span class="eyebrow">Explore our collection</span>
      <h1>${coll === "sleep" ? "Sleep Collection" : coll === "move" ? "Move Collection" : "Bộ sưu tập NESTORA"}</h1>
      <p>${coll === "sleep" ? "Dòng sản phẩm dành cho nhu cầu nghỉ ngơi tại nhà, bao gồm các thiết kế gối ngủ và gối ôm dài. Các sản phẩm chú trọng cảm giác êm ái, độ đầy đặn, chiều cao và khả năng nâng đỡ, mang đến nhiều lựa chọn theo sở thích cá nhân."
        : coll === "move" ? "Dòng sản phẩm dành cho những khoảng nghỉ tại văn phòng và trong quá trình di chuyển. Các thiết kế ưu tiên sự nhỏ gọn, linh hoạt, dễ mang theo và thuận tiện sử dụng."
        : "NESTORA phát triển hai dòng sản phẩm chính, đáp ứng nhu cầu nghỉ ngơi trong nhiều hoàn cảnh khác nhau."}</p>
    </div></section>
    <div class="container shop-layout">
      <aside class="filters" id="filters" aria-label="Bộ lọc sản phẩm"></aside>
      <section>
        <div class="shop-toolbar">
          <div class="left">
            <button class="btn btn-outline btn-sm filter-open" id="filterOpen">${ICON.filter} Bộ lọc</button>
            <div class="seg" role="group" aria-label="Dòng sản phẩm">
              <button data-coll="" class="${!coll ? "on" : ""}">Tất cả</button>
              <button data-coll="sleep" class="${coll === "sleep" ? "on" : ""}">Sleep</button>
              <button data-coll="move" class="${coll === "move" ? "on" : ""}">Move</button>
            </div>
          </div>
          <select class="select" id="sort" aria-label="Sắp xếp">
            <option value="featured">Nổi bật</option>
            <option value="price-asc">Giá: thấp → cao</option>
            <option value="price-desc">Giá: cao → thấp</option>
            <option value="name">Tên A → Z</option>
          </select>
        </div>
        <div class="active-filters" id="activeFilters" style="margin-bottom:16px"></div>
        <p class="muted" id="resultCount" style="font-size:.85rem"></p>
        <div class="grid" id="productGrid"></div>
      </section>
    </div>`;
  };

  function renderFilters() {
    const f = shop;
    const groups = FILTER_KEYS.map((k) => {
      const opts = Object.entries(FILTER_LABELS[k]).map(([val, label]) => {
        const count = PRODUCTS.filter((p) => matches(p, { ...f, [k]: [val] }, null) ).length;
        return `<label class="check"><input type="checkbox" data-f="${k}" value="${val}" ${f[k].includes(val) ? "checked" : ""}> ${label}<span class="count">${count}</span></label>`;
      }).join("");
      return `<div class="filter-group"><h4>${FILTER_TITLES[k]}</h4>${opts}${k === "height" || k === "fullness" ? '<small class="muted" style="font-size:.72rem">Áp dụng với sản phẩm phù hợp</small>' : ""}</div>`;
    }).join("");
    $("#filters").innerHTML = `
      <div class="filters-head"><h3>Bộ lọc</h3><button class="link-btn" id="clearFilters">Xóa tất cả</button></div>
      ${groups}
      <div class="filter-group"><h4>Giá tiền</h4>
        <div class="price-range">
          <input type="range" id="priceRange" min="150000" max="${MAX_PRICE}" step="10000" value="${f.maxPrice}" aria-label="Giá tối đa">
          <div class="vals"><span>100.000₫</span><span>Đến <b id="priceVal">${money(f.maxPrice)}</b></span></div>
        </div>
      </div>
      <button class="btn btn-primary btn-block filter-open" id="filterDone">Xem kết quả</button>`;
  }

  function renderGrid() {
    const f = shop;
    let list = PRODUCTS.filter((p) => matches(p, f));
    if (f.sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (f.sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (f.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    $("#productGrid").innerHTML = list.length
      ? list.map(productCard).join("")
      : `<div class="empty" style="grid-column:1/-1"><h3>Không tìm thấy sản phẩm phù hợp</h3><p class="muted">Hãy thử bỏ bớt bộ lọc, hoặc để Pillow Quiz gợi ý giúp bạn.</p><button class="btn btn-outline btn-sm" id="clearFilters2">Xóa bộ lọc</button> <a class="btn btn-primary btn-sm" href="#quiz">Làm Pillow Quiz</a></div>`;
    $("#resultCount").textContent = `${list.length} sản phẩm`;
    const chips = [];
    FILTER_KEYS.forEach((k) => f[k].forEach((v) => chips.push(`<button data-rm="${k}:${v}">${FILTER_LABELS[k][v]} ${ICON.close.replace("<svg", '<svg style="width:12px;height:12px"')}</button>`)));
    if (f.maxPrice < MAX_PRICE) chips.push(`<button data-rm="price">≤ ${money(f.maxPrice)} ×</button>`);
    if (f.q) chips.push(`<button data-rm="q">“${esc(f.q)}” ×</button>`);
    $("#activeFilters").innerHTML = chips.join("");
    $$(".seg button").forEach((b) => b.classList.toggle("on", f.collection.length === 1 ? b.dataset.coll === f.collection[0] : !b.dataset.coll && f.collection.length !== 1));
  }

  function bindShop() {
    renderFilters(); renderGrid();
    const refresh = () => { renderFilters(); renderGrid(); };
    const filters = $("#filters");
    filters.addEventListener("change", (e) => {
      const t = e.target;
      if (t.dataset.f) {
        const k = t.dataset.f;
        shop[k] = t.checked ? [...shop[k], t.value] : shop[k].filter((v) => v !== t.value);
        refresh();
      }
    });
    filters.addEventListener("input", (e) => {
      if (e.target.id === "priceRange") { shop.maxPrice = +e.target.value; $("#priceVal").textContent = money(shop.maxPrice); renderGrid(); }
    });
    $("#sort").addEventListener("change", (e) => { shop.sort = e.target.value; renderGrid(); });
  }
  function shopClick(e) {
    const filters = $("#filters");
    if (!filters || !shop) return;
    const refresh = () => { renderFilters(); renderGrid(); };
    const t = e.target.closest("button");
    if (!t) return;
    if (t.id === "clearFilters" || t.id === "clearFilters2") { FILTER_KEYS.forEach((k) => (shop[k] = [])); shop.maxPrice = MAX_PRICE; shop.q = ""; refresh(); }
      if (t.id === "filterOpen") filters.classList.add("open");
      if (t.id === "filterDone") filters.classList.remove("open");
      if (t.dataset.coll !== undefined) { shop.collection = t.dataset.coll ? [t.dataset.coll] : []; refresh(); }
      if (t.dataset.rm) {
        const [k, v] = t.dataset.rm.split(":");
        if (k === "price") shop.maxPrice = MAX_PRICE;
        else if (k === "q") shop.q = "";
        else shop[k] = shop[k].filter((x) => x !== v);
      refresh();
    }
  }

  /* ----- Product detail ----- */
  const METERS = { n01: [5, 3, 3], n02: [3, 3, 3], n03: [2, 4, 4], n04: [4, 1, 1], n05: [3, 3, 3], n06: [5, 4, 5], n07: [2, 3, 4], n08: [3, 3, 4], n09: [4, 4, 4], n10: [3, 3, 3], n11: [4, 3, 3], n12: [4, 2, 2] };
  views.product = ([id]) => {
    const p = byId(id);
    if (!p) return views.notfound();
    const m = METERS[p.id];
    const meter = (label, v, l, r, adj) => `
      <div class="meter-row"><span>${label}</span><div class="meter">${[1, 2, 3, 4, 5].map((i) => `<span class="${adj || i <= v ? "on" : ""}" style="${adj ? "opacity:" + (0.25 + i * 0.15) : ""}"></span>`).join("")}</div>
      <div class="meter-labels"><span>${l}</span><span>${adj ? "Tùy chỉnh" : ""}</span><span>${r}</span></div></div>`;
    const related = PRODUCTS.filter((x) => x.collection === p.collection && x.id !== p.id).slice(0, 4);
    return `
    <div class="container" style="padding-top:34px">
      ${crumbs([["#shop", "Shop"], [`#shop-${p.collection}`, p.collection === "sleep" ? "Sleep Collection" : "Move Collection"], [null, p.name]])}
      <div class="pdp">
        <div class="pdp-gallery">
          <div class="pdp-main" id="pdpMain"><img src="${p.img}" alt="Gối ${esc(p.name)}"><div class="viewer3d" id="viewer3d" hidden></div></div>
          <div class="pdp-thumbs">
            <button class="on" data-view="photo" aria-label="Ảnh sản phẩm"><img src="${p.img}" alt=""></button>
            <button class="swatch" data-view="swatch" style="background:${p.tone}" aria-label="Màu vỏ gối">${p.code}</button>
            <button class="thumb-3d" data-view="3d" aria-label="Xem 3D và AR">${ICON.cube}<span>3D · AR</span></button>
          </div>
          <button class="btn btn-outline btn-block ar-cta" id="open3d">${ICON.cube} Xem 3D &amp; đặt thử gối trong phòng (AR)</button>
        </div>
        <div class="pdp-info">
          <span class="eyebrow">${p.code} · ${p.collection === "sleep" ? "Sleep Collection" : "Move Collection"}</span>
          <h1>${esc(p.name)}</h1>
          <p class="muted" style="margin:0">${esc(p.tagline)}</p>
          <span class="price">${money(p.price)}</span>
          <p class="desc">${esc(p.description)}</p>
          <div class="feel-meter">
            ${meter("Độ mềm", m[0], "Chắc", "Mềm", p.id === "n05")}
            ${meter(p.shape === "long" || p.collection === "move" ? "Độ dày" : "Chiều cao", m[1], "Thấp", "Cao", p.id === "n05")}
            ${meter("Độ đầy đặn", m[2], "Ít phồng", "Phồng cao", p.id === "n05")}
          </div>
          <div class="buy-row">
            <div class="qty"><button data-q="-1" aria-label="Giảm">−</button><input id="pdpQty" type="number" value="1" min="1" max="20" aria-label="Số lượng"><button data-q="1" aria-label="Tăng">+</button></div>
            <button class="btn btn-primary" id="pdpAdd">${ICON.cart} Thêm vào giỏ</button>
            <button class="icon-btn wish-btn ${wish.includes(p.id) ? "on" : ""}" data-wish="${p.id}" style="position:static;width:48px;height:48px" aria-label="Yêu thích">${ICON.heart}</button>
          </div>
          <button class="btn btn-outline btn-block" id="pdpBuy">Mua ngay</button>
          <div class="perks">
            <div class="perk">${ICON.truck} Miễn phí giao từ 500K</div>
            <div class="perk">${ICON.swap} Đổi trả trong 7 ngày</div>
            <div class="perk">${ICON.shield} Bảo hành ${["n07", "n08"].includes(p.id) ? "24" : "12"} tháng</div>
          </div>
          <div class="accordion">
            <details open><summary>Thông số sản phẩm</summary><div class="acc-body"><table class="spec-table">${p.specs.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("")}</table></div></details>
            <details open><summary>Đặc điểm nổi bật</summary><div class="acc-body"><ul class="ticks">${p.highlights.map((h) => `<li>${h}</li>`).join("")}</ul>
              <div class="reason"><strong>Lý do nên chọn</strong>${p.reason}</div></div></details>
            <details><summary>Giao hàng &amp; đổi trả</summary><div class="acc-body"><p>Giao hàng toàn quốc trong 2–4 ngày làm việc. Miễn phí giao hàng cho đơn từ 500.000₫. Đổi sản phẩm trong 7 ngày nếu còn nguyên tem, vỏ bọc. <a class="link-btn" href="#support-returns">Xem chính sách</a></p></div></details>
          </div>
        </div>
      </div>
      <section class="section-sm">
        <div class="section-head"><div><span class="eyebrow">Có thể bạn sẽ thích</span><h2>Sản phẩm cùng bộ sưu tập</h2></div></div>
        <div class="grid">${related.map(productCard).join("")}</div>
      </section>
    </div>`;
  };
  function bindProduct([id]) {
    const qty = $("#pdpQty");
    if (!qty) return;
    $$("[data-q]").forEach((b) => b.addEventListener("click", () => (qty.value = Math.max(1, Math.min(20, (+qty.value || 1) + +b.dataset.q)))));
    $("#pdpAdd").addEventListener("click", () => addToCart(id, Math.max(1, +qty.value || 1)));
    $("#pdpBuy").addEventListener("click", () => { addToCart(id, Math.max(1, +qty.value || 1), true); location.hash = "#checkout"; });
    const main = $("#pdpMain"), img = main.querySelector("img"), v3d = $("#viewer3d");
    img.addEventListener("click", () => main.classList.toggle("zoom"));
    const show = (view) => {
      $$(".pdp-thumbs button").forEach((x) => x.classList.toggle("on", x.dataset.view === view));
      main.classList.remove("zoom");
      const is3d = view === "3d";
      img.hidden = is3d; v3d.hidden = !is3d; main.classList.toggle("is-3d", is3d);
      main.style.background = view === "swatch" ? $(".pdp-thumbs .swatch").style.background : "";
      img.style.mixBlendMode = view === "swatch" ? "multiply" : "";
      if (is3d) open3D(byId(id), v3d);
    };
    $$(".pdp-thumbs button").forEach((b) => b.addEventListener("click", () => show(b.dataset.view)));
    $("#open3d").addEventListener("click", () => { show("3d"); main.scrollIntoView({ behavior: "smooth", block: "center" }); });
  }

  /* ----- 3D & AR (Google model-viewer, chỉ tải khi cần) ----- */
  let mvLoading = null;
  function loadModelViewer() {
    if (window.customElements && customElements.get("model-viewer")) return Promise.resolve();
    if (!mvLoading) mvLoading = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "assets/vendor/model-viewer.min.js";
      s.onload = res;
      s.onerror = () => { mvLoading = null; rej(); };
      document.head.appendChild(s);
    });
    return mvLoading;
  }
  function open3D(p, box) {
    if (box.dataset.loaded === p.id) return;
    box.dataset.loaded = p.id;
    const size = p.specs[0][1];
    box.innerHTML = '<div class="viewer-loading"><span class="spinner"></span>Đang tải mô hình 3D…</div>';
    loadModelViewer().then(() => {
      box.innerHTML = `
        <model-viewer id="mv" src="assets/models/${p.id}.glb?v=${ASSET_VERSION}" alt="Mô hình 3D gối ${esc(p.name)}"
          ar ar-modes="webxr scene-viewer quick-look" ar-scale="fixed" ar-placement="floor"
          camera-controls touch-action="pan-y" auto-rotate auto-rotate-delay="1500" rotation-per-second="18deg"
          interaction-prompt="none" shadow-intensity="1.3" shadow-softness="0.8" exposure="1.0" tone-mapping="commerce"
          camera-orbit="28deg 78deg auto" min-camera-orbit="auto 10deg auto" max-camera-orbit="auto 88deg auto"
          environment-image="neutral" style="background-color:${p.tone}">
          <button slot="ar-button" class="ar-btn">${ICON.cube} Xem trong phòng của bạn</button>
          <div class="mv-progress" slot="progress-bar"><span></span></div>
        </model-viewer>
        <div class="viewer-chip">${ICON.ruler} Kích thước thật: ${size}</div>
        <div class="viewer-hint">Kéo để xoay · Cuộn / chụm để phóng to</div>
        <div class="viewer-note" id="arNote" hidden>AR hoạt động trên điện thoại Android (ARCore) và iPhone/iPad. Hãy mở trang này bằng điện thoại để đặt thử gối vào phòng với kích thước thật.</div>`;
      const mv = $("#mv", box);
      mv.addEventListener("progress", (e) => { const bar = $(".mv-progress span", box); if (bar) bar.style.width = e.detail.totalProgress * 100 + "%"; });
      mv.addEventListener("load", () => { if (!mv.canActivateAR) $("#arNote", box).hidden = false; });
      mv.addEventListener("ar-status", (e) => { if (e.detail.status === "failed") toast("Thiết bị này chưa hỗ trợ AR"); });
      mv.addEventListener("error", () => { box.innerHTML = '<div class="viewer-loading">Không tải được mô hình 3D. Vui lòng thử lại.</div>'; delete box.dataset.loaded; });
    }).catch(() => { box.innerHTML = '<div class="viewer-loading">Không tải được trình xem 3D. Vui lòng kiểm tra kết nối và thử lại.</div>'; delete box.dataset.loaded; });
  }

  /* ----- Story ----- */
  views.story = () => `
    <div class="container">
      <section class="story-hero">
        <div class="reveal">
          ${crumbs([[null, "Our Story"]])}
          <span class="eyebrow">Our Story</span>
          <h1>Comfort is Personal.</h1>
          <p class="muted" style="font-size:1.08rem">Mỗi người có một cách nghỉ ngơi khác nhau, nhưng chúng ta thường phải sử dụng những chiếc gối được sản xuất hàng loạt, với độ cao và độ mềm cố định.</p>
        </div>
        <div class="visual" role="img" aria-label="Phòng ngủ NESTORA"></div>
      </section>
      <section class="story-body">
        <div class="insights">
          <div class="insight"><span class="ic">01</span><p style="margin:0">Có người thích gối thật mềm, nhẹ và bồng bềnh.</p></div>
          <div class="insight"><span class="ic">02</span><p style="margin:0">Có người thích gối đầy đặn, có độ nâng đỡ.</p></div>
          <div class="insight"><span class="ic">03</span><p style="margin:0">Có người thích gối thấp nhưng thường mua phải gối quá cao.</p></div>
          <div class="insight"><span class="ic">04</span><p style="margin:0">Có người mua gối online chỉ qua hình ảnh, đến khi nhận hàng mới phát hiện không hợp sở thích.</p></div>
        </div>
        <p>Vấn đề không nằm ở việc thị trường thiếu gối, mà là khách hàng khó tìm được chiếc gối phù hợp với sở thích của mình.</p>
        <p>Từ insight này, <b>NESTORA</b> ra đời với mong muốn mang đến nhiều lựa chọn về độ mềm, độ phồng, độ cao và cảm giác sử dụng.</p>
        <blockquote class="pull">“Một chiếc gối tốt không nhất thiết phải giống với chiếc gối của tất cả mọi người. Nó nên mang lại cảm giác mà chính bạn yêu thích.”</blockquote>
        <h2 class="center">Discover NESTORA</h2>
        <p class="center muted">NESTORA tập trung vào việc mang đến những sản phẩm gối có chất lượng bên trong được chú trọng, từ chất liệu ruột gối, cấu tạo đến độ đàn hồi và khả năng giữ form.</p>
        <div class="values" style="margin:30px 0 20px">
          ${["Quality", "Personalization", "Transparency", "Experience"].map((t, i) => `<div class="value"><span class="num">0${i + 1}</span><h3>${t}</h3></div>`).join("")}
        </div>
        <div class="center" style="padding:30px 0 80px"><a class="btn btn-primary" href="#quiz">Tìm chiếc gối của bạn ${ICON.arrow}</a></div>
      </section>
    </div>`;

  /* ----- Quiz ----- */
  let quiz = { step: 0, answers: {} };
  views.quiz = () => `
    <div class="container quiz-wrap">
      <div class="center" style="margin-bottom:30px">
        <span class="eyebrow center">Find your perfect pillow</span>
        <h1 style="font-size:clamp(2rem,4vw,3rem)">Pillow Quiz</h1>
        <p class="muted">7 câu hỏi giúp bạn khám phá sản phẩm phù hợp với sở thích cá nhân.</p>
      </div>
      <div id="quizMount"></div>
    </div>`;

  function renderQuiz() {
    const mount = $("#quizMount");
    if (!mount) return;
    if (quiz.step >= QUIZ.length) return renderResults(mount);
    const q = QUIZ[quiz.step];
    const ans = quiz.answers[q.key];
    const selected = (v) => (q.multi ? (ans || []).includes(v) : ans === v);
    const can = q.multi ? (ans || []).length > 0 : !!ans;
    mount.innerHTML = `
      <div class="quiz-card reveal">
        <div class="quiz-step-label"><span>Câu ${quiz.step + 1} / ${QUIZ.length}</span><span>${Math.round((quiz.step / QUIZ.length) * 100)}%</span></div>
        <div class="progress"><span style="width:${((quiz.step + (can ? 1 : 0)) / QUIZ.length) * 100}%"></span></div>
        <h2>${q.title}</h2>
        ${q.hint ? `<p class="muted" style="margin:0">${q.hint}</p>` : ""}
        <div class="options" role="${q.multi ? "group" : "radiogroup"}">
          ${q.options.map(([v, t]) => `<button class="option ${q.multi ? "multi" : ""} ${selected(v) ? "on" : ""}" data-opt="${v}" role="${q.multi ? "checkbox" : "radio"}" aria-checked="${selected(v)}"><span class="dot"></span>${t}</button>`).join("")}
        </div>
        <div class="quiz-nav">
          <button class="btn btn-outline" id="qPrev" ${quiz.step === 0 ? "disabled" : ""}>${ICON.back} Quay lại</button>
          <button class="btn btn-primary" id="qNext" ${can ? "" : "disabled"}>${quiz.step === QUIZ.length - 1 ? "Xem kết quả" : "Tiếp theo"} ${ICON.arrow}</button>
        </div>
      </div>`;
    $$(".option", mount).forEach((b) => b.addEventListener("click", () => {
      const v = b.dataset.opt;
      if (q.multi) {
        const cur = quiz.answers[q.key] || [];
        quiz.answers[q.key] = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
        renderQuiz();
      } else {
        quiz.answers[q.key] = v;
        renderQuiz();
        setTimeout(() => { if (QUIZ[quiz.step] === q) { quiz.step++; renderQuiz(); } }, 320);
      }
    }));
    $("#qPrev").addEventListener("click", () => { quiz.step = Math.max(0, quiz.step - 1); renderQuiz(); });
    $("#qNext").addEventListener("click", () => { quiz.step++; renderQuiz(); });
  }

  function scoreProducts(a) {
    const W = QUIZ_WEIGHTS;
    const nQ = (a.quality || []).length;
    const max = W.purpose + W.feel + W.height + W.fullness + W.position + W.quality * nQ;
    const [bMin, bMax] = BUDGETS[a.budget] || [0, Infinity];
    return PRODUCTS.map((p) => {
      let s = 0; const why = [];
      if (p.purposes.includes(a.purpose)) { s += W.purpose; why.push(`Phù hợp mục đích <b>${PURPOSE_LABELS[a.purpose]}</b>`); }
      if (p.feel.includes(a.feel)) { s += W.feel; why.push(`Đúng cảm giác bạn muốn: <b>${FILTER_LABELS.feel[a.feel].toLowerCase()}</b>`); }
      if (p.height.includes(a.height)) { s += W.height; why.push(a.height === "flex" ? "Có thể <b>tùy chỉnh chiều cao</b> theo nhu cầu" : `Chiều cao <b>${FILTER_LABELS.height[a.height].toLowerCase()}</b> như bạn thích`); }
      if (p.fullness.includes(a.fullness)) { s += W.fullness; why.push(`Độ đầy đặn <b>${FILTER_LABELS.fullness[a.fullness].toLowerCase()}</b>`); }
      if (p.collection === "sleep" && p.positions.includes(a.position)) { s += W.position; why.push(`Phù hợp người <b>${POSITION_LABELS[a.position]}</b>`); }
      const qm = (a.quality || []).filter((q) => p.quality.includes(q));
      s += qm.length * W.quality;
      if (qm.length) why.push(`Đáp ứng tiêu chí: <b>${qm.map((q) => QUALITY_LABELS[q]).join(", ")}</b>`);
      const inBudget = p.price >= bMin && p.price <= bMax;
      return { p, s, why, inBudget, pct: Math.round((s / max) * 100) };
    }).sort((x, y) => y.s + (y.inBudget ? 3 : 0) - (x.s + (x.inBudget ? 3 : 0)) || x.p.price - y.p.price);
  }

  function renderResults(mount) {
    const a = quiz.answers;
    const res = scoreProducts(a);
    store.set("quiz", a);
    const top = res.slice(0, 3), more = res.slice(3, 7);
    if (window.Backend && Backend.available) Backend.saveQuiz({ answers: a, top: top.map((r) => ({ id: r.p.id, pct: r.pct })) }).catch(() => {});
    const summary = QUIZ.map((q) => {
      const v = a[q.key];
      const lab = (x) => { const t = q.options.find((o) => o[0] === x)[1]; return q.key === "budget" ? t : t.split(" – ")[0].split(",")[0]; };
      return Array.isArray(v) ? v.map((x) => `<span class="chip">${lab(x)}</span>`).join("") : `<span class="chip">${lab(v)}</span>`;
    }).join("");
    mount.innerHTML = `
      <div class="reveal">
        <h2 class="center">Gợi ý dành riêng cho bạn</h2>
        <div class="answers-summary" style="justify-content:center">${summary}</div>
        ${top.map((r, i) => `
          <article class="result-card ${i === 0 ? "top" : ""}">
            ${i === 0 ? '<span class="ribbon">Phù hợp nhất</span>' : ""}
            <a class="rimg" href="#product-${r.p.id}"><img src="${r.p.img}" alt="Gối ${esc(r.p.name)}"></a>
            <div>
              <div class="match"><strong>${r.pct}%</strong><small>Mức độ phù hợp</small></div>
              <span class="card-code">${r.p.code} · ${r.p.category}</span>
              <h3>${esc(r.p.name)}</h3>
              <span class="price">${money(r.p.price)}</span> ${r.inBudget ? '<span class="chip mist">Trong ngân sách</span>' : '<span class="chip clay">Ngoài ngân sách</span>'}
              <div class="mini-specs"><span>Ruột gối: <b>${r.p.fill}</b></span><span>Cảm giác: <b>${FEEL_TEXT(r.p)}</b></span></div>
              <ul class="ticks" style="margin:10px 0;font-size:.86rem">${r.p.highlights.slice(0, 2).map((h) => `<li>${h}</li>`).join("")}</ul>
              <div class="why"><b>Vì sao phù hợp với bạn?</b>${r.why.length ? `<ul>${r.why.map((w) => `<li>${w}</li>`).join("")}</ul>` : ""}<div style="margin-top:6px">${r.p.reason}</div></div>
              <div class="card-actions">
                <a class="btn btn-outline btn-sm" href="#product-${r.p.id}">Xem chi tiết</a>
                <button class="btn btn-primary btn-sm" data-add="${r.p.id}">${ICON.cart} Thêm vào giỏ</button>
              </div>
            </div>
          </article>`).join("")}
        <h3 style="margin-top:40px">Các lựa chọn khác</h3>
        <div class="grid" style="margin-top:16px">${more.map((r) => productCard(r.p)).join("")}</div>
        <div class="center" style="margin-top:36px"><button class="btn btn-outline" id="qRestart">Làm lại bài trắc nghiệm</button></div>
      </div>`;
    $("#qRestart").addEventListener("click", () => { quiz = { step: 0, answers: {} }; renderQuiz(); window.scrollTo({ top: 0 }); });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ----- Journal ----- */
  views.journal = ([slug]) => {
    if (slug) {
      const a = ARTICLES.find((x) => x.slug === slug);
      if (!a) return views.notfound();
      const others = ARTICLES.filter((x) => x !== a).slice(0, 3);
      return `
      <div class="container">
        <article class="article">
          <div style="padding-top:34px">${crumbs([["#journal", "Journal"], [null, a.tag]])}</div>
          <span class="meta">${a.tag} · ${a.minutes} phút đọc</span>
          <h1 style="font-size:clamp(2rem,4vw,3rem);margin-top:10px">${a.title}</h1>
          <p class="muted" style="font-size:1.1rem">${a.excerpt}</p>
          <div class="article-hero${a.cover ? " cover" : ""}" style="background:${a.tone}"><img src="${a.img}" alt=""></div>
          ${a.body.map(([t, c]) => t === "h" ? `<h2>${c}</h2>`
            : t === "ul" ? `<ul class="article-list">${c.map((li) => `<li>${li}</li>`).join("")}</ul>`
            : t === "quote" ? `<blockquote class="pull">${c}</blockquote>`
            : `<p>${c}</p>`).join("")}
          <div class="quiz-cta" style="margin-top:40px;grid-template-columns:1fr"><div><h3>Vẫn chưa chắc chọn gối nào?</h3><p class="muted">Pillow Quiz sẽ gợi ý giúp bạn chỉ trong 1 phút.</p><a class="btn btn-primary" href="#quiz">Làm Pillow Quiz ${ICON.arrow}</a></div></div>
        </article>
        <section class="section-sm"><h2>Bài viết khác</h2><div class="journal-grid">${others.map(articleCard).join("")}</div></section>
      </div>`;
    }
    return `
    <section class="page-hero"><div class="container">
      ${crumbs([[null, "Journal"]])}
      <span class="eyebrow">Journal</span><h1>Góc kiến thức</h1>
      <p>Chia sẻ kiến thức về gối – chất liệu, cách chọn và cách chăm sóc – giúp bạn hiểu rõ sản phẩm và nghỉ ngơi trọn vẹn hơn.</p>
    </div></section>
    <div class="container" style="padding-bottom:80px"><div class="journal-grid">${ARTICLES.map(articleCard).join("")}</div></div>`;
  };

  /* ----- Wishlist ----- */
  views.wishlist = () => `
    <section class="page-hero"><div class="container">${crumbs([[null, "Yêu thích"]])}<h1>Danh sách yêu thích</h1></div></section>
    <div class="container" style="padding-bottom:80px">
      ${wish.length ? `<div class="grid">${wish.map(byId).filter(Boolean).map(productCard).join("")}</div>`
        : `<div class="empty"><h3>Chưa có sản phẩm yêu thích</h3><p class="muted">Nhấn biểu tượng ♡ trên sản phẩm để lưu lại.</p><a class="btn btn-primary" href="#shop">Khám phá sản phẩm</a></div>`}
    </div>`;

  /* ----- Cart ----- */
  function cartLine(l, compact) {
    const p = byId(l.id);
    return `<div class="cart-line">
      <a href="#product-${p.id}"><img src="${p.img}" alt="${esc(p.name)}"></a>
      <div><h4>${esc(p.name)}</h4><div class="unit">${p.code} · ${money(p.price)} / sản phẩm</div>
        ${compact ? "" : `<div class="unit">${p.specs[0][1]} · ${FEEL_TEXT(p)}</div>`}</div>
      <div class="line-right">
        <div class="qty sm"><button data-cq="${p.id}:-1" aria-label="Giảm">−</button><input data-cqi="${p.id}" type="number" min="1" max="20" value="${l.qty}" aria-label="Số lượng ${esc(p.name)}"><button data-cq="${p.id}:1" aria-label="Tăng">+</button></div>
        <span class="line-total">${money(p.price * l.qty)}</span>
        <button class="remove" data-rmline="${p.id}">Xóa</button>
      </div>
    </div>`;
  }
  function freeShipBar() {
    const left = FREE_SHIP - (subtotal() - discount());
    const pct = Math.min(100, ((subtotal() - discount()) / FREE_SHIP) * 100);
    return `<div class="free-ship">${left > 0 ? `Mua thêm <b>${money(left)}</b> để được miễn phí giao hàng` : "🎉 Đơn hàng của bạn được <b>miễn phí giao hàng</b>"}<div class="bar"><span style="width:${pct}%"></span></div></div>`;
  }
  function summaryRows(method = "standard") {
    const ship = shipping(method);
    return `
      <div class="summary-row"><span>Tạm tính (${cartQty()} sản phẩm)</span><span>${money(subtotal())}</span></div>
      ${discount() ? `<div class="summary-row" style="color:var(--success)"><span>Giảm giá (${coupon})</span><span>−${money(discount())}</span></div>` : ""}
      <div class="summary-row"><span>Phí giao hàng</span><span>${ship ? money(ship) : "Miễn phí"}</span></div>
      <div class="summary-row total"><span>Tổng cộng</span><span>${money(subtotal() - discount() + ship)}</span></div>`;
  }

  views.cart = () => {
    if (!cart.length) return `
      <section class="page-hero"><div class="container">${crumbs([[null, "Giỏ hàng"]])}<h1>Giỏ hàng</h1></div></section>
      <div class="container" style="padding-bottom:80px"><div class="empty"><h3>Giỏ hàng của bạn đang trống</h3><p class="muted">Hãy khám phá bộ sưu tập hoặc để Pillow Quiz gợi ý giúp bạn.</p><a class="btn btn-primary" href="#shop">Mua sắm ngay</a> <a class="btn btn-outline" href="#quiz">Pillow Quiz</a></div></div>`;
    return `
      <section class="page-hero"><div class="container">${crumbs([[null, "Giỏ hàng"]])}<h1>Giỏ hàng</h1></div></section>
      <div class="container cart-layout">
        <div class="panel" id="cartLines">${cart.map((l) => cartLine(l)).join("")}</div>
        <aside>
          <div class="panel">
            <h3>Tóm tắt đơn hàng</h3>
            ${freeShipBar()}
            <form class="coupon" id="couponForm"><input id="couponInput" placeholder="Mã giảm giá (thử NESTORA10)" value="${coupon || ""}" aria-label="Mã giảm giá"><button class="btn btn-outline btn-sm" type="submit">Áp dụng</button></form>
            ${summaryRows()}
            <a class="btn btn-primary btn-block" href="#checkout" style="margin-top:18px">Tiến hành thanh toán ${ICON.arrow}</a>
            <a class="btn btn-block" href="#shop" style="margin-top:6px">Tiếp tục mua sắm</a>
          </div>
        </aside>
      </div>`;
  };
  function bindCart() {
    const f = $("#couponForm");
    if (f) f.addEventListener("submit", (e) => {
      e.preventDefault();
      const c = $("#couponInput").value.trim().toUpperCase();
      if (!c) { coupon = null; store.set("coupon", null); render(); return; }
      if (COUPONS[c]) { coupon = c; store.set("coupon", c); toast(`Đã áp dụng mã <b>${c}</b>`); render(); }
      else toast("Mã giảm giá không hợp lệ");
    });
  }

  /* ----- Checkout ----- */
  const PROVINCES = ["TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Bình Dương", "Đồng Nai", "Khánh Hòa", "Lâm Đồng", "Thừa Thiên Huế", "Quảng Ninh", "Tỉnh/thành khác"];
  views.checkout = () => {
    if (!cart.length) return views.cart();
    const saved = store.get("customer", {});
    const v = (k) => esc(saved[k] || "");
    return `
    <section class="page-hero" style="padding-bottom:10px"><div class="container">
      ${crumbs([["#cart", "Giỏ hàng"], [null, "Thanh toán"]])}
      <h1>Thanh toán</h1>
      <div class="steps-bar"><span>Giỏ hàng</span><i></i><span class="on">Thông tin &amp; thanh toán</span><i></i><span>Xác nhận</span></div>
    </div></section>
    <form class="container cart-layout" id="checkoutForm" novalidate>
      <div>
        <div class="checkout-auth" id="checkoutAuth"></div>
        <div class="panel">
          <h3>Thông tin người nhận</h3>
          <div class="form-grid">
            <div class="field"><label for="f-name">Họ và tên *</label><input id="f-name" name="name" autocomplete="name" value="${v("name")}" required><span class="err"></span></div>
            <div class="field"><label for="f-phone">Số điện thoại *</label><input id="f-phone" name="phone" type="tel" autocomplete="tel" value="${v("phone")}" required><span class="err"></span></div>
            <div class="field full"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" value="${v("email")}"><span class="err"></span></div>
            <div class="field"><label for="f-prov">Tỉnh / Thành phố *</label><select id="f-prov" name="province" required><option value="">Chọn tỉnh / thành</option>${PROVINCES.map((p) => `<option ${saved.province === p ? "selected" : ""}>${p}</option>`).join("")}</select><span class="err"></span></div>
            <div class="field"><label for="f-dist">Quận / Huyện *</label><input id="f-dist" name="district" value="${v("district")}" required><span class="err"></span></div>
            <div class="field full"><label for="f-addr">Địa chỉ cụ thể *</label><input id="f-addr" name="address" autocomplete="street-address" placeholder="Số nhà, tên đường, phường/xã" value="${v("address")}" required><span class="err"></span></div>
            <div class="field full"><label for="f-note">Ghi chú</label><textarea id="f-note" name="note" rows="2" placeholder="Ví dụ: giao giờ hành chính"></textarea></div>
          </div>
        </div>
        <div class="panel">
          <h3>Phương thức giao hàng</h3>
          <div class="pay-options">
            <label class="pay-option"><input type="radio" name="ship" value="standard" checked><span><strong>Giao hàng tiêu chuẩn</strong><small>2–4 ngày làm việc</small></span><span id="shipStd"></span></label>
            <label class="pay-option"><input type="radio" name="ship" value="express"><span><strong>Giao hàng nhanh</strong><small>1–2 ngày làm việc</small></span><span id="shipExp"></span></label>
          </div>
        </div>
        <div class="panel">
          <h3>Phương thức thanh toán</h3>
          <div class="pay-options">
            <label class="pay-option"><input type="radio" name="pay" value="cod" checked><span><strong>Thanh toán khi nhận hàng (COD)</strong><small>Trả tiền mặt khi nhận được sản phẩm</small></span><span class="pay-ic">COD</span></label>
            <label class="pay-option"><input type="radio" name="pay" value="bank"><span><strong>Chuyển khoản ngân hàng</strong><small>Thông tin chuyển khoản hiển thị sau khi đặt hàng</small></span><span class="pay-ic">BANK</span></label>
            <label class="pay-option"><input type="radio" name="pay" value="online"><span><strong>Thanh toán trực tuyến</strong><small>Thẻ ATM / Visa / Mastercard / Ví điện tử</small></span><span class="pay-ic">CARD</span></label>
          </div>
          <div class="pay-extra" id="payExtra" hidden>
            <div class="form-grid">
              <div class="field full"><label>Chọn hình thức</label><select name="gateway"><option>Thẻ Visa / Mastercard</option><option>Thẻ ATM nội địa</option><option>Ví điện tử</option></select></div>
              <div class="field full"><label for="f-card">Số thẻ (demo)</label><input id="f-card" name="card" inputmode="numeric" placeholder="4111 1111 1111 1111"><span class="err"></span></div>
            </div>
            <p class="muted" style="margin:10px 0 0;font-size:.78rem">Đây là bản demo – không có giao dịch thật nào được thực hiện.</p>
          </div>
        </div>
      </div>
      <aside>
        <div class="panel">
          <h3>Đơn hàng của bạn</h3>
          ${cart.map((l) => { const p = byId(l.id); return `<div class="mini-line"><img src="${p.img}" alt=""><div>${esc(p.name)}<div class="q">SL: ${l.qty}</div></div><span class="p">${money(p.price * l.qty)}</span></div>`; }).join("")}
          <div style="border-top:1px solid var(--line);margin-top:10px;padding-top:10px" id="checkoutSummary">${summaryRows()}</div>
          <button class="btn btn-primary btn-block" type="submit" style="margin-top:18px">Xác nhận đặt hàng</button>
          <p class="muted center" style="font-size:.76rem;margin:12px 0 0">Bằng việc đặt hàng, bạn đồng ý với <a class="link-btn" href="#support-returns">chính sách đổi trả</a> của NESTORA.</p>
        </div>
      </aside>
    </form>`;
  };
  function bindCheckout() {
    const form = $("#checkoutForm");
    if (!form) return;
    const updShip = () => {
      const method = form.ship.value;
      $("#checkoutSummary").innerHTML = summaryRows(method);
      const free = subtotal() - discount() >= FREE_SHIP;
      $("#shipStd").textContent = free ? "Miễn phí" : money(SHIP_FEE.standard);
      $("#shipExp").textContent = money(free ? SHIP_FEE.express - SHIP_FEE.standard : SHIP_FEE.express);
    };
    updShip();
    const be = BE();
    const hint = $("#checkoutAuth");
    if (be.available && be.user) {
      hint.innerHTML = `Bạn đang đặt hàng với tài khoản <b>${esc(be.user.email || be.user.name)}</b>. Đơn hàng sẽ được lưu vào <a class="link-btn" href="#account">tài khoản của bạn</a>.`;
      be.getProfile().then((p) => {
        const fill = (name, val) => { if (val && form[name] && !form[name].value) form[name].value = val; };
        fill("name", p.name || be.user.name); fill("phone", p.phone); fill("email", be.user.email);
        fill("province", p.province); fill("district", p.district); fill("address", p.address);
      }).catch(() => {});
    } else if (be.available) {
      hint.innerHTML = `<a class="link-btn" href="#account">Đăng nhập</a> để lưu địa chỉ và theo dõi đơn hàng trên mọi thiết bị, hoặc tiếp tục đặt hàng không cần tài khoản.`;
    } else hint.hidden = true;
    form.addEventListener("change", (e) => {
      if (e.target.name === "ship") updShip();
      if (e.target.name === "pay") $("#payExtra").hidden = form.pay.value !== "online";
    });
    const setErr = (name, msg) => {
      const field = form[name].closest(".field");
      field.classList.toggle("invalid", !!msg);
      field.querySelector(".err").textContent = msg || "";
      return !msg;
    };
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      let ok = true;
      ok = setErr("name", d.name.trim().length < 2 ? "Vui lòng nhập họ tên" : "") && ok;
      ok = setErr("phone", /^(0|\+84)\d{9}$/.test(d.phone.replace(/[\s.]/g, "")) ? "" : "Số điện thoại không hợp lệ (VD: 0912345678)") && ok;
      ok = setErr("email", d.email && !/^\S+@\S+\.\S+$/.test(d.email) ? "Email không hợp lệ" : "") && ok;
      ok = setErr("province", d.province ? "" : "Vui lòng chọn tỉnh / thành") && ok;
      ok = setErr("district", d.district.trim() ? "" : "Vui lòng nhập quận / huyện") && ok;
      ok = setErr("address", d.address.trim().length < 5 ? "Vui lòng nhập địa chỉ cụ thể" : "") && ok;
      if (d.pay === "online") ok = setErr("card", d.card.replace(/\s/g, "").length >= 12 ? "" : "Nhập số thẻ demo (tối thiểu 12 số)") && ok;
      if (!ok) { const first = $(".field.invalid input, .field.invalid select", form); first && first.focus(); return; }

      store.set("customer", { name: d.name, phone: d.phone, email: d.email, province: d.province, district: d.district, address: d.address });
      const order = {
        id: "NS" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10),
        createdAt: Date.now(),
        items: cart.map((l) => ({ id: l.id, qty: l.qty, price: byId(l.id).price })),
        subtotal: subtotal(), discount: discount(), coupon, shipping: shipping(d.ship),
        total: subtotal() - discount() + shipping(d.ship),
        ship: d.ship, pay: d.pay, gateway: d.gateway,
        customer: { name: d.name, phone: d.phone, email: d.email, address: `${d.address}, ${d.district}, ${d.province}`, note: d.note },
        step: 0, paid: false,
      };
      const finish = async () => {
        if (d.pay === "online") order.paid = true;
        if (be.available) {
          try {
            await Promise.race([be.saveOrder(order), new Promise((_, rej) => setTimeout(() => rej({ code: "unavailable" }), 10000))]);
            order.synced = true;
            if (be.user) be.saveProfile({ name: d.name, phone: d.phone, province: d.province, district: d.district, address: d.address }).catch(() => {});
          } catch (err) {
            order.synced = false;
            toast("Đơn hàng đã lưu trên máy này nhưng chưa gửi được lên hệ thống. NESTORA sẽ liên hệ bạn qua điện thoại.");
          }
        }
        orders.unshift(order); store.set("orders", orders);
        cart = []; coupon = null; store.set("coupon", null); saveCart();
        justPlaced = order.id;
        location.hash = `#order-${order.id}`;
      };
      const btn = form.querySelector("[type=submit]");
      btn.disabled = true;
      btn.textContent = d.pay === "online" ? "Đang xử lý thanh toán…" : "Đang đặt hàng…";
      setTimeout(finish, d.pay === "online" ? 1400 : 600);
    });
  }

  /* ----- Order & tracking ----- */
  const STATUS = [
    ["Đã đặt hàng", "Đơn hàng đã được ghi nhận"],
    ["Đã xác nhận", "NESTORA đã xác nhận đơn"],
    ["Đang đóng gói", "Sản phẩm đang được chuẩn bị"],
    ["Đang giao hàng", "Đơn vị vận chuyển đang giao"],
    ["Đã giao hàng", "Giao hàng thành công"],
  ];
  const PAY_TEXT = { cod: "Thanh toán khi nhận hàng (COD)", bank: "Chuyển khoản ngân hàng", online: "Thanh toán trực tuyến" };
  views.order = ([id], query) => {
    const o = orders.find((x) => x.id === id);
    if (!o && BE().available && !BE().authReady) return `<div class="container section"><div class="viewer-loading" style="position:static;background:none"><span class="spinner"></span>Đang tải đơn hàng…</div></div>`;
    if (!o && BE().user) return `<div class="container section" id="orderRemote" data-id="${esc(id)}"><div class="viewer-loading" style="position:static;background:none"><span class="spinner"></span>Đang tìm đơn hàng ${esc(id)}…</div></div>`;
    if (!o) return `<div class="container section"><div class="empty"><h3>Không tìm thấy đơn hàng ${esc(id)}</h3><p class="muted">${BE().available ? "Nếu bạn đặt hàng khi đã đăng nhập, hãy <a class=\"link-btn\" href=\"#account\">đăng nhập</a> để xem đơn." : ""}</p><a class="btn btn-primary" href="#track">Tra cứu đơn hàng khác</a></div></div>`;
    const isNew = justPlaced === o.id;
    const d = new Date(o.createdAt);
    return `
    <div class="container" style="padding:40px 0 80px">
      ${isNew ? `<div class="order-done reveal"><div class="check-circle">${ICON.check}</div><h1 style="font-size:clamp(2rem,4vw,2.8rem)">Cảm ơn bạn đã đặt hàng!</h1><p class="muted">Mã đơn hàng của bạn là <b style="color:var(--plum)">${o.id}</b>. Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.</p></div>`
        : crumbs([["#track", "Theo dõi đơn hàng"], [null, o.id]])}
      <div class="cart-layout" style="margin-top:30px;padding-bottom:0">
        <div>
          <div class="panel">
            <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center">
              <h3 style="margin:0">Đơn hàng ${o.id}</h3><span class="status-pill">${STATUS[o.step][0]}</span>
            </div>
            <p class="muted" style="font-size:.84rem;margin:6px 0 0">Đặt lúc ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} · ${d.toLocaleDateString("vi-VN")}</p>
            <ol class="timeline">${STATUS.map(([t, s], i) => `<li class="${i <= o.step ? "done" : ""}"><strong>${t}</strong>${s}</li>`).join("")}</ol>
            ${o.synced ? `<p class="muted center" style="font-size:.8rem;margin:18px 0 0">Trạng thái được NESTORA cập nhật khi đơn hàng được xử lý.</p>`
               : o.step < STATUS.length - 1 ? `<div class="center" style="margin-top:22px"><button class="btn btn-outline btn-sm" id="advance">Mô phỏng cập nhật trạng thái (demo)</button></div>` : ""}
          </div>
          ${o.pay === "bank" && !o.paid ? `
          <div class="panel">
            <h3>Thông tin chuyển khoản</h3>
            <div class="info-grid" style="margin:10px 0">
              <div class="info-box"><div class="k">Ngân hàng</div><div class="v">Ngân hàng demo</div></div>
              <div class="info-box"><div class="k">Số tài khoản</div><div class="v">0000 1234 5678</div></div>
              <div class="info-box"><div class="k">Chủ tài khoản</div><div class="v">NESTORA</div></div>
              <div class="info-box"><div class="k">Nội dung</div><div class="v">${o.id}</div></div>
            </div>
            <p class="muted" style="font-size:.84rem">Số tiền: <b style="color:var(--plum)">${money(o.total)}</b>. Đơn hàng sẽ được xác nhận sau khi NESTORA nhận được thanh toán.</p>
            ${o.synced ? "" : '<button class="btn btn-primary btn-sm" id="markPaid">Tôi đã chuyển khoản (demo)</button>'}
          </div>` : ""}
          <div class="panel">
            <h3>Sản phẩm</h3>
            ${o.items.map((it) => { const p = byId(it.id); return `<div class="mini-line"><img src="${p.img}" alt=""><div>${esc(p.name)}<div class="q">${money(it.price)} × ${it.qty}</div></div><span class="p">${money(it.price * it.qty)}</span></div>`; }).join("")}
          </div>
        </div>
        <aside>
          <div class="panel">
            <h3>Thông tin giao hàng</h3>
            <p style="margin:0 0 4px"><b>${esc(o.customer.name)}</b> · ${esc(o.customer.phone)}</p>
            <p class="muted" style="font-size:.88rem">${esc(o.customer.address)}</p>
            ${o.customer.note ? `<p class="muted" style="font-size:.84rem">Ghi chú: ${esc(o.customer.note)}</p>` : ""}
            <p style="font-size:.88rem;margin:0">Giao hàng: <b>${o.ship === "express" ? "Nhanh (1–2 ngày)" : "Tiêu chuẩn (2–4 ngày)"}</b></p>
            <p style="font-size:.88rem">Thanh toán: <b>${PAY_TEXT[o.pay]}</b> — <span style="color:${o.paid ? "var(--success)" : "var(--clay)"}">${o.paid ? "Đã thanh toán" : o.pay === "cod" ? "Thanh toán khi nhận" : "Chờ thanh toán"}</span></p>
            <div style="border-top:1px solid var(--line);padding-top:10px">
              <div class="summary-row"><span>Tạm tính</span><span>${money(o.subtotal)}</span></div>
              ${o.discount ? `<div class="summary-row"><span>Giảm giá</span><span>−${money(o.discount)}</span></div>` : ""}
              <div class="summary-row"><span>Phí giao hàng</span><span>${o.shipping ? money(o.shipping) : "Miễn phí"}</span></div>
              <div class="summary-row total"><span>Tổng cộng</span><span>${money(o.total)}</span></div>
            </div>
            <a class="btn btn-outline btn-block" href="#shop" style="margin-top:16px">Tiếp tục mua sắm</a>
          </div>
        </aside>
      </div>
    </div>`;
  };
  function bindOrder([id]) {
    const be = BE();
    const o = orders.find((x) => x.id === id);
    if (be.available && be.authReady && (be.user || (o && o.synced))) {
      // lấy trạng thái mới nhất từ hệ thống (chủ đơn hoặc quản trị viên mới đọc được)
      be.getOrder(id).then((r) => {
        if (!r) { if (!o) render(true); return; }
        const before = o ? JSON.stringify([o.step, o.paid]) : "";
        cacheOrders([r]);
        const now = orders.find((x) => x.id === id);
        if (!o || JSON.stringify([now.step, now.paid]) !== before) render(true);
      }).catch(() => { if (!o) { const box = $("#orderRemote"); if (box) box.innerHTML = `<div class="empty"><h3>Không tìm thấy đơn hàng ${esc(id)}</h3><a class="btn btn-primary" href="#track">Tra cứu đơn hàng khác</a></div>`; } });
    }
    if (!o) return;
    const save = () => { store.set("orders", orders); render(); };
    const adv = $("#advance");
    if (adv) adv.addEventListener("click", () => { o.step = Math.min(STATUS.length - 1, o.step + 1); if (o.step === STATUS.length - 1 && o.pay === "cod") o.paid = true; save(); });
    const mp = $("#markPaid");
    if (mp) mp.addEventListener("click", () => { o.paid = true; o.step = Math.max(o.step, 1); save(); toast("Đã ghi nhận thanh toán"); });
  }

  views.track = () => `
    <section class="page-hero"><div class="container">
      ${crumbs([[null, "Theo dõi đơn hàng"]])}
      <span class="eyebrow">Order tracking</span><h1>Theo dõi đơn hàng</h1>
      <p>Nhập mã đơn hàng (VD: NS12345678) để xem trạng thái giao hàng.</p>
      <form class="track-form" id="trackForm"><input class="input" id="trackInput" placeholder="Mã đơn hàng" aria-label="Mã đơn hàng"><button class="btn btn-primary">Tra cứu</button></form>
    </div></section>
    <div class="container" style="padding-bottom:80px">
      <div class="panel">
        <h3>Đơn hàng gần đây trên thiết bị này</h3>
        ${orders.length ? `<div class="order-list">${orders.map((o) => `<a class="order-item" href="#order-${o.id}"><b>${o.id}</b><span class="muted">${new Date(o.createdAt).toLocaleDateString("vi-VN")}</span><span>${money(o.total)}</span><span class="status-pill">${STATUS[o.step][0]}</span></a>`).join("")}</div>`
          : '<p class="muted" style="margin:0">Chưa có đơn hàng nào.</p>'}
      </div>
    </div>`;
  function bindTrack() {
    const be = BE();
    if (be.available && be.user) be.myOrders().then((list) => { if (list.length) { const n = orders.length; cacheOrders(list); if (orders.length !== n) render(true); } }).catch(() => {});
    const f = $("#trackForm");
    f && f.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = $("#trackInput").value.trim().toUpperCase();
      if (orders.find((o) => o.id === id) || (be.available && be.user)) location.hash = `#order-${id}`;
      else toast(be.available ? "Không tìm thấy đơn hàng trên thiết bị này. Hãy đăng nhập nếu bạn đặt hàng bằng tài khoản." : "Không tìm thấy đơn hàng với mã này");
    });
  }

  /* ----- Support ----- */
  const SUPPORT_TABS = [
    ["faq", "Câu hỏi thường gặp"], ["guide", "Hướng dẫn mua hàng"], ["shipping", "Chính sách giao hàng"],
    ["returns", "Đổi trả & bảo hành"], ["contact", "Thông tin liên hệ"],
  ];
  const SUPPORT_CONTENT = {
    faq: () => `<h2>Câu hỏi thường gặp</h2><div class="accordion">${FAQ.map((f) => `<details><summary>${f.q}</summary><div class="acc-body"><p>${f.a}</p>${f.link ? `<a class="btn btn-outline btn-sm" href="${f.link[0]}">${f.link[1]}</a>` : ""}</div></details>`).join("")}</div>
      <p class="muted" style="margin-top:24px">Không tìm thấy câu trả lời? Mở hộp chat ở góc phải hoặc <a class="link-btn" href="https://zalo.me/" target="_blank" rel="noopener">nhắn tư vấn viên qua Zalo</a>.</p>`,
    guide: () => `<h2>Hướng dẫn mua hàng</h2>
      <ol class="guide-steps">
        <li><strong>Tìm sản phẩm phù hợp</strong>Duyệt bộ sưu tập với bộ lọc theo dòng sản phẩm, kiểu dáng, chất liệu, cảm giác, chiều cao, độ đầy đặn và giá – hoặc làm Pillow Quiz.</li>
        <li><strong>Thêm vào giỏ hàng</strong>Chọn số lượng và nhấn “Thêm vào giỏ”. Bạn có thể thay đổi số lượng hoặc xóa sản phẩm trong giỏ.</li>
        <li><strong>Nhập thông tin giao hàng</strong>Điền họ tên, số điện thoại và địa chỉ nhận hàng.</li>
        <li><strong>Chọn phương thức thanh toán</strong>COD, chuyển khoản ngân hàng hoặc thanh toán trực tuyến.</li>
        <li><strong>Xác nhận &amp; theo dõi đơn</strong>Sau khi đặt hàng, bạn nhận mã đơn để theo dõi trạng thái tại trang Theo dõi đơn hàng.</li>
      </ol>`,
    shipping: () => `<h2>Chính sách giao hàng</h2>
      <div class="info-grid">
        <div class="info-box"><div class="k">Tiêu chuẩn</div><div class="v">2–4 ngày · 30.000₫</div></div>
        <div class="info-box"><div class="k">Giao nhanh</div><div class="v">1–2 ngày · 50.000₫</div></div>
        <div class="info-box"><div class="k">Miễn phí</div><div class="v">Đơn từ 500.000₫</div></div>
      </div>
      <ul><li>Giao hàng toàn quốc. Nội thành các thành phố lớn thường nhận hàng trong 1–2 ngày.</li>
      <li>Đơn hàng được xác nhận qua điện thoại trước khi giao.</li>
      <li>Khách hàng được kiểm tra sản phẩm trước khi thanh toán (với đơn COD).</li>
      <li>Thời gian giao có thể kéo dài vào dịp lễ, Tết hoặc do điều kiện thời tiết.</li></ul>`,
    returns: () => `<h2>Chính sách đổi trả &amp; bảo hành</h2>
      <h3>Đổi trả trong 7 ngày</h3>
      <ul><li>Sản phẩm còn nguyên tem, nhãn, vỏ bọc và chưa qua giặt.</li><li>Đổi sang mẫu khác cùng hoặc cao hơn giá trị (bù chênh lệch).</li><li>Sản phẩm lỗi do nhà sản xuất được đổi mới miễn phí, NESTORA chịu phí vận chuyển.</li></ul>
      <h3>Bảo hành</h3>
      <ul><li>Bảo hành 12 tháng cho ruột gối với lỗi xẹp lún bất thường, bung đường may.</li><li>Dòng Signature Comfort và Contour: bảo hành 24 tháng.</li><li>Không bảo hành với hư hỏng do sử dụng sai hướng dẫn, giặt sai cách hoặc tác động ngoại lực.</li></ul>`,
    contact: () => `<h2>Thông tin liên hệ</h2>
      <div class="info-grid">
        <div class="info-box"><div class="k">Hotline</div><div class="v">1900 0000</div></div>
        <div class="info-box"><div class="k">Email</div><div class="v">hello@nestora.vn</div></div>
        <div class="info-box"><div class="k">Zalo</div><div class="v"><a href="https://zalo.me/" target="_blank" rel="noopener">Chat với tư vấn viên</a></div></div>
        <div class="info-box"><div class="k">Giờ làm việc</div><div class="v">8:00 – 21:00 hằng ngày</div></div>
      </div>
      <h3>Theo dõi NESTORA</h3>
      <div class="socials socials-dark">${socialLinks()}</div>
      <p class="muted" style="font-size:.8rem">* Thông tin liên hệ trong bản demo là thông tin minh họa.</p>
      <div class="panel" style="margin-top:24px"><h3>Gửi lời nhắn cho NESTORA</h3>
        <form class="form-grid" id="contactForm">
          <div class="field"><label for="c-name">Họ tên</label><input id="c-name" name="name" required></div>
          <div class="field"><label for="c-phone">Số điện thoại / Email</label><input id="c-phone" name="contact" required></div>
          <div class="field full"><label for="c-msg">Nội dung</label><textarea id="c-msg" name="message" rows="4" maxlength="1500" required></textarea></div>
          <div class="field full"><button class="btn btn-primary" style="justify-self:start">Gửi lời nhắn</button></div>
        </form></div>`,
  };
  views.support = ([tab = "faq"]) => {
    if (!SUPPORT_CONTENT[tab]) tab = "faq";
    return `
    <section class="page-hero"><div class="container">
      ${crumbs([[null, "Hỗ trợ khách hàng"]])}
      <span class="eyebrow">Customer care</span><h1>Hỗ trợ khách hàng</h1>
      <p>Chúng tôi luôn sẵn sàng giúp bạn tìm được chiếc gối phù hợp và có trải nghiệm mua sắm thoải mái nhất.</p>
    </div></section>
    <div class="container support-layout">
      <nav class="side-nav" aria-label="Mục hỗ trợ">${SUPPORT_TABS.map(([k, t]) => `<a href="#support-${k}" class="${k === tab ? "on" : ""}">${t}</a>`).join("")}</nav>
      <div class="support-content reveal">${SUPPORT_CONTENT[tab]()}</div>
    </div>`;
  };
  function bindSupport() {
    const f = $("#contactForm");
    f && f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f));
      const be = BE();
      const btn = f.querySelector("button");
      btn.disabled = true;
      try {
        if (be.available) await be.saveContact({ name: d.name.trim(), contact: d.contact.trim(), message: d.message.trim().slice(0, 1500) });
        f.reset();
        toast("Cảm ơn bạn! NESTORA đã nhận lời nhắn và sẽ phản hồi sớm nhất.");
      } catch (err) { toast("Chưa gửi được lời nhắn: " + be.message(err)); }
      finally { btn.disabled = false; }
    });
  }


  /* ----- Tài khoản (Firebase Authentication + Firestore) ----- */
  const BE = () => window.Backend || { available: false, authReady: true, user: null };
  let accountTab = "login";
  const field = (id, label, type = "text", attrs = "") =>
    `<div class="field full"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" ${attrs}><span class="err"></span></div>`;

  views.account = () => {
    const be = BE();
    const head = `<section class="page-hero"><div class="container">${crumbs([[null, "Tài khoản"]])}<span class="eyebrow">My account</span><h1>Tài khoản</h1></div></section>`;
    if (!be.available) return head + `<div class="container" style="padding-bottom:80px"><div class="empty"><h3>Chưa kết nối được máy chủ tài khoản</h3><p class="muted">Kiểm tra kết nối mạng rồi tải lại trang. Bạn vẫn có thể mua hàng bình thường mà không cần đăng nhập.</p><a class="btn btn-primary" href="#shop">Tiếp tục mua sắm</a></div></div>`;
    if (!be.authReady) return head + `<div class="container" style="padding-bottom:80px"><div class="viewer-loading" style="position:static;background:none"><span class="spinner"></span>Đang tải…</div></div>`;
    if (!be.user) {
      const tabs = `<div class="seg auth-tabs" role="tablist">
          <button type="button" data-atab="login" class="${accountTab === "login" ? "on" : ""}" role="tab">Đăng nhập</button>
          <button type="button" data-atab="register" class="${accountTab === "register" ? "on" : ""}" role="tab">Đăng ký</button></div>`;
      let form;
      if (accountTab === "register") {
        form = `<form id="authForm" data-mode="register" novalidate>${field("a-name", "Họ và tên", "text", 'autocomplete="name"')}${field("a-email", "Email", "email", 'autocomplete="email"')}${field("a-pass", "Mật khẩu (ít nhất 6 ký tự)", "password", 'autocomplete="new-password"')}${field("a-pass2", "Nhập lại mật khẩu", "password", 'autocomplete="new-password"')}
          <p class="form-msg" id="authMsg" role="alert"></p><button class="btn btn-primary btn-block" type="submit">Tạo tài khoản</button></form>`;
      } else if (accountTab === "forgot") {
        form = `<form id="authForm" data-mode="forgot" novalidate><p class="muted" style="margin-top:0">Nhập email đã đăng ký, NESTORA sẽ gửi link đặt lại mật khẩu.</p>${field("a-email", "Email", "email", 'autocomplete="email"')}
          <p class="form-msg" id="authMsg" role="alert"></p><button class="btn btn-primary btn-block" type="submit">Gửi link đặt lại mật khẩu</button>
          <button type="button" class="link-btn" data-atab="login" style="margin-top:14px">← Quay lại đăng nhập</button></form>`;
      } else {
        form = `<form id="authForm" data-mode="login" novalidate>${field("a-email", "Email", "email", 'autocomplete="email"')}${field("a-pass", "Mật khẩu", "password", 'autocomplete="current-password"')}
          <button type="button" class="link-btn" data-atab="forgot" style="margin:-4px 0 14px">Quên mật khẩu?</button>
          <p class="form-msg" id="authMsg" role="alert"></p><button class="btn btn-primary btn-block" type="submit">Đăng nhập</button></form>`;
      }
      return head + `
      <div class="container auth-layout">
        <div class="panel auth-card">
          ${accountTab === "forgot" ? "<h3>Quên mật khẩu</h3>" : tabs}
          ${form}
          ${accountTab === "forgot" ? "" : `<div class="or"><span>hoặc</span></div>
          <button type="button" class="btn btn-outline btn-block" id="googleBtn"><svg viewBox="0 0 24 24" style="width:18px;height:18px"><path fill="#4285F4" stroke="none" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path fill="#34A853" stroke="none" d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" stroke="none" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9z"/><path fill="#EA4335" stroke="none" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6z"/></svg> Tiếp tục với Google</button>`}
        </div>
        <div class="auth-benefits">
          <h2>Đăng nhập để mua sắm tiện hơn</h2>
          <ul class="ticks">
            <li>Lưu sẵn địa chỉ giao hàng, thanh toán nhanh hơn</li>
            <li>Xem lịch sử và trạng thái đơn hàng trên mọi thiết bị</li>
            <li>Lưu kết quả Pillow Quiz và gợi ý dành riêng cho bạn</li>
          </ul>
          <p class="muted" style="font-size:.84rem">Bạn vẫn có thể đặt hàng mà không cần tài khoản.</p>
        </div>
      </div>`;
    }
    const u = be.user;
    return head + `
    <div class="container account-layout">
      <aside class="panel account-side">
        <div class="avatar">${esc((u.name || u.email || "?").trim().charAt(0).toUpperCase())}</div>
        <h3 style="margin:10px 0 2px">${esc(u.name || "Khách hàng NESTORA")}</h3>
        <p class="muted" style="font-size:.85rem;margin:0 0 16px;word-break:break-all">${esc(u.email || "")}</p>
        <button class="btn btn-outline btn-sm btn-block" id="signOutBtn">Đăng xuất</button>
      </aside>
      <div>
        <div class="panel">
          <h3>Thông tin &amp; địa chỉ giao hàng</h3>
          <form class="form-grid" id="profileForm" novalidate>
            <div class="field"><label for="p-name">Họ và tên</label><input id="p-name" name="name" autocomplete="name"></div>
            <div class="field"><label for="p-phone">Số điện thoại</label><input id="p-phone" name="phone" type="tel" autocomplete="tel"></div>
            <div class="field"><label for="p-prov">Tỉnh / Thành phố</label><select id="p-prov" name="province"><option value="">Chọn tỉnh / thành</option>${PROVINCES.map((p) => `<option>${p}</option>`).join("")}</select></div>
            <div class="field"><label for="p-dist">Quận / Huyện</label><input id="p-dist" name="district"></div>
            <div class="field full"><label for="p-addr">Địa chỉ cụ thể</label><input id="p-addr" name="address" autocomplete="street-address"></div>
            <div class="field full"><button class="btn btn-primary" style="justify-self:start" type="submit">Lưu thông tin</button></div>
          </form>
        </div>
        <div class="panel"><h3>Đơn hàng của tôi</h3><div id="myOrders"><p class="muted">Đang tải…</p></div></div>
        <div class="panel"><h3>Kết quả Pillow Quiz</h3><div id="myQuiz"><p class="muted">Đang tải…</p></div></div>
      </div>
    </div>`;
  };

  const orderRow = (o) => `<a class="order-item" href="#order-${o.id}"><b>${o.id}</b><span class="muted">${new Date(o.createdAt).toLocaleDateString("vi-VN")}</span><span>${money(o.total)}</span><span class="status-pill">${STATUS[o.step || 0][0]}</span></a>`;
  function cacheOrders(list) {
    list.forEach((r) => {
      const i = orders.findIndex((o) => o.id === r.id);
      const merged = { ...r, createdAt: r.createdAtMs || (orders[i] && orders[i].createdAt) || Date.now(), synced: true };
      delete merged.createdAtMs; delete merged.uid;
      if (i >= 0) orders[i] = { ...orders[i], ...merged }; else orders.push(merged);
    });
    orders.sort((a, b) => b.createdAt - a.createdAt);
    store.set("orders", orders);
  }

  function bindAccount() {
    const be = BE();
    $$("[data-atab]").forEach((b) => b.addEventListener("click", () => { accountTab = b.dataset.atab; render(true); }));
    const form = $("#authForm");
    if (form) {
      const msg = $("#authMsg");
      const say = (t, ok) => { msg.textContent = t; msg.classList.toggle("ok", !!ok); };
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const mode = form.dataset.mode;
        const email = form["a-email"].value.trim();
        const pass = form["a-pass"] ? form["a-pass"].value : "";
        if (!/^\S+@\S+\.\S+$/.test(email)) return say("Vui lòng nhập email hợp lệ.");
        if (mode === "register") {
          if (form["a-name"].value.trim().length < 2) return say("Vui lòng nhập họ tên.");
          if (pass.length < 6) return say("Mật khẩu cần ít nhất 6 ký tự.");
          if (pass !== form["a-pass2"].value) return say("Hai mật khẩu chưa khớp.");
        } else if (mode === "login" && !pass) return say("Vui lòng nhập mật khẩu.");
        const btn = form.querySelector("[type=submit]");
        btn.disabled = true; say("");
        try {
          if (mode === "register") { await be.signUp({ name: form["a-name"].value.trim(), email, password: pass }); toast("Tạo tài khoản thành công. Chào mừng bạn đến với NESTORA!"); }
          else if (mode === "login") { await be.signIn(email, pass); toast("Đăng nhập thành công"); }
          else { await be.resetPassword(email); say("Đã gửi link đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (cả mục Spam).", true); }
        } catch (err) { say(be.message(err)); }
        finally { btn.disabled = false; }
      });
    }
    const g = $("#googleBtn");
    if (g) g.addEventListener("click", async () => {
      try { await be.signInGoogle(); toast("Đăng nhập thành công"); }
      catch (err) { const m = $("#authMsg"); if (m) m.textContent = be.message(err); }
    });
    const so = $("#signOutBtn");
    if (so) so.addEventListener("click", async () => { await be.signOut(); toast("Đã đăng xuất"); });

    const pf = $("#profileForm");
    if (pf && be.user) {
      be.getProfile().then((p) => {
        const local = store.get("customer", {});
        pf.name.value = p.name || be.user.name || local.name || "";
        pf.phone.value = p.phone || local.phone || "";
        pf.province.value = p.province || local.province || "";
        pf.district.value = p.district || local.district || "";
        pf.address.value = p.address || local.address || "";
      }).catch(() => {});
      pf.addEventListener("submit", async (e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(pf));
        try { await be.saveProfile(d); toast("Đã lưu thông tin"); }
        catch (err) { toast(be.message(err)); }
      });
      be.myOrders().then((list) => {
        cacheOrders(list);
        const box = $("#myOrders");
        if (box) box.innerHTML = list.length ? `<div class="order-list">${orders.filter((o) => list.some((r) => r.id === o.id)).map(orderRow).join("")}</div>`
          : '<p class="muted" style="margin:0">Bạn chưa có đơn hàng nào. <a class="link-btn" href="#shop">Mua sắm ngay</a></p>';
      }).catch((err) => { const box = $("#myOrders"); if (box) box.innerHTML = `<p class="muted">${esc(be.message(err))}</p>`; });
      be.myQuiz().then((list) => {
        const box = $("#myQuiz");
        if (!box) return;
        box.innerHTML = list.length ? list.map((q) => {
          const when = q.createdAtMs ? new Date(q.createdAtMs).toLocaleDateString("vi-VN") : "";
          const tops = (q.top || []).map((t) => { const p = byId(t.id); return p ? `<a class="chip" href="#product-${p.id}">${esc(p.name)} · ${t.pct}%</a>` : ""; }).join(" ");
          return `<div class="quiz-row"><span class="muted">${when}</span><div class="chips" style="margin:0">${tops}</div></div>`;
        }).join("") + '<a class="btn btn-outline btn-sm" href="#quiz" style="margin-top:12px">Làm lại Pillow Quiz</a>'
          : '<p class="muted" style="margin:0">Bạn chưa làm Pillow Quiz. <a class="link-btn" href="#quiz">Làm ngay</a></p>';
      }).catch(() => { const box = $("#myQuiz"); if (box) box.innerHTML = '<p class="muted">Không tải được kết quả quiz.</p>'; });
    }
  }


  /* ----- Quản trị: kết quả Pillow Quiz của khách hàng ----- */
  const QLAB = Object.fromEntries(QUIZ.map((q) => [q.key, Object.fromEntries(q.options.map(([v, t]) => [v, q.key === "budget" ? t.replace(" VNĐ", "") : t.split(" – ")[0].split(",")[0]]))]));
  const QTITLE = { purpose: "Mục đích sử dụng", position: "Tư thế nằm", feel: "Cảm giác mong muốn", height: "Chiều cao", fullness: "Độ đầy đặn", quality: "Tiêu chí chất lượng", budget: "Ngân sách" };
  let adminData = null;
  const adminFilter = { q: "", product: "", who: "", days: "" };

  views.admin = () => `
    <section class="page-hero"><div class="container">
      ${crumbs([["#account", "Tài khoản"], [null, "Kết quả Pillow Quiz"]])}
      <span class="eyebrow">Quản trị</span><h1>Kết quả Pillow Quiz của khách hàng</h1>
      <p>Tổng hợp câu trả lời và sản phẩm được gợi ý cho từng khách sau khi hoàn thành Pillow Quiz.</p>
    </div></section>
    <div class="container admin-wrap" id="adminMount"><div class="viewer-loading" style="position:static;background:none"><span class="spinner"></span>Đang tải dữ liệu…</div></div>`;

  const ansText = (key, v) => Array.isArray(v) ? v.map((x) => QLAB[key][x] || x).join(", ") : (QLAB[key] && QLAB[key][v]) || v || "–";
  const whenText = (r) => r.createdAtMs ? new Date(r.createdAtMs).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "–";

  function adminFiltered() {
    const f = adminFilter, q = f.q.trim().toLowerCase();
    const since = f.days ? Date.now() - +f.days * 86400000 : 0;
    return adminData.filter((r) =>
      (!q || (r.name || "").toLowerCase().includes(q) || (r.email || "").toLowerCase().includes(q)) &&
      (!f.product || (r.top && r.top[0] && r.top[0].id === f.product)) &&
      (!f.who || (f.who === "member" ? !!r.uid : !r.uid)) &&
      (!since || (r.createdAtMs || 0) >= since));
  }

  // Biểu đồ thanh ngang một chuỗi: một màu thương hiệu, nhãn giá trị trực tiếp, chú thích khi rê chuột
  function barList(rows, total) {
    const max = Math.max(1, ...rows.map((r) => r.n));
    return `<div class="bars">${rows.map((r) => {
      const pct = total ? Math.round((r.n / total) * 100) : 0;
      return `<div class="bar-row" title="${esc(r.label)}: ${r.n} lượt (${pct}%)">
        <span class="bar-label">${esc(r.label)}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${Math.max(r.n ? 2 : 0, (r.n / max) * 100)}%"></span></span>
        <span class="bar-val">${r.n} <small>(${pct}%)</small></span></div>`;
    }).join("")}</div>`;
  }

  function renderAdmin() {
    const box = $("#adminMount");
    if (!box || !adminData) return;
    const list = adminFiltered();
    const total = list.length;
    const members = new Set(list.filter((r) => r.uid).map((r) => r.uid)).size;
    const guests = list.filter((r) => !r.uid).length;
    const topCount = {};
    list.forEach((r) => { const id = r.top && r.top[0] && r.top[0].id; if (id) topCount[id] = (topCount[id] || 0) + 1; });
    const topRows = PRODUCTS.map((p) => ({ label: `${p.code} ${p.name}`, n: topCount[p.id] || 0 })).filter((r) => r.n).sort((a, b) => b.n - a.n);
    const best = topRows[0];
    const dist = (key) => {
      const c = {};
      list.forEach((r) => { const v = r.answers && r.answers[key]; (Array.isArray(v) ? v : v ? [v] : []).forEach((x) => (c[x] = (c[x] || 0) + 1)); });
      return QUIZ.find((q) => q.key === key).options.map(([v]) => ({ label: QLAB[key][v], n: c[v] || 0 }));
    };
    const sel = (id, opts, val) => `<select class="select" id="${id}">${opts.map(([v, t]) => `<option value="${v}" ${v === val ? "selected" : ""}>${t}</option>`).join("")}</select>`;
    box.innerHTML = `
      <div class="admin-filters">
        <input class="input" id="af-q" placeholder="Tìm theo tên hoặc email" value="${esc(adminFilter.q)}" aria-label="Tìm khách hàng">
        ${sel("af-product", [["", "Mọi sản phẩm gợi ý"], ...PRODUCTS.map((p) => [p.id, `${p.code} ${p.name}`])], adminFilter.product)}
        ${sel("af-who", [["", "Tất cả khách"], ["member", "Khách có tài khoản"], ["guest", "Khách vãng lai"]], adminFilter.who)}
        ${sel("af-days", [["", "Mọi thời gian"], ["7", "7 ngày qua"], ["30", "30 ngày qua"], ["90", "90 ngày qua"]], adminFilter.days)}
        <button class="btn btn-outline btn-sm" id="af-refresh">Tải lại</button>
        <button class="btn btn-primary btn-sm" id="af-csv" ${total ? "" : "disabled"}>Xuất CSV</button>
      </div>
      <div class="stat-tiles">
        <div class="stat"><span class="k">Lượt làm quiz</span><strong>${total}</strong></div>
        <div class="stat"><span class="k">Khách có tài khoản</span><strong>${members}</strong></div>
        <div class="stat"><span class="k">Lượt của khách vãng lai</span><strong>${guests}</strong></div>
        <div class="stat"><span class="k">Gợi ý nhiều nhất</span><strong class="sm">${best ? esc(best.label) : "–"}</strong></div>
      </div>
      ${total ? `
      <div class="admin-grid">
        <div class="panel"><h3>Sản phẩm được gợi ý phù hợp nhất</h3><p class="muted chart-note">Số lượt mỗi sản phẩm đứng đầu kết quả</p>${barList(topRows, total)}</div>
        <div class="panel"><h3>${QTITLE.purpose}</h3>${barList(dist("purpose"), total)}<h3 style="margin-top:22px">${QTITLE.budget}</h3>${barList(dist("budget"), total)}</div>
        <div class="panel"><h3>${QTITLE.feel}</h3>${barList(dist("feel"), total)}<h3 style="margin-top:22px">${QTITLE.position}</h3>${barList(dist("position"), total)}</div>
        <div class="panel"><h3>${QTITLE.height}</h3>${barList(dist("height"), total)}<h3 style="margin-top:22px">${QTITLE.fullness}</h3>${barList(dist("fullness"), total)}</div>
        <div class="panel"><h3>${QTITLE.quality}</h3><p class="muted chart-note">Khách được chọn nhiều đáp án</p>${barList(dist("quality"), total)}</div>
      </div>
      <div class="panel">
        <h3>Chi tiết từng lượt (${total})</h3>
        <div class="table-scroll"><table class="admin-table">
          <thead><tr><th>Thời gian</th><th>Khách hàng</th><th>Mục đích</th><th>Tư thế</th><th>Cảm giác</th><th>Chiều cao</th><th>Độ đầy đặn</th><th>Tiêu chí</th><th>Ngân sách</th><th>Gợi ý (mức phù hợp)</th></tr></thead>
          <tbody>${list.slice(0, 500).map((r) => `<tr>
            <td class="nowrap">${whenText(r)}</td>
            <td>${r.uid ? `<b>${esc(r.name || "Khách hàng")}</b><br><small class="muted">${esc(r.email || "")}</small>` : '<span class="muted">Khách vãng lai</span>'}</td>
            ${["purpose", "position", "feel", "height", "fullness", "quality", "budget"].map((k) => `<td>${esc(ansText(k, r.answers && r.answers[k]))}</td>`).join("")}
            <td>${(r.top || []).map((t, i) => { const p = byId(t.id); return p ? `<a class="chip ${i ? "" : "chip-top"}" href="#product-${p.id}">${esc(p.name)} · ${t.pct}%</a>` : ""; }).join(" ")}</td>
          </tr>`).join("")}</tbody>
        </table></div>
        ${total > 500 ? '<p class="muted" style="font-size:.8rem">Hiển thị 500 lượt mới nhất – xuất CSV để xem đầy đủ.</p>' : ""}
      </div>` : `<div class="empty"><h3>Chưa có lượt làm quiz nào${adminData.length ? " khớp bộ lọc" : ""}</h3><p class="muted">Kết quả sẽ xuất hiện ở đây khi khách hoàn thành Pillow Quiz.</p></div>`}`;

    const rerender = () => { renderAdmin(); };
    $("#af-q").addEventListener("input", (e) => { adminFilter.q = e.target.value; clearTimeout(renderAdmin.t); renderAdmin.t = setTimeout(() => { rerender(); const i = $("#af-q"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); });
    $("#af-product").addEventListener("change", (e) => { adminFilter.product = e.target.value; rerender(); });
    $("#af-who").addEventListener("change", (e) => { adminFilter.who = e.target.value; rerender(); });
    $("#af-days").addEventListener("change", (e) => { adminFilter.days = e.target.value; rerender(); });
    $("#af-refresh").addEventListener("click", () => { adminData = null; bindAdmin(); });
    $("#af-csv").addEventListener("click", () => {
      const head = ["Thời gian", "Tên", "Email", "Loại khách", ...["purpose", "position", "feel", "height", "fullness", "quality", "budget"].map((k) => QTITLE[k]), "Gợi ý 1", "Gợi ý 2", "Gợi ý 3"];
      const rows = list.map((r) => [whenText(r), r.name || "", r.email || "", r.uid ? "Có tài khoản" : "Vãng lai",
        ...["purpose", "position", "feel", "height", "fullness", "quality", "budget"].map((k) => ansText(k, r.answers && r.answers[k])),
        ...[0, 1, 2].map((i) => { const t = r.top && r.top[i]; const p = t && byId(t.id); return p ? `${p.name} (${t.pct}%)` : ""; })]);
      const csv = "﻿" + [head, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      a.download = `nestora-pillow-quiz-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });
  }

  function bindAdmin() {
    const box = $("#adminMount");
    if (!box) return;
    const be = BE();
    if (!be.available) { box.innerHTML = '<div class="empty"><h3>Chưa kết nối được máy chủ</h3><p class="muted">Kiểm tra kết nối mạng rồi tải lại trang.</p></div>'; return; }
    if (!be.authReady) return; // onAuth sẽ render lại
    if (!be.user) { box.innerHTML = '<div class="empty"><h3>Vui lòng đăng nhập bằng tài khoản quản trị</h3><a class="btn btn-primary" href="#account">Đăng nhập</a></div>'; return; }
    if (adminData) { renderAdmin(); return; }
    be.allQuiz().then((d) => { adminData = d; renderAdmin(); })
      .catch((err) => {
        box.innerHTML = err && err.code === "permission-denied"
          ? `<div class="empty"><h3>Tài khoản này không có quyền quản trị</h3><p class="muted">Bạn đang đăng nhập bằng ${esc(be.user.email || "")}. Chỉ email quản trị khai báo trong Firestore Rules mới xem được trang này.</p></div>`
          : `<div class="empty"><h3>Không tải được dữ liệu</h3><p class="muted">${esc(be.message(err))}</p><button class="btn btn-outline" id="af-retry">Thử lại</button></div>`;
        const r = $("#af-retry"); if (r) r.addEventListener("click", bindAdmin);
      });
  }

  views.notfound = () => `<div class="container section"><div class="empty"><h3>Không tìm thấy trang</h3><p class="muted">Trang bạn tìm có thể đã được di chuyển.</p><a class="btn btn-primary" href="#home">Về trang chủ</a></div></div>`;

  /* ---------- Drawer ---------- */
  function renderDrawer() {
    const body = $("#drawerBody"), foot = $("#drawerFoot");
    if (!cart.length) {
      body.innerHTML = `<div class="empty" style="background:none;padding:60px 10px"><h3>Giỏ hàng trống</h3><p class="muted">Khám phá các mẫu gối của NESTORA.</p><a class="btn btn-primary btn-sm" href="#shop">Mua sắm</a></div>`;
      foot.innerHTML = "";
      return;
    }
    body.innerHTML = cart.map((l) => cartLine(l, true)).join("");
    foot.innerHTML = `${freeShipBar()}<div class="summary-row total" style="margin:0;border:0;padding-top:0"><span>Tạm tính</span><span>${money(subtotal())}</span></div>
      <a class="btn btn-primary btn-block" href="#checkout">Thanh toán ${ICON.arrow}</a><a class="btn btn-outline btn-block" href="#cart">Xem giỏ hàng</a>`;
  }
  const openDrawer = () => { renderDrawer(); $("#cartDrawer").classList.add("open"); $("#cartDrawer").setAttribute("aria-hidden", "false"); $("#drawerBackdrop").hidden = false; };
  const closeDrawer = () => { $("#cartDrawer").classList.remove("open"); $("#cartDrawer").setAttribute("aria-hidden", "true"); $("#drawerBackdrop").hidden = true; };

  /* ---------- Global events ---------- */
  document.addEventListener("click", (e) => {
    shopClick(e);
    const add = e.target.closest("[data-add]");
    if (add) { e.preventDefault(); addToCart(add.dataset.add); return; }
    const w = e.target.closest("[data-wish]");
    if (w) { e.preventDefault(); toggleWish(w.dataset.wish); if (route().name === "wishlist") render(); return; }
    const cq = e.target.closest("[data-cq]");
    if (cq) {
      const [id, d] = cq.dataset.cq.split(":");
      const line = cart.find((l) => l.id === id);
      if (line) { setQty(id, line.qty + +d); refreshCartViews(); }
      return;
    }
    const rm = e.target.closest("[data-rmline]");
    if (rm) { removeLine(rm.dataset.rmline); refreshCartViews(); return; }
    if (e.target.closest("#drawerBody a, #drawerFoot a")) closeDrawer();
  });
  document.addEventListener("change", (e) => {
    const i = e.target.closest("[data-cqi]");
    if (i) { setQty(i.dataset.cqi, +i.value); refreshCartViews(); }
  });
  function refreshCartViews() {
    const r = route().name;
    if (r === "cart" || r === "checkout") render(true);
  }

  $("#cartBtn").addEventListener("click", openDrawer);
  $("#drawerClose").addEventListener("click", closeDrawer);
  $("#drawerBackdrop").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeDrawer(); $("#chatbox").hidden = true; $("#searchBar").hidden = true; const f = $("#filters"); f && f.classList.remove("open"); }
  });

  const menuBtn = $("#menuToggle"), nav = $("#mainNav");
  menuBtn.addEventListener("click", () => { const o = nav.classList.toggle("open"); menuBtn.setAttribute("aria-expanded", o); });

  $("#searchBtn").addEventListener("click", () => { const sb = $("#searchBar"); sb.hidden = !sb.hidden; if (!sb.hidden) $("#searchInput").focus(); });
  $("#searchClose").addEventListener("click", () => ($("#searchBar").hidden = true));
  $("#searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = $("#searchInput").value.trim();
    $("#searchBar").hidden = true;
    pendingQuery = q;
    if (location.hash === "#shop") render(); else location.hash = "#shop";
  });

  /* ---------- Chat ---------- */
  const chatBody = $("#chatBody");
  function addMsg(html, who = "bot") {
    const m = document.createElement("div");
    m.className = "msg " + who;
    m.innerHTML = html;
    chatBody.appendChild(m);
    chatBody.scrollTop = chatBody.scrollHeight;
  }
  // Trả lời bằng bộ câu hỏi thường gặp (dùng khi AI không phản hồi)
  function faqReply(text) {
    const t = text.toLowerCase();
    const hit = FAQ.map((f) => ({ f, n: f.k.filter((k) => t.includes(k)).length })).sort((a, b) => b.n - a.n)[0];
    if (hit && hit.n > 0) return hit.f.a + (hit.f.link ? `<br><a href="${hit.f.link[0]}">${hit.f.link[1]} →</a>` : "");
    if (/(mềm|cứng|chắc|cao|thấp|nằm|ngủ)/.test(t)) return 'Để gợi ý chính xác, bạn hãy thử Pillow Quiz nhé – chỉ mất khoảng 1 phút.<br><a href="#quiz">Làm Pillow Quiz →</a>';
    return 'Cảm ơn bạn! Câu hỏi này cần tư vấn viên hỗ trợ thêm.<br><a href="https://zalo.me/" target="_blank" rel="noopener">Chat với tư vấn viên qua Zalo →</a>';
  }

  /* ----- Trợ lý AI (Pollinations – miễn phí, không cần API key) ----- */
  const AI = {
    enabled: true,
    endpoint: "https://text.pollinations.ai/openai", // API tương thích OpenAI
    fallbackEndpoint: "https://text.pollinations.ai/", // GET /{prompt} trả về văn bản
    model: "openai",
    timeoutMs: 25000,
    maxHistory: 10,
  };
  const chatHistory = [];

  function systemPrompt() {
    const fmt = (p) => {
      const spec = Object.fromEntries(p.specs);
      return `- ${p.code} ${p.name} (${p.collection === "sleep" ? "Sleep" : "Move"} Collection, ${p.category}): ${money(p.price)}; ` +
        `kích thước ${spec["Kích thước"]}; ${spec["Chiều cao"] || spec["Chiều cao mục tiêu"] || spec["Độ dày"] || ""}; ` +
        `ruột ${p.fill}; cảm giác ${p.feel.map((f) => FILTER_LABELS.feel[f]).join("/")}; ` +
        `${p.fullness.length ? "độ đầy đặn " + p.fullness.map((f) => FILTER_LABELS.fullness[f]).join("/") + "; " : ""}` +
        `phù hợp: ${p.reason}`;
    };
    return [
      "Bạn là trợ lý tư vấn của NESTORA – thương hiệu gối Việt Nam, slogan \"Comfort is Personal – Thoải mái theo cách riêng của bạn\".",
      "Luôn trả lời bằng tiếng Việt, thân thiện, ngắn gọn (tối đa khoảng 120 từ). Chỉ dùng thông tin dưới đây; nếu không biết, hãy nói chưa có thông tin và gợi ý khách liên hệ tư vấn viên qua Zalo.",
      "Khi gợi ý sản phẩm, nêu đúng tên sản phẩm và giá, giải thích ngắn vì sao phù hợp. Không bịa sản phẩm, giá, khuyến mãi hay chính sách. Không đưa ra lời khuyên y tế; với vấn đề đau cổ, vai, gáy kéo dài, khuyên khách gặp bác sĩ.",
      "Nếu khách chưa rõ nhu cầu, hỏi lại về mục đích sử dụng, tư thế nằm, độ mềm và chiều cao mong muốn, hoặc gợi ý làm Pillow Quiz.",
      "",
      "SẢN PHẨM:",
      ...PRODUCTS.map(fmt),
      "",
      "CHÍNH SÁCH:",
      ...FAQ.map((f) => `- ${f.q} ${f.a}`),
      "- Mã giảm giá đang có: NESTORA10 (giảm 10%).",
    ].join("\n");
  }

  async function askAI(question) {
    const messages = [{ role: "system", content: systemPrompt() }, ...chatHistory.slice(-AI.maxHistory), { role: "user", content: question }];
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), AI.timeoutMs);
    try {
      let text = "";
      try {
        const r = await fetch(AI.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: AI.model, messages, private: true }),
          signal: ctrl.signal,
        });
        if (!r.ok) throw new Error("HTTP " + r.status);
        const data = await r.json();
        text = data?.choices?.[0]?.message?.content || "";
      } catch (e) {
        if (ctrl.signal.aborted) throw e;
        // dự phòng: endpoint GET dạng văn bản thuần
        const convo = chatHistory.slice(-6).map((m) => (m.role === "user" ? "Khách: " : "Trợ lý: ") + m.content).join("\n");
        const prompt = (convo ? convo + "\n" : "") + "Khách: " + question;
        const url = AI.fallbackEndpoint + encodeURIComponent(prompt) + "?model=" + AI.model + "&private=true&system=" + encodeURIComponent(systemPrompt());
        const r = await fetch(url, { signal: ctrl.signal });
        if (!r.ok) throw new Error("HTTP " + r.status);
        text = await r.text();
      }
      text = text.trim();
      if (!text) throw new Error("empty");
      return text;
    } finally {
      clearTimeout(timer);
    }
  }

  // Định dạng câu trả lời: an toàn HTML, **đậm**, xuống dòng, tự gắn link tên sản phẩm
  function formatAI(text) {
    let h = esc(text).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
    const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    [...PRODUCTS].sort((a, b) => b.name.length - a.name.length).forEach((p) => {
      const re = new RegExp(`(^|[^A-Za-z0-9])(${reEsc(p.name)})(?![A-Za-z0-9])`, "i");
      // chỉ thay ở phần văn bản chưa nằm trong thẻ <a>, mỗi sản phẩm gắn link một lần
      const parts = h.split(/(<a [^>]*>.*?<\/a>)/);
      for (let i = 0; i < parts.length; i += 2) {
        if (re.test(parts[i])) { parts[i] = parts[i].replace(re, `$1<a href="#product-${p.id}">$2</a>`); break; }
      }
      h = parts.join("");
    });
    return h;
  }

  function typing(on) {
    let el = $("#chatTyping");
    if (on && !el) {
      el = document.createElement("div");
      el.id = "chatTyping";
      el.className = "msg bot typing";
      el.innerHTML = "<span></span><span></span><span></span>";
      chatBody.appendChild(el);
      chatBody.scrollTop = chatBody.scrollHeight;
    } else if (!on && el) el.remove();
  }

  let aiBusy = false;
  async function botReply(text) {
    if (!AI.enabled) { setTimeout(() => addMsg(faqReply(text)), 450); return; }
    aiBusy = true;
    typing(true);
    const send = $("#chatForm button");
    send.disabled = true;
    try {
      const answer = await askAI(text);
      typing(false);
      addMsg(formatAI(answer));
      chatHistory.push({ role: "user", content: text }, { role: "assistant", content: answer });
    } catch (e) {
      typing(false);
      addMsg(faqReply(text) + '<br><small class="muted">(Trợ lý AI đang bận, đây là câu trả lời tự động.)</small>');
    } finally {
      aiBusy = false;
      send.disabled = false;
    }
  }
  let chatInit = false;
  $("#chatToggle").addEventListener("click", () => {
    const cb = $("#chatbox");
    cb.hidden = !cb.hidden;
    if (!chatInit) {
      chatInit = true;
      addMsg("Xin chào! 👋 Mình là trợ lý AI của NESTORA. Bạn có thể hỏi bất cứ điều gì về gối, ví dụ: <i>“Mình hay nằm nghiêng, thích gối chắc, nên chọn mẫu nào?”</i> – hoặc chọn câu hỏi nhanh bên dưới.");
      $("#chatQuick").innerHTML = FAQ.map((f, i) => `<button data-faq="${i}">${f.q}</button>`).join("");
    }
    if (!cb.hidden) $("#chatInput").focus();
  });
  $("#chatClose").addEventListener("click", () => ($("#chatbox").hidden = true));
  $("#chatQuick").addEventListener("click", (e) => {
    const b = e.target.closest("[data-faq]");
    if (!b) return;
    const f = FAQ[+b.dataset.faq];
    addMsg(esc(f.q), "me");
    setTimeout(() => addMsg(f.a + (f.link ? `<br><a href="${f.link[0]}">${f.link[1]} →</a>` : "")), 400);
  });
  $("#chatForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = $("#chatInput").value.trim();
    if (!v || aiBusy) return;
    addMsg(esc(v), "me");
    $("#chatInput").value = "";
    botReply(v);
  });
  chatBody.addEventListener("click", (e) => { if (e.target.closest("a[href^='#']")) $("#chatbox").hidden = true; });

  /* ---------- Router ---------- */
  // Hash routes: #shop, #shop-sleep, #product-n05, #journal-<slug>, #support-returns, #order-<id>
  function route() {
    const raw = location.hash.replace(/^#\/?/, "");
    const i = raw.indexOf("-");
    const name = (i < 0 ? raw : raw.slice(0, i)) || "home";
    return { name, params: i < 0 ? [] : [raw.slice(i + 1)], query: new URLSearchParams() };
  }
  const BINDERS = { admin: bindAdmin, account: bindAccount, shop: bindShop, product: bindProduct, cart: bindCart, checkout: bindCheckout, order: bindOrder, track: bindTrack, support: bindSupport };
  const TITLES = { home: "Comfort is Personal", shop: "Shop", product: "Sản phẩm", story: "Our Story", quiz: "Pillow Quiz", journal: "Journal", cart: "Giỏ hàng", checkout: "Thanh toán", order: "Đơn hàng", track: "Theo dõi đơn hàng", support: "Hỗ trợ khách hàng", wishlist: "Yêu thích", account: "Tài khoản", admin: "Kết quả Pillow Quiz" };

  function render(keepScroll) {
    const r = route();
    const view = views[r.name] || views.notfound;
    if (r.name === "quiz" && !keepScroll) quiz = { step: 0, answers: {} };
    $("#app").innerHTML = view(r.params, r.query);
    (BINDERS[r.name] || (() => {}))(r.params, r.query);
    if (r.name === "quiz") renderQuiz();
    const p = r.name === "product" && byId(r.params[0]);
    document.title = `${p ? p.name : TITLES[r.name] || "NESTORA"} – NESTORA`;
    $$("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === r.name || (a.dataset.nav === "shop" && r.name === "product")));
    nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false");
    closeDrawer();
    if (!keepScroll) window.scrollTo({ top: 0, behavior: "instant" });
  }
  window.addEventListener("hashchange", () => render());

  updateBadges();
  renderDrawer();
  render();

  if (window.Backend && Backend.available) {
    let first = true;
    Backend.onAuth((u) => {
      accountTab = "login";
      const btn = $("#accountBtn");
      btn.classList.toggle("signed", !!u);
      btn.setAttribute("aria-label", u ? `Tài khoản: ${u.name || u.email}` : "Đăng nhập / Đăng ký");
      btn.title = u ? (u.name || u.email) : "Đăng nhập / Đăng ký";
      const r = route().name;
      if (r === "admin") adminData = null;
      if (["account", "checkout", "order", "track", "admin"].includes(r) && !(first && r === "checkout" && !u)) render(true);
      first = false;
    });
  }
})();
