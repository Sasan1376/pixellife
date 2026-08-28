(() => {
  "use strict";
  const style = document.createElement("style");
  style.textContent = ".pl-universal-amazing-ribbon{position:absolute!important;top:10px!important;right:10px!important;z-index:30!important;background:#dc2626!important;color:#fff!important;padding:5px 10px!important;border-radius:9px!important;font:800 11px Vazirmatn,Tahoma,sans-serif!important;box-shadow:0 3px 9px rgba(220,38,38,.22)!important}.pl-universal-amazing-discount{position:absolute!important;top:10px!important;left:10px!important;z-index:30!important;background:#dc2626!important;color:#fff!important;padding:4px 7px!important;border-radius:8px!important;font:800 11px Vazirmatn,Tahoma,sans-serif!important;direction:ltr!important}.pl-universal-amazing-timer{display:flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;margin:9px 8px 0!important;padding:7px 8px!important;border-radius:9px!important;background:#fff1f2!important;color:#be123c!important;font:800 12px Vazirmatn,Tahoma,sans-serif!important;white-space:nowrap!important}.pl-universal-amazing-timer i{font-size:15px!important}";
  document.head.appendChild(style);
  let offers = [];
  const escape = (v) => String(v == null ? "" : v).replace(/"/g, "&quot;");
  const active = (p) => p.amazingOffer && (!p.amazingOfferEndsAt || new Date(p.amazingOfferEndsAt).getTime() > Date.now());
  const match = (card) => {
    const href = card.getAttribute("href") || "";
    const key = decodeURIComponent((href.match(/[?&](?:slug|id)=([^&]+)/) || href.match(/\/product\/([^?#]+)/) || [])[1] || "");
    const text = (card.textContent || "").replace(/\s+/g, " ").trim();
    return offers.find((p) => key && [p.slug, String(p._id)].includes(key)) || offers.find((p) => p.name && text.includes(p.name));
  };
  const clock = () => {
    document.querySelectorAll("[data-universal-amazing-end]").forEach((el) => {
      const d = new Date(el.dataset.universalAmazingEnd).getTime() - Date.now();
      if (d <= 0) { el.closest("a")?.querySelectorAll(".pl-universal-amazing-ribbon,.pl-universal-amazing-discount,.pl-universal-amazing-timer").forEach(x=>x.remove()); return; }
      const h=Math.floor(d/3600000),m=Math.floor((d%3600000)/60000),s=Math.floor((d%60000)/1000);
      el.textContent=h+":"+String(m).padStart(2,"0")+":"+String(s).padStart(2,"0")+" باقی‌مانده";
    });
  };
  const decorate = () => {
    document.querySelectorAll("a[href*='product']").forEach((card) => {
      if (card.dataset.universalAmazingDone) return;
      const p=match(card); if(!p || !active(p)) return;
      card.dataset.universalAmazingDone="1"; card.style.position="relative";
      card.insertAdjacentHTML("afterbegin",'<span class="pl-universal-amazing-ribbon">شگفت‌انگیز</span>'+ (Number(p.discount||0)>0?'<span class="pl-universal-amazing-discount">'+Number(p.discount)+'%</span>':''));
      if(p.amazingOfferEndsAt) card.insertAdjacentHTML("beforeend",'<div class="pl-universal-amazing-timer"><i class="ti ti-clock"></i><span data-universal-amazing-end="'+escape(p.amazingOfferEndsAt)+'"></span></div>');
    }); clock();
  };
  fetch("/api/products?limit=100",{cache:"no-store"}).then(r=>r.json()).then(d=>{offers=(d.products||[]).filter(active);decorate();new MutationObserver(()=>setTimeout(decorate,0)).observe(document.body,{childList:true,subtree:true});setInterval(clock,1000);}).catch(()=>{});
})();