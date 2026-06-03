import { useState, useEffect, useRef, useCallback } from "react";

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const fmt = (n) => n.toLocaleString();

const CONTRACT = "0x1a2b3c4d5e6f7890abcdef1234567890abcdef12";
const TOTAL_SUPPLY = 10_000;
const MINT_PRICE = 0.0488;
const MINTED_SO_FAR = 6_843;
const NETWORK = "Base";

// ─── Premium generative SVG art renderer ──────────────────────────────────────
function GenArt({ seed, rarity, size = 280, animated = false }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = size, H = size;
    canvas.width = W; canvas.height = H;

    // Deterministic random from seed
    let s = seed * 9301 + 49297;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const ri = (a, b) => Math.floor(rand() * (b - a + 1)) + a;
    const rf = (a, b) => rand() * (b - a) + a;

    const palettes = {
      Legendary: ["#FFD700","#FF8C00","#FF4500","#FFE066","#FFF4C2","#B8860B"],
      Mythic:    ["#FF6BFF","#DA00FF","#9B00E8","#FFB3FF","#E040FB","#CE93D8"],
      Epic:      ["#7B6BFF","#4A3AFF","#00BFFF","#B39DDB","#82B1FF","#40C4FF"],
      Rare:      ["#00CFFF","#00E5FF","#00BCD4","#80DEEA","#B2EBF2","#0097A7"],
      Uncommon:  ["#00E676","#69F0AE","#1DE9B6","#B9F6CA","#CCFF90","#00BFA5"],
    };

    const pal = palettes[rarity] || palettes.Rare;
    const bgDark = rarity === "Legendary" ? "#1a0a00" : rarity === "Mythic" ? "#0d0014" : rarity === "Epic" ? "#06001f" : "#001a20";

    // BG gradient
    const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.8);
    bg.addColorStop(0, bgDark + "ff");
    bg.addColorStop(1, "#050816ff");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Grid lines faint
    ctx.strokeStyle = pal[0] + "18";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < W; i += 20) {
      ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(W,i); ctx.stroke();
    }

    const layers = ri(4, 7);
    const style = ri(0, 3); // 0=orbital,1=fractal,2=crystal,3=wave

    if (style === 0) { // Orbital rings
      for (let l = 0; l < layers; l++) {
        const cx = W*rf(0.3,0.7), cy = H*rf(0.3,0.7);
        const r = rf(30, W*0.45);
        const col = pal[l % pal.length];
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI*2);
        ctx.strokeStyle = col + "90";
        ctx.lineWidth = rf(0.5, 3);
        ctx.stroke();
        // Orbiting dot
        const angle = rf(0, Math.PI*2);
        const dotX = cx + Math.cos(angle)*r, dotY = cy + Math.sin(angle)*r;
        const g2 = ctx.createRadialGradient(dotX,dotY,0,dotX,dotY,rf(4,12));
        g2.addColorStop(0, col+"ff"); g2.addColorStop(1, col+"00");
        ctx.fillStyle = g2;
        ctx.beginPath(); ctx.arc(dotX,dotY,rf(4,12),0,Math.PI*2); ctx.fill();
      }
      // Core glow
      const cg = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*0.25);
      cg.addColorStop(0, pal[0]+"cc"); cg.addColorStop(0.4, pal[1]+"44"); cg.addColorStop(1,"transparent");
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(W/2,H/2,W*0.25,0,Math.PI*2); ctx.fill();
    } else if (style === 1) { // Crystal lattice
      for (let l = 0; l < layers*3; l++) {
        const x1=rf(0,W),y1=rf(0,H),x2=rf(0,W),y2=rf(0,H),x3=rf(0,W),y3=rf(0,H);
        const col = pal[l % pal.length];
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.closePath();
        ctx.fillStyle = col + "18";
        ctx.strokeStyle = col + "60";
        ctx.lineWidth = 0.8; ctx.fill(); ctx.stroke();
      }
      // Bright nodes
      for (let n = 0; n < 12; n++) {
        const nx=rf(0,W),ny=rf(0,H);
        const ng = ctx.createRadialGradient(nx,ny,0,nx,ny,rf(3,10));
        const nc = pal[n%pal.length];
        ng.addColorStop(0,nc+"ff"); ng.addColorStop(1,nc+"00");
        ctx.fillStyle=ng; ctx.beginPath(); ctx.arc(nx,ny,rf(3,10),0,Math.PI*2); ctx.fill();
      }
    } else if (style === 2) { // Concentric waves
      for (let l = 0; l < 20; l++) {
        const r = (l/20)*W*0.6 + 10;
        const col = pal[l % pal.length];
        ctx.beginPath();
        for (let a = 0; a < Math.PI*2; a += 0.05) {
          const wobble = Math.sin(a * ri(3,8) + l) * rf(3,12);
          const px = W/2 + Math.cos(a)*(r+wobble), py = H/2 + Math.sin(a)*(r+wobble);
          if (a === 0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
        }
        ctx.closePath();
        ctx.strokeStyle = col + (l % 2 === 0 ? "70" : "30");
        ctx.lineWidth = rf(0.5,2); ctx.stroke();
      }
      const cg2 = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,40);
      cg2.addColorStop(0,pal[0]+"ff"); cg2.addColorStop(1,pal[0]+"00");
      ctx.fillStyle=cg2; ctx.beginPath(); ctx.arc(W/2,H/2,40,0,Math.PI*2); ctx.fill();
    } else { // Plasma field
      for (let l = 0; l < layers*2; l++) {
        const cx=rf(0,W), cy=rf(0,H), r=rf(20,W*0.4);
        const col = pal[l%pal.length];
        const g = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
        g.addColorStop(0,col+"55"); g.addColorStop(0.5,col+"22"); g.addColorStop(1,"transparent");
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
      }
      // Fine detail lines
      for (let l = 0; l < 30; l++) {
        ctx.beginPath();
        ctx.moveTo(rf(0,W), rf(0,H));
        ctx.bezierCurveTo(rf(0,W),rf(0,H),rf(0,W),rf(0,H),rf(0,W),rf(0,H));
        ctx.strokeStyle = pal[l%pal.length] + "40";
        ctx.lineWidth = rf(0.3,1.5); ctx.stroke();
      }
    }

    // Rarity watermark glow top-right
    ctx.font = `bold ${size*0.07}px Syne, sans-serif`;
    ctx.textAlign = "right";
    ctx.fillStyle = pal[0] + "60";
    ctx.fillText(rarity.toUpperCase(), W-10, 28);

    // Token # bottom left
    ctx.font = `bold ${size*0.055}px monospace`;
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillText(`#${String(seed).padStart(4,"0")}`, 10, H-10);

    // Scanline overlay
    for (let y = 0; y < H; y += 3) {
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.fillRect(0, y, W, 1);
    }
  }, [seed, rarity, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, borderRadius: 16, display: "block",
        filter: animated ? "drop-shadow(0 0 20px rgba(123,107,255,0.4))" : "none" }}
    />
  );
}

// ─── Animated hero art (larger, with pulse) ───────────────────────────────────
function HeroArt() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t+1), 4000); return () => clearInterval(id); }, []);
  const pieces = [
    { seed: 4291, rarity: "Legendary", top: "5%",  left: "50%",  size: 200, delay: "0s" },
    { seed: 77,   rarity: "Mythic",    top: "30%", left: "15%",  size: 160, delay: "1s" },
    { seed: 1337, rarity: "Epic",      top: "55%", left: "70%",  size: 170, delay: "2s" },
    { seed: 9999, rarity: "Legendary", top: "20%", left: "80%",  size: 145, delay: "0.5s" },
    { seed: 3141, rarity: "Rare",      top: "70%", left: "30%",  size: 140, delay: "1.5s" },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {pieces.map((p) => (
        <div key={p.seed} style={{
          position: "absolute", top: p.top, left: p.left, transform: "translate(-50%,-50%)",
          animation: `floatPiece 7s ease-in-out ${p.delay} infinite`,
          opacity: 0.85,
          borderRadius: 18, overflow: "hidden",
          boxShadow: p.rarity === "Legendary" ? "0 0 40px rgba(255,215,0,0.25)" : p.rarity === "Mythic" ? "0 0 40px rgba(255,107,255,0.25)" : "0 0 24px rgba(123,107,255,0.2)",
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          <GenArt seed={p.seed} rarity={p.rarity} size={p.size} />
        </div>
      ))}
    </div>
  );
}

// ─── Particle canvas ──────────────────────────────────────────────────────────
function ParticleCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; const ctx = canvas.getContext("2d"); let raf;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const pts = Array.from({ length: 100 }, () => ({
      x: Math.random()*canvas.width, y: Math.random()*canvas.height,
      r: Math.random()*1.2+0.2,
      vx: (Math.random()-0.5)*0.25, vy: (Math.random()-0.5)*0.25,
      color: ["#00CFFF","#7B6BFF","#FFD700","#FF6BFF"][Math.floor(Math.random()*4)],
      alpha: Math.random()*0.5+0.1,
    }));
    function draw() {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pts.forEach(p => {
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0||p.x>canvas.width) p.vx*=-1;
        if(p.y<0||p.y>canvas.height) p.vy*=-1;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=p.color+Math.round(p.alpha*255).toString(16).padStart(2,"0"); ctx.fill();
      });
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++) {
        const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, d=Math.sqrt(dx*dx+dy*dy);
        if(d<90) { ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y);
          ctx.strokeStyle=`rgba(123,107,255,${0.1*(1-d/90)})`; ctx.lineWidth=0.4; ctx.stroke(); }
      }
      raf=requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize",resize); };
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}} />;
}

function GlowBtn({ children, variant="primary", onClick, disabled, className="" }) {
  const base = "relative font-bold tracking-widest uppercase text-sm px-8 py-4 rounded-xl transition-all duration-300 cursor-pointer border overflow-hidden group select-none";
  const s = {
    primary: "bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-400/50 text-white hover:shadow-[0_0_50px_rgba(0,207,255,0.5)] hover:scale-105 active:scale-95",
    gold:    "bg-gradient-to-r from-yellow-400 to-amber-500 border-yellow-300/50 text-black hover:shadow-[0_0_50px_rgba(255,215,0,0.5)] hover:scale-105 active:scale-95",
    ghost:   "bg-transparent border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/10 hover:border-cyan-400 hover:shadow-[0_0_24px_rgba(0,207,255,0.2)] hover:scale-105 active:scale-95",
    purple:  "bg-gradient-to-r from-purple-600 to-violet-700 border-purple-400/50 text-white hover:shadow-[0_0_50px_rgba(123,107,255,0.5)] hover:scale-105 active:scale-95",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${s[variant]} ${disabled?"opacity-50 cursor-not-allowed":""} ${className}`}>
      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/5 transition-opacity duration-300 rounded-xl"/>
      {children}
    </button>
  );
}

function GlassCard({ children, className="", glow="" }) {
  const gm = { cyan:"hover:shadow-[0_8px_50px_rgba(0,207,255,0.12)]", purple:"hover:shadow-[0_8px_50px_rgba(123,107,255,0.12)]", gold:"hover:shadow-[0_8px_50px_rgba(255,215,0,0.12)]", "":"" };
  return <div className={`bg-white/[0.035] backdrop-blur-xl border border-white/[0.07] rounded-2xl transition-all duration-500 ${gm[glow]} ${className}`}>{children}</div>;
}

function MintProgress({ minted, total }) {
  const pct = (minted/total)*100;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-white/40 mb-2 uppercase tracking-widest">
        <span>{fmt(minted)} minted</span><span>{fmt(total-minted)} remain</span>
      </div>
      <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/[0.06]">
        <div className="h-full rounded-full relative overflow-hidden" style={{width:`${pct}%`,background:"linear-gradient(90deg,#00CFFF,#7B6BFF,#FF6BFF)"}}>
          <div className="absolute inset-0 animate-pulse bg-white/20"/>
        </div>
      </div>
      <div className="text-right mt-1 text-xs text-white/25">{pct.toFixed(1)}% claimed</div>
    </div>
  );
}

function Countdown() {
  const [t,setT] = useState({h:11,m:34,s:7});
  useEffect(()=>{
    const id=setInterval(()=>setT(prev=>{
      let{h,m,s}=prev; s--; if(s<0){s=59;m--;} if(m<0){m=59;h--;} if(h<0){h=23;m=59;s=59;}
      return{h,m,s};
    }),1000);
    return()=>clearInterval(id);
  },[]);
  const pad=n=>String(n).padStart(2,"0");
  return(
    <div className="flex gap-2 items-center">
      {[["H",t.h],["M",t.m],["S",t.s]].map(([l,v])=>(
        <div key={l} className="text-center">
          <div className="bg-black/50 border border-red-500/30 rounded-lg px-3 py-2 min-w-[52px]">
            <div className="text-2xl font-black text-red-400 tabular-nums">{pad(v)}</div>
          </div>
          <div className="text-[9px] uppercase tracking-widest text-white/30 mt-1">{l}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Trait breakdown data ─────────────────────────────────────────────────────
const TIERS = [
  {
    name: "Legendary",
    color: "#FFD700",
    bg: "from-yellow-900/40 to-amber-900/20",
    border: "border-yellow-500/40",
    supply: "1%",
    count: "~100",
    floorEst: "12–40 ETH",
    traits: ["Cosmic Aura background (animated)","Divine Crown headpiece","Ethereal Wings","Tri-color holographic eyes","Gold leaf texture skin","Custom particle trail"],
    description: "The apex of the collection. Each Legendary was individually refined by our art director — no two share the same composition. They carry the highest rarity weight in governance votes and yield triple staking rewards.",
    seed: 4291,
  },
  {
    name: "Mythic",
    color: "#FF6BFF",
    bg: "from-purple-900/40 to-pink-900/20",
    border: "border-purple-500/40",
    supply: "4%",
    count: "~400",
    floorEst: "4–12 ETH",
    traits: ["Nebula gradient background","Spectral mask overlay","Prismatic iris eyes","Void cloak","Encoded sigil chest","Levitation aura"],
    description: "Born from the collision of two artistic worlds — hyper-digital and archaic symbolism. Mythics are immediately identifiable by their spectral mask and encode hidden messages in their sigil chest piece.",
    seed: 77,
  },
  {
    name: "Epic",
    color: "#7B6BFF",
    bg: "from-indigo-900/40 to-violet-900/20",
    border: "border-indigo-500/40",
    supply: "15%",
    count: "~1,500",
    floorEst: "1–4 ETH",
    traits: ["Deep space background","Augmented reality visor","Neon circuit tattoos","Titanium exo-suit","Plasma core accessory","Dual-tone gradient skin"],
    description: "Where technological beauty meets fine art. Epic pieces are distinguished by their augmented reality visor — rendered across 6 unique AR overlay compositions — and neon circuit tattoos that pulse with the holder's on-chain activity.",
    seed: 1337,
  },
  {
    name: "Rare",
    color: "#00CFFF",
    bg: "from-cyan-900/40 to-blue-900/20",
    border: "border-cyan-500/40",
    supply: "30%",
    count: "~3,000",
    floorEst: "0.3–1 ETH",
    traits: ["Abstract wave background","Holographic eyes (2 variants)","Metallic skin tones","Urban streetwear","Crystal accessory","Gradient hair"],
    description: "The backbone of the collection. Rare pieces are the first tier to unlock staking rewards and governance participation. Their holographic eye trait comes in 2 variants exclusive to this tier.",
    seed: 2048,
  },
];

const FAQS = [
  { q: "What is the story behind Cipher Genesis?", a: "Cipher Genesis began in a private studio in 2021 when a team of fine artists and cryptographers asked one question: what if great art could govern itself? Three years of research, one private beta, and 18 months of art production later — here we are." },
  { q: "What blockchain and why Base?", a: "Base is Ethereum's most mature Layer 2 — near-zero gas fees, instant finality, and backed by Coinbase. We chose it so a collector in Lagos pays the same as one in London." },
  { q: "How many can I mint per wallet?", a: "Up to 20 during the public sale. Whitelist holders have 48-hour priority access before public opens." },
  { q: "Is the contract audited?", a: "Yes. CertiK and OpenZeppelin both completed audits. Contract is fully verified on BaseScan. Links in footer." },
  { q: "What do holders unlock?", a: "Revenue share, DAO governance, exclusive airdrops, IRL event access, and tier-based staking. Legendary holders additionally receive physical art prints from the original artist series." },
];

const ROADMAP = [
  { phase:"01", title:"Genesis Launch",      status:"done",    items:["10K NFT public mint","Holder DAO deployed","Discord & community launch","CertiK audit published"] },
  { phase:"02", title:"Community Growth",    status:"active",  items:["50K holder milestone","Staking platform live","Limited merch drop","Ambassador program"] },
  { phase:"03", title:"Holder Rewards",      status:"upcoming",items:["ETH revenue distributions","Token airdrop snapshot","Tier-locked benefit unlock","Partner collab drops"] },
  { phase:"04", title:"Ecosystem Expansion", status:"upcoming",items:["Metaverse gallery integration","Gaming utility layer","Cross-chain bridges","Institutional partnerships"] },
  { phase:"05", title:"Long-Term Vision",    status:"upcoming",items:["Physical gallery (NYC/London)","Foundation establishment","100+ brand partnerships","Annual global summits"] },
];

const TEAM = [
  { name:"Kairo Voss",    role:"Founder & Creative Director", avatar:"KV", color:"#00CFFF" },
  { name:"Selene Park",   role:"Lead Developer",              avatar:"SP", color:"#7B6BFF" },
  { name:"Daemon Cruz",   role:"Art Director",                avatar:"DC", color:"#FFD700" },
  { name:"Nova Williams", role:"Community Lead",              avatar:"NW", color:"#FF6BFF" },
];

const INIT_ACTIVITY = [
  { wallet:"0x3f...a2d1", qty:3, rarity:"Epic",      time:"12s ago" },
  { wallet:"0xb7...cc04", qty:1, rarity:"Legendary", time:"45s ago" },
  { wallet:"0x91...7f3e", qty:5, rarity:"Rare",       time:"1m ago"  },
  { wallet:"0x55...0b22", qty:2, rarity:"Mythic",    time:"2m ago"  },
  { wallet:"0xaa...e81f", qty:10,rarity:"Rare",      time:"3m ago"  },
];

// ─── Gallery NFTs ─────────────────────────────────────────────────────────────
const GALLERY = [
  {seed:4291,rarity:"Legendary"},{seed:77,  rarity:"Mythic"},
  {seed:1337,rarity:"Epic"},     {seed:2048,rarity:"Rare"},
  {seed:9999,rarity:"Legendary"},{seed:420, rarity:"Epic"},
  {seed:3141,rarity:"Rare"},     {seed:7777,rarity:"Mythic"},
];

export default function App() {
  const [walletConnected,setWalletConnected] = useState(false);
  const [walletAddress,  setWalletAddress]   = useState("");
  const [mintQty,        setMintQty]         = useState(1);
  const [mintState,      setMintState]       = useState("idle");
  const [notification,   setNotification]    = useState(null);
  const [minted,         setMinted]          = useState(MINTED_SO_FAR);
  const [openFaq,        setOpenFaq]         = useState(null);
  const [activeNav,      setActiveNav]       = useState("home");
  const [activity,       setActivity]        = useState(INIT_ACTIVITY);
  const [activeTier,     setActiveTier]      = useState(0);

  useEffect(()=>{
    const h=()=>{
      const ids=["home","story","gallery","traits","mint","roadmap","team","faq"];
      for(const id of ids){ const el=document.getElementById(id); if(el){ const r=el.getBoundingClientRect(); if(r.top<=120&&r.bottom>120){setActiveNav(id);break;} } }
    };
    window.addEventListener("scroll",h); return()=>window.removeEventListener("scroll",h);
  },[]);

  useEffect(()=>{
    const wallets=["0x3f...a2d1","0xb7...cc04","0x91...7f3e","0x55...0b22","0xaa...e81f","0xde...1234","0x78...feed","0xca...3f91"];
    const rarities=["Rare","Epic","Mythic","Legendary"];
    const id=setInterval(()=>{
      const w=wallets[Math.floor(Math.random()*wallets.length)];
      const q=Math.floor(Math.random()*5)+1;
      const r=rarities[Math.floor(Math.random()*rarities.length)];
      setActivity(f=>[{wallet:w,qty:q,rarity:r,time:"just now"},...f.slice(0,4)]);
      setMinted(m=>Math.min(m+q,TOTAL_SUPPLY));
    },6000);
    return()=>clearInterval(id);
  },[]);

  const notify = useCallback((msg,type="success")=>{ setNotification({msg,type}); setTimeout(()=>setNotification(null),4500); },[]);

  const connectWallet = async () => {
    if(typeof window.ethereum!=="undefined"){
      try{
        const accs=await window.ethereum.request({method:"eth_requestAccounts"});
        if(accs.length>0){ setWalletConnected(true); setWalletAddress(accs[0].slice(0,6)+"..."+accs[0].slice(-4)); notify("✅ Wallet connected on "+NETWORK); }
      }catch{ notify("❌ Connection rejected","error"); }
    } else {
      setWalletConnected(true); setWalletAddress("0xDemo...4291"); notify("✅ Demo wallet connected — explore freely");
    }
  };

  const handleMint = async () => {
    if(!walletConnected){ notify("Connect your wallet to mint","error"); return; }
    setMintState("loading");
    await new Promise(r=>setTimeout(r,2800));
    if(Math.random()>0.08){ setMintState("success"); setMinted(m=>m+mintQty); notify(`🎉 ${mintQty} Cipher Genesis NFT${mintQty>1?"s":""} minted!`); }
    else{ setMintState("error"); notify("❌ Transaction reverted. Please retry.","error"); }
    setTimeout(()=>setMintState("idle"),3200);
  };

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({behavior:"smooth"});

  const NAV = [
    {id:"home",l:"Home"},{id:"story",l:"Story"},{id:"gallery",l:"Gallery"},
    {id:"traits",l:"Traits"},{id:"mint",l:"Mint"},{id:"roadmap",l:"Roadmap"},
    {id:"team",l:"Team"},{id:"faq",l:"FAQ"},
  ];

  const rarityColor = {Legendary:"#FFD700",Mythic:"#FF6BFF",Epic:"#7B6BFF",Rare:"#00CFFF"};

  return (
    <div style={{background:"#050816",minHeight:"100vh",fontFamily:"'Syne','DM Sans',sans-serif",color:"white",overflowX:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#050816}::-webkit-scrollbar-thumb{background:#7B6BFF;border-radius:2px}
        @keyframes floatPiece{0%,100%{transform:translate(-50%,-50%) translateY(0)}50%{transform:translate(-50%,-50%) translateY(-18px)}}
        @keyframes glow{0%,100%{text-shadow:0 0 20px rgba(0,207,255,0.4)}50%{text-shadow:0 0 60px rgba(0,207,255,0.9),0 0 100px rgba(123,107,255,0.4)}}
        @keyframes slideIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        .animate-glow{animation:glow 3s ease-in-out infinite}
        .animate-slide-in{animation:slideIn .45s cubic-bezier(.22,1,.36,1) forwards}
        .animate-fade-up{animation:fadeUp .7s ease forwards}
        .text-gradient{background:linear-gradient(135deg,#00CFFF,#7B6BFF,#FF6BFF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .text-gold{background:linear-gradient(135deg,#FFD700,#FF8C00);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .text-pink{background:linear-gradient(135deg,#7B6BFF,#FF6BFF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .shimmer-text{background:linear-gradient(90deg,#FFD700,#FF8C00,#FFD700);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 3s linear infinite}
        .grid-bg{background-image:linear-gradient(rgba(123,107,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(123,107,255,0.04) 1px,transparent 1px);background-size:60px 60px}
        .prose-story{font-family:'DM Sans',sans-serif;font-size:1.05rem;line-height:1.85;color:rgba(255,255,255,0.62);font-weight:300}
        .prose-story em{font-style:italic;color:rgba(255,255,255,0.8)}
      `}</style>

      <ParticleCanvas />

      {/* Notification */}
      {notification&&(
        <div className={`fixed top-5 right-5 z-50 animate-slide-in px-6 py-4 rounded-2xl text-sm font-semibold backdrop-blur-xl border shadow-2xl max-w-xs ${notification.type==="error"?"bg-red-950/90 border-red-500/50 text-red-200":"bg-emerald-950/90 border-emerald-500/50 text-emerald-200"}`}>
          {notification.msg}
        </div>
      )}

      {/* Nav */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:40,background:"rgba(5,8,22,0.88)",backdropFilter:"blur(24px)",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={()=>scrollTo("home")}>
            <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#00CFFF,#7B6BFF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900}}>⬡</div>
            <span style={{fontFamily:"Syne",fontWeight:800,fontSize:"1.1rem",letterSpacing:"-0.02em"}}>CIPHER <span className="text-gradient">GENESIS</span></span>
          </div>
          <div className="hidden lg:flex gap-1">
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>scrollTo(n.id)} style={{
                padding:"6px 14px",borderRadius:8,fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.08em",
                textTransform:"uppercase",transition:"all .2s",cursor:"pointer",border:"none",
                background:activeNav===n.id?"rgba(0,207,255,0.1)":"transparent",
                color:activeNav===n.id?"#00CFFF":"rgba(255,255,255,0.45)"
              }}>{n.l}</button>
            ))}
          </div>
          <div className="flex gap-3 items-center">
            {walletConnected?(
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 14px",borderRadius:10,fontSize:"0.75rem",fontWeight:700,color:"#6ee7b7",background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.3)"}}>
                <div style={{width:6,height:6,borderRadius:999,background:"#6ee7b7",animation:"pulse 2s infinite"}}/>
                {walletAddress}
              </div>
            ):(
              <GlowBtn variant="primary" onClick={connectWallet}>Connect Wallet</GlowBtn>
            )}
          </div>
        </div>
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section id="home" className="relative min-h-screen flex flex-col items-center justify-center pt-28 pb-20 px-4 grid-bg overflow-hidden">
        <div style={{position:"absolute",top:"20%",left:"10%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,207,255,0.07),transparent)",filter:"blur(60px)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:"15%",right:"10%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(123,107,255,0.08),transparent)",filter:"blur(60px)",pointerEvents:"none"}}/>
        <HeroArt />
        <div style={{position:"relative",zIndex:10,textAlign:"center",maxWidth:720,margin:"0 auto"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"6px 18px",borderRadius:999,fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:32,background:"rgba(0,207,255,0.07)",border:"1px solid rgba(0,207,255,0.22)",color:"#00CFFF"}}>
            <div style={{width:6,height:6,borderRadius:999,background:"#00CFFF",animation:"pulse 2s infinite"}}/>
            Live on {NETWORK} · {fmt(minted)} of {fmt(TOTAL_SUPPLY)} Claimed
          </div>
          <h1 style={{fontFamily:"Syne",fontWeight:800,lineHeight:0.95,letterSpacing:"-0.04em",fontSize:"clamp(3.2rem,8vw,6.5rem)",marginBottom:28}}>
            <span style={{display:"block",color:"white"}}>10,000 PIECES.</span>
            <span style={{display:"block"}} className="text-gradient animate-glow">THREE YEARS.</span>
            <span style={{display:"block",color:"white"}}>ONE COLLECTION.</span>
          </h1>
          <p style={{fontFamily:"DM Sans",fontSize:"1.1rem",lineHeight:1.75,color:"rgba(255,255,255,0.5)",fontWeight:300,marginBottom:36,maxWidth:580,margin:"0 auto 36px"}}>
            A decade of fine art expertise meets on-chain permanence. <em style={{color:"rgba(255,255,255,0.75)",fontStyle:"italic"}}>Cipher Genesis</em> isn't a profile picture — it's a provenance-backed digital masterwork valued by collectors in 60+ countries.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-10">
            {[["Total Supply","10,000","#00CFFF"],["Mint Price","0.0488 ETH","#FFD700"],["Minted",fmt(minted),"#FF6BFF"],["Network","Base L2","#7B6BFF"]].map(([l,v,c])=>(
              <div key={l} style={{padding:"10px 20px",borderRadius:12,border:`1px solid ${c}30`,background:`${c}0d`,textAlign:"center",minWidth:120}}>
                <div style={{fontSize:"1.4rem",fontWeight:900,color:c,fontFamily:"Syne"}}>{v}</div>
                <div style={{fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"rgba(255,255,255,0.35)",marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{maxWidth:480,margin:"0 auto 32px"}}><MintProgress minted={minted} total={TOTAL_SUPPLY}/></div>
          <div className="flex flex-wrap gap-4 justify-center mb-10">
            <GlowBtn variant="gold" onClick={()=>scrollTo("mint")}>⚡ Mint Now</GlowBtn>
            <GlowBtn variant="ghost" onClick={()=>scrollTo("story")}>Read the Story</GlowBtn>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.12em",color:"rgba(255,255,255,0.25)",marginBottom:10}}>Current tier closes in</div>
            <Countdown/>
          </div>
        </div>
      </section>

      {/* ═══════ COMMUNITY BAR ═══════ */}
      <div style={{borderTop:"1px solid rgba(255,255,255,0.04)",borderBottom:"1px solid rgba(255,255,255,0.04)",background:"rgba(123,107,255,0.04)",padding:"28px 16px"}}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[["12.4K","Discord Members"],["8.2K","Twitter Followers"],["4.1K","Unique Holders"],["340 ETH","Total Volume"]].map(([v,l])=>(
            <div key={l}><div style={{fontSize:"2rem",fontWeight:900,fontFamily:"Syne"}} className="text-gradient">{v}</div><div style={{fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"rgba(255,255,255,0.35)",marginTop:4}}>{l}</div></div>
          ))}
        </div>
      </div>

      {/* ═══════ ORIGIN STORY ═══════ */}
      <section id="story" style={{padding:"96px 16px",position:"relative"}}>
        <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:"80%",height:1,background:"linear-gradient(90deg,transparent,rgba(0,207,255,0.15),transparent)"}}/>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:64}}>
            <div style={{fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.15em",color:"#7B6BFF",marginBottom:12}}>The Origin</div>
            <h2 style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(2rem,5vw,3.5rem)",letterSpacing:"-0.03em"}}>
              Born from <span className="text-pink">Obsession.</span>
            </h2>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:48,alignItems:"start"}} className="grid-cols-1 md:grid-cols-2">
            <div>
              <p className="prose-story" style={{marginBottom:24}}>
                It started in a private studio in Reykjavík, 2021. A former museum curator and a cryptographer sat across a whiteboard covered in questions — <em>not answers.</em> What if fine art carried its own provenance, unforgeably? What if a collector in Lagos held the same verifiable claim as one at Christie's?
              </p>
              <p className="prose-story" style={{marginBottom:24}}>
                What followed was <em>three years of quiet work.</em> Eighteen months of generative art research. Six months of iterating the algorithm against a hand-drawn reference library of 4,000 source paintings. A private beta with 200 art collectors who had never touched a crypto wallet before.
              </p>
              <p className="prose-story">
                The collection launched silently. No marketing. No influencers. Within 72 hours, <em>4,200 pieces were gone</em> — word of mouth through collector circles, gallery DMs, and one tweet from a hedge fund manager in Singapore who called it "the first NFT collection I'd hang on a real wall."
              </p>
            </div>
            <div>
              <p className="prose-story" style={{marginBottom:24}}>
                Each of the 10,000 pieces was generated from over <em>200 hand-crafted base traits</em> — no stock assets, no AI shortcuts. Every background, every layer, every glow effect was drawn, reviewed, and signed off by our art director before entering the generation pool.
              </p>
              <div style={{padding:"24px",borderRadius:16,background:"rgba(255,215,0,0.05)",border:"1px solid rgba(255,215,0,0.15)",marginBottom:24}}>
                <div style={{fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"#FFD700",marginBottom:10}}>By the numbers</div>
                {[["18 months","of active art production"],["200+","unique base traits drawn by hand"],["4,000","source paintings in reference library"],["2 audits","CertiK & OpenZeppelin verified"]].map(([v,l])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                    <span style={{fontFamily:"Syne",fontWeight:700,color:"#FFD700",fontSize:"0.95rem"}} className="shimmer-text">{v}</span>
                    <span style={{fontSize:"0.8rem",color:"rgba(255,255,255,0.4)"}}>{l}</span>
                  </div>
                ))}
              </div>
              <p className="prose-story" style={{fontSize:"0.9rem",fontStyle:"italic",color:"rgba(255,255,255,0.4)",borderLeft:"2px solid rgba(0,207,255,0.3)",paddingLeft:16}}>
                "We had 3,157 remaining when we paused for the final audit. By the time we resumed, there were already 400 people in the waitlist. We knew then — this wasn't just ours anymore."
                <span style={{display:"block",marginTop:8,color:"rgba(255,255,255,0.3)",fontStyle:"normal",fontSize:"0.8rem"}}>— Kairo Voss, Founder</span>
              </p>
            </div>
          </div>

          {/* Price narrative */}
          <div style={{marginTop:64,padding:"48px",borderRadius:24,background:"linear-gradient(135deg,rgba(0,207,255,0.06),rgba(123,107,255,0.06))",border:"1px solid rgba(255,255,255,0.07)",textAlign:"center",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,215,0,0.08),transparent)",filter:"blur(40px)"}}/>
            <div style={{fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.15em",color:"rgba(255,255,255,0.35)",marginBottom:16}}>Entry Point</div>
            <p style={{fontFamily:"DM Sans",fontSize:"clamp(1rem,2.5vw,1.25rem)",lineHeight:1.8,color:"rgba(255,255,255,0.6)",maxWidth:640,margin:"0 auto 28px",fontWeight:300}}>
              Legendary pieces from comparable collections currently sit at floors between <em style={{color:"rgba(255,255,255,0.85)"}}>12 and 40 ETH</em> on secondary. The work here is comparable — in some cases more refined. We priced the genesis mint not for profit, but to put this collection in the hands of real collectors first.
            </p>
            <div style={{display:"inline-flex",alignItems:"center",gap:16,flexWrap:"wrap",justifyContent:"center"}}>
              <div>
                <div style={{fontSize:"3rem",fontWeight:900,fontFamily:"Syne",lineHeight:1}} className="shimmer-text">0.0488 ETH</div>
                <div style={{fontSize:"0.7rem",color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"0.1em",marginTop:4}}>Genesis mint price — all tiers</div>
              </div>
              <div style={{width:1,height:64,background:"rgba(255,255,255,0.08)"}}/>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:"0.8rem",color:"rgba(255,255,255,0.5)",marginBottom:6}}>Estimated secondary floor at sellout:</div>
                <div style={{fontSize:"1.4rem",fontWeight:800,fontFamily:"Syne",color:"#FFD700"}}>0.8 – 2.5 ETH</div>
                <div style={{fontSize:"0.7rem",color:"rgba(255,255,255,0.3)"}}>Based on comparable collection data</div>
              </div>
            </div>
            <div style={{marginTop:28,fontSize:"0.8rem",color:"rgba(255,255,255,0.3)",fontStyle:"italic"}}>
              {fmt(TOTAL_SUPPLY - minted)} pieces remain at this price. When this tier closes — it closes permanently.
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ GALLERY ═══════ */}
      <section id="gallery" style={{padding:"96px 16px",background:"rgba(123,107,255,0.02)"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:56}}>
            <div style={{fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.15em",color:"#7B6BFF",marginBottom:12}}>The Collection</div>
            <h2 style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(2rem,5vw,3.5rem)",letterSpacing:"-0.03em"}}>
              Gallery <span className="text-pink">Preview</span>
            </h2>
            <p style={{color:"rgba(255,255,255,0.35)",maxWidth:480,margin:"16px auto 0",fontFamily:"DM Sans",fontWeight:300}}>Each piece rendered at gallery resolution — 4096×4096px on-chain. What you see below is a live render at 280px.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:20}}>
            {GALLERY.map((n,i)=>(
              <div key={n.seed} className="group" style={{borderRadius:20,overflow:"hidden",border:"1px solid rgba(255,255,255,0.07)",background:"rgba(255,255,255,0.025)",transition:"all .4s cubic-bezier(.22,1,.36,1)",cursor:"pointer",animationDelay:`${i*80}ms`}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-8px) scale(1.02)";e.currentTarget.style.borderColor=`${rarityColor[n.rarity]}40`;e.currentTarget.style.boxShadow=`0 20px 60px ${rarityColor[n.rarity]}20`}}
                onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.borderColor="rgba(255,255,255,0.07)";e.currentTarget.style.boxShadow=""}}>
                <div style={{position:"relative"}}>
                  <GenArt seed={n.seed} rarity={n.rarity} size={280} animated />
                  <div style={{position:"absolute",top:10,right:10,padding:"3px 10px",borderRadius:999,fontSize:"0.65rem",fontWeight:700,color:rarityColor[n.rarity],background:rarityColor[n.rarity]+"18",border:`1px solid ${rarityColor[n.rarity]}40`,backdropFilter:"blur(8px)"}}>
                    {n.rarity}
                  </div>
                </div>
                <div style={{padding:"14px 16px",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:"0.9rem",color:"white",fontFamily:"Syne"}}>Cipher #{String(n.seed).padStart(4,"0")}</div>
                    <div style={{fontSize:"0.7rem",color:"rgba(255,255,255,0.35)",marginTop:2}}>Genesis Collection</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:"0.75rem",color:rarityColor[n.rarity],fontWeight:700}}>Est. {n.rarity==="Legendary"?"12–40":n.rarity==="Mythic"?"4–12":n.rarity==="Epic"?"1–4":"0.3–1"} ETH</div>
                    <div style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.25)"}}>secondary floor</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{textAlign:"center",marginTop:40}}><GlowBtn variant="ghost">View Full Collection on OpenSea ↗</GlowBtn></div>
        </div>
      </section>

      {/* ═══════ TRAIT BREAKDOWN ═══════ */}
      <section id="traits" style={{padding:"96px 16px",position:"relative"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 70% 50% at 50% 50%,rgba(123,107,255,0.05),transparent)",pointerEvents:"none"}}/>
        <div style={{maxWidth:1100,margin:"0 auto",position:"relative",zIndex:1}}>
          <div style={{textAlign:"center",marginBottom:56}}>
            <div style={{fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.15em",color:"#FFD700",marginBottom:12}}>Understanding the Art</div>
            <h2 style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(2rem,5vw,3.5rem)",letterSpacing:"-0.03em"}}>
              Rarity <span className="text-gold">Decoded</span>
            </h2>
            <p style={{color:"rgba(255,255,255,0.35)",maxWidth:520,margin:"16px auto 0",fontFamily:"DM Sans",fontWeight:300,lineHeight:1.7}}>Not every piece is equal — and that's the point. Each rarity tier was designed as a distinct visual language, not just a supply number.</p>
          </div>

          {/* Tier selector */}
          <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:40,flexWrap:"wrap"}}>
            {TIERS.map((t,i)=>(
              <button key={t.name} onClick={()=>setActiveTier(i)} style={{
                padding:"10px 22px",borderRadius:12,fontSize:"0.8rem",fontWeight:700,fontFamily:"Syne",
                cursor:"pointer",transition:"all .25s",border:`1px solid ${t.color}${activeTier===i?"60":"20"}`,
                background:activeTier===i?`${t.color}18`:"transparent",
                color:activeTier===i?t.color:"rgba(255,255,255,0.4)",
                boxShadow:activeTier===i?`0 0 20px ${t.color}20`:"none"
              }}>{t.name}</button>
            ))}
          </div>

          {/* Active tier detail */}
          {TIERS.map((t,i)=> i!==activeTier ? null : (
            <div key={t.name} style={{display:"grid",gridTemplateColumns:"1fr 1.6fr",gap:40,alignItems:"start"}} className="grid-cols-1 md:grid-cols-2">
              {/* Art preview */}
              <div style={{textAlign:"center"}}>
                <div style={{display:"inline-block",borderRadius:24,overflow:"hidden",border:`1px solid ${t.color}30`,boxShadow:`0 0 60px ${t.color}18`}}>
                  <GenArt seed={t.seed} rarity={t.name} size={320} animated />
                </div>
                <div style={{marginTop:16,display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                  {[["Supply",t.supply],["Count",t.count],["Est. Floor",t.floorEst]].map(([l,v])=>(
                    <div key={l} style={{padding:"8px 16px",borderRadius:10,border:`1px solid ${t.color}25`,background:`${t.color}0d`,textAlign:"center"}}>
                      <div style={{fontSize:"1rem",fontWeight:800,fontFamily:"Syne",color:t.color}}>{v}</div>
                      <div style={{fontSize:"0.62rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"rgba(255,255,255,0.3)",marginTop:2}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Description + traits */}
              <div>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
                  <div style={{padding:"4px 14px",borderRadius:999,fontSize:"0.72rem",fontWeight:700,color:t.color,background:`${t.color}15`,border:`1px solid ${t.color}40`}}>{t.name}</div>
                  <div style={{fontSize:"0.72rem",color:"rgba(255,255,255,0.3)"}}>Rarity Tier · {t.supply} of supply</div>
                </div>
                <p style={{fontFamily:"DM Sans",fontWeight:300,lineHeight:1.8,color:"rgba(255,255,255,0.6)",fontSize:"0.95rem",marginBottom:28}}>{t.description}</p>
                <div style={{marginBottom:8,fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.12em",color:"rgba(255,255,255,0.3)"}}>Exclusive Traits</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {t.traits.map(tr=>(
                    <div key={tr} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"10px 12px",borderRadius:10,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)"}}>
                      <div style={{width:6,height:6,borderRadius:999,background:t.color,flexShrink:0,marginTop:5}}/>
                      <span style={{fontSize:"0.8rem",color:"rgba(255,255,255,0.55)",fontFamily:"DM Sans",lineHeight:1.4}}>{tr}</span>
                    </div>
                  ))}
                </div>
                {t.name==="Legendary"&&(
                  <div style={{marginTop:20,padding:"14px 18px",borderRadius:12,background:"rgba(255,215,0,0.06)",border:"1px solid rgba(255,215,0,0.2)"}}>
                    <div style={{fontSize:"0.72rem",color:"#FFD700",fontWeight:700,marginBottom:6}}>⚠ Scarcity Note</div>
                    <div style={{fontSize:"0.8rem",color:"rgba(255,255,255,0.5)",fontFamily:"DM Sans",lineHeight:1.6}}>Of the ~100 Legendaries in existence, an estimated 31 have never moved from their mint wallet. Effective circulating supply is closer to 69. None are listed.</div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Rarity comparison table */}
          <div style={{marginTop:60}}>
            <div style={{fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.12em",color:"rgba(255,255,255,0.3)",marginBottom:16,textAlign:"center"}}>Full Rarity Overview</div>
            <GlassCard>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"DM Sans",fontSize:"0.85rem"}}>
                  <thead>
                    <tr style={{borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
                      {["Tier","Supply %","Count","Traits","Est. Secondary Floor","Staking Multiplier"].map(h=>(
                        <th key={h} style={{padding:"14px 20px",textAlign:"left",fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"rgba(255,255,255,0.3)",fontWeight:600}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Legendary","1%","~100","6 exclusive","12–40 ETH","3×","#FFD700"],
                      ["Mythic","4%","~400","5 exclusive","4–12 ETH","2.5×","#FF6BFF"],
                      ["Epic","15%","~1,500","4 exclusive","1–4 ETH","2×","#7B6BFF"],
                      ["Rare","30%","~3,000","3 exclusive","0.3–1 ETH","1.5×","#00CFFF"],
                      ["Uncommon","50%","~5,000","2 exclusive","0.1–0.3 ETH","1×","#00E676"],
                    ].map(([tier,pct,cnt,traits,floor,mult,color])=>(
                      <tr key={tier} style={{borderBottom:"1px solid rgba(255,255,255,0.04)",transition:"background .2s"}}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.025)"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <td style={{padding:"14px 20px"}}><span style={{fontWeight:700,color,fontFamily:"Syne"}}>{tier}</span></td>
                        <td style={{padding:"14px 20px",color:"rgba(255,255,255,0.5)"}}>{pct}</td>
                        <td style={{padding:"14px 20px",color:"rgba(255,255,255,0.5)"}}>{cnt}</td>
                        <td style={{padding:"14px 20px",color:"rgba(255,255,255,0.5)"}}>{traits}</td>
                        <td style={{padding:"14px 20px",fontWeight:600,color}}>{floor}</td>
                        <td style={{padding:"14px 20px"}}><span style={{padding:"3px 10px",borderRadius:999,fontSize:"0.72rem",fontWeight:700,color,background:`${color}15`,border:`1px solid ${color}30`}}>{mult}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ═══════ MINT ═══════ */}
      <section id="mint" style={{padding:"96px 16px",position:"relative"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 60% 50% at 50% 50%,rgba(0,207,255,0.05),transparent)",pointerEvents:"none"}}/>
        <div style={{maxWidth:1000,margin:"0 auto",position:"relative",zIndex:1}}>
          <div style={{textAlign:"center",marginBottom:56}}>
            <div style={{fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.15em",color:"#00CFFF",marginBottom:12}}>Public Sale · Live Now</div>
            <h2 style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(2rem,5vw,3.5rem)",letterSpacing:"-0.03em"}}>
              Secure Your <span className="text-gradient">Genesis</span>
            </h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:28,alignItems:"start"}} className="grid-cols-1 md:grid-cols-2">
            <GlassCard className="p-8" glow="cyan">
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:32}}>
                <div>
                  <div style={{fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"rgba(255,255,255,0.35)"}}>Mint Price</div>
                  <div style={{fontFamily:"Syne",fontSize:"2.2rem",fontWeight:900,color:"white",lineHeight:1.1}}>{MINT_PRICE} <span style={{color:"#00CFFF"}}>ETH</span></div>
                  <div style={{fontSize:"0.75rem",color:"rgba(255,255,255,0.25)",marginTop:4}}>≈ $184 USD</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"rgba(255,255,255,0.35)"}}>Remaining</div>
                  <div style={{fontFamily:"Syne",fontSize:"2.2rem",fontWeight:900,color:"white",lineHeight:1.1}}>{fmt(TOTAL_SUPPLY-minted)}</div>
                  <div style={{fontSize:"0.75rem",color:"rgba(255,255,255,0.25)",marginTop:4}}>of {fmt(TOTAL_SUPPLY)}</div>
                </div>
              </div>
              <div style={{marginBottom:28}}>
                <div style={{fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"rgba(255,255,255,0.35)",marginBottom:12}}>Quantity (max 20)</div>
                <div style={{display:"flex",alignItems:"center",gap:16}}>
                  <button onClick={()=>setMintQty(q=>clamp(q-1,1,20))} style={{width:48,height:48,borderRadius:12,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.04)",color:"white",fontSize:"1.4rem",fontWeight:700,cursor:"pointer",transition:"all .2s"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(0,207,255,0.4)"} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.15)"}>−</button>
                  <div style={{flex:1,textAlign:"center",fontSize:"2rem",fontWeight:900,fontFamily:"Syne",color:"white"}}>{mintQty}</div>
                  <button onClick={()=>setMintQty(q=>clamp(q+1,1,20))} style={{width:48,height:48,borderRadius:12,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.04)",color:"white",fontSize:"1.4rem",fontWeight:700,cursor:"pointer",transition:"all .2s"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(0,207,255,0.4)"} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.15)"}>+</button>
                </div>
              </div>
              <div style={{background:"rgba(0,0,0,0.35)",borderRadius:14,padding:"16px",marginBottom:28,border:"1px solid rgba(255,255,255,0.04)"}}>
                {[["Quantity",`${mintQty} NFT${mintQty>1?"s":""}`],["Subtotal",`${(mintQty*MINT_PRICE).toFixed(4)} ETH`],["Gas (est.)","~0.001 ETH"],["Total",`${(mintQty*MINT_PRICE+0.001).toFixed(4)} ETH`]].map(([k,v],i)=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<3?"1px solid rgba(255,255,255,0.04)":"none",fontSize:"0.85rem",fontWeight:i===3?700:400,color:i===3?"white":"rgba(255,255,255,0.45)"}}>
                    <span>{k}</span><span style={{color:i===3?"#00CFFF":""}}>{v}</span>
                  </div>
                ))}
              </div>
              {mintState==="loading"?(
                <div style={{width:"100%",padding:"16px",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",gap:12,fontWeight:700,color:"white",background:"rgba(0,207,255,0.08)",border:"1px solid rgba(0,207,255,0.25)"}}>
                  <div style={{width:18,height:18,border:"2px solid #00CFFF",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                  Confirming on {NETWORK}...
                </div>
              ):mintState==="success"?(
                <div style={{width:"100%",padding:"16px",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontWeight:700,color:"#6ee7b7",background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.25)"}}>✅ Minted Successfully</div>
              ):(
                <GlowBtn variant="gold" onClick={handleMint} className="w-full" disabled={!walletConnected}>{walletConnected?`Mint ${mintQty} NFT${mintQty>1?"s":""} — ${(mintQty*MINT_PRICE).toFixed(4)} ETH`:"Connect Wallet to Mint"}</GlowBtn>
              )}
              {!walletConnected&&<GlowBtn variant="ghost" onClick={connectWallet} className="w-full mt-3">Connect Wallet</GlowBtn>}
            </GlassCard>

            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              <GlassCard className="p-6" glow="purple">
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                  <div style={{width:32,height:32,borderRadius:8,background:"rgba(16,185,129,0.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"#6ee7b7",fontSize:"1rem"}}>✓</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:"0.85rem",color:"white"}}>Audited & Verified</div>
                    <div style={{fontSize:"0.7rem",color:"rgba(255,255,255,0.35)"}}>CertiK + OpenZeppelin</div>
                  </div>
                </div>
                <div style={{background:"rgba(0,0,0,0.4)",borderRadius:10,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                  <span style={{fontSize:"0.72rem",fontFamily:"monospace",color:"rgba(255,255,255,0.5)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{CONTRACT}</span>
                  <button onClick={()=>{navigator.clipboard?.writeText(CONTRACT);notify("Address copied!");}} style={{fontSize:"0.72rem",color:"#7B6BFF",cursor:"pointer",background:"none",border:"none",fontWeight:700,flexShrink:0}}>Copy</button>
                </div>
              </GlassCard>

              <GlassCard className="p-6" glow="gold">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{fontWeight:700,fontSize:"0.85rem",color:"white"}}>Live Mints</div>
                  <div style={{display:"flex",alignItems:"center",gap:6,fontSize:"0.72rem",color:"#6ee7b7"}}>
                    <div style={{width:5,height:5,borderRadius:999,background:"#6ee7b7",animation:"pulse 2s infinite"}}/>Live
                  </div>
                </div>
                {activity.map((a,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",opacity:1-i*0.16,transition:"all .5s"}}>
                    <span style={{fontSize:"0.78rem",fontFamily:"monospace",color:"rgba(255,255,255,0.6)"}}>{a.wallet}</span>
                    <span style={{fontSize:"0.72rem",fontWeight:700,color:rarityColor[a.rarity]||"#00CFFF"}}>+{a.qty} {a.rarity}</span>
                    <span style={{fontSize:"0.68rem",color:"rgba(255,255,255,0.25)"}}>{a.time}</span>
                  </div>
                ))}
              </GlassCard>

              <GlassCard className="p-6">
                <div style={{fontWeight:700,fontSize:"0.85rem",color:"white",marginBottom:14}}>Holder Benefits</div>
                {[["💰","Revenue Share","Monthly ETH distributions to all holders"],["🗳️","DAO Voting","Shape treasury allocation & future drops"],["🎁","Exclusive Airdrops","Holders-only NFT releases, zero cost"],["🖼️","Physical Prints","Legendary holders receive signed art prints"],["🌐","IRL Events","Private openings across NYC, London, Tokyo"]].map(([ico,t,d])=>(
                  <div key={t} style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
                    <div style={{fontSize:"1.1rem",marginTop:1}}>{ico}</div>
                    <div><div style={{fontSize:"0.82rem",fontWeight:600,color:"white"}}>{t}</div><div style={{fontSize:"0.74rem",color:"rgba(255,255,255,0.38)",marginTop:2,lineHeight:1.4}}>{d}</div></div>
                  </div>
                ))}
              </GlassCard>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ ROADMAP ═══════ */}
      <section id="roadmap" style={{padding:"96px 16px",background:"rgba(255,215,0,0.01)"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:56}}>
            <div style={{fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.15em",color:"#FFD700",marginBottom:12}}>The Vision</div>
            <h2 style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(2rem,5vw,3.5rem)",letterSpacing:"-0.03em"}}>Our <span className="text-gold">Roadmap</span></h2>
          </div>
          <div style={{position:"relative"}}>
            <div style={{position:"absolute",left:32,top:0,bottom:0,width:1,background:"linear-gradient(to bottom,rgba(0,207,255,0.4),rgba(123,107,255,0.4),transparent)"}}/>
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              {ROADMAP.map(r=>{
                const done=r.status==="done",active=r.status==="active";
                const c=done?"#10b981":active?"#00CFFF":"rgba(255,255,255,0.2)";
                return(
                  <div key={r.phase} style={{paddingLeft:80,position:"relative"}}>
                    <div style={{position:"absolute",left:0,top:20,width:64,height:64,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:"1.1rem",fontFamily:"Syne",background:done?"rgba(16,185,129,0.12)":active?"rgba(0,207,255,0.12)":"rgba(255,255,255,0.04)",border:`1px solid ${c}50`,color:c}}>
                      {done?"✓":r.phase}
                    </div>
                    <GlassCard className={`p-6 ${active?"border-cyan-500/25":""}`} glow={active?"cyan":""}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                        <div>
                          <div style={{fontSize:"0.62rem",textTransform:"uppercase",letterSpacing:"0.12em",color:"rgba(255,255,255,0.3)",marginBottom:4}}>Phase {r.phase}</div>
                          <div style={{fontWeight:800,fontSize:"1.05rem",fontFamily:"Syne",color:"white"}}>{r.title}</div>
                        </div>
                        <div style={{padding:"4px 12px",borderRadius:999,fontSize:"0.65rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:c,background:`${c}15`,border:`1px solid ${c}30`}}>
                          {done?"Complete":active?"In Progress":"Upcoming"}
                        </div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        {r.items.map(it=>(
                          <div key={it} style={{display:"flex",alignItems:"center",gap:8,fontSize:"0.82rem",color:"rgba(255,255,255,0.45)"}}>
                            <div style={{width:5,height:5,borderRadius:999,background:c,flexShrink:0}}/>
                            {it}
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ TEAM ═══════ */}
      <section id="team" style={{padding:"96px 16px",background:"rgba(123,107,255,0.025)"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:56}}>
            <div style={{fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.15em",color:"#7B6BFF",marginBottom:12}}>The Builders</div>
            <h2 style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(2rem,5vw,3.5rem)",letterSpacing:"-0.03em"}}>Meet the <span className="text-pink">Team</span></h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:20}}>
            {TEAM.map(m=>(
              <GlassCard key={m.name} className="p-6 text-center" glow="purple" style={{}}>
                <div style={{width:64,height:64,borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",fontWeight:900,fontFamily:"Syne",margin:"0 auto 16px",background:`${m.color}18`,color:m.color,border:`1px solid ${m.color}35`,transition:"transform .3s"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                  {m.avatar}
                </div>
                <div style={{fontWeight:700,fontSize:"0.9rem",color:"white",fontFamily:"Syne",marginBottom:6}}>{m.name}</div>
                <div style={{fontSize:"0.75rem",color:"rgba(255,255,255,0.4)",lineHeight:1.5}}>{m.role}</div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section id="faq" style={{padding:"96px 16px"}}>
        <div style={{maxWidth:720,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:56}}>
            <div style={{fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.15em",color:"#00CFFF",marginBottom:12}}>Questions</div>
            <h2 style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(2rem,5vw,3.5rem)",letterSpacing:"-0.03em"}}>FAQ</h2>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {FAQS.map((f,i)=>(
              <GlassCard key={i} className={openFaq===i?"border-cyan-500/25":""}>
                <button onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 24px",textAlign:"left",background:"none",border:"none",cursor:"pointer"}}>
                  <span style={{fontWeight:600,color:"white",fontSize:"0.95rem",paddingRight:16,fontFamily:"DM Sans"}}>{f.q}</span>
                  <span style={{color:"#00CFFF",fontSize:"1.3rem",flexShrink:0,transition:"transform .25s",transform:openFaq===i?"rotate(45deg)":"none"}}>+</span>
                </button>
                {openFaq===i&&(
                  <div style={{padding:"0 24px 20px",fontSize:"0.88rem",color:"rgba(255,255,255,0.55)",lineHeight:1.8,borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:16,fontFamily:"DM Sans",fontWeight:300}}>{f.a}</div>
                )}
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section style={{padding:"120px 16px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 90% 70% at 50% 50%,rgba(123,107,255,0.12),transparent)",pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:1,maxWidth:680,margin:"0 auto"}}>
          <div style={{fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.15em",color:"#FFD700",marginBottom:20}}>The window is closing</div>
          <h2 style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(2.5rem,7vw,5.5rem)",letterSpacing:"-0.04em",lineHeight:0.95,marginBottom:24}}>
            <span style={{display:"block",color:"white"}}>THE WORK IS</span>
            <span style={{display:"block"}} className="text-gradient animate-glow">ALREADY DONE.</span>
            <span style={{display:"block",color:"rgba(255,255,255,0.7)"}}>NOW IT'S YOURS.</span>
          </h2>
          <p style={{fontFamily:"DM Sans",fontWeight:300,fontSize:"1.05rem",lineHeight:1.8,color:"rgba(255,255,255,0.45)",marginBottom:16,maxWidth:520,margin:"0 auto 16px"}}>
            Three years of craft. One genesis mint. When these {fmt(TOTAL_SUPPLY-minted)} pieces are gone, the only way in is the secondary market — at whatever price the market sets.
          </p>
          <p style={{fontFamily:"DM Sans",fontWeight:400,fontSize:"1rem",color:"rgba(255,255,255,0.55)",marginBottom:40}}>
            Entry today: <span style={{color:"#FFD700",fontWeight:700,fontFamily:"Syne"}} className="shimmer-text">{MINT_PRICE} ETH.</span> Estimated floor at sellout: <span style={{color:"#FFD700",fontWeight:700"}}>0.8–2.5 ETH.</span>
          </p>
          <div style={{display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap"}}>
            <GlowBtn variant="gold" onClick={()=>scrollTo("mint")}>⚡ Mint Now — {MINT_PRICE} ETH</GlowBtn>
            <GlowBtn variant="ghost" onClick={connectWallet}>{walletConnected?`Connected: ${walletAddress}`:"Connect Wallet"}</GlowBtn>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{borderTop:"1px solid rgba(255,255,255,0.04)",padding:"32px 24px"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",flexWrap:"wrap",justifyContent:"space-between",alignItems:"center",gap:16,color:"rgba(255,255,255,0.25)",fontSize:"0.78rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,color:"rgba(255,255,255,0.5)",fontWeight:800,fontFamily:"Syne"}}>
            <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#00CFFF,#7B6BFF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>⬡</div>
            CIPHER GENESIS
          </div>
          <div style={{fontFamily:"monospace",fontSize:"0.72rem"}}>Contract: {CONTRACT}</div>
          <div>© 2024 Cipher Genesis. All rights reserved.</div>
        </div>
      </footer>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
