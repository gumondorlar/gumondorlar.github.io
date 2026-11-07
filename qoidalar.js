// «Tanasiz aql» — oqlash qoidalari banki (sayt va tekshiruv uchun yagona manba).
// Python nusxasi: ../qoida_bank.py — mantiq bir xil bo'lishi shart (`node ../tekshir.mjs` solishtiradi).
// Qoida faqat ish ochilgan paytdagi nik yoki ish raqamidan hisoblanadi.
(function (root) {
  const toza = (nik) => String(nik).replace(/^@/, "").toLowerCase();
  // harf va raqamlar (nuqta va _ sanalmaydi)
  const belgilar = (nik) => toza(nik).replace(/[^a-z0-9]/g, "");
  const harflar = (nik) => toza(nik).replace(/[^a-z]/g, "");
  const tub = (n) => {
    if (n < 2) return false;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
    return true;
  };
  const kvadrat = (n) => n > 0 && Math.round(Math.sqrt(n)) ** 2 === n;
  const uchburchak = (n) => {
    let s = 0;
    for (let k = 1; s < n; k++) s += k;
    return n > 0 && s === n;
  };
  const raqam4 = (n) => String(n).padStart(4, "0");
  const UNLI = "aeiou";

  const BANK = {
    uzunlik_tub: {
      nomi: "Nik uzunligi — tub son",
      qoida: "Nikingizdagi harf va raqamlar soni tub son bo'lsa — oqlandingiz.",
      izoh: "Tub son faqat 1 ga va o'ziga bo'linadi: 2, 3, 5, 7, 11, 13… Nuqta va «_» sanalmaydi.",
      tekshir(ish) {
        const s = belgilar(ish.nik), n = s.length, ok = tub(n);
        return { mos: ok, yozuv: `${s} → ${n} ta belgi → ${ok ? "tub son" : "tub emas"}` };
      },
    },
    raqam_4: {
      nomi: "Ish raqami — 4 ga bo'linish",
      qoida: "Ish raqamingizning oxirgi ikki raqami 4 ga bo'linsa — oqlandingiz.",
      izoh: "4 ga bo'linishni bilish uchun butun sonni emas, oxirgi ikki raqamni tekshirish kifoya: 12, 36, 08, 00 — bo'linadi.",
      tekshir(ish) {
        const r = raqam4(ish.n), v = Number(r.slice(-2)), ok = v % 4 === 0;
        return { mos: ok, yozuv: `#${r} → ${r.slice(-2)} → ${ok ? "4 ga bo'linadi" : "4 ga bo'linmaydi"}` };
      },
    },
    kvadrat: {
      nomi: "Nik uzunligi — kvadrat son",
      qoida: "Nikingizdagi harf va raqamlar soni kvadrat son bo'lsa — oqlandingiz.",
      izoh: "Kvadrat son — biror sonni o'ziga ko'paytirgandagi natija: 1, 4, 9, 16, 25… Nuqta va «_» sanalmaydi.",
      tekshir(ish) {
        const s = belgilar(ish.nik), n = s.length, ok = kvadrat(n);
        return { mos: ok, yozuv: `${s} → ${n} ta belgi → ${ok ? `kvadrat son (${Math.round(Math.sqrt(n))}×${Math.round(Math.sqrt(n))})` : "kvadrat emas"}` };
      },
    },
    uchburchak: {
      nomi: "Nik uzunligi — uchburchak son",
      qoida: "Nikingizdagi harf va raqamlar soni uchburchak son bo'lsa — oqlandingiz.",
      izoh: "Uchburchak son — 1 dan boshlab ketma-ket sonlarni qo'shib chiqadi: 1, 3, 6, 10, 15, 21… Tangalarni uchburchak qilib terganda shuncha tanga ketadi.",
      tekshir(ish) {
        const s = belgilar(ish.nik), n = s.length, ok = uchburchak(n);
        return { mos: ok, yozuv: `${s} → ${n} ta belgi → ${ok ? "uchburchak son" : "uchburchak emas"}` };
      },
    },
    qosh_harf: {
      nomi: "Nikda yonma-yon bir xil harf",
      qoida: "Nikingizda yonma-yon ikkita bir xil harf bo'lsa — oqlandingiz.",
      izoh: "Masalan, «malikka»dagi «kk» yoki «saodat_ii»dagi «ii». Raqamlar hisoblanmaydi, nuqta va «_» orasidagi harflar yonma-yon emas.",
      tekshir(ish) {
        const m = toza(ish.nik).match(/([a-z])\1/);
        return { mos: !!m, yozuv: m ? `${toza(ish.nik)} → «${m[0]}» bor` : `${toza(ish.nik)} → yonma-yon bir xil harf yo'q` };
      },
    },
    unli_kop: {
      nomi: "Unlilar undoshlardan kam emas",
      qoida: "Nikingizdagi unli harflar (a, e, i, o, u) undoshlardan kam bo'lmasa — oqlandingiz.",
      izoh: "Faqat harflar sanaladi, raqamlar, nuqta va «_» sanalmaydi.",
      tekshir(ish) {
        const h = harflar(ish.nik);
        const u = [...h].filter((c) => UNLI.includes(c)).length, d = h.length - u, ok = h.length > 0 && u >= d;
        return { mos: ok, yozuv: `${h || "—"} → unli ${u}, undosh ${d} → ${ok ? "unlilar kam emas" : "undoshlar ko'p"}` };
      },
    },
    raqam_uzunlik: {
      nomi: "Ish raqami nik uzunligiga bo'linadi",
      qoida: "Ish raqamingiz nikingizdagi harf va raqamlar soniga qoldiqsiz bo'linsa — oqlandingiz.",
      izoh: "Masalan, #0042 va 7 belgili nik: 42 ÷ 7 = 6, qoldiq yo'q — oqlanadi.",
      tekshir(ish) {
        const n = belgilar(ish.nik).length, ok = n > 0 && ish.n % n === 0;
        return { mos: ok, yozuv: `${ish.n} ÷ ${n} → ${ok ? `${ish.n / n}, qoldiq yo'q` : `qoldiq ${n ? ish.n % n : "—"}`}` };
      },
    },
  };

  const api = { BANK, toza, belgilar, harflar, tub, kvadrat, uchburchak, raqam4 };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.TZQ = api;
})(typeof window !== "undefined" ? window : globalThis);
