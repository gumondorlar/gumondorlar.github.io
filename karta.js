// «Tanasiz aql» — storis kartasi (1080×1920 PNG) brauzerda chiziladi va ulashiladi.
// IG storis xavfsiz zonasi: tepa ~250 px va past ~270 px da muhim narsa yo'q.
(function (root) {
  const W = 1080, H = 1920;
  const C = {
    paper: "#F3EEE3", card: "#FFFDF8", ink: "#1E1B19", ink2: "#5B544D", gold: "#B8935A",
    ember: "#C9461E", red: "#B3261E", green: "#2E7D5B", amber: "#B8700F", line: "#D9CDB6",
  };
  const TUR = {
    gumondor: { sarlavha: "ISH OCHIQ", muhr: "GUMONDOR", rang: C.red },
    oqlandi: { sarlavha: "GUVOHNOMA", muhr: "OQLANDI", rang: C.green },
    qidiruvda: { sarlavha: "AYBLANGAN", muhr: "QIDIRUVDA", rang: C.red },
    ayblandi: { sarlavha: "AYBLANGAN", muhr: "AYBLANDI", rang: C.amber },
    ayblov: { sarlavha: "AYBLOV", muhr: "AYBLANDI", rang: C.red },
  };
  const SANS = "Montserrat, system-ui, sans-serif";
  const MONO = '"Courier Prime", "Courier New", monospace';
  let muqova = null;

  const rasm = (src) => new Promise((ok, yoq) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = yoq;
    i.src = src;
  });

  async function tayyor() {
    try {
      await Promise.all([
        document.fonts.load(`900 100px Montserrat`), document.fonts.load(`800 40px Montserrat`),
        document.fonts.load(`600 40px Montserrat`), document.fonts.load(`700 50px "Courier Prime"`),
        document.fonts.load(`400 40px "Courier Prime"`),
      ]);
    } catch (e) { /* shrift kelmasa — zaxira shrift bilan chiziladi */ }
    if (!muqova) muqova = await rasm("img/muqova.jpg").catch(() => null);
  }

  // muqovadagi kabi oltin nurlar (bir xil urug' — har safar bir xil rasm)
  function nurlar(g) {
    let s = 9;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const ox = W * 0.7, oy = 150;
    g.save();
    g.lineCap = "round";
    for (let k = 0; k < 170; k++) {
      const a = Math.PI * (0.05 + r() * 0.9) + (r() < 0.25 ? Math.PI : 0);
      const r0 = 30 + r() * 120, r1 = r0 + 200 + r() * 1300;
      g.strokeStyle = `rgba(184,147,90,${0.12 + r() * 0.28})`;
      g.lineWidth = 0.8 + r() * 1.6;
      g.beginPath();
      g.moveTo(ox + Math.cos(a) * r0, oy + Math.sin(a) * r0);
      g.lineTo(ox + Math.cos(a) * r1, oy + Math.sin(a) * r1);
      g.stroke();
    }
    g.restore();
  }

  function sigdir(g, matn, vazn, maxW, maxS, minS, oila = SANS) {
    let s = maxS;
    for (; s > minS; s -= 2) {
      g.font = `${vazn} ${s}px ${oila}`;
      if (g.measureText(matn).width <= maxW) break;
    }
    g.font = `${vazn} ${s}px ${oila}`;
    return s;
  }

  function qatorla(g, matn, maxW, maxQ) {
    const sozlar = String(matn).split(/\s+/).filter(Boolean);
    const q = [];
    let joriy = "";
    for (const s of sozlar) {
      const sinov = joriy ? joriy + " " + s : s;
      if (g.measureText(sinov).width <= maxW || !joriy) joriy = sinov;
      else { q.push(joriy); joriy = s; }
    }
    if (joriy) q.push(joriy);
    if (q.length > maxQ) {
      q.length = maxQ;
      let oxir = q[maxQ - 1];
      while (oxir.length && g.measureText(oxir + "…»").width > maxW) oxir = oxir.slice(0, -1);
      q[maxQ - 1] = oxir.replace(/[\s,.;:]+$/, "") + "…";
    }
    return q;
  }

  function muhr(g, matn, rang, x, y, burch) {
    g.save();
    g.translate(x, y);
    g.rotate(burch);
    g.font = `900 66px ${SANS}`;
    const w = g.measureText(matn).width + 56, h = 102;
    g.globalAlpha = 0.88;
    g.strokeStyle = rang;
    g.lineWidth = 9;
    g.strokeRect(-w / 2, -h / 2, w, h);
    g.lineWidth = 3;
    g.strokeRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24);
    g.fillStyle = rang;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(matn, 0, 5);
    g.restore();
  }

  function igna(g, x, y) {
    g.save();
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.beginPath(); g.arc(x + 4, y + 7, 22, 0, Math.PI * 2); g.fill();
    const gr = g.createRadialGradient(x - 7, y - 7, 3, x, y, 24);
    gr.addColorStop(0, "#F07A55"); gr.addColorStop(1, C.ember);
    g.fillStyle = gr;
    g.beginPath(); g.arc(x, y, 22, 0, Math.PI * 2); g.fill();
    g.restore();
  }

  /**
   * o: { tur, raqam, nik, alibi, qator1, qator2, qator3, sayt }
   * tur: gumondor | oqlandi | qidiruvda | ayblandi | ayblov
   */
  async function chiz(o) {
    await tayyor();
    const t = TUR[o.tur] || TUR.gumondor;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const g = cv.getContext("2d");

    // fon
    g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
    nurlar(g);
    const vin = g.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.45, H * 0.8);
    vin.addColorStop(0, "rgba(30,27,25,0)"); vin.addColorStop(1, "rgba(30,27,25,0.16)");
    g.fillStyle = vin; g.fillRect(0, 0, W, H);

    // tepa yozuv
    g.textAlign = "center"; g.textBaseline = "alphabetic";
    g.fillStyle = C.ink;
    g.font = `900 46px ${SANS}`;
    if ("letterSpacing" in g) g.letterSpacing = "8px";
    g.fillText("TANASIZ AQL", W / 2, 312);
    g.font = `700 30px ${MONO}`;
    if ("letterSpacing" in g) g.letterSpacing = "4px";
    g.fillStyle = C.ink2;
    g.fillText("GUMONDORLAR RO'YXATI", W / 2, 356);
    if ("letterSpacing" in g) g.letterSpacing = "0px";

    // kartochka
    const cx = 100, cy = 420, cw = 880, ch = 900;
    g.save();
    g.translate(W / 2, cy + ch / 2);
    g.rotate(-0.021);
    g.translate(-W / 2, -(cy + ch / 2));
    g.shadowColor = "rgba(30,27,25,0.28)"; g.shadowBlur = 50; g.shadowOffsetY = 22;
    g.fillStyle = C.card; g.fillRect(cx, cy, cw, ch);
    g.shadowColor = "transparent";
    g.fillStyle = t.rang; g.fillRect(cx, cy, cw, 14);

    const L = cx + 64, maxW = cw - 128;
    g.textAlign = "left";
    g.fillStyle = t.rang;
    g.font = `900 38px ${SANS}`;
    if ("letterSpacing" in g) g.letterSpacing = "5px";
    g.fillText(t.sarlavha, L, cy + 100);
    if ("letterSpacing" in g) g.letterSpacing = "0px";
    g.fillStyle = C.ink2;
    g.font = `700 46px ${MONO}`;
    g.fillText(o.raqam || "", L, cy + 162);

    g.fillStyle = C.ink;
    sigdir(g, "@" + o.nik, 900, maxW, 118, 54);
    g.fillText("@" + o.nik, L, cy + 300);
    g.strokeStyle = C.gold; g.lineWidth = 3;
    g.beginPath(); g.moveTo(L, cy + 336); g.lineTo(L + maxW, cy + 336); g.stroke();

    // alibi
    g.font = `600 50px ${SANS}`;
    g.fillStyle = o.alibi ? C.ink : C.ink2;
    const alibi = o.alibi ? `«${o.alibi}»` : (o.alibiYoq || "Alibi yo'q");
    const q = qatorla(g, alibi, maxW, 4);
    q.forEach((s, k) => g.fillText(s, L, cy + 420 + k * 66));

    // pastki qatorlar
    let y = cy + ch - 176;
    if (o.qator1) {
      g.fillStyle = C.ink; g.font = `800 46px ${SANS}`;
      sigdir(g, o.qator1, 800, maxW, 46, 30);
      g.fillText(o.qator1, L, y);
    }
    if (o.qator2) {
      g.fillStyle = C.ink2;
      sigdir(g, o.qator2, 400, maxW, 38, 24, MONO);
      g.fillText(o.qator2, L, y + 58);
    }
    if (o.qator3) {
      g.fillStyle = C.ink2;
      sigdir(g, o.qator3, 600, maxW, 34, 24);
      g.fillText(o.qator3, L, y + 110);
    }
    muhr(g, t.muhr, t.rang, cx + cw - 215, cy + 96, -0.12);
    g.restore();
    igna(g, W / 2, cy + 8);

    // chaqiriq
    g.textAlign = "center";
    g.fillStyle = C.ink;
    g.font = `900 54px ${SANS}`;
    g.fillText(o.tur === "ayblov" ? "Sen gumondorsan!" : "Sen ham gumondormisan?", W / 2, 1418);
    g.fillStyle = C.ink2;
    g.font = `600 36px ${SANS}`;
    g.fillText(o.tur === "ayblov" ? "Alibingni kommentga yoz" : "Kommentga alibingni yoz", W / 2, 1468);

    // kitob qatori
    const kx = 250, ky = 1510, kh = 140;
    if (muqova) {
      const kw = Math.round(muqova.width * kh / muqova.height);
      g.save();
      g.shadowColor = "rgba(30,27,25,0.35)"; g.shadowBlur = 18; g.shadowOffsetY = 8;
      g.drawImage(muqova, kx, ky, kw, kh);
      g.restore();
    }
    g.textAlign = "left";
    g.fillStyle = C.ink; g.font = `900 40px ${SANS}`;
    g.fillText("«TANASIZ AQL»", kx + 120, ky + 46);
    g.fillStyle = C.ember; g.font = `800 34px ${SANS}`;
    g.fillText("Kitob dekabrda", kx + 120, ky + 92);
    if (o.sayt) {
      g.fillStyle = C.ink2; g.font = `600 30px ${SANS}`;
      sigdir(g, o.sayt, 600, W - kx - 120 - 60, 30, 20);
      g.fillText(o.sayt, kx + 120, ky + 134);
    }
    return cv;
  }

  const blob = (cv) => new Promise((ok) => cv.toBlob(ok, "image/png"));

  // Fayl kartochka ochilganda OLDINDAN yasaladi: iPhone Safari'da navigator.share()
  // faqat bosishdan keyin darhol chaqirilsa ishlaydi (oraliqda await bo'lsa — rad etadi).
  async function fayl(cv, nom) {
    return new File([await blob(cv)], nom + ".png", { type: "image/png" });
  }

  const ulashMumkin = (f) => !!(f && navigator.canShare && navigator.canShare({ files: [f] }));

  // Faqat fayl yuboriladi (matn/havola qo'shilsa, iPhone'da ba'zi ilovalar rasm o'rniga havolani oladi).
  // Bosish hodisasining ichida, hech qanday await'siz chaqirilsin.
  function ulash(f) {
    return navigator.share({ files: [f] }).then(
      () => "ulashildi",
      (e) => (e && (e.name === "AbortError" || e.name === "InvalidStateError") ? "bekor" : "xato"),
    );
  }

  function saqla(f) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(f);
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  root.TZK = { chiz, fayl, ulashMumkin, ulash, saqla };
})(window);
