// «Tanasiz aql» sayti — holat.json'ni o'qiydi va sahifani chizadi. Server yo'q, hamma narsa brauzerda.
(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const OY = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
  // vaqtlar holat.json'da Toshkent vaqti (+05:00) bilan yoziladi — ko'rsatish ham shunday
  const sana = (iso, soat = true) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(iso || "");
    if (!m) return "";
    const s = `${+m[3]}-${OY[+m[2] - 1]}`;
    return soat && m[4] ? `${s}, ${m[4]}:${m[5]}` : s;
  };
  const raqam = (n) => "#" + String(n).padStart(4, "0");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const HOLAT = {
    gumondor: { t: "GUMONDOR", c: "st-gum" },
    oqlandi: { t: "OQLANDI", c: "st-oql" },
    qidiruvda: { t: "QIDIRUVDA", c: "st-qid" },
    ayblandi: { t: "AYBLANDI", c: "st-ayb" },
  };
  const muhr = (h, kl = "") => `<span class="muhr ${HOLAT[h].c} ${kl}">${HOLAT[h].t}</span>`;

  // qurilma: storis yo'riqnomasi shunga qarab yoziladi
  const UA = navigator.userAgent;
  const IOS = /iPad|iPhone|iPod/.test(UA) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const ANDROID = /Android/i.test(UA);
  // Instagram/Facebook ichidagi brauzer: Android'da navigator.share yo'q, blob yuklab olish ham ishonchsiz
  const ICHKI = /Instagram|FBAN|FBAV|FB_IAB/.test(UA);

  let H = null;
  const BYN = new Map();
  const QISM = new Map();
  let jami = 0, qoldi = 0;
  let rasmUrl = null;

  function toast(m) {
    const t = $("#toast");
    t.textContent = m;
    t.classList.add("bor");
    clearTimeout(toast.k);
    toast.k = setTimeout(() => t.classList.remove("bor"), 3200);
  }

  async function yukla() {
    try {
      const r = await fetch("holat.json", { cache: "no-cache" });
      if (!r.ok) throw new Error(r.status);
      H = await r.json();
    } catch (e) {
      $("#xato").hidden = false;
      return;
    }
    H.ishlar.forEach((i) => BYN.set(i.n, i));
    H.qismlar.forEach((q) => QISM.set(q.n, q));
    chiz();
    yonalish();
  }

  // ---------- bosh qism ----------
  function nurlar() {
    const svg = $("#nur");
    const w = 1200, h = 700;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    let s = 3;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const ox = w * 0.82, oy = 40;
    let d = "";
    for (let k = 0; k < 150; k++) {
      const a = Math.PI * (0.08 + r() * 0.9);
      const r0 = 20 + r() * 80, r1 = r0 + 120 + r() * 900;
      d += `M${(ox + Math.cos(a) * r0).toFixed(1)} ${(oy + Math.sin(a) * r0).toFixed(1)}L${(ox + Math.cos(a) * r1).toFixed(1)} ${(oy + Math.sin(a) * r1).toFixed(1)}`;
    }
    svg.innerHTML = `<path d="${d}" stroke="#B8935A" stroke-opacity="0.3" stroke-width="0.9" fill="none" stroke-linecap="round"/>`;
  }

  function chiz() {
    $("#namuna").hidden = !H.namuna;
    nurlar();
    jami = H.ishlar.length;
    const oql = H.ishlar.filter((i) => i.holat === "oqlandi").length;
    qoldi = jami - oql;
    $("#hisob").innerHTML = `Ro'yxatda <b>${fmt(qoldi)}</b> gumondor qoldi · <b class="yashil">${fmt(oql)}</b> oqlandi<br><small>Har soat yangilanadi · oxirgisi ${sana(H.yangilandi)}</small>`;
    if (H.sotuv && H.sotuv.matn) $("#sotuv").textContent = H.sotuv.matn;
    const qq = H.qismlar.filter((q) => q.qoida);
    oxirgiQoida = qq.length ? qq[qq.length - 1].n : null;
    chizDevor(true);
    chizBugun();
    chizKundalik();
    chizHavolalar();
  }

  // ---------- gumondorlar devori ----------
  // hamma ish chiziladi, lekin bo'lib-bo'lib: devor ichida pastga tushgan sari qo'shiladi (minglab ishda ham tez)
  const BOLAK = 120;
  let filtr = "qoldi", royxat = [], korsatildi = 0, oxirgiQoida = null;
  const FILTR = {
    qoldi: (i) => i.holat !== "oqlandi",
    oqlandi: (i) => i.holat === "oqlandi",
    // kimdir belgilagan har bir ish — keyin o'zi alibi yozgan (gumondor/oqlangan) bo'lsa ham
    ayb: (i) => !!i.ayblovchi || i.ayblovlar > 0 || i.holat === "qidiruvda" || i.holat === "ayblandi",
    hammasi: () => true,
  };
  const FNOM = { qoldi: "Devorda qolganlar", oqlandi: "Oqlanib tushganlar", ayb: "Ayblanganlar", hammasi: "Hammasi" };

  function mini(i) {
    const rot = (((i.n * 37) % 9) - 4) * 0.55; // har kartochka o'z qiyshiqligida, har safar bir xil
    const tush = i.holat === "oqlandi" && i.oqlandi === oxirgiQoida;
    const kl = ["mini", i.holat === "oqlandi" ? "oql" : "", tush ? "tush" : "", i.holat === "qidiruvda" || i.holat === "ayblandi" ? "ayb" : ""].join(" ");
    const alibi = i.alibi ? `«${esc(i.alibi)}»` : `<i>Alibi yo'q</i>`;
    return `<button class="${kl}" data-n="${i.n}" style="--rot:${rot.toFixed(2)}deg">
      <span class="r">${raqam(i.n)}</span><span class="n">@${esc(i.nik)}</span><span class="a">${alibi}</span>${muhr(i.holat)}${tush ? `<span class="yangi">bugun tushdi</span>` : ""}</button>`;
  }

  function qosh(gacha) {
    const g = $("#grid");
    const to = Math.min(royxat.length, gacha);
    if (to > korsatildi) {
      g.insertAdjacentHTML("beforeend", royxat.slice(korsatildi, to).map(mini).join(""));
      korsatildi = to;
    }
    $("#dum").hidden = korsatildi >= royxat.length;
  }

  function chizDevor(boshidan) {
    for (const b of $("#tablar").querySelectorAll("button")) {
      const f = b.dataset.f;
      b.innerHTML = `${b.textContent.replace(/\s*[\d ]+$/, "")} <span>${fmt(H.ishlar.filter(FILTR[f]).length)}</span>`;
      b.setAttribute("aria-selected", String(f === filtr));
    }
    if (!boshidan) return;
    royxat = H.ishlar.filter(FILTR[filtr]);
    korsatildi = 0;
    $("#grid").innerHTML = "";
    $("#doska").scrollTop = 0;
    qosh(BOLAK);
    $("#doska-past").textContent = royxat.length
      ? `${FNOM[filtr]}: ${fmt(royxat.length)} ta · kartochkani bosing — ishni oching`
      : "Bu yerda hali hech kim yo'q.";
  }

  // ish kartochkasidan «Devorda ko'rish»: kartochkani devorda topib, ajratib ko'rsatadi
  function devordaKor(n) {
    yopKarta();
    if (filtr !== "hammasi") { filtr = "hammasi"; chizDevor(true); }
    const k = royxat.findIndex((i) => i.n === n);
    if (k < 0) return;
    qosh(k + BOLAK);
    const el = $(`#grid [data-n="${n}"]`);
    const d = $("#doska");
    $("#devor").scrollIntoView({ behavior: "smooth", block: "start" });
    d.scrollTo({ top: el.offsetTop - d.clientHeight / 2 + el.offsetHeight / 2, behavior: "smooth" });
    for (const s of $("#grid").querySelectorAll(".siz")) s.classList.remove("siz");
    el.classList.add("siz");
  }

  // ---------- bugungi qoida + ovoz ----------
  function chizBugun() {
    const qq = H.qismlar.filter((q) => q.qoida);
    const oxirgi = H.qismlar[H.qismlar.length - 1];
    const el = $("#bugun");
    if (!qq.length) {
      el.innerHTML = `<div class="varaq"><div class="qism">Hali qoida yo'q</div>
        <p class="matn">Isom birinchi qoidani yangi qismda e'lon qiladi.</p></div>`;
    } else {
      const q = qq[qq.length - 1], b = TZQ.BANK[q.qoida.kod];
      el.innerHTML = `<div class="varaq">
        <div class="qism">${q.n}-qism · ${sana(q.sana, false)}</div>
        <p class="matn">${esc(b.qoida)}</p>
        <p class="izoh2">${esc(b.izoh)}</p>
        <p class="son"><b>${fmt(q.qoida.tekshirildi)}</b> kishidan <b>${fmt(q.qoida.oqlandi)}</b> tasi oqlandi</p>
      </div>`;
    }
    const ov = oxirgi && oxirgi.ovoz;
    if (ov && ov.golib == null) {
      $("#ovoz").innerHTML = `<div class="ovoz">
        <p>Ertaga Isom nimani tekshirsin? <small>${oxirgi.n}-qism ostiga raqam yozing</small></p>
        <ol>${ov.variantlar.map((v, k) => `<li><b>${k + 1}</b>${esc(v)}</li>`).join("")}</ol>
      </div>`;
    } else $("#ovoz").innerHTML = "";
  }

  function chizKundalik() {
    const li = [...H.qismlar].reverse().map((q) => {
      let ichi;
      if (q.qoida) {
        const b = TZQ.BANK[q.qoida.kod];
        ichi = `<p class="q">${esc(b.qoida)}</p><p class="d">${fmt(q.qoida.tekshirildi)} kishidan ${fmt(q.qoida.oqlandi)} tasi oqlandi.</p>`;
      } else {
        ichi = `<p class="q">Qoida yo'q</p><p class="d">Bu qismda hech kim oqlanmadi.</p>`;
      }
      if (q.ovoz && q.ovoz.golib) ichi += `<p class="d">Ovozda <b>${esc(q.ovoz.variantlar[q.ovoz.golib - 1])}</b> yutdi.</p>`;
      const nom = q.url ? `<a href="${esc(q.url)}" target="_blank" rel="noopener">${q.n}-qism</a>` : `${q.n}-qism`;
      return `<li class="${q.qoida ? "bor" : ""}"><span class="t">${nom} · ${sana(q.sana, false)}</span>${ichi}</li>`;
    });
    $("#kun").innerHTML = li.join("");
    $("#oldingi").hidden = H.qismlar.length < 2;
  }

  function chizHavolalar() {
    const h = H.havolalar || {};
    const t = [];
    if (h.instagram) t.push(`<a class="btn" href="${esc(h.instagram)}" target="_blank" rel="noopener">Instagram'da o'ynash</a>`);
    if (h.nashriyot) t.push(`<a class="btn ikkinchi" href="${esc(h.nashriyot)}" target="_blank" rel="noopener">Nashriyot</a>`);
    if (h.telegram) t.push(`<a class="btn ikkinchi" href="${esc(h.telegram)}" target="_blank" rel="noopener">Chiqqanda xabar ber</a>`);
    $("#kitob-havola").innerHTML = t.join("");
    if (h.rasmiy_qoidalar) $("#rasmiy").innerHTML = `<a href="${esc(h.rasmiy_qoidalar)}" target="_blank" rel="noopener">Rasmiy qoidalarni o'qish</a>`;
  }

  // ---------- qidiruv ----------
  function qidir(s) {
    s = s.trim().toLowerCase().replace(/^[@#]/, "").replace(/\s+/g, "");
    if (!s) return [];
    if (/^\d+$/.test(s)) {
      const i = BYN.get(Number(s));
      return i ? [i] : [];
    }
    const ball = (i) => {
      const n = i.nik, h = i.hozir || "";
      if (n === s || h === s) return 0;
      if (n.startsWith(s) || h.startsWith(s)) return 1;
      if (n.includes(s) || h.includes(s)) return 2;
      return 9;
    };
    return H.ishlar.map((i) => [ball(i), i]).filter((x) => x[0] < 9)
      .sort((a, b) => a[0] - b[0] || a[1].nik.length - b[1].nik.length).slice(0, 6).map((x) => x[1]);
  }
  function chizNatija() {
    if (!H) return;
    const s = $("#q").value;
    const r = qidir(s);
    $("#natija").innerHTML = r.map((i) =>
      `<li><button class="qator" data-n="${i.n}"><span class="n">@${esc(i.nik)}${i.hozir ? ` <small>(hozir @${esc(i.hozir)})</small>` : ""}</span>${muhr(i.holat)}</button></li>`).join("");
    $("#topilmadi").hidden = !(s.trim().length >= 2 && r.length === 0);
  }

  // ---------- ish kartochkasi ----------
  function tekshiruvlar(i) {
    return (i.tekshiruv || []).map((qn) => {
      const q = QISM.get(qn);
      if (!q || !q.qoida) return null;
      const b = TZQ.BANK[q.qoida.kod];
      const r = b.tekshir(i);
      if (r.mos !== (i.oqlandi === qn)) console.warn("[tanasiz] mos kelmadi", i.n, qn);
      return { qn, b, r };
    }).filter(Boolean);
  }

  function storisMatn(i, tk) {
    const o = { tur: i.holat, raqam: "ISH " + raqam(i.n), nik: i.nik, alibi: i.alibi, sayt: H.sayt || location.host || "" };
    const omon = tk.filter((x) => !x.r.mos).length;
    if (i.holat === "oqlandi") {
      const x = tk.find((y) => y.r.mos);
      o.qator1 = `${i.oqlandi}-qismda oqlandim`;
      if (x) { o.qator2 = x.r.yozuv; o.qator3 = x.b.nomi; }
    } else if (i.holat === "gumondor") {
      o.qator1 = omon ? `${omon} ta qoidadan omon qoldim` : "Ro'yxatdaman. Birinchi tekshiruv oldinda";
      o.qator3 = `${fmt(jami)} gumondordan ${fmt(qoldi)} tasi qoldi`;
    } else {
      const ay = BYN.get(i.ayblovchi);
      o.alibiYoq = "Alibi hali yo'q";
      o.qator1 = ay ? `Ayblovchi: @${ay.nik}` : "Ayblangan";
      o.qator3 = i.holat === "qidiruvda" ? "Alibi yozmaguncha — qidiruvda" : "24 soat ichida alibi yozishi kerak";
    }
    return o;
  }

  // bitta oddiy gap: holat nima va endi nima qilish kerak
  function xulosa(i, tk) {
    const ay = i.ayblovchi ? BYN.get(i.ayblovchi) : null;
    const ayb = ay ? `Sizni <button data-n="${ay.n}">@${esc(ay.nik)}</button> aybladi.` : "Siz ayblangansiz.";
    const omon = tk.filter((x) => !x.r.mos).length;
    if (i.holat === "oqlandi") return { k: "yashil", t: `Siz ${i.oqlandi}-qismda oqlandingiz — Isom sizni ro'yxatdan chiqardi.` };
    if (i.holat === "gumondor") return { k: "", t: omon ? `Siz hali ro'yxatdasiz: ${omon} ta tekshiruvdan omon qoldingiz. Keyingi qoida — yangi qismda.` : "Siz ro'yxatdasiz. Birinchi tekshiruv — keyingi qismda." };
    if (i.holat === "qidiruvda") return { k: "qizil", t: `${ayb} Siz hali alibi yozmadingiz — qidiruvdasiz. Istalgan qism ostiga alibi yozing, aks holda kitobni ololmaysiz.` };
    return { k: "qizil", t: `${ayb} 24 soat ichida o'zingiz alibi yozing, aks holda qidiruvga berilasiz.` };
  }

  function yol(f) {
    if (ICHKI && !TZK.ulashMumkin(f)) return `<li>Siz Instagram ichidagi brauzerdasiz — bu yerda storis tugmasi ishlamaydi.</li><li>Yuqoridagi <b>⋯</b> (yoki <b>⋮</b>) → <b>«Brauzerda ochish»</b>, keyin tugmani qayta bosing.</li><li>Yoki rasmni bosib turing → «Saqlash» → Instagram → + → Story.</li>`;
    if ((IOS || ANDROID) && f && !TZK.ulashMumkin(f)) return `<li>Tugmani bosing — rasm telefonga saqlanadi.</li><li>Instagram → <b>+</b> → <b>Story</b> → galereyadagi oxirgi rasm.</li>`;
    if (ANDROID) return `<li>Tugmani bosing.</li><li>Ochilgan ro'yxatdan Instagram <b>Stories</b> ni tanlang.</li><li>Storisda «Your story» — tayyor.</li>`;
    if (IOS) return `<li>Tugmani bosing.</li><li>Instagram'ni tanlang → <b>Story</b>.</li><li>Story chiqmasa: <b>«Save Image»</b> (Rasmni saqlash) → Instagram → + → Story → oxirgi rasm.</li>`;
    return `<li>Kompyuterda rasm yuklab olinadi.</li><li>Storisga to'g'ridan qo'yish uchun shu sahifani telefonda oching.</li>`;
  }

  function ochKarta(n, tarix = true) {
    const i = BYN.get(Number(n));
    if (!i) return;
    const tk = tekshiruvlar(i);
    const x = xulosa(i, tk);
    const qatorlar = tk.map(({ qn, b, r }) =>
      `<li><span class="qn">${qn}-qism</span><span class="y">${esc(r.yozuv)}</span>
        <b class="${r.mos ? "natija-oql" : "natija-qol"}">${r.mos ? "oqlandi" : "omon qoldi"}</b></li>`).join("");
    const telefon = IOS || ANDROID;
    $("#karta").innerHTML = `
      <article class="ish">
        <div class="r">ISH ${raqam(i.n)} · ${sana(i.vaqt)}</div>
        ${muhr(i.holat, "katta-muhr")}
        <h3 id="m-nik">@${esc(i.nik)}</h3>
        ${i.hozir ? `<div class="hozir">hozir: @${esc(i.hozir)} · qoida ish ochilgandagi nikka qo'llanadi</div>` : ""}
        ${i.alibi ? `<blockquote>«${esc(i.alibi)}»</blockquote>` : `<blockquote class="yoq">Alibi yo'q</blockquote>`}
        <p class="xabar ${x.k}">${x.t}</p>
        ${tk.length ? `<ul class="tek">${qatorlar}</ul>` : ""}
      </article>
      <div class="storis">
        <div id="st-joy" class="st-joy"></div>
        <div class="st-ong">
          <button class="btn olov katta" id="st-ulash" disabled>Rasm tayyorlanmoqda…</button>
          <ol class="yol" id="yol">${yol(null)}</ol>
          <button class="havola" id="hav">Kartochka havolasini nusxalash</button>
          <button class="havola" id="devorda">Devorda ko'rish</button>
        </div>
      </div>`;
    $("#modal").hidden = false;
    document.body.style.overflow = "hidden";
    if (tarix) history.replaceState(null, "", "#ish-" + i.n);
    $("#yop").focus();

    const nom = `tanasiz-aql-ish-${String(i.n).padStart(4, "0")}`;
    const tugma = $("#st-ulash");
    let f = null;
    TZK.chiz(storisMatn(i, tk))
      .then((cv) => TZK.fayl(cv, nom))
      .then((ff) => {
        if (tugma !== $("#st-ulash")) return; // boshqa kartochka ochilib bo'lgan
        f = ff;
        // ko'rinishi <img>: telefonda bosib turib saqlash mumkin
        if (rasmUrl) URL.revokeObjectURL(rasmUrl);
        rasmUrl = URL.createObjectURL(f);
        $("#st-joy").innerHTML = `<img src="${rasmUrl}" width="1080" height="1920" alt="Storis uchun rasm: @${esc(i.nik)}">`;
        tugma.disabled = false;
        tugma.textContent = telefon && TZK.ulashMumkin(f) ? "Instagram storisga qo'yish" : "Rasmni saqlash";
        $("#yol").innerHTML = yol(f);
      })
      .catch(() => { tugma.textContent = "Rasmni yasab bo'lmadi"; });

    // await yo'q: iPhone'da ulashish oynasi faqat shunda ochiladi
    tugma.onclick = () => {
      if (!f) return;
      if (TZK.ulashMumkin(f)) {
        TZK.ulash(f).then((r) => {
          if (r === "xato") { TZK.saqla(f); toast("Rasm saqlandi. Instagram → + → Story → oxirgi rasm"); }
        });
      } else {
        TZK.saqla(f);
        toast(ICHKI ? "Saqlanmasa — rasmni bosib turing yoki saytni brauzerda oching"
          : telefon ? "Rasm saqlandi. Instagram → + → Story → oxirgi rasm" : "Rasm yuklab olindi");
      }
    };
    $("#hav").onclick = async () => {
      const url = location.origin + location.pathname + "#ish-" + i.n;
      try { await navigator.clipboard.writeText(url); toast("Havola nusxalandi"); } catch (e) { prompt("Havola:", url); }
    };
    $("#devorda").onclick = () => devordaKor(i.n);
  }

  function yopKarta() {
    $("#modal").hidden = true;
    document.body.style.overflow = "";
    if (/^#ish-/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
  }

  function yonalish() {
    const m = /^#ish-(\d+)$/.exec(location.hash);
    if (m) ochKarta(m[1], false);
  }

  // ---------- hodisalar ----------
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-n]");
    if (b) { ochKarta(b.dataset.n); return; }
    if (e.target.id === "modal" || e.target.id === "yop") yopKarta();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#modal").hidden) yopKarta(); });
  window.addEventListener("hashchange", yonalish);
  $("#q").addEventListener("input", chizNatija);
  $("#tablar").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-f]");
    if (!b || !H) return;
    filtr = b.dataset.f;
    chizDevor(true);
  });
  // devor ichida pastga tushganda keyingi bo'lak qo'shiladi
  new IntersectionObserver((e) => { if (H && e[0].isIntersecting) qosh(korsatildi + BOLAK); },
    { root: $("#doska"), rootMargin: "600px 0px" }).observe($("#dum"));

  yukla();
})();
