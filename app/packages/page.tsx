"use client";
import Image from "next/image";
import { useState } from "react";
import styles from './packages.module.css';

const packages = [
  {
    id: 1,
    uc: "60 + 600",
    discount: "10%",
    price: "EGP 419.99",
    oldPrice: "EGP 449.99",
    desc: "اشحن 60 + 600 UC لأول مرة واحصل على مكافأة.",
    img: "https://cdn.midasbuy.com/images/uc-small.bc30c95b.png",
  },
  {
    id: 2,
    uc: "30",
    price: "EGP 20.99",
    oldPrice: "EGP 22.49",
    desc: "اشحن 30 UC لأول مرة واحصل على مكافأة.",
    img: "https://cdn.midasbuy.com/images/uc-small.bc30c95b.png",
  },
  {
    id: 3,
    uc: "25 + 300",
    discount: "8%",
    price: "EGP 209.99",
    oldPrice: "EGP 224.99",
    desc: "اشحن 25 + 300 UC لأول مرة واحصل على مكافأة.",
    img: "https://cdn.midasbuy.com/images/uc-small.bc30c95b.png",
  },
  {
    id: 4,
    uc: "60",
    price: "EGP 41.99",
    oldPrice: "EGP 44.99",
    desc: "اشحن 60 UC لأول مرة واحصل على مكافأة.",
    img: "https://cdn.midasbuy.com/images/uc-small.bc30c95b.png",
  },
  {
    id: 5,
    uc: "4200 + 12000",
    discount: "35%",
    price: "EGP 8399.99",
    oldPrice: "EGP 8999.99",
    desc: "اشحن 4200 + 12000 UC لأول مرة واحصل على مكافأة.",
    img: "https://cdn.midasbuy.com/images/uc-small.bc30c95b.png",
  },
  {
    id: 6,
    uc: "2100 + 6000",
    discount: "35%",
    price: "EGP 4199.99",
    oldPrice: "EGP 4499.99",
    desc: "اشحن 2100 + 6000 UC لأول مرة واحصل على مكافأة.",
    img: "https://cdn.midasbuy.com/images/uc-small.bc30c95b.png",
  },
  {
    id: 7,
    uc: "850 + 3000",
    discount: "28%",
    price: "EGP 2099.99",
    oldPrice: "EGP 2249.99",
    desc: "اشحن 850 + 3000 UC لأول مرة واحصل على مكافأة.",
    img: "https://cdn.midasbuy.com/images/uc-small.bc30c95b.png",
  },
  {
    id: 8,
    uc: "300 + 1500",
    discount: "20%",
    price: "EGP 1049.99",
    oldPrice: "EGP 1124.99",
    desc: "اشحن 300 + 1500 UC لأول مرة واحصل على مكافأة.",
    img: "https://cdn.midasbuy.com/images/uc-small.bc30c95b.png",
  },
];

const gameDescription = `لعبة ببجي موبايل هي لعبة قتال وبقاء على قيد الحياة تم نشرها بواسطة Tencent Games ومتاحة على أجهزة Android وiOS. استمتع بتجربة معارك واقعية ورسومات مذهلة.`;

export default function PackagesPage() {
  const [userId, setUserId] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className={styles.customPackagesBg + " min-h-screen text-white"}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#1b2631]">
        <div className="flex items-center gap-2">
          <Image src="/next.svg" alt="Endex Logo" width={48} height={48} />
          <span className="text-2xl font-bold tracking-wide">ENDEX</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="border border-[#00e6c0] text-[#00e6c0] px-6 py-2 rounded hover:bg-[#00e6c0] hover:text-[#151e2e] transition">دخول</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col md:flex-row gap-4 px-2 md:px-4 py-4 max-w-5xl mx-auto">
        {/* Left: ID + Packages */}
        <section className="flex-1 min-w-0">
          {/* Step 1: User ID */}
          <div className="mb-4">
            <div className="input-group">
              <input
                required
                type="text"
                name="userId"
                autoComplete="off"
                className="input"
                value={userId}
                onChange={e => setUserId(e.target.value)}
              />
              <label className="user-label">أدخل الـ ID الخاص بك</label>
            </div>
          </div>
          {/* Step 2: Packages */}
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="bg-[#232f47] text-[#00e6c0] rounded-full w-7 h-7 flex items-center justify-center font-bold">2</span>
              اختر الباقة
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelected(pkg.id)}
                  className={`square-card bg-yellow-box cursor-pointer relative transition-all duration-300 ${selected === pkg.id ? "selected-card" : ""}`}
                  style={{ minHeight: 140, maxWidth: 210, padding: 12 }}
                >
                  <img src={pkg.img} alt="UC" className="card-img" style={{ width: 38, height: 38 }} />
                  <div className="card-title" style={{ fontSize: 16 }}>{pkg.uc}</div>
                  <div className="card-description" style={{ fontSize: 12 }}>{pkg.desc}</div>
                  <div className="card-price" style={{ fontSize: 15 }}>{pkg.price}</div>
                  <div className="card-oldprice" style={{ fontSize: 12 }}>{pkg.oldPrice}</div>
                  {pkg.discount && (
                    <span className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-yellow-300 text-[#232f47] text-xs font-bold px-2 py-1 rounded-full shadow border border-yellow-200">
                      {pkg.discount}
                    </span>
                  )}
                  {selected === pkg.id && (
                    <span className="absolute top-3 right-3 bg-[#00e6c0] text-[#151e2e] text-xs px-2 py-1 rounded-full font-bold z-20">✓</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-4">
              <button
                className="buy-btn"
                disabled={selected === null}
                style={{ opacity: selected === null ? 0.5 : 1, cursor: selected === null ? 'not-allowed' : 'pointer' }}
              >
                شراء الباقة
              </button>
            </div>
          </div>
        </section>

        {/* Right: Game Info */}
        <aside className="w-full md:w-72 flex flex-col items-center md:items-start bg-transparent rounded-xl p-4 mt-6 md:mt-0">
          <Image
            src="/pubg.jpg"
            alt="PUBG Mobile"
            width={220}
            height={120}
            className="rounded mb-3 object-cover"
          />
          <p className="text-xs text-gray-300 leading-relaxed mb-3">{gameDescription}</p>
          <div className="flex gap-2 w-full justify-center mt-auto">
            <a href="#" className="inline-block"><img src="/appstore.svg" alt="App Store" className="w-24" /></a>
            <a href="#" className="inline-block"><img src="/googleplay.svg" alt="Google Play" className="w-24" /></a>
          </div>
        </aside>
      </main>
    </div>
  );
}
