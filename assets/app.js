
const COVERS = window.GISE_COVERS || {};

/* ---------------- data ---------------- */
const EVENTS = [
 {id:1,title:"Boğaz Elektronik Gecesi",cat:"Konser",venue:"KüçükÇiftlik Park",district:"Maçka",date:"2026-11-14",time:"22:00",doors:"21:00",price:650,left:38,cap:4000,org:"Sahne Kolektif",age:"+18",desc:"Şehrin en uzun gecesi Maçka'da. Üç sahnede dokuz DJ, gün doğumuna kadar süren bir set ve Boğaz manzaralı açık hava bar. Yağmur ihtimaline karşı ana sahne kapalı alanda kuruluyor."},
 {id:2,title:"Gece Yarısı Caz Seansları",cat:"Konser",venue:"Salon İKSV",district:"Şişhane",date:"2026-11-16",time:"21:30",doors:"20:45",price:420,left:120,cap:450,org:"Mavi Nota Prodüksiyon",age:"+16",desc:"Kuartet formatında iki set: ilki standartlar, ikincisi grubun yeni albümünden parçalar. Masa düzeninde oturmalı konser."},
 {id:3,title:"Bir Garip Pazartesi",cat:"Komedi",venue:"Maximum Uniq Hall",district:"Maslak",date:"2026-11-18",time:"20:30",doors:"19:45",price:380,left:210,cap:1200,org:"Gülümse Ajans",age:"+16",desc:"Haftanın en sevilmeyen gününe 90 dakikalık bir intikam. Üç yeni stand-up komedyeni, bir sürpriz konuk."},
 {id:4,title:"Hamlet: Yeniden",cat:"Tiyatro",venue:"Moda Sahnesi",district:"Kadıköy",date:"2026-11-21",time:"20:00",doors:"19:30",price:300,left:12,cap:280,org:"Moda Sahnesi",age:"+12",desc:"Shakespeare'in klasiği, bugünün İstanbul'unda geçen yalın bir yorumla. Dört oyuncu, tek dekor, iki perde."},
 {id:5,title:"İstanbul Yapay Zekâ Zirvesi",cat:"Konferans",venue:"Haliç Kongre Merkezi",district:"Beyoğlu",date:"2026-11-23",time:"10:00",doors:"09:00",price:900,left:340,cap:1500,org:"TechIST",age:"Herkes",desc:"Araştırmacılar, girişimciler ve öğrenciler için tam gün program: ana oturumlar, atölyeler ve bir kariyer fuarı. Öğle yemeği bilete dahil."},
 {id:6,title:"Kadıköy Sokak Lezzetleri",cat:"Festival",venue:"Kadıköy Rıhtım",district:"Kadıköy",date:"2026-11-24",time:"12:00",doors:"12:00",price:150,left:800,cap:5000,org:"Rıhtım Etkinlik",age:"Herkes",desc:"Kırk tezgâh, sekiz canlı performans ve gün batımında rıhtımda bir DJ seti. Bilet, üç tadım kuponu içerir."},
 {id:7,title:"Senfonik Film Müzikleri",cat:"Klasik",venue:"Zorlu PSM",district:"Beşiktaş",date:"2026-11-28",time:"20:00",doors:"19:15",price:550,left:64,cap:2100,org:"Sahne Kolektif",age:"+7",desc:"80 kişilik orkestra ve koro, sinema tarihinin en bilinen temalarını dev ekran eşliğinde çalıyor."},
 {id:8,title:"Derbi Gecesi: Basketbol",cat:"Spor",venue:"Sinan Erdem Spor Salonu",district:"Bakırköy",date:"2026-11-30",time:"19:00",doors:"17:30",price:480,left:1500,cap:16000,org:"İstanbul Basket Ligi",age:"Herkes",desc:"Sezonun en çok beklenen maçı. Kapılar maçtan 90 dakika önce açılıyor; tribün renklerine göre giriş kapıları farklı."},
 {id:9,title:"Kuzey Rüzgârı Akustik",cat:"Konser",venue:"Bostancı Gösteri Merkezi",district:"Kadıköy",date:"2026-12-02",time:"21:00",doors:"20:00",price:400,left:290,cap:3500,org:"Mavi Nota Prodüksiyon",age:"+12",desc:"Grubun ilk akustik turnesinin İstanbul durağı. Yaylı dörtlü eşliğinde yeniden düzenlenmiş şarkılar."},
 {id:10,title:"Uzay Atölyesi: Çocuklar İçin Bilim",cat:"Aile",venue:"Maslak Bilim Merkezi",district:"Sarıyer",date:"2026-12-06",time:"11:00",doors:"10:30",price:200,left:44,cap:120,org:"Küçük Kaşifler",age:"7–12 yaş",desc:"Roket yapımı, planetaryum gösterisi ve bir astronotla soru-cevap. Her çocuk bir ebeveynle katılır; ebeveyn bileti ücretsiz."},
 {id:11,title:"Gece Fotoğrafçılığı Atölyesi",cat:"Atölye",venue:"Galata Rıhtımı",district:"Karaköy",date:"2026-12-12",time:"19:00",doors:"18:45",price:750,left:8,cap:20,org:"Kare Kolektif",age:"+16",desc:"Uzun pozlama, ışık izleri ve şehir ışıkları. Tripod ve manuel ayar yapılabilen bir fotoğraf makinesi gerekiyor."},
 {id:12,title:"Yılbaşı Gala Konseri",cat:"Klasik",venue:"Cemal Reşit Rey",district:"Harbiye",date:"2026-12-31",time:"21:00",doors:"20:15",price:1200,left:150,cap:860,org:"Sahne Kolektif",age:"+7",desc:"Strauss valsleri, opera aryaları ve gece yarısı geri sayımı. Gala sonrası fuayede kutlama."},
];
const CATS=["Tümü","Konser","Tiyatro","Komedi","Klasik","Festival","Spor","Atölye","Konferans","Aile"];
const MON=["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
const MONL=["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const DAY=["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"];
const DAYL=["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
const PEOPLE={
  user:{name:"Elif Kaya",username:"elifkaya",email:"elif.kaya@ornek.com",since:"Eylül 2025",roleLabel:"Katılımcı"},
  organizer:{name:"Mert Aydın",username:"sahnekolektif",email:"mert@sahnekolektif.com",since:"Mart 2025",roleLabel:"Organizatör",org:"Sahne Kolektif"},
  admin:{name:"Zeynep Arslan",username:"zeynep",email:"zeynep@gise.app",since:"Ocak 2025",roleLabel:"Admin"}
};
const USERS=[
 {id:1,name:"Elif Kaya",email:"elif.kaya@ornek.com",role:"Katılımcı",joined:"12.09.2025",tickets:7,status:"active"},
 {id:2,name:"Mert Aydın",email:"mert@sahnekolektif.com",role:"Organizatör",joined:"03.03.2025",tickets:0,status:"active"},
 {id:3,name:"Can Demir",email:"can.demir@ornek.com",role:"Katılımcı",joined:"21.10.2026",tickets:31,status:"banned",until:"06.11.2026",reason:"Bilet karaborsası"},
 {id:4,name:"Selin Öztürk",email:"selin.ozturk@ornek.com",role:"Katılımcı",joined:"08.07.2026",tickets:3,status:"active"},
 {id:5,name:"Burak Şahin",email:"burak@gulumse.co",role:"Organizatör",joined:"17.01.2026",tickets:0,status:"active"},
 {id:6,name:"Defne Yıldız",email:"defne.y@ornek.com",role:"Katılımcı",joined:"29.10.2026",tickets:1,status:"active"},
 {id:7,name:"Emre Koç",email:"emrekoc@ornek.com",role:"Katılımcı",joined:"14.05.2026",tickets:0,status:"banned",until:"Kalıcı",reason:"Sahte hesap"},
 {id:8,name:"Ayşe Çelik",email:"ayse.celik@ornek.com",role:"Katılımcı",joined:"02.02.2026",tickets:12,status:"active"},
 {id:9,name:"Zeynep Arslan",email:"zeynep@gise.app",role:"Admin",joined:"05.01.2025",tickets:2,status:"active"},
 {id:10,name:"Kaan Aksoy",email:"kaan.aksoy@ornek.com",role:"Katılımcı",joined:"19.08.2026",tickets:5,status:"active"},
];
const S={
  role:"user", filter:"Tümü", query:"", sort:"date", eventId:1, qty:{}, profileTab:"upcoming", notif:true,
  tickets:[{eventId:2,tier:"Tam",qty:2,order:"GS-48102",total:840},{eventId:7,tier:"Öğrenci",qty:1,order:"GS-47755",total:390},{eventId:12,tier:"Tam",qty:2,order:"GS-46310",total:2400}],
  past:[{title:"Sonbahar Akustik",venue:"Moda Sahnesi",date:"12 Eki 2026",cover:9,qty:2},{title:"Kampüs Film Gecesi",venue:"Işık Üniversitesi",date:"3 Eki 2026",cover:7,qty:1}],
  last:null, adminFilter:"Tümü", adminQuery:"", ban:{target:null,dur:"7",reason:"Spam"},
  draft:{title:"",cat:"Konser",date:"",time:"20:00",venue:"",district:"",desc:"",cover:1,tiers:[{name:"Tam",price:"",cap:""}]},
  tab:"kesfet", loggedIn:false, next:null, pendingToast:null, autoCheckout:false, chat:[], chatOpen:false, chatCtx:{lastIds:[]}, theme:(()=>{try{return localStorage.getItem("gise-theme")||"system"}catch(e){return "system"}})()
};

/* ---------------- helpers ---------------- */
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const tl=n=>"₺"+Number(n).toLocaleString("tr-TR");
const ev=id=>EVENTS.find(e=>e.id===+id);
const d=e=>new Date(e.date+"T"+(e.time||"20:00"));
const shortDate=e=>{const x=d(e);return `${DAY[x.getDay()]}, ${x.getDate()} ${MON[x.getMonth()]} · ${e.time}`};
const longDate=e=>{const x=d(e);return `${DAYL[x.getDay()]}, ${x.getDate()} ${MONL[x.getMonth()]} ${x.getFullYear()}`};
const cover=id=>COVERS[id]||COVERS[1];
const round=(n,s)=>Math.round(n/s)*s;
function tiers(e){
  return [
    {id:"tam",name:"Tam",desc:"Genel giriş",price:e.price,left:e.left},
    {id:"ogr",name:"Öğrenci",desc:"Girişte öğrenci kimliği istenir",price:round(e.price*.65,10),left:Math.max(0,Math.round(e.left*.4))},
    {id:"vip",name:"VIP",desc:"Ön bölüm ve ayrı giriş",price:round(e.price*2.2,50),left:e.id===1||e.id===11?0:Math.max(2,Math.round(e.left*.08))}
  ];
}
function initials(n){return n.split(" ").map(p=>p[0]).slice(0,2).join("").toLocaleUpperCase("tr-TR")}
const AV=[["#FF5C8A","#C81E52"],["#5E5CE6","#3634A3"],["#30B0C7","#0A7C8C"],["#FF9F0A","#C93400"],["#34C759","#1F7A35"],["#BF5AF2","#8944AB"]];
function avatarBg(n){let h=0;for(const c of n)h=(h*31+c.charCodeAt(0))>>>0;const p=AV[h%AV.length];return `linear-gradient(145deg,${p[0]},${p[1]})`}
function avatar(n,cls=""){return `<span class="avatar ${cls}" style="background:${avatarBg(n)}" aria-hidden="true">${initials(n)}</span>`}

/* SF-like icons (inline SVG) */
const P={
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/>',
 compass:'<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
 person:'<circle cx="12" cy="8.5" r="3.8"/><path d="M4.8 20c.9-3.6 3.8-5.6 7.2-5.6s6.3 2 7.2 5.6"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 plusSq:'<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><path d="M12 8v8M8 12h8"/>',
 shield:'<path d="M12 3.5 5 6v5.5c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
 cal:'<rect x="3.5" y="5" width="17" height="15.5" rx="4"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
 clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
 pin:'<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
 ticket:'<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v2a2.5 2.5 0 0 0 0 5v2a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-2a2.5 2.5 0 0 0 0-5z"/><path d="M14.5 6v12" stroke-dasharray="1.6 2.2"/>',
 chevL:'<path d="m14.5 5-7 7 7 7"/>',
 chevR:'<path d="m9.5 5 7 7-7 7"/>',
 check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
 x:'<path d="m6.5 6.5 11 11M17.5 6.5l-11 11"/>',
 minus:'<path d="M5 12h14"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6"/>',
 bell:'<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
 out:'<path d="M14 4.5H7.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H14"/><path d="M11 12h9.5M17 8.5l3.5 3.5-3.5 3.5"/>',
 card:'<rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="M3 10h18M7 15h3"/>',
 info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
 people:'<circle cx="9" cy="9" r="3.2"/><path d="M3.5 19c.6-3 2.8-4.7 5.5-4.7s4.9 1.7 5.5 4.7"/><circle cx="16.5" cy="8" r="2.6"/><path d="M15.8 13.6c2.4.1 4.3 1.6 4.8 4.4"/>',
 slash:'<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>',
 photo:'<rect x="3.5" y="4.5" width="17" height="15" rx="4"/><circle cx="9" cy="9.5" r="1.7"/><path d="m4 17 5-4.5 4 3.5 2.5-2 4.5 3.5"/>',
 trash:'<path d="M5 7h14M10 4h4M7 7l.8 12a2 2 0 0 0 2 1.8h4.4a2 2 0 0 0 2-1.8L17 7"/>',
 qr:'<rect x="4" y="4" width="6" height="6" rx="1.4"/><rect x="14" y="4" width="6" height="6" rx="1.4"/><rect x="4" y="14" width="6" height="6" rx="1.4"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>',
 eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
 arrowUR:'<path d="M8 16 16 8M9 8h7v7"/>',
 at:'<circle cx="12" cy="12" r="3.5"/><path d="M15.5 12v1.5a2.5 2.5 0 0 0 5 0V12a8.5 8.5 0 1 0-3.4 6.8"/>',
 envelope:'<rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="m4 7.5 8 6 8-6"/>',
 lock:'<rect x="5" y="10.5" width="14" height="10" rx="3"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4"/>',
 moon:'<path d="M19.5 14.5A7.8 7.8 0 0 1 9.5 4.5a7.8 7.8 0 1 0 10 10z"/>',
 circleHalf:'<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor"/>',
 sparkle:'<path d="M12 3.5c.6 4.4 2.1 5.9 6.5 6.5-4.4.6-5.9 2.1-6.5 6.5-.6-4.4-2.1-5.9-6.5-6.5 4.4-.6 5.9-2.1 6.5-6.5z"/>'
};
function ic(n,cls="",w=1.8){return `<span class="i ${cls}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${P[n]}</svg></span>`}

function logo(size=32){
  const id="lg"+size+Math.random().toString(36).slice(2,6);
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF4F7E"/><stop offset=".55" stop-color="#C81E52"/><stop offset="1" stop-color="#6E1238"/></linearGradient></defs><rect width="64" height="64" rx="15" fill="url(#${id})"/><path d="M15 21a4 4 0 0 1 4-4h26a4 4 0 0 1 4 4v5.2a5.8 5.8 0 0 0 0 11.6V43a4 4 0 0 1-4 4H19a4 4 0 0 1-4-4v-5.2a5.8 5.8 0 0 0 0-11.6z" fill="#fff"/><path d="M39 19.5v25" stroke="#C81E52" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="0.1 5"/><path d="M27 25.5l1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6z" fill="#C81E52"/></svg>`;
}

function qr(seed,size=168){
  const N=25;let s=seed*9301+49297;const r=()=>(s=(s*9301+49297)%233280)/233280;
  const m=[...Array(N)].map(()=>Array(N).fill(0));
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)m[y][x]=r()>.52?1:0;
  const finder=(ox,oy)=>{for(let y=-1;y<8;y++)for(let x=-1;x<8;x++){const X=ox+x,Y=oy+y;if(X<0||Y<0||X>=N||Y>=N)continue;const on=(x>=0&&x<7&&y>=0&&y<7)&&(x===0||x===6||y===0||y===6||(x>=2&&x<=4&&y>=2&&y<=4));m[Y][X]=on?1:0}};
  finder(0,0);finder(N-7,0);finder(0,N-7);
  let p="";for(let y=0;y<N;y++){let x=0;while(x<N){if(m[y][x]){let w=1;while(x+w<N&&m[y][x+w])w++;p+=`M${x} ${y}h${w}v1h-${w}z`;x+=w}else x++}}
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges" role="img" aria-label="Bilet QR kodu"><path d="${p}" fill="#000"/></svg>`;
}

/* springs → CSS linear() (Apple: damping ratio + response) */
function springCurve(response=.4,damping=1){
  const w=2*Math.PI/response, wd=w*Math.sqrt(Math.max(1-damping*damping,1e-6));
  const x=t=>damping<1?1-Math.exp(-damping*w*t)*(Math.cos(wd*t)+(damping*w/wd)*Math.sin(wd*t)):1-Math.exp(-w*t)*(1+w*t);
  let T=.1;for(;T<3;T+=.01){let ok=true;for(let t=T;t<T+.25;t+=.02){if(Math.abs(1-x(t))>.002){ok=false;break}}if(ok)break}
  const pts=[];for(let i=0;i<=48;i++)pts.push(+x(T*i/48).toFixed(4));pts[48]=1;
  return {easing:`linear(${pts.join(",")})`,duration:Math.round(T*1000)};
}
const LINEAR_OK=typeof CSS!=="undefined"&&CSS.supports&&CSS.supports("animation-timing-function","linear(0, 1)");
const REDUCED=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
function spring(r,dmp){const s=springCurve(r,dmp);return LINEAR_OK?s:{easing:"cubic-bezier(.2,.8,.2,1)",duration:Math.min(s.duration,450)}}

/* ---------------- shell pieces ---------------- */
function nav(active){
  const me=PEOPLE[S.role];
  const tabs=[["kesfet","Keşfet","compass"],["profil","Profil","person"]];
  if(S.role==="organizer")tabs.push(["olustur","Oluştur","plusSq"]);
  if(S.role==="admin")tabs.push(["yonetim","Yönetim","shield"]);
  return `<header class="nav glass">
    <a class="brand" href="#kesfet" aria-label="Gişe, Keşfet'e git">${logo(30)}<span>Gişe</span></a>
    <nav class="tabs" aria-label="Ana gezinme">${tabs.map(([h,l,i])=>`<a class="tab" href="#${h}" ${active===h?'aria-current="page"':""}>${ic(i,"i-sm",active===h?2.2:1.9)}${l}</a>`).join("")}</nav>
    <div class="nav-right">${themeBtn()}<a href="#profil" class="avatar avatar-btn" style="background:${avatarBg(me.name)}" aria-label="Profil: ${esc(me.name)}">${initials(me.name)}</a></div>
  </header>`;
}
function footer(){return `<footer class="footer"><p class="footnote">Gişe · Web ve İnternet Programlama dersi projesi</p><p class="footnote">Prototip. Gerçek ödeme alınmaz.</p></footer>`}
function card(e){
  const x=d(e);const low=e.left>0&&e.left<=50;
  return `<a class="card" href="#etkinlik-${e.id}" aria-label="${esc(e.title)}, ${shortDate(e)}, ${esc(e.venue)}">
    <div class="cover"><img src="${cover(e.cover||e.id)}" alt="">
      <div class="date-badge" aria-hidden="true"><b class="num">${x.getDate()}</b><span>${MON[x.getMonth()].toLocaleUpperCase("tr-TR")}</span></div>
      <span class="cover-shade" aria-hidden="true"></span><span class="cover-cat" aria-hidden="true">${e.cat}</span></div>
    <div class="card-body">
      <h3 class="card-title">${esc(e.title)}</h3>
      <p class="card-meta">${shortDate(e)}</p>
      <p class="card-meta">${esc(e.venue)}, ${esc(e.district)}</p>
      <div class="card-foot"><span class="price num">${tl(e.price)}<small>'den başlayan</small></span>${low?`<span class="pill warn"><span class="dot"></span>Son ${e.left} bilet</span>`:""}</div>
    </div></a>`;
}

/* ---------------- screens ---------------- */
function authBg(){
  const ids=[3,1,5,7,2,12,6,9,4,10,11,8,1,7,3,12,5,2,10,4,9,6,8,11];
  return `<div class="auth-bg" aria-hidden="true">${ids.map(i=>`<img src="${cover(i)}" alt="">`).join("")}</div><div class="auth-dim" aria-hidden="true"></div>`;
}
function protoRole(){
  return `<div class="proto-role no-export"><span class="caption" style="color:rgba(255,255,255,.85)">Prototip: hangi rolle girileceğini seç</span>
  <div class="seg" role="group" aria-label="Prototip rolü">${[["user","Katılımcı"],["organizer","Organizatör"],["admin","Admin"]].map(([k,l])=>`<button type="button" data-act="role" data-v="${k}" aria-pressed="${S.role===k}">${l}</button>`).join("")}</div></div>`;
}
const SCREENS={
giris(){
  return `<main class="auth">${authBg()}<div class="auth-theme no-export">${themeBtn(true)}</div>
  <div><form class="auth-card glass" id="loginForm" novalidate>
    <div class="auth-head">${logo(64)}<h1 class="title1">Gişe'ye giriş yap</h1><p class="subhead">Şehrin bütün sahneleri, tek gişede.</p></div>
    <div class="grouped-fields">
      <label class="sr" for="lgUser">E-posta veya kullanıcı adı</label>
      <input class="input" id="lgUser" type="text" autocomplete="username" placeholder="E-posta veya kullanıcı adı">
      <div class="sep"></div>
      <label class="sr" for="lgPass">Şifre</label>
      <input class="input" id="lgPass" type="password" autocomplete="current-password" placeholder="Şifre">
    </div>
    <p class="msg err" id="lgErr" hidden>${ic("info","i-sm")}<span>Devam etmek için e-posta ve şifreni gir.</span></p>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <label class="check-row"><input type="checkbox" id="lgRemember" checked> Beni hatırla</label>
      <button type="button" class="link" data-act="toast" data-v="Şifre sıfırlama bağlantısı e-postana gönderildi.">Şifremi Unuttum</button>
    </div>
    <button class="btn btn-primary btn-large btn-block" type="submit">Giriş Yap</button>
    <div class="or">ya da</div>
    <a class="btn btn-gray btn-large btn-block" href="#kayit">Hesap Oluştur</a>
  </form>${protoRole()}</div></main>`;
},
kayit(){
  const t=S.regType||"user";
  return `<main class="auth">${authBg()}<div class="auth-theme no-export">${themeBtn(true)}</div>
  <form class="auth-card glass" id="regForm" novalidate>
    <div class="auth-head">${logo(56)}<h1 class="title1">Hesap oluştur</h1><p class="subhead">Bilet almak ya da etkinlik yayınlamak için.</p></div>
    <div class="seg seg-block" role="group" aria-label="Hesap türü">${[["user","Katılımcı"],["organizer","Organizatör"]].map(([k,l])=>`<button type="button" data-act="regType" data-v="${k}" aria-pressed="${t===k}">${l}</button>`).join("")}</div>
    <div class="grouped-fields">
      <label class="sr" for="rgName">Ad soyad</label><input class="input" id="rgName" autocomplete="name" placeholder="Ad soyad">
      <div class="sep"></div><label class="sr" for="rgUser">Kullanıcı adı</label><input class="input" id="rgUser" autocomplete="username" placeholder="Kullanıcı adı">
      <div class="sep"></div><label class="sr" for="rgMail">E-posta</label><input class="input" id="rgMail" type="email" autocomplete="email" placeholder="E-posta">
      <div class="sep"></div><label class="sr" for="rgPass">Şifre</label><input class="input" id="rgPass" type="password" autocomplete="new-password" placeholder="Şifre (en az 8 karakter)">
    </div>
    <p class="msg err" id="rgErr" hidden>${ic("info","i-sm")}<span></span></p>
    <label class="check-row"><input type="checkbox" id="rgTerms"> Kullanım koşullarını ve gizlilik politikasını kabul ediyorum.</label>
    <button class="btn btn-primary btn-large btn-block" type="submit">Hesap Oluştur</button>
    <p class="footnote" style="text-align:center">Zaten hesabın var mı? <a class="link" href="#giris">Giriş Yap</a></p>
  </form></main>`;
},
kesfet(){
  return `${nav("kesfet")}<main class="page">
    <div class="page-head"><div><p class="eyebrow">İstanbul · Kasım–Aralık 2026</p><h1 class="large-title">Keşfet</h1></div>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <div class="search">${ic("search")}<label class="sr" for="q">Ara</label><input class="input" id="q" type="search" placeholder="Etkinlik, mekân veya organizatör ara" value="${esc(S.query)}"></div>
        <label class="sr" for="sort">Sırala</label>
        <select class="input" id="sort" style="width:auto;height:44px;border-radius:999px;font-weight:600;font-size:15px"><option value="date" ${S.sort==="date"?"selected":""}>Tarihe göre</option><option value="price" ${S.sort==="price"?"selected":""}>Fiyata göre</option></select>
      </div></div>
    <div class="chips" role="group" aria-label="Kategori" style="margin-bottom:28px">${CATS.map(c=>`<button class="chip" data-act="cat" data-v="${c}" aria-pressed="${S.filter===c}">${c}</button>`).join("")}</div>
    <div class="grid" id="grid">${gridHTML()}</div>
  </main>${footer()}`;
},
etkinlik(){
  const e=ev(S.eventId)||EVENTS[0];const q=S.qty[e.id]||{};
  const T=tiers(e);const total=T.reduce((s,t)=>s+(q[t.id]||0)*t.price,0);const count=T.reduce((s,t)=>s+(q[t.id]||0),0);
  return `${nav("kesfet")}<main class="page">
    <a class="back" href="#kesfet">${ic("chevL","",2.2)}Keşfet</a>
    <section class="hero"><img src="${cover(e.cover||e.id)}" alt=""><div class="hero-shade"></div>
      <div class="hero-text"><span class="eyebrow" style="color:rgba(255,255,255,.88);margin:0">${e.cat} · ${esc(e.org)}</span><h1 class="large-title">${esc(e.title)}</h1><p>${longDate(e)} · ${esc(e.venue)}</p></div></section>
    <div class="detail-grid">
      <div>
        <ul class="list">
          ${infoRow("cal","#FF3B30","Tarih",longDate(e))}
          ${infoRow("clock","#FF9500","Saat",`${e.time} · Kapılar ${e.doors}`)}
          ${infoRow("pin","#34C759","Mekân",`${esc(e.venue)}, ${esc(e.district)}`,`<a class="btn btn-gray btn-sm" href="https://www.openstreetmap.org/search?query=${encodeURIComponent(e.venue+" İstanbul")}">Yol Tarifi ${ic("arrowUR","i-sm")}</a>`)}
          ${infoRow("people","#5E5CE6","Organizatör",esc(e.org))}
          ${infoRow("info","#8E8E93","Yaş sınırı",e.age)}
        </ul>
        <h2 class="title3" style="margin:32px 0 10px">Hakkında</h2>
        <p class="prose">${esc(e.desc)}</p>
        <h2 class="title3" style="margin:32px 0 10px">Bilmen gerekenler</h2>
        <ul class="list no-icons">
          <li class="row"><div class="row-main"><p class="row-title">İade ve değişim</p><p class="row-sub">Etkinlikten 48 saat öncesine kadar ücretsiz iade.</p></div></li>
          <li class="row"><div class="row-main"><p class="row-title">Girişte QR kod</p><p class="row-sub">Biletlerin Profil sayfanda; çıktı almana gerek yok.</p></div></li>
          <li class="row"><div class="row-main"><p class="row-title">Kişi başı en fazla 6 bilet</p><p class="row-sub">Karaborsayı önlemek için sınırlı.</p></div></li>
        </ul>
      </div>
      <aside class="buy" aria-label="Bilet seçimi">
        <h2 class="title3" style="margin-bottom:4px">Bilet seç</h2>
        <p class="footnote" style="margin-bottom:6px">${e.left<=50?`<span style="color:var(--warn);font-weight:600">Son ${e.left} bilet.</span> `:""}Fiyatlara hizmet bedeli dahil.</p>
        ${T.map(t=>{const n=q[t.id]||0;const sold=t.left===0;return `<div class="tier"><div class="tier-main"><p class="headline">${t.name}</p><p class="footnote">${sold?'<span class="pill neutral">Tükendi</span>':t.desc}</p></div>
          <span class="tier-price">${tl(t.price)}</span>
          ${sold?"":`<div class="stepper" role="group" aria-label="${t.name} bilet adedi"><button type="button" data-act="qty" data-t="${t.id}" data-d="-1" aria-label="Azalt" ${n===0?"disabled":""}>${ic("minus","i-sm",2.2)}</button><output aria-live="polite">${n}</output><button type="button" data-act="qty" data-t="${t.id}" data-d="1" aria-label="Arttır" ${count>=6||n>=t.left?"disabled":""}>${ic("plus","i-sm",2.2)}</button></div>`}</div>`}).join("")}
        <div class="total"><span class="subhead">${count?`${count} bilet`:"Toplam"}</span><b>${tl(total)}</b></div>
        <button class="btn btn-primary btn-large btn-block" data-act="checkout" ${count?"":"disabled"}>${count?"Bilet Al":"Bilet Seç"}</button>
        <p class="caption" style="text-align:center;margin-top:8px">Ödemeyi bir sonraki adımda onaylarsın.</p>
      </aside>
    </div></main>${footer()}`;
},
onay(){
  const o=S.last||{eventId:4,qty:2,tierText:"2 × Tam",order:"GS-48219",total:600};
  const e=ev(o.eventId);
  return `${nav("profil")}<main class="page page-narrow">
    <div class="success-head"><div class="check">${ic("check","",2.6)}</div><h1 class="title1">Biletlerin hazır</h1><p class="subhead">Sipariş ${o.order} · ${tl(o.total)} · Bir kopyasını e-postana da gönderdik.</p></div>
    ${pass(e,o)}
    <div style="display:flex;gap:12px;justify-content:center;margin-top:28px;flex-wrap:wrap">
      <a class="btn btn-primary btn-large" href="#profil">Biletlerime Git</a>
      <a class="btn btn-gray btn-large" href="#kesfet">Keşfet'e Dön</a>
    </div></main>${footer()}`;
},
profil(){
  const me=PEOPLE[S.role];const isOrg=S.role==="organizer";
  const segs=[["upcoming","Yaklaşan"],["past","Geçmiş"]];if(isOrg)segs.push(["mine","Etkinliklerim"]);
  if(!segs.find(s=>s[0]===S.profileTab))S.profileTab="upcoming";
  return `${nav("profil")}<main class="page">
    <div class="profile-grid">
      <div>
        <section class="me">${avatar(me.name)}<h1 class="title2">${esc(me.name)}</h1><p class="subhead">@${esc(me.username)}</p>
          <span class="pill ${S.role==="admin"?"accent":S.role==="organizer"?"accent":"neutral"}" style="margin-top:6px">${me.roleLabel}${me.org?" · "+esc(me.org):""}</span>
          <div class="me-stats"><div><b class="num">${S.tickets.reduce((s,t)=>s+t.qty,0)}</b><span class="caption">Aktif bilet</span></div><div><b class="num">${S.past.length}</b><span class="caption">Katıldığı etkinlik</span></div></div>
        </section>
        <p class="section-head">Hesap</p>
        <ul class="list">
          <li><a class="row" href="#ayarlar"><span class="row-icon" style="background:#8E8E93">${ic("gear","i-sm",2)}</span><span class="row-main"><span class="row-title">Hesap Ayarları</span><span class="row-sub" style="display:block">Kullanıcı adı, e-posta, şifre</span></span>${ic("chevR","chev i-sm",2.2)}</a></li>
          <li class="row"><span class="row-icon" style="background:#FF3B30">${ic("bell","i-sm",2)}</span><span class="row-main"><label class="row-title" for="notif">Etkinlik hatırlatmaları</label></span><span class="switch"><input type="checkbox" id="notif" role="switch" ${S.notif?"checked":""} data-act="notif"><span></span></span></li>
          <li class="row"><span class="row-icon" style="background:#5E5CE6">${ic("circleHalf","i-sm",2)}</span><span class="row-main"><span class="row-title">Görünüm</span></span><div class="seg" role="group" aria-label="Görünüm">${[["system","Sistem"],["light","Açık"],["dark","Koyu"]].map(([k,l])=>`<button type="button" data-act="theme" data-v="${k}" aria-pressed="${S.theme===k}" style="height:30px;padding:0 12px;font-size:13px">${l}</button>`).join("")}</div></li>
          <li><button class="row" data-act="logout"><span class="row-icon" style="background:var(--bad)">${ic("out","i-sm",2)}</span><span class="row-main"><span class="row-title" style="color:var(--bad)">Çıkış Yap</span></span></button></li>
        </ul>
        <p class="section-foot">Üyelik: ${me.since} · ${esc(me.email)}</p>
      </div>
      <section aria-labelledby="tk">
        <div class="page-head" style="margin-bottom:18px"><h2 class="large-title" id="tk">${isOrg&&S.profileTab==="mine"?"Etkinliklerim":"Biletlerim"}</h2>
          <div class="seg" role="group" aria-label="Görünüm">${segs.map(([k,l])=>`<button type="button" data-act="ptab" data-v="${k}" aria-pressed="${S.profileTab===k}">${l}</button>`).join("")}</div></div>
        ${profileList()}
      </section>
    </div></main>${footer()}`;
},
ayarlar(){
  const me=PEOPLE[S.role];
  return `${nav("profil")}<main class="page page-narrow">
    <a class="back" href="#profil">${ic("chevL","",2.2)}Profil</a>
    <h1 class="large-title">Hesap Ayarları</h1>

    <form id="fUser" novalidate>
      <p class="section-head">Kullanıcı adı</p>
      <div class="group">
        <div class="form-row"><label>Mevcut</label><span class="row-value">@${esc(me.username)}</span></div>
        <div class="form-row"><label for="nu">Yeni kullanıcı adı</label><input class="input" id="nu" autocomplete="username" placeholder="ör. ${esc(me.username)}.ist"></div>
      </div>
      <div class="section-actions"><p class="msg" id="nuMsg" style="color:var(--label-2)">3–20 karakter; harf, rakam, nokta ve alt çizgi.</p><button class="btn btn-tinted btn-sm" type="submit" id="nuBtn" disabled>Kaydet</button></div>
    </form>

    <form id="fMail" novalidate>
      <p class="section-head">E-posta</p>
      <div class="group">
        <div class="form-row"><label>Mevcut</label><span class="row-value">${esc(me.email)}</span></div>
        <div class="form-row"><label for="nm">Yeni e-posta</label><input class="input" id="nm" type="email" autocomplete="email" placeholder="ad@ornek.com"></div>
        <div class="form-row"><label for="nmp">Şifren</label><input class="input" id="nmp" type="password" autocomplete="current-password" placeholder="Onay için gerekli"></div>
      </div>
      <div class="section-actions"><p class="msg" id="nmMsg" style="color:var(--label-2)">Yeni adresine bir doğrulama bağlantısı göndereceğiz.</p><button class="btn btn-tinted btn-sm" type="submit">Doğrulama Gönder</button></div>
    </form>

    <form id="fPass" novalidate>
      <p class="section-head">Şifre</p>
      <div class="group">
        <div class="form-row"><label for="op">Mevcut şifre</label><input class="input" id="op" type="password" autocomplete="current-password" placeholder="Gerekli"></div>
        <div class="form-row"><label for="np">Yeni şifre</label><input class="input" id="np" type="password" autocomplete="new-password" placeholder="En az 8 karakter"><div class="meter" id="meter" data-s="0" aria-hidden="true"><i></i><i></i><i></i><i></i></div></div>
        <div class="form-row"><label for="np2">Yeni şifre (tekrar)</label><input class="input" id="np2" type="password" autocomplete="new-password" placeholder="Tekrar gir"></div>
      </div>
      <ul class="rules" id="rules"><li data-r="len">${ic("check","i-sm",2.4)}8+ karakter</li><li data-r="up">${ic("check","i-sm",2.4)}Büyük harf</li><li data-r="num">${ic("check","i-sm",2.4)}Rakam</li><li data-r="match">${ic("check","i-sm",2.4)}Şifreler aynı</li></ul>
      <div class="section-actions"><p class="msg" id="npMsg" hidden></p><span></span><button class="btn btn-primary btn-sm" type="submit">Şifreyi Güncelle</button></div>
    </form>
  </main>${footer()}`;
},
olustur(){
  const f=S.draft;
  return `${nav("olustur")}<main class="page">
    <div class="page-head"><div><p class="eyebrow">${esc(PEOPLE.organizer.org)} adına</p><h1 class="large-title">Yeni Etkinlik</h1></div>
      <div style="display:flex;gap:10px"><button class="btn btn-gray" data-act="draft">Taslak Olarak Kaydet</button><button class="btn btn-primary" data-act="publish">Yayınla</button></div></div>
    <div class="create-grid">
      <form id="cf" novalidate>
        <p class="section-head" style="margin-top:0">Temel bilgiler</p>
        <div class="fieldset">
          <div class="field"><label for="cTitle">Etkinlik adı</label><input class="input" id="cTitle" data-k="title" value="${esc(f.title)}" placeholder="ör. Kampüs Caz Gecesi" maxlength="60"></div>
          <div class="two"><div class="field"><label for="cCat">Kategori</label><select class="input" id="cCat" data-k="cat">${CATS.slice(1).map(c=>`<option ${f.cat===c?"selected":""}>${c}</option>`).join("")}</select></div>
          <div class="field"><label for="cAge">Yaş sınırı</label><select class="input" id="cAge"><option>Herkes</option><option>+7</option><option>+12</option><option>+16</option><option>+18</option></select></div></div>
          <div class="field"><label for="cDesc">Açıklama</label><textarea class="input" id="cDesc" data-k="desc" placeholder="Katılımcılar neyle karşılaşacak? Program, süre, dahil olanlar…">${esc(f.desc)}</textarea></div>
        </div>
        <p class="section-head">Tarih ve mekân</p>
        <div class="fieldset">
          <div class="two"><div class="field"><label for="cDate">Tarih</label><input class="input" id="cDate" data-k="date" type="date" value="${f.date}" min="2026-10-31"></div><div class="field"><label for="cTime">Saat</label><input class="input" id="cTime" data-k="time" type="time" value="${f.time}"></div></div>
          <div class="two"><div class="field"><label for="cVenue">Mekân</label><input class="input" id="cVenue" data-k="venue" value="${esc(f.venue)}" placeholder="ör. Salon İKSV"></div><div class="field"><label for="cDist">İlçe</label><input class="input" id="cDist" data-k="district" value="${esc(f.district)}" placeholder="ör. Beyoğlu"></div></div>
        </div>
        <p class="section-head">Kapak</p>
        <div class="fieldset"><div class="cover-pick" role="group" aria-label="Kapak görseli">
          ${[1,2,5,7,10,11].map(i=>`<button type="button" class="cover-opt" data-act="cover" data-v="${i}" aria-pressed="${f.cover===i}" aria-label="Kapak ${i}"><img src="${cover(i)}" alt=""><span class="tick">${ic("check","i-sm",2.6)}</span></button>`).join("")}
          <label class="cover-opt upload">${ic("photo")}Yükle<input type="file" accept="image/*" id="cUp" aria-label="Kapak görseli yükle"></label>
        </div><p class="footnote">Önerilen boyut 1200×1500 (4:5). Afişte yazı olmamasını öneririz; başlık kartta ayrıca gösterilir.</p></div>
        <p class="section-head">Biletler</p>
        <div class="fieldset" id="tierBox">${tierRows()}</div>
        <p class="section-foot">Fiyatları hizmet bedeli dahil gir. Kontenjan dolunca bilet türü "Tükendi" görünür.</p>
        <p class="msg err" id="cErr" hidden style="margin:14px 18px 0">${ic("info","i-sm")}<span></span></p>
      </form>
      <aside class="preview-wrap" aria-label="Önizleme"><p class="section-head" style="margin:0 2px">Keşfet'te böyle görünecek</p><div id="pv">${previewCard()}</div></aside>
    </div></main>${footer()}`;
},
yonetim(){
  const banned=USERS.filter(u=>u.status==="banned").length;
  return `${nav("yonetim")}<main class="page">
    <div class="page-head"><div><p class="eyebrow">Admin</p><h1 class="large-title">Kullanıcılar</h1></div></div>
    <div class="stats">
      <div class="stat"><span class="footnote">Toplam kullanıcı</span><b>1.284</b><span class="caption">Bu hafta +37</span></div>
      <div class="stat"><span class="footnote">Organizatör</span><b>46</b><span class="caption">3 onay bekliyor</span></div>
      <div class="stat"><span class="footnote">Banlı hesap</span><b style="color:var(--bad)" id="bannedCount">${banned+10}</b><span class="caption">Son 30 gün</span></div>
    </div>
    <div class="toolbar">
      <div class="search">${ic("search")}<label class="sr" for="aq">Kullanıcı ara</label><input class="input" id="aq" type="search" placeholder="Ad veya e-posta ara" value="${esc(S.adminQuery)}"></div>
      <div class="seg" role="group" aria-label="Filtre">${["Tümü","Katılımcı","Organizatör","Banlı"].map(f=>`<button type="button" data-act="afilter" data-v="${f}" aria-pressed="${S.adminFilter===f}">${f}</button>`).join("")}</div>
    </div>
    <table class="table"><thead><tr><th>Kullanıcı</th><th>Rol</th><th>Kayıt</th><th>Bilet</th><th>Durum</th><th style="text-align:right">İşlem</th></tr></thead><tbody id="ubody">${userRows()}</tbody></table>
    <div class="pager"><span class="footnote">1.284 kullanıcıdan ${USERS.length} tanesi gösteriliyor</span><div style="display:flex;gap:8px"><button class="btn btn-gray btn-sm" disabled>Önceki</button><button class="btn btn-gray btn-sm" data-act="toast" data-v="Prototipte tek sayfa var.">Sonraki</button></div></div>
  </main>${footer()}`;
}
};

function infoRow(icon,color,label,value,extra=""){
  return `<li class="row"><span class="row-icon" style="background:${color}">${ic(icon,"i-sm",2)}</span><div class="row-main"><p class="row-sub">${label}</p><p class="row-title">${value}</p></div>${extra}</li>`;
}
function gridHTML(){
  let list=EVENTS.filter(e=>(S.filter==="Tümü"||e.cat===S.filter));
  const q=S.query.trim().toLocaleLowerCase("tr-TR");
  if(q)list=list.filter(e=>[e.title,e.venue,e.district,e.org,e.cat].join(" ").toLocaleLowerCase("tr-TR").includes(q));
  list.sort(S.sort==="price"?(a,b)=>a.price-b.price:(a,b)=>d(a)-d(b));
  if(!list.length)return `<div class="empty">${ic("search")}<p class="headline">Eşleşen etkinlik yok</p><p class="subhead">Başka bir kelime dene ya da kategori filtresini kaldır.</p><button class="btn btn-gray" data-act="clear">Filtreleri Temizle</button></div>`;
  return list.map(card).join("");
}
function pass(e,o){
  return `<article class="pass" aria-label="Bilet">
    <div class="pass-top"><img src="${cover(e.cover||e.id)}" alt=""><div class="pass-brand">${logo(22)}Gişe<span style="margin-left:auto;font-weight:600;opacity:.9">${o.tierText}</span></div>
      <div><p class="caption" style="color:rgba(255,255,255,.85);font-weight:600">${esc(e.venue)}, ${esc(e.district)}</p><h2 class="pass-title">${esc(e.title)}</h2></div></div>
    <div class="perf"><span class="notch l"></span><span class="notch r"></span></div>
    <div class="pass-fields"><div><div class="k">Tarih</div><div class="v">${d(e).getDate()} ${MON[d(e).getMonth()]}</div></div><div><div class="k">Saat</div><div class="v">${e.time}</div></div><div><div class="k">Kapı</div><div class="v">${e.doors}</div></div><div><div class="k">Adet</div><div class="v">${o.qty}</div></div></div>
    <div class="pass-qr"><div class="qr">${qr(e.id*7+o.qty,168)}</div><p class="caption">${o.order} · Girişte bu kodu göster</p></div>
  </article>`;
}
function profileList(){
  if(S.profileTab==="past")return `<div class="stubs">${S.past.map(p=>`<div class="stub" style="opacity:.85"><div class="stub-art"><img src="${cover(p.cover)}" alt="" style="filter:grayscale(.6)"></div><div class="stub-main"><p class="headline">${esc(p.title)}</p><p class="subhead">${p.date} · ${esc(p.venue)}</p><p class="footnote">${p.qty} bilet</p></div><span class="notch t"></span><span class="notch b"></span><div class="stub-side"><span class="pill neutral">${ic("check","i-sm",2.4)}Katıldın</span></div></div>`).join("")}</div>`;
  if(S.profileTab==="mine"){
    const mine=EVENTS.filter(e=>e.org===PEOPLE.organizer.org);
    return `<ul class="list no-icons">${mine.map(e=>{const sold=e.cap-e.left;const pct=Math.round(sold/e.cap*100);return `<li class="row" style="min-height:84px"><img src="${cover(e.cover||e.id)}" alt="" style="width:52px;height:64px;border-radius:10px;object-fit:cover"><div class="row-main"><p class="row-title">${esc(e.title)}</p><p class="row-sub">${shortDate(e)} · ${esc(e.venue)}</p><div style="display:flex;align-items:center;gap:10px;margin-top:8px"><div class="progress" style="width:220px"><span style="width:${pct}%"></span></div><span class="caption num">${sold.toLocaleString("tr-TR")} / ${e.cap.toLocaleString("tr-TR")} satıldı</span></div></div><span class="pill ok"><span class="dot"></span>Yayında</span><a class="btn btn-gray btn-sm" href="#etkinlik-${e.id}">Görüntüle</a></li>`}).join("")}</ul>
    <p class="section-foot"><a class="link" href="#olustur">Yeni etkinlik oluştur</a></p>`;
  }
  if(!S.tickets.length)return `<div class="empty">${ic("ticket")}<p class="headline">Henüz biletin yok</p><a class="btn btn-primary" href="#kesfet">Etkinliklere Göz At</a></div>`;
  return `<div class="stubs">${S.tickets.map((t,i)=>{const e=ev(t.eventId);return `<div class="stub"><div class="stub-art"><img src="${cover(e.cover||e.id)}" alt=""></div><div class="stub-main"><p class="headline">${esc(e.title)}</p><p class="subhead">${shortDate(e)}</p><p class="footnote">${esc(e.venue)}, ${esc(e.district)} · ${t.qty} × ${t.tier}</p></div><span class="notch t"></span><span class="notch b"></span><div class="stub-side"><button class="btn btn-tinted btn-sm" data-act="showPass" data-i="${i}">${ic("qr","i-sm",2)}Bileti Göster</button><span class="caption">${t.order}</span></div></div>`}).join("")}</div>`;
}
function tierRows(){
  return S.draft.tiers.map((t,i)=>`<div class="tier-edit">
    <div class="field"><label for="tn${i}">Bilet türü</label><input class="input" id="tn${i}" data-tier="${i}" data-f="name" value="${esc(t.name)}" placeholder="ör. Tam"></div>
    <div class="field"><label for="tp${i}">Fiyat (₺)</label><input class="input num" id="tp${i}" data-tier="${i}" data-f="price" inputmode="numeric" value="${esc(t.price)}" placeholder="0"></div>
    <div class="field"><label for="tc${i}">Kontenjan</label><input class="input num" id="tc${i}" data-tier="${i}" data-f="cap" inputmode="numeric" value="${esc(t.cap)}" placeholder="100"></div>
    <button type="button" class="icon-btn" data-act="rmTier" data-i="${i}" aria-label="${esc(t.name||"Bilet türü")} satırını sil" ${S.draft.tiers.length<2?"disabled style='opacity:.35'":""}>${ic("trash","i-sm")}</button></div>`).join("")+
    `<button type="button" class="btn btn-tinted" data-act="addTier" style="justify-self:start">${ic("plus","i-sm",2.2)}Bilet Türü Ekle</button>`;
}
function previewCard(){
  const f=S.draft;const prices=f.tiers.map(t=>+t.price).filter(n=>n>0);
  const e={id:0,cover:f.cover,title:f.title||"Etkinlik adı",cat:f.cat,venue:f.venue||"Mekân",district:f.district||"İlçe",date:f.date||"2026-12-20",time:f.time||"20:00",price:prices.length?Math.min(...prices):0,left:999};
  return card(e).replace('href="#etkinlik-0"','href="#olustur" tabindex="-1"');
}
function userRows(){
  let list=USERS.slice();const f=S.adminFilter;
  if(f==="Banlı")list=list.filter(u=>u.status==="banned");else if(f!=="Tümü")list=list.filter(u=>u.role===f);
  const q=S.adminQuery.trim().toLocaleLowerCase("tr-TR");if(q)list=list.filter(u=>(u.name+" "+u.email).toLocaleLowerCase("tr-TR").includes(q));
  if(!list.length)return `<tr><td colspan="6" style="text-align:center;padding:40px" class="subhead">Bu filtreyle eşleşen kullanıcı yok.</td></tr>`;
  return list.map(u=>`<tr>
    <td><div class="who">${avatar(u.name)}<div><div style="font-weight:600">${esc(u.name)}</div><div class="footnote">${esc(u.email)}</div></div></div></td>
    <td>${u.role==="Admin"?'<span class="pill accent">Admin</span>':u.role==="Organizatör"?'<span class="pill neutral">Organizatör</span>':'<span class="footnote" style="font-size:15px">Katılımcı</span>'}</td>
    <td class="num">${u.joined}</td><td class="num">${u.tickets}</td>
    <td>${u.status==="banned"?`<span class="pill bad">${ic("slash","i-sm",2.2)}Banlı · ${u.until}</span>`:`<span class="pill ok"><span class="dot"></span>Aktif</span>`}</td>
    <td style="text-align:right">${u.role==="Admin"?'<span class="footnote">—</span>':u.status==="banned"?`<button class="btn btn-gray btn-sm" data-act="unban" data-id="${u.id}">Banı Kaldır</button>`:`<button class="btn btn-ban btn-sm" data-act="ban" data-id="${u.id}">Banla</button>`}</td></tr>`).join("");
}

/* ---------------- sheets ---------------- */
function checkoutSheet(){
  const e=ev(S.eventId);const q=S.qty[e.id]||{};const T=tiers(e).filter(t=>q[t.id]);const total=T.reduce((s,t)=>s+q[t.id]*t.price,0);
  return `<div class="sheet-head" data-drag><h2 class="title2">Siparişi onayla</h2><button class="icon-btn" data-act="close" aria-label="Kapat">${ic("x","i-sm",2.2)}</button></div>
    <div style="display:flex;gap:14px;align-items:center;margin-bottom:12px"><img src="${cover(e.cover||e.id)}" alt="" style="width:56px;height:70px;border-radius:12px;object-fit:cover"><div><p class="headline">${esc(e.title)}</p><p class="footnote">${shortDate(e)} · ${esc(e.venue)}</p></div></div>
    <div class="list no-icons" style="background:var(--fill);padding:4px 16px;border-radius:18px">
      ${T.map(t=>`<div class="line"><span>${q[t.id]} × ${t.name}</span><span>${tl(q[t.id]*t.price)}</span></div>`).join("")}
      <div class="line" style="border-top:1px solid var(--separator)"><span class="headline">Toplam</span><span class="headline">${tl(total)}</span></div>
    </div>
    <p class="section-head" style="margin:20px 4px 8px">Ödeme yöntemi</p>
    <div class="row" style="background:var(--fill);border-radius:18px"><span class="row-icon" style="background:#1C1C1E">${ic("card","i-sm",2)}</span><div class="row-main"><p class="row-title">Visa •••• 4417</p><p class="row-sub">Son kullanma 08/29</p></div><button class="btn btn-plain btn-sm" data-act="toast" data-v="Prototipte tek kayıtlı kart var.">Değiştir</button></div>
    <button class="btn btn-primary btn-large btn-block" style="margin-top:22px" data-act="pay">${tl(total)} Öde</button>
    <p class="caption" style="text-align:center;margin-top:10px">Ders projesi prototipi: gerçek ödeme alınmaz.</p>`;
}
function banSheet(){
  const u=USERS.find(x=>x.id===S.ban.target)||USERS[3];
  return `<div class="sheet-head" data-drag><h2 class="title2">Kullanıcıyı banla</h2><button class="icon-btn" data-act="close" aria-label="Kapat">${ic("x","i-sm",2.2)}</button></div>
    <div class="who" style="margin-bottom:20px">${avatar(u.name)}<div><div class="headline">${esc(u.name)}</div><div class="footnote">${esc(u.email)} · ${u.tickets} bilet</div></div></div>
    <div class="field" style="margin-bottom:16px"><span class="label">Süre</span><div class="seg seg-block" role="group" aria-label="Ban süresi">${[["7","7 Gün"],["30","30 Gün"],["perm","Kalıcı"]].map(([k,l])=>`<button type="button" data-act="bdur" data-v="${k}" aria-pressed="${S.ban.dur===k}">${l}</button>`).join("")}</div></div>
    <div class="field" style="margin-bottom:16px"><label for="bReason">Sebep</label><select class="input" id="bReason">${["Spam","Bilet karaborsası","Sahte hesap","Taciz veya kötü davranış","Diğer"].map(r=>`<option ${S.ban.reason===r?"selected":""}>${r}</option>`).join("")}</select></div>
    <div class="field"><label for="bNote">Not (isteğe bağlı)</label><textarea class="input" id="bNote" style="min-height:80px" placeholder="Diğer adminler için kısa açıklama"></textarea></div>
    <p class="footnote" style="display:flex;gap:8px;margin:16px 0 20px">${ic("info","i-sm")}<span>Banlanan kullanıcı giriş yapamaz ve bilet alamaz. Daha önce aldığı biletler geçerli kalır.</span></p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><button class="btn btn-gray btn-large" data-act="close">Vazgeç</button><button class="btn btn-destructive btn-large" data-act="confirmBan">Banla</button></div>`;
}
function passSheet(i){
  const t=S.tickets[i];const e=ev(t.eventId);
  return `<div class="sheet-head" data-drag><h2 class="title2">Biletin</h2><button class="icon-btn" data-act="close" aria-label="Kapat">${ic("x","i-sm",2.2)}</button></div>${pass(e,{qty:t.qty,tierText:t.qty+" × "+t.tier,order:t.order})}`;
}

let sheetEl=null,scrimEl=null;
function openSheet(html){
  closeSheet(true);
  const L=$("#layer");
  L.innerHTML=`<div class="overlay"><div class="scrim" data-act="close"></div><div class="sheet glass" role="dialog" aria-modal="true"><div class="grabber" data-drag aria-hidden="true"></div>${html}</div></div>`;
  sheetEl=$(".sheet",L);scrimEl=$(".scrim",L);
  document.body.classList.add("sheet-open");
  const sp=spring(.32,.86);
  if(REDUCED()){sheetEl.animate([{opacity:0},{opacity:1}],{duration:200});}
  else{sheetEl.animate([{transform:"translateY(105%)"},{transform:"translateY(0)"}],{duration:sp.duration,easing:sp.easing});}
  scrimEl.animate([{opacity:0},{opacity:1}],{duration:250,fill:"forwards"});
  bindDrag(sheetEl);
  setTimeout(()=>{const f=sheetEl&&sheetEl.querySelector("button:not([data-act=close]),select,input,textarea");f&&f.focus({preventScroll:true})},50);
}
function currentY(el){const m=new DOMMatrixReadOnly(getComputedStyle(el).transform);return m.m42}
function closeSheet(instant=false,velocity=0){
  if(!sheetEl)return;const el=sheetEl,sc=scrimEl;sheetEl=null;scrimEl=null;
  document.body.classList.remove("sheet-open");
  if(instant){$("#layer").innerHTML="";return}
  const from=currentY(el);const h=el.offsetHeight+40;
  const sp=spring(.3,1);
  const a=REDUCED()?el.animate([{opacity:1},{opacity:0}],{duration:160,fill:"forwards"}):el.animate([{transform:`translateY(${from}px)`},{transform:`translateY(${h}px)`}],{duration:Math.max(180,sp.duration*(velocity>1500?.6:1)),easing:sp.easing,fill:"forwards"});
  sc.animate([{opacity:getComputedStyle(sc).opacity},{opacity:0}],{duration:220,fill:"forwards"});
  a.onfinish=()=>{if(!sheetEl)$("#layer").innerHTML=""};
}
/* drag to dismiss: 1:1 tracking, rubber-band upward, velocity projection on release */
function bindDrag(el){
  let start=0,y=0,hist=[],dragging=false,id=null;
  const rubber=(o,dim,c=.55)=>(o*dim*c)/(dim+c*Math.abs(o));
  el.addEventListener("pointerdown",e=>{
    if(!e.target.closest("[data-drag]")||e.target.closest("button"))return;
    dragging=true;id=e.pointerId;el.setPointerCapture(id);el.getAnimations().forEach(a=>{const cy=currentY(el);a.cancel();el.style.transform=`translateY(${cy}px)`});
    start=e.clientY-currentY(el);hist=[{y:e.clientY,t:performance.now()}];
  });
  el.addEventListener("pointermove",e=>{
    if(!dragging)return;let dy=e.clientY-start;if(dy<0)dy=rubber(dy,el.offsetHeight);
    y=dy;el.style.transform=`translateY(${y}px)`;
    hist.push({y:e.clientY,t:performance.now()});if(hist.length>6)hist.shift();
    if(scrimEl)scrimEl.style.opacity=String(Math.max(0,1-y/el.offsetHeight));
  });
  const end=e=>{
    if(!dragging)return;dragging=false;
    const a=hist[0],b=hist[hist.length-1];const v=b.t>a.t?(b.y-a.y)/((b.t-a.t)/1000):0;
    const project=(v,dr=.998)=>(v/1000)*dr/(1-dr);
    const projected=y+project(v);
    if(projected>el.offsetHeight*.5||v>900){el.style.transform="";el.animate([],{});const keep=y;el.style.transform=`translateY(${keep}px)`;closeSheet(false,v)}
    else{const sp=spring(.32,.8);el.animate([{transform:`translateY(${y}px)`},{transform:"translateY(0)"}],{duration:sp.duration,easing:sp.easing});el.style.transform="";if(scrimEl)scrimEl.style.opacity="";}
  };
  el.addEventListener("pointerup",end);el.addEventListener("pointercancel",end);
}

let toastT=null;
function toast(msg,undo){
  document.querySelectorAll(".toast").forEach(t=>t.remove());
  const t=document.createElement("div");t.className="toast glass";t.setAttribute("role","status");
  t.innerHTML=`<span>${esc(msg)}</span>${undo?`<button class="btn btn-plain btn-sm" id="undoBtn">Geri Al</button>`:'<span style="width:8px"></span>'}`;
  document.body.appendChild(t);
  const sp=spring(.35,1);if(!REDUCED())t.animate([{transform:"translate(-50%,24px)",opacity:0},{transform:"translate(-50%,0)",opacity:1}],{duration:sp.duration,easing:sp.easing});
  if(undo)$("#undoBtn",t).onclick=()=>{undo();t.remove()};
  clearTimeout(toastT);toastT=setTimeout(()=>{t.animate([{opacity:1},{opacity:0}],{duration:200}).onfinish=()=>t.remove()},undo?5000:2800);
}


function isDark(){return S.theme==="dark"||(S.theme==="system"&&matchMedia("(prefers-color-scheme: dark)").matches)}
function themeBtn(glass){const dk=isDark();return `<button type="button" class="theme-btn${glass?" glass":""}" data-act="toggleTheme" aria-label="${dk?"Açık moda geç":"Koyu moda geç"}" title="${dk?"Açık mod":"Koyu mod"}">${ic(dk?"sun":"moon","",2)}</button>`}
function applyTheme(){const r=document.documentElement;if(S.theme==="system")r.removeAttribute("data-theme");else r.setAttribute("data-theme",S.theme)}
function setTheme(t){S.theme=t;try{localStorage.setItem("gise-theme",t)}catch(e){}
  const go=()=>{applyTheme();const y=scrollY;const keep=lastRoute;render();scrollTo(0,y);lastRoute=keep};
  if(document.startViewTransition&&!REDUCED())document.startViewTransition(go);else go();}
matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{if(S.theme==="system")render()});
/* ---------------- router ---------------- */
function route(){
  let h=location.hash.slice(1)||"giris";
  if(/^etkinlik-\d+$/.test(h)){S.eventId=+h.split("-")[1];return "etkinlik"}
  return SCREENS[h]?h:"giris";
}
let lastRoute=null;
function render(){
  const r=route();closeSheet(true);
  $("#app").innerHTML=SCREENS[r]();
  document.title=({giris:"Giriş",kayit:"Kayıt",kesfet:"Keşfet",etkinlik:(ev(S.eventId)||{}).title,onay:"Biletlerin hazır",profil:"Profil",ayarlar:"Hesap Ayarları",olustur:"Yeni Etkinlik",yonetim:"Kullanıcılar"}[r]||"Gişe")+" · Gişe";
  if(r!==lastRoute){window.scrollTo(0,0);const m=$("#app main");if(m){const sp=spring(.42,1);m.animate(REDUCED()?[{opacity:0},{opacity:1}]:[{opacity:0,transform:"translateY(10px)"},{opacity:1,transform:"none"}],{duration:REDUCED()?180:sp.duration,easing:REDUCED()?"ease":sp.easing})}}
  document.body.classList.toggle("is-auth",r==="giris"||r==="kayit");
  lastRoute=r;after(r);
}
function after(r){
  if(r==="giris"){$("#loginForm").onsubmit=e=>{e.preventDefault();const u=$("#lgUser").value.trim(),p=$("#lgPass").value;if(!u||!p){$("#lgErr").hidden=false;(u?$("#lgPass"):$("#lgUser")).focus();return}location.hash=S.role==="admin"?"yonetim":"kesfet"}}
  if(r==="kayit"){$("#regForm").onsubmit=e=>{e.preventDefault();const n=$("#rgName").value.trim(),u=$("#rgUser").value.trim(),m=$("#rgMail").value.trim(),p=$("#rgPass").value;const err=$("#rgErr");let msg="";
    if(!n||!u||!m||!p)msg="Bütün alanları doldur.";else if(!/^[\w.]{3,20}$/.test(u))msg="Kullanıcı adı 3–20 karakter olmalı; harf, rakam, nokta ve alt çizgi kullanabilirsin.";else if(!/^\S+@\S+\.\S+$/.test(m))msg="E-posta adresi geçerli görünmüyor; ad@ornek.com biçiminde gir.";else if(p.length<8)msg="Şifre en az 8 karakter olmalı.";else if(!$("#rgTerms").checked)msg="Devam etmek için koşulları kabul et.";
    if(msg){err.hidden=false;err.querySelector("span").textContent=msg;return}
    S.role=S.regType||"user";if(S.role==="user")PEOPLE.user={...PEOPLE.user,name:n,username:u,email:m};else PEOPLE.organizer={...PEOPLE.organizer,name:n,username:u,email:m};
    location.hash="kesfet";setTimeout(()=>toast("Hoş geldin, "+n.split(" ")[0]+"!"),300)}}
  if(r==="kesfet"){$("#q").oninput=e=>{S.query=e.target.value;$("#grid").innerHTML=gridHTML()};$("#sort").onchange=e=>{S.sort=e.target.value;$("#grid").innerHTML=gridHTML()}}
  if(r==="ayarlar")bindSettings();
  if(r==="olustur")bindCreate();
  if(r==="yonetim"){$("#aq").oninput=e=>{S.adminQuery=e.target.value;$("#ubody").innerHTML=userRows()}}
}
function bindSettings(){
  const me=PEOPLE[S.role];
  const nu=$("#nu"),nuBtn=$("#nuBtn"),nuMsg=$("#nuMsg");
  nu.oninput=()=>{const v=nu.value.trim();const ok=/^[\w.]{3,20}$/.test(v)&&v!==me.username;nuBtn.disabled=!ok;
    if(!v){nuMsg.style.color="var(--label-2)";nuMsg.textContent="3–20 karakter; harf, rakam, nokta ve alt çizgi."}
    else if(ok){nuMsg.style.color="var(--ok)";nuMsg.textContent="@"+v+" kullanılabilir."}
    else{nuMsg.style.color="var(--bad)";nuMsg.textContent=v===me.username?"Bu zaten senin kullanıcı adın.":"Yalnızca harf, rakam, nokta ve alt çizgi; 3–20 karakter."}};
  $("#fUser").onsubmit=e=>{e.preventDefault();const old=me.username;me.username=nu.value.trim();render();toast("Kullanıcı adın @"+me.username+" oldu.",()=>{me.username=old;render()})};
  $("#fMail").onsubmit=e=>{e.preventDefault();const m=$("#nm").value.trim(),p=$("#nmp").value;const msg=$("#nmMsg");
    if(!/^\S+@\S+\.\S+$/.test(m)){msg.style.color="var(--bad)";msg.textContent="E-posta geçerli görünmüyor; ad@ornek.com biçiminde gir.";$("#nm").focus();return}
    if(!p){msg.style.color="var(--bad)";msg.textContent="Değişikliği onaylamak için mevcut şifreni gir.";$("#nmp").focus();return}
    msg.style.color="var(--ok)";msg.textContent=m+" adresine doğrulama bağlantısı gönderildi.";$("#nm").value="";$("#nmp").value=""};
  const np=$("#np"),np2=$("#np2");
  const check=()=>{const v=np.value;const r={len:v.length>=8,up:/[A-ZÇĞİÖŞÜ]/.test(v),num:/\d/.test(v),match:v.length>0&&v===np2.value};
    document.querySelectorAll("#rules li").forEach(li=>li.classList.toggle("on",r[li.dataset.r]));
    $("#meter").dataset.s=String(!v?0:[r.len,r.up,r.num,v.length>=12].filter(Boolean).length||1);return r};
  np.oninput=check;np2.oninput=check;
  $("#fPass").onsubmit=e=>{e.preventDefault();const r=check();const m=$("#npMsg");m.hidden=false;
    if(!$("#op").value){m.className="msg err";m.textContent="Mevcut şifreni gir.";$("#op").focus();return}
    if(!(r.len&&r.up&&r.num)){m.className="msg err";m.textContent="Yeni şifre kuralların hepsini karşılamalı.";np.focus();return}
    if(!r.match){m.className="msg err";m.textContent="Yeni şifreler aynı değil.";np2.focus();return}
    m.className="msg okm";m.textContent="Şifren güncellendi.";["#op","#np","#np2"].forEach(s=>$(s).value="");check()};
}
function bindCreate(){
  const upd=()=>{$("#pv").innerHTML=previewCard()};
  document.querySelectorAll("#cf [data-k]").forEach(inp=>inp.addEventListener("input",()=>{S.draft[inp.dataset.k]=inp.value;upd()}));
  $("#tierBox").addEventListener("input",e=>{const t=e.target.closest("[data-tier]");if(!t)return;let v=t.value;if(t.dataset.f!=="name"){v=v.replace(/\D/g,"");t.value=v}S.draft.tiers[+t.dataset.tier][t.dataset.f]=v;upd()});
  $("#cUp").onchange=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{COVERS.custom=rd.result;S.draft.cover="custom";render()};rd.readAsDataURL(f)};
}

/* ---------------- actions ---------------- */
document.addEventListener("click",e=>{
  const a=e.target.closest("[data-act]");if(!a)return;const act=a.dataset.act,v=a.dataset.v;
  if(a.tagName==="INPUT")return;
  switch(act){
    case "role":S.role=v;render();break;
    case "theme":setTheme(v);break;
    case "toggleTheme":setTheme(isDark()?"light":"dark");break;
    case "regType":S.regType=v;document.querySelectorAll('[data-act="regType"]').forEach(b=>b.setAttribute("aria-pressed",b.dataset.v===v));break;
    case "cat":S.filter=v;document.querySelectorAll('[data-act="cat"]').forEach(b=>b.setAttribute("aria-pressed",b.dataset.v===v));$("#grid").innerHTML=gridHTML();break;
    case "clear":S.filter="Tümü";S.query="";render();break;
    case "qty":{const e2=ev(S.eventId);const q=S.qty[e2.id]=S.qty[e2.id]||{};q[a.dataset.t]=Math.max(0,(q[a.dataset.t]||0)+ +a.dataset.d);const y=window.scrollY;render();window.scrollTo(0,y);break}
    case "checkout":if(!S.loggedIn){S.next="etkinlik-"+S.eventId;S.pendingToast="Bilet almak için giriş yap.";go("giris");break}openSheet(checkoutSheet());break;
    case "pay":{const e2=ev(S.eventId);const q=S.qty[e2.id];const T=tiers(e2).filter(t=>q[t.id]);const total=T.reduce((s,t)=>s+q[t.id]*t.price,0);const qty=T.reduce((s,t)=>s+q[t.id],0);
      const order="GS-"+(48200+Math.floor(Math.random()*90));
      T.forEach(t=>S.tickets.unshift({eventId:e2.id,tier:t.name,qty:q[t.id],order,total:q[t.id]*t.price}));
      S.last={eventId:e2.id,qty,tierText:T.map(t=>q[t.id]+" × "+t.name).join(", "),order,total};S.qty[e2.id]={};go("onay");break}
    case "close":closeSheet();break;
    case "ptab":S.profileTab=v;render();break;
    case "notif":S.notif=a.checked;break;
    case "logout":S.loggedIn=false;S.chatOpen=false;S.chat=[];S.pendingToast="Çıkış yaptın.";go("kesfet");break;
    case "showPass":openSheet(passSheet(+a.dataset.i));break;
    case "toast":toast(v);break;
    case "cover":S.draft.cover=+v;document.querySelectorAll('[data-act="cover"]').forEach(b=>b.setAttribute("aria-pressed",b.dataset.v===v));$("#pv").innerHTML=previewCard();break;
    case "addTier":S.draft.tiers.push({name:"",price:"",cap:""});$("#tierBox").innerHTML=tierRows();break;
    case "rmTier":S.draft.tiers.splice(+a.dataset.i,1);$("#tierBox").innerHTML=tierRows();$("#pv").innerHTML=previewCard();break;
    case "draft":toast("Taslak kaydedildi. Yayınlayana kadar yalnızca sen görürsün.");break;
    case "publish":{const f=S.draft;const err=$("#cErr");let m="";const okT=f.tiers.filter(t=>t.name&&+t.price>0&&+t.cap>0);
      if(!f.title.trim())m="Etkinlik adını gir.";else if(!f.date)m="Tarih seç.";else if(!f.venue.trim())m="Mekânı gir.";else if(!okT.length)m="En az bir bilet türü için ad, fiyat ve kontenjan gir.";
      if(m){err.hidden=false;err.querySelector("span").textContent=m;err.scrollIntoView({block:"center",behavior:REDUCED()?"auto":"smooth"});return}
      const id=Math.max(...EVENTS.map(x=>x.id))+1;const minP=Math.min(...okT.map(t=>+t.price));const cap=okT.reduce((s,t)=>s+ +t.cap,0);
      EVENTS.push({id,cover:f.cover,title:f.title.trim(),cat:f.cat,venue:f.venue.trim(),district:f.district.trim()||"İstanbul",date:f.date,time:f.time||"20:00",doors:f.time||"20:00",price:minP,left:cap,cap,org:PEOPLE.organizer.org,age:$("#cAge").value,desc:f.desc.trim()||"Açıklama yakında."});
      S.draft={title:"",cat:"Konser",date:"",time:"20:00",venue:"",district:"",desc:"",cover:1,tiers:[{name:"Tam",price:"",cap:""}]};
      S.pendingToast="Yayınlandı. Etkinliğin Keşfet'te görünüyor.";go("etkinlik-"+id);break}
    case "afilter":S.adminFilter=v;document.querySelectorAll('[data-act="afilter"]').forEach(b=>b.setAttribute("aria-pressed",b.dataset.v===v));$("#ubody").innerHTML=userRows();break;
    case "ban":S.ban.target=+a.dataset.id;S.ban.dur="7";openSheet(banSheet());break;
    case "bdur":S.ban.dur=v;document.querySelectorAll('[data-act="bdur"]').forEach(b=>b.setAttribute("aria-pressed",b.dataset.v===v));break;
    case "confirmBan":{const u=USERS.find(x=>x.id===S.ban.target);const days={"7":7,"30":30}[S.ban.dur];
      let until="Kalıcı";if(days){const t=new Date(2026,9,30+days);until=String(t.getDate()).padStart(2,"0")+"."+String(t.getMonth()+1).padStart(2,"0")+"."+t.getFullYear()}
      u.status="banned";u.until=until;u.reason=$("#bReason").value;closeSheet();$("#ubody").innerHTML=userRows();$("#bannedCount").textContent=USERS.filter(x=>x.status==="banned").length+10;
      toast(u.name+" banlandı.",()=>{u.status="active";$("#ubody").innerHTML=userRows();$("#bannedCount").textContent=USERS.filter(x=>x.status==="banned").length+10});break}
    case "unban":{const u=USERS.find(x=>x.id===+a.dataset.id);const prev={until:u.until};u.status="active";$("#ubody").innerHTML=userRows();$("#bannedCount").textContent=USERS.filter(x=>x.status==="banned").length+10;
      toast(u.name+" için ban kaldırıldı.",()=>{u.status="banned";u.until=prev.until;$("#ubody").innerHTML=userRows();$("#bannedCount").textContent=USERS.filter(x=>x.status==="banned").length+10});break}
  }
});
document.addEventListener("change",e=>{if(e.target.dataset&&e.target.dataset.act==="notif"){S.notif=e.target.checked;toast(S.notif?"Etkinlikten bir gün önce hatırlatacağız.":"Hatırlatmalar kapatıldı.")}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&sheetEl)closeSheet()});
addEventListener("hashchange",render);




/* ================= multi-page layer ================= */
const PAGES={giris:"giris.html",kayit:"kayit.html",kesfet:"index.html",onay:"bilet.html",profil:"profil.html",ayarlar:"ayarlar.html",olustur:"olustur.html",yonetim:"yonetim.html"};
function link(h){if(/^etkinlik-\d+$/.test(h))return "etkinlik.html#"+h;return PAGES[h]||("#"+h)}
function go(h){save();location.href=link(h)}
function fixLinks(root){(root||document).querySelectorAll('a[href^="#"]').forEach(a=>{const h=a.getAttribute("href").slice(1);if(PAGES[h]||/^etkinlik-\d+$/.test(h))a.setAttribute("href",link(h))})}
new MutationObserver(ms=>{for(const m of ms)m.addedNodes.forEach(n=>{if(n.nodeType===1)fixLinks(n.parentNode||n)})}).observe(document.documentElement,{childList:true,subtree:true});

/* persistence */
const KEY="gise-state-v1";
function save(){
  try{
    const users=USERS.map(u=>({id:u.id,status:u.status,until:u.until,reason:u.reason}));
    const data={S:{role:S.role,loggedIn:S.loggedIn,tickets:S.tickets,past:S.past,qty:S.qty,last:S.last,notif:S.notif,draft:S.draft,chat:S.chat.slice(-40),chatOpen:S.chatOpen,chatCtx:S.chatCtx,next:S.next,pendingToast:S.pendingToast,autoCheckout:S.autoCheckout,regType:S.regType,filter:S.filter,sort:S.sort},
      events:EVENTS.filter(e=>e.id>12),users,people:PEOPLE};
    if(COVERS.custom&&COVERS.custom.length<1500000)data.customCover=COVERS.custom;
    localStorage.setItem(KEY,JSON.stringify(data));
  }catch(e){}
}
function load(){
  try{
    const d=JSON.parse(localStorage.getItem(KEY)||"null");if(!d)return;
    Object.assign(S,d.S||{});
    (d.events||[]).forEach(e=>{if(!EVENTS.find(x=>x.id===e.id))EVENTS.push(e)});
    (d.users||[]).forEach(u=>{const x=USERS.find(y=>y.id===u.id);if(x)Object.assign(x,u)});
    if(d.people)Object.keys(d.people).forEach(k=>Object.assign(PEOPLE[k],d.people[k]));
    if(d.customCover)COVERS.custom=d.customCover;
  }catch(e){}
}
document.addEventListener("click",()=>setTimeout(save,0),true);
document.addEventListener("change",()=>setTimeout(save,0),true);
addEventListener("pagehide",save);

/* shell overrides */
function nav(active){
  const me=PEOPLE[S.role];
  const tabs=[["kesfet","Keşfet","compass"]];
  if(S.loggedIn){tabs.push(["profil","Profil","person"]);if(S.role==="organizer")tabs.push(["olustur","Oluştur","plusSq"]);if(S.role==="admin")tabs.push(["yonetim","Yönetim","shield"]);}
  const right=S.loggedIn
    ?`<a href="#profil" class="avatar avatar-btn" style="background:${avatarBg(me.name)}" aria-label="Profil: ${esc(me.name)}">${initials(me.name)}</a>`
    :`<a class="btn btn-gray btn-sm" href="#kayit">Hesap Oluştur</a><a class="btn btn-primary btn-sm" href="#giris">Giriş Yap</a>`;
  return `<header class="nav glass">
    <a class="brand" href="#kesfet" aria-label="Gişe, Keşfet'e git">${logo(30)}<span>Gişe</span></a>
    <nav class="tabs" aria-label="Ana gezinme">${tabs.map(([h,l,i])=>`<a class="tab" href="#${h}" ${active===h?'aria-current="page"':""}>${ic(i,"i-sm",active===h?2.2:1.9)}${l}</a>`).join("")}</nav>
    <div class="nav-right">${themeBtn()}${right}</div>
  </header>`;
}
function footer(){return `<footer class="footer"><p class="footnote">Gişe · SOFT3111 Internet and Web Programming · Grup 13</p><p class="footnote">Prototip, gerçek ödeme alınmaz. <button class="link" data-act="reset">Demo verisini sıfırla</button></p></footer>`}
SCREENS.yetki=function(){
  const msg=S._denied||"Bu sayfaya erişimin yok.";
  return `${nav("")}<main class="page page-narrow"><div class="empty" style="padding:96px 16px">${ic("lock")}<h1 class="title2">Erişim yok</h1><p class="subhead">${esc(msg)}</p><a class="btn btn-primary" href="#kesfet">Keşfet'e Dön</a></div></main>${footer()}`;
};

function route(){
  const p=document.body.dataset.page||"kesfet";
  if(p==="etkinlik"){const m=location.hash.match(/etkinlik-(\d+)/);S.eventId=m?+m[1]:(S.eventId||1);if(!ev(S.eventId))S.eventId=1;}
  return p;
}
function render(){
  let r=route();closeSheet(true);
  const NEED=["onay","profil","ayarlar","olustur","yonetim"];
  if(NEED.includes(r)&&!S.loggedIn){S.next=r;S.pendingToast="Devam etmek için giriş yap.";go("giris");return;}
  if(r==="olustur"&&S.role!=="organizer"){S._denied="Etkinlik oluşturmak için organizatör hesabıyla giriş yapman gerekiyor.";r="yetki";}
  if(r==="yonetim"&&S.role!=="admin"){S._denied="Kullanıcı yönetimi yalnızca admin hesaplarına açık.";r="yetki";}
  if(r==="onay"&&!S.last){go("profil");return;}
  $("#app").innerHTML=SCREENS[r]();fixLinks($("#app"));
  const e=ev(S.eventId)||{};
  document.title=({giris:"Giriş",kayit:"Kayıt",kesfet:"Keşfet",etkinlik:e.title,onay:"Biletlerin hazır",profil:"Profil",ayarlar:"Hesap Ayarları",olustur:"Yeni Etkinlik",yonetim:"Kullanıcılar",yetki:"Erişim yok"}[r]||"Gişe")+" · Gişe";
  if(r!==lastRoute){const m=$("#app main");if(m){const sp=spring(.42,1);m.animate(REDUCED()?[{opacity:0},{opacity:1}]:[{opacity:0,transform:"translateY(10px)"},{opacity:1,transform:"none"}],{duration:REDUCED()?180:sp.duration,easing:REDUCED()?"ease":sp.easing})}}
  document.body.classList.toggle("is-auth",r==="giris"||r==="kayit");
  lastRoute=r;after(r);renderAI();
  if(r==="etkinlik"&&S.autoCheckout){S.autoCheckout=false;if(S.loggedIn)setTimeout(()=>openSheet(checkoutSheet()),250);}
}
function after(r){
  if(r==="giris"){$("#loginForm").onsubmit=e=>{e.preventDefault();const u=$("#lgUser").value.trim(),p=$("#lgPass").value;if(!u||!p){$("#lgErr").hidden=false;(u?$("#lgPass"):$("#lgUser")).focus();return}
    S.loggedIn=true;const nx=S.next;S.next=null;S.pendingToast="Hoş geldin, "+PEOPLE[S.role].name.split(" ")[0]+"!";go(nx||(S.role==="admin"?"yonetim":"kesfet"))}}
  if(r==="kayit"){$("#regForm").onsubmit=e=>{e.preventDefault();const n=$("#rgName").value.trim(),u=$("#rgUser").value.trim(),m=$("#rgMail").value.trim(),p=$("#rgPass").value;const err=$("#rgErr");let msg="";
    if(!n||!u||!m||!p)msg="Bütün alanları doldur.";else if(!/^[\w.]{3,20}$/.test(u))msg="Kullanıcı adı 3–20 karakter olmalı; harf, rakam, nokta ve alt çizgi kullanabilirsin.";else if(!/^\S+@\S+\.\S+$/.test(m))msg="E-posta adresi geçerli görünmüyor; ad@ornek.com biçiminde gir.";else if(p.length<8)msg="Şifre en az 8 karakter olmalı.";else if(!$("#rgTerms").checked)msg="Devam etmek için koşulları kabul et.";
    if(msg){err.hidden=false;err.querySelector("span").textContent=msg;return}
    S.role=S.regType||"user";Object.assign(PEOPLE[S.role],{name:n,username:u,email:m,since:"Kasım 2026"});
    S.loggedIn=true;S.pendingToast="Hesabın oluşturuldu. Hoş geldin, "+n.split(" ")[0]+"!";const nx=S.next;S.next=null;go(nx||"kesfet")}}
  if(r==="kesfet"){$("#q").oninput=e=>{S.query=e.target.value;$("#grid").innerHTML=gridHTML()};$("#sort").onchange=e=>{S.sort=e.target.value;$("#grid").innerHTML=gridHTML()}}
  if(r==="ayarlar")bindSettings();
  if(r==="olustur")bindCreate();
  if(r==="yonetim"){$("#aq").oninput=e=>{S.adminQuery=e.target.value;$("#ubody").innerHTML=userRows()}}
}

/* ================= Gişe Asistan (demo) ================= */
const DIST={"KüçükÇiftlik Park":8,"Salon İKSV":11,"Maximum Uniq Hall":1,"Moda Sahnesi":22,"Haliç Kongre Merkezi":13,"Kadıköy Rıhtım":20,"Zorlu PSM":6,"Sinan Erdem Spor Salonu":26,"Bostancı Gösteri Merkezi":27,"Maslak Bilim Merkezi":1,"Galata Rıhtımı":13,"Cemal Reşit Rey":12};
const distOf=e=>DIST[e.venue]??15;
Object.assign(P,{arrowUp:'<path d="M12 19V5M6 11l6-6 6 6"/>',mic:'<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/>',globe:'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.6 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.6-3.5-8.5s1-5.9 3.5-8.5z"/>',newchat:'<path d="M13 4.5H7.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3V11"/><path d="M17.5 3.5l3 3-7.5 7.5H10v-3z"/>'});
const TRW=new Set("ve bir var mı mi mu mü en hangi hangileri yakın yakınımdaki yakındaki bilet bileti konser konserler bu hafta sonu ucuz öğrenci için ne nerede alalım al alayım olsun tiyatro komedi çocuk aile ay kasım aralık merhaba selam göster istiyorum lazım kaçta saat kapı tam olanı olan şu o cumartesi pazar yarın bugün etkinlik etkinlikler fiyat kaç yok gibi mi?".split(" "));
const ENW=new Set("the any is are what where near nearest nearby me show shows concert concerts ticket tickets cheap cheapest student this weekend week month jazz comedy for in i i'm im want find buy hello hi please with under one the a an of to do does bring id when time door doors how much price get book".split(" "));
function detectLang(text){
  const t=text.toLocaleLowerCase("tr-TR");const toks=t.split(/[^a-zçğıöşü0-9']+/).filter(Boolean);
  let tr=(t.match(/[çğışöü]/g)||[]).length*1.5, en=0;
  toks.forEach(k=>{if(TRW.has(k))tr++;if(ENW.has(k))en++;});
  return en>tr?"en":"tr";
}
function aiTokens(text){const t=text.toLocaleLowerCase("tr-TR");return {t,toks:t.split(/[^a-zçğıöşü0-9₺]+/).filter(Boolean)}}
function hasW({t,toks},...ws){return ws.some(w=>w.includes(" ")?t.includes(w):toks.some(k=>k===w||(w.length>=4&&k.startsWith(w))))}
const day0=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x};
const addD=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const enDate=e=>d(e).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})+" · "+e.time;
const enLong=e=>d(e).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"});
const ogrPrice=e=>round(e.price*.65,10);
const CATW=[["Konser",["konser","concert","müzik","music","gig","canlı"]],["Klasik",["klasik","classical","senfoni","symphon","orkestra","orchestra","opera","gala"]],["Tiyatro",["tiyatro","theat","play"]],["Komedi",["komedi","comedy","stand","standup","güldür","funny"]],["Festival",["festival","yemek","food","lezzet"]],["Spor",["spor","sport","basket","maç","match"]],["Atölye",["atölye","workshop","fotoğraf","photo","kurs"]],["Konferans",["konferans","conference","zirve","summit","yapay","teknoloji","tech"]],["Aile",["aile","family","çocuk","kid","child","bilim","science"]]];
const TITLEW=[["Caz",["caz","jazz"]],["Elektronik",["elektronik","electronic","dj","techno","tekno"]],["Akustik",["akustik","acoustic","rock","indie"]],["Film",["film","movie","sinema","cinema"]],["Hamlet",["hamlet","shakespeare"]],["Derbi",["derbi","derby"]],["Uzay",["uzay","space","roket","rocket"]],["Yılbaşı",["yılbaşı","new year"]]];
function resolveEvent(q,ctx){
  const ids=ctx.lastIds||[];
  const ord=[["ilk","first","birinci","ilki"],["ikinci","second","ikincisi"],["üçüncü","third","üçüncüsü"]].findIndex(ws=>hasW(q,...ws));
  if(ord>=0&&ids[ord])return ev(ids[ord]);
  let cand=[];
  TITLEW.forEach(([k,ws])=>{if(hasW(q,...ws))cand.push(...EVENTS.filter(e=>e.title.includes(k)))});
  if(!cand.length){
    const stop=new Set(["konser","etkinlik","bilet","gecesi","gece","için","olan","olanı","event","show","ticket","tickets"]);
    EVENTS.forEach(e=>{const words=e.title.toLocaleLowerCase("tr-TR").split(/[^a-zçğıöşü]+/).filter(w=>w.length>=4&&!stop.has(w));if(words.some(w=>q.toks.some(k=>k.length>=4&&(k.startsWith(w.slice(0,5))||w.startsWith(k.slice(0,5))))))cand.push(e)});
  }
  cand=[...new Set(cand)];
  if(cand.length>1&&ids.length){const inCtx=cand.filter(e=>ids.includes(e.id));if(inCtx.length)cand=inCtx;}
  if(cand.length)return cand.sort((a,b)=>d(a)-d(b))[0];
  if(ids.length===1)return ev(ids[0]);
  return null;
}
function aiReply(text){
  const lang=detectLang(text),tr=lang==="tr",q=aiTokens(text),ctx=S.chatCtx||(S.chatCtx={lastIds:[]});
  const now=day0(new Date());
  const greet=q.toks.length<=3&&hasW(q,"merhaba","selam","hello","hi","hey","günaydın");
  const buy=hasW(q,"al","alalım","alayım","alırım","satın","buy","book","reserve","rezerv")||/\d+\s*(tam|öğrenci|bilet|ticket|student|kişi|person|seat)/.test(q.t);
  const infoQ=hasW(q,"kaçta","saat","kapı","kapılar","when","time","door","doors","nerede","where","fiyat","price","kaç","how much","cumartesi","pazar","tarih","date","yaş","age","kimlik","id","bring","getir","detay","detail");
  const student=hasW(q,"öğrenci","student");
  if(greet)return {lang,html:tr?"Merhaba! Etkinlik bulmana yardım edebilirim. Kategori, tarih, bütçe ya da yakınlığa göre sorabilirsin.":"Hi! I can help you find events. Ask by category, date, budget or distance.",chips:tr?["Yakınımdaki konserler","Bu hafta sonu ne var?","200 TL altı etkinlikler"]:["Concerts near me","What's on this weekend?","Events under 300 TL"]};
  const one=(buy||infoQ)?resolveEvent(q,ctx):null;
  if(buy&&one){
    const n=Math.min(6,Math.max(1,+(q.t.match(/(\d+)/)||[0,1])[1]||1));
    const tier=student?"ogr":"tam";const T=tiers(one).find(x=>x.id===tier);
    if(!T.left){return {lang,html:tr?`<b>${esc(one.title)}</b> için ${T.name} biletler tükenmiş.`:`${tier==="ogr"?"Student":"Regular"} tickets for <b>${esc(one.title)}</b> are sold out.`,actions:[{label:tr?"Etkinliğe Git":"View Event",act:"aiGo",v:one.id}]};}
    const qn=Math.min(n,T.left);S.qty[one.id]={[tier]:qn};ctx.lastIds=[one.id];
    const tn=tr?(tier==="ogr"?"Öğrenci":"Tam"):(tier==="ogr"?"Student":"Regular");
    return {lang,html:tr?`<b>${esc(one.title)}</b> için ${qn} × ${tn} bilet, toplam <b>${tl(qn*T.price)}</b>. Seçimi hazırladım; ödemeyi sen onaylarsın.`:`${qn} × ${tn} for <b>${esc(one.title)}</b>, total <b>${tl(qn*T.price)}</b>. I've prepared the selection; you confirm the payment.`,
      actions:[{label:tr?"Ödemeye Geç":"Go to Checkout",act:"aiCheckout",v:one.id,primary:true},{label:tr?"Etkinliğe Git":"View Event",act:"aiGo",v:one.id}]};
  }
  if(infoQ&&one&&!hasW(q,"hangi","which","list","listele","neler","what's on")){
    ctx.lastIds=[one.id];
    const sid=hasW(q,"kimlik","id","bring","getir");
    const html=tr?`<b>${esc(one.title)}</b>: ${longDate(one)}, saat ${one.time} (kapılar ${one.doors}). ${esc(one.venue)}, ${esc(one.district)}. Tam ${tl(one.price)}, öğrenci ${tl(ogrPrice(one))}. Yaş sınırı: ${one.age}.${sid?" Öğrenci biletinde girişte öğrenci kimliği kontrol ediliyor.":""}`
      :`<b>${esc(one.title)}</b>: ${enLong(one)} at ${one.time} (doors ${one.doors}). ${esc(one.venue)}, ${esc(one.district)}. Regular ${tl(one.price)}, student ${tl(ogrPrice(one))}. Age: ${one.age==="Herkes"?"all ages":one.age}.${sid?" Yes, student IDs are checked at the door.":""}`;
    return {lang,html,actions:[{label:tr?"Bilet Al":"Get Tickets",act:"aiGo",v:one.id,primary:true}],chips:tr?["2 tam bilet al","Öğrenci bileti al"]:["Buy 2 tickets","Buy a student ticket"]};
  }
  // search
  let list=EVENTS.filter(e=>day0(d(e))>=now);const notes=[];
  const cats=CATW.filter(([c,ws])=>hasW(q,...ws)).map(([c])=>c);
  if(cats.includes("Konser")&&!cats.includes("Klasik"))cats.push("Klasik");
  const titleKeys=TITLEW.filter(([k,ws])=>hasW(q,...ws)).map(([k])=>k);
  if(cats.length||titleKeys.length){list=list.filter(e=>cats.includes(e.cat)||titleKeys.some(k=>e.title.includes(k)));notes.push(tr?"kategori":"category");}
  let range=null;
  if(hasW(q,"hafta sonu","haftasonu","weekend")){const dw=now.getDay();const sat=dw===0?addD(now,-1):addD(now,(6-dw+7)%7);range=[dw===0?now:sat,addD(sat,2)];}
  else if(hasW(q,"bugün","today","tonight","bu akşam"))range=[now,addD(now,1)];
  else if(hasW(q,"yarın","tomorrow"))range=[addD(now,1),addD(now,2)];
  else if(hasW(q,"gelecek hafta","next week","haftaya"))range=[addD(now,7),addD(now,14)];
  else if(hasW(q,"bu hafta","this week"))range=[now,addD(now,7)];
  else if(hasW(q,"bu ay","this month"))range=[now,new Date(now.getFullYear(),now.getMonth()+1,1)];
  else if(hasW(q,"kasım","november"))range=[new Date(2026,10,1),new Date(2026,11,1)];
  else if(hasW(q,"aralık","december"))range=[new Date(2026,11,1),new Date(2027,0,1)];
  let shifted=false;
  if(range){const base=list;list=list.filter(e=>{const x=d(e);return x>=range[0]&&x<range[1]});notes.push(tr?"tarih":"date");
    if(!list.length){list=base.filter(e=>d(e)>=range[1]);shifted=list.length>0;}}
  const pm=q.t.match(/(\d{2,5})\s*(tl|₺|lira)?/);let maxP=null;
  if(pm&&hasW(q,"altı","altında","alti","under","below","less","max","fazla","kadar","bütçe","budget"))maxP=+pm[1];
  const priceOf=e=>student?ogrPrice(e):e.price;
  if(maxP){list=list.filter(e=>priceOf(e)<=maxP);notes.push(tr?`en fazla ${tl(maxP)}`:`max ${tl(maxP)}`);}
  if(student)notes.push(tr?"öğrenci bileti":"student tickets");
  const near=hasW(q,"yakın","yakınımdaki","yakındaki","near","nearest","nearby","close","closest","civar");
  const cheap=hasW(q,"ucuz","ucuzları","cheap","cheapest","uygun","budget");
  if(near){list.sort((a,b)=>distOf(a)-distOf(b));notes.push(tr?"Konum: Maslak":"near Maslak");}
  else if(cheap)list.sort((a,b)=>priceOf(a)-priceOf(b));
  else list.sort((a,b)=>d(a)-d(b));
  const status=(tr?`${EVENTS.length} etkinlik tarandı`:`Searched ${EVENTS.length} events`)+(notes.length?" · "+notes.join(", "):"");
  if(!list.length){ctx.lastIds=[];return {lang,status,html:tr?"Bu kriterlere uyan etkinlik bulamadım. Tarihi genişletmeyi ya da başka bir kategori denemeyi öneririm.":"I couldn't find events matching that. Try a wider date range or another category.",chips:tr?["Bu ay ne var?","Yakınımdaki konserler"]:["What's on this month?","Concerts near me"]};}
  const generic=!notes.length&&!cheap;
  const ids=list.slice(0,3).map(e=>e.id);ctx.lastIds=ids;
  let html;
  if(generic)html=tr?"Tam anlayamadım ama yaklaşan etkinliklerden birkaçı şunlar. Kategori, tarih ya da bütçe söylersen daraltırım.":"Not sure I got that, but here are some upcoming events. Tell me a category, date or budget to narrow it down.";
  else if(shifted)html=tr?"Bu tarih aralığında uygun etkinlik yok. En yakın tarihli olanlar:":"Nothing in that date range. Here are the next ones:";
  else if(near)html=tr?`Maslak'a en yakın ${ids.length} etkinlik, yakından uzağa sıraladım:`:`The ${ids.length} closest to Maslak, nearest first:`;
  else if(cheap)html=tr?`En uygun fiyatlı ${ids.length} etkinlik:`:`The ${ids.length} most affordable:`;
  else html=tr?`${list.length} etkinlik buldum${list.length>3?", ilk 3'ü":""}:`:`Found ${list.length} event${list.length>1?"s":""}${list.length>3?", here are the top 3":""}:`;
  const turkishOnly=ids.map(ev).filter(e=>["Komedi","Tiyatro"].includes(e.cat));
  let after=null;
  if(!tr&&turkishOnly.length)after=`Heads-up: ${turkishOnly.map(e=>e.title).join(" and ")} ${turkishOnly.length>1?"are":"is"} performed in Turkish.`;
  return {lang,status,html,ids,near,student,after,chips:tr?["Öğrenci bileti olanlar","Bu hafta sonu","En ucuzları"]:["Student tickets only","This weekend","Cheapest first"]};
}
function optHTML(id,m){
  const e=ev(id);const tr=m.lang!=="en";const low=e.left>0&&e.left<=50;
  const meta2=`${esc(e.venue)}${m.near?` · ${distOf(e)} km`:""}`;
  const price=m.student?(tr?`Öğrenci ${tl(ogrPrice(e))}`:`Student ${tl(ogrPrice(e))}`):(tr?`${tl(e.price)}'den`:`from ${tl(e.price)}`);
  return `<a class="opt" href="#etkinlik-${e.id}"><img src="${cover(e.cover||e.id)}" alt=""><div class="opt-main"><p class="opt-title">${esc(e.title)}</p><p class="opt-meta">${tr?shortDate(e):enDate(e)}</p><p class="opt-meta">${meta2}</p></div><div class="opt-side"><span class="opt-price">${price}</span>${low?`<span class="pill warn">${tr?"Son":"Last"} ${e.left}</span>`:""}</div>${ic("chevR","chev i-sm",2.2)}</a>`;
}
function msgHTML(m){
  if(m.who==="me")return `<div class="bubble b-me">${esc(m.text)}</div>${m.note?`<div class="lang">${ic("globe","i-sm",1.8)}${m.note}</div>`:""}`;
  if(m.typing)return `<div class="bubble b-ai typing" aria-label="Asistan yazıyor"><span></span><span></span><span></span></div>`;
  let h="";
  if(m.status)h+=`<div class="ai-status">${ic("check","i-sm",2.4)}${esc(m.status)}</div>`;
  if(m.html)h+=`<div class="bubble b-ai">${m.html}</div>`;
  if(m.ids&&m.ids.length)h+=`<div class="opts">${m.ids.filter(ev).map(id=>optHTML(id,m)).join("")}</div>`;
  if(m.after)h+=`<div class="bubble b-ai">${esc(m.after)}</div>`;
  if(m.actions)h+=`<div class="ai-row">${m.actions.map(a=>`<button type="button" class="btn ${a.primary?"btn-primary":"btn-gray"} btn-sm" data-act="${a.act}" data-v="${a.v}">${esc(a.label)}</button>`).join("")}</div>`;
  if(m.chips)h+=`<div class="ai-row">${m.chips.map(c=>`<button type="button" class="sugg" data-act="aiChip" data-v="${esc(c)}">${esc(c)}</button>`).join("")}</div>`;
  return h;
}
function welcome(){return {who:"ai",lang:"tr",html:"Merhaba! Ben Gişe Asistan. Etkinlik bulmana yardım ederim; Türkçe ya da İngilizce yazabilirsin.",chips:["Yakınımdaki konserler","Bu hafta sonu ne var?","Comedy or jazz for students?"]}}
function renderAI(){
  let box=$("#ai-root");if(!box){box=document.createElement("div");box.id="ai-root";document.body.appendChild(box);}
  const auth=document.body.classList.contains("is-auth");
  if(auth){box.innerHTML="";return;}
  if(!S.chat||!S.chat.length)S.chat=[welcome()];
  if(!S.chatOpen){box.innerHTML=`<button type="button" class="ai-fab glass" data-act="aiOpen" aria-label="Gişe Asistan'ı aç"><span class="ai-mark">${ic("sparkle","",2)}</span>Asistan</button>`;return;}
  box.innerHTML=`<aside class="ai glass" aria-label="Gişe Asistan">
    <header class="ai-head"><div class="ai-id"><span class="ai-mark">${ic("sparkle","",2)}</span><div><p class="headline">Gişe Asistan</p><p class="caption">Türkçe ve İngilizce anlar</p></div><span class="pill accent">Beta</span></div>
      <div class="ai-actions"><button type="button" class="icon-btn" data-act="aiNew" aria-label="Yeni sohbet" title="Yeni sohbet">${ic("newchat","i-sm",1.9)}</button><button type="button" class="icon-btn" data-act="aiClose" aria-label="Asistanı kapat">${ic("x","i-sm",2.2)}</button></div></header>
    <div class="ai-body" id="aiBody" aria-live="polite">${S.chat.map(msgHTML).join("")}</div>
    <footer class="ai-foot"><form class="ai-input" id="aiForm"><label class="sr" for="aiIn">Asistana sor</label><input id="aiIn" autocomplete="off" placeholder="Etkinlik, sanatçı ya da mekân sor…"><button type="button" class="ai-mic" data-act="aiMic" aria-label="Sesle yaz">${ic("mic","i-sm",1.9)}</button><button type="submit" class="ai-send" aria-label="Gönder">${ic("arrowUp","i-sm",2.4)}</button></form>
      <p class="caption" style="text-align:center">Demo: yanıtlar uygulamadaki etkinlik verisinden kurallarla üretilir. Asıl projede bir LLM API kullanılacak.</p></footer></aside>`;
  const body=$("#aiBody");body.scrollTop=body.scrollHeight;
  $("#aiForm").onsubmit=e=>{e.preventDefault();const v=$("#aiIn").value.trim();if(v)aiSend(v)};
}
function aiSend(text){
  const lang=detectLang(text);
  S.chat.push({who:"me",text,note:lang==="en"?"English detected · replying in English":"Türkçe algılandı"});
  S.chat.push({who:"ai",typing:true});renderAI();$("#aiIn")&&$("#aiIn").focus();
  setTimeout(()=>{S.chat=S.chat.filter(m=>!m.typing);const r=aiReply(text);S.chat.push({who:"ai",...r});renderAI();save();const i=$("#aiIn");i&&i.focus();},REDUCED()?150:700);
}
function aiAction(act,v){
  switch(act){
    case "aiOpen":S.chatOpen=true;renderAI();{const a=$(".ai");if(a&&!REDUCED()){const sp=spring(.35,1);a.animate([{opacity:0,transform:"translateY(16px) scale(.98)",filter:"blur(6px)"},{opacity:1,transform:"none",filter:"blur(0)"}],{duration:sp.duration,easing:sp.easing})}}setTimeout(()=>$("#aiIn")&&$("#aiIn").focus(),60);return true;
    case "aiClose":S.chatOpen=false;renderAI();return true;
    case "aiNew":S.chat=[welcome()];S.chatCtx={lastIds:[]};renderAI();return true;
    case "aiChip":aiSend(v);return true;
    case "aiMic":toast("Sesli giriş prototipte yok; yazarak sorabilirsin.");return true;
    case "aiGo":go("etkinlik-"+v);return true;
    case "aiCheckout":S.eventId=+v;if(!S.loggedIn){S.next="etkinlik-"+v;S.autoCheckout=true;S.pendingToast="Ödemeye geçmek için giriş yap.";go("giris");return true;}S.autoCheckout=true;go("etkinlik-"+v);return true;
    case "reset":try{localStorage.removeItem(KEY)}catch(e){}location.href="index.html";return true;
  }
  return false;
}
document.addEventListener("click",e=>{const a=e.target.closest("[data-act]");if(!a)return;if(aiAction(a.dataset.act,a.dataset.v)){e.stopImmediatePropagation();}},true);

function boot(){
  load();applyTheme();render();
  if(S.pendingToast){const t=S.pendingToast;S.pendingToast=null;setTimeout(()=>toast(t),350);}
  save();
}

boot();
