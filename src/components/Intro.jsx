import { Component, createRef } from 'react'
import './Intro.css'

// L'intro di All For One: pixel art su canvas, quattordici secondi.
//
// Il disegno arriva tale e quale dal prototipo — sono seicento righe di
// rettangoli piazzati a mano, e riscriverle vorrebbe dire rifare
// l'intro. Qui e' cambiato solo il guscio: una classe React normale
// invece del componente del prototipo, e un render() vero.
//
// Classe e non hook di proposito: il ciclo di disegno tiene una decina
// di valori che cambiano a ogni fotogramma e non devono far ridisegnare
// niente a React. Con gli hook sarebbero dieci ref.
//
// ⚠️ Nel pannello di anteprima non si vede: requestAnimationFrame non
// scatta e ResizeObserver non consegna, perche' la scheda non compone
// fotogrammi. Non e' un difetto del codice, e' scritto in DA-FARE.md.

const C = {
  night:'#071F30', deep:'#0B3550', deep2:'#092B42', gold:'#F2A93B', coral:'#E8604A',
  green:'#3F6E5C', dgreen:'#24463B', cream:'#F7F4EC', sand:'#E3C892', sandD:'#C0A272',
  turq:'#3FB3A6', turqD:'#2A7E86', sky:'#8FCBD8', sky2:'#DCEAF0', snow:'#DCEAF0',
  snowD:'#A9C2D0', stone:'#8A99A6', khaki:'#A8905F', skin:'#E8C39E', rock:'#B4573C',
  trav:'#D8C9A8', travD:'#8E805F', pink:'#E8A0A6'
};

const GLYPH = {
  'A':['.###.','#...#','#...#','#####','#...#','#...#','#...#'],
  'L':['#....','#....','#....','#....','#....','#....','#####'],
  'F':['#####','#....','#....','####.','#....','#....','#....'],
  'O':['.###.','#...#','#...#','#...#','#...#','#...#','.###.'],
  'R':['####.','#...#','#...#','####.','#..#.','#...#','#...#'],
  'N':['#...#','##..#','##..#','#.#.#','#..##','#..##','#...#'],
  'E':['#####','#....','#....','####.','#....','#....','#####'],
  '1':['..#..','.##..','..#..','..#..','..#..','..#..','.###.'],
  '4':['...#.','..##.','.#.#.','#..#.','#####','...#.','...#.'],
  ' ':['.....','.....','.....','.....','.....','.....','.....']
};

const M_A = ['..ooo..','.ohhho.','.hsssh.','.sesse.','..sss..','.bbbbb.','sbbbbbs','.bbbbb.','.bbbbb.','.pp.pp.','.pp.pp.','.oo.oo.'];
const M_B = ['..ooo..','.ohhho.','.hsssh.','.sesse.','..sss..','.bbbbb.','sbbbbbs','.bbbbb.','.bbbbb.','..ppp..','.pp.pp.','oo...oo'];
const F_A = ['..ooo..','.ohhho.','.hsssh.','hsesseh','h.sss.h','.bbbbb.','sbbbbbs','.bbbbb.','bbbbbbb','.pp.pp.','.pp.pp.','.oo.oo.'];
const F_B = ['..ooo..','.ohhho.','.hsssh.','hsesseh','h.sss.h','.bbbbb.','sbbbbbs','.bbbbb.','bbbbbbb','..ppp..','.pp.pp.','oo...oo'];
const P_A = ['..ooo..','.ohhhoh','.hssshh','.sesse.','..sss..','.bbbbb.','sbbbbbs','.bbbbb.','.bbbbb.','.pp.pp.','.pp.pp.','.oo.oo.'];
const P_B = ['..ooo..','.ohhhoh','.hssshh','.sesse.','..sss..','.bbbbb.','sbbbbbs','.bbbbb.','.bbbbb.','..ppp..','.pp.pp.','oo...oo'];

const ALAN_A = ['....kk......','...dggd.....','..dgddgd....','..dgwegd....','..dggggd.kk.','...dggggkkkd','...dgcccgggd','...dgcccggd.','....ggggg...','....d.dd....'];
const ALAN_B = ['....kk......','...dggd.....','..dgddgd....','..dgwegd....','..dggggd.kk.','...dggggkkkd','...dgcccgggd','...dgcccggd.','....ggggg...','...dd..d....'];
const ALAN_UP = ['..kkk.kk....','...dggd.kkk.','..dgddgdkkk.','..dgwegdkk..','..dggggd....','...dgcccggd.','...dgcccggd.','....ggggg...','.....dd.....','............'];
const ALAN_DN = ['....kk......','...dggd.....','..dgddgd....','..dgwegd....','..dggggd....','...dgcccgkk.','...dgcccgkkk','....gggggkk.','.....dd.....','............'];
const ALAN_F = ['...k.....k...','..ddgggggdd..','.dgggggggggd.','.dgddgggddgd.','.dgwegggewgd.','.dggggcggggd.','kdggcccccggdk','kkdgcccccgdkk','.kddgggggddk.','...dd...dd...'];

/* busto frontale (POV: gli altri seduti di fronte) */
const BUST = [
'......hhhhhh......',
'....hhhhhhhhhh....',
'..hhhhhhhhhhhhhh..',
'.hhhhhhhhhhhhhhhh.',
'.hhhsssssssssshhh.',
'.hhsssssssssssshh.',
'.hhsssssssssssshh.',
'.hhsswwsssswwsshh.',
'.hhsseesssseesshh.',
'.hhsssssssssssshh.',
'.hhssssseessssshh.',
'..hhsssssssssshh..',
'...ssssssssssss...',
'.....ssssssss.....',
'.......ssss.......',
'....bbbbbbbbbb....',
'..bbbbbbbbbbbbbb..',
'.bbbbbbbbbbbbbbbb.',
'sbbbbbbbbbbbbbbbbs',
'sbbbbbbbbbbbbbbbbs'
];
const SEAT34 = ['...hhhh.....','..hhhhhh....','.hhhhhhhh...','.hhsssssh...','.hswessss...','.hssssssh...','..ssssss....','...ssss.....','..bbbbbb....','.bbbbbbbb...','.bbbbbbbbs..','.bbbbbbbb...','..bbppppp...','..ppppppppp.','..ppppppppp.','...oo...ooo.'];
const COOK = ['...hhhhh....','..hhhhhhh...','.hhhhhhhhh..','.hhhhhhhhh..','.hhhhhhhhh..','..hhhhhhh...','...sssss....','..bbbbbbb...','.bbbbbbbbb..','sbbbbbbbbbs.','sbbbbbbbbbs.','.bbbbbbbbb..','.bbbbbbbbb..','..ppppppp...','..ppppppp...','..pp...pp...','..pp...pp...','..oo...oo...'];
const CARDS = ['...hhhh.....','..hhhhhh....','.hhsssss....','.hswessss...','..sssss.....','..bbbbb.....','.bbbbbbss...','.bbbbbb.....','.bbppppp....','..pppppppp..','..pp....ss..','..oo........'];
const CREWP = [
  {h:'#3A2B22', s:C.skin,    b:C.coral},
  {h:'#F2A93B', s:C.skin,    b:C.cream},
  {h:'#8E4A2E', s:'#F0D0AE', b:C.turq},
  {h:'#2A1F1A', s:'#C58C63', b:C.gold},
  {h:'#E8E0C8', s:C.skin,    b:C.green},
  {h:'#C86A3C', s:'#B57A50', b:'#C24A34'}
];

const HAND = ['.sss.','sssss','sssss','.sss.','..o..'];

const EM_HEART = ['.##.##.','#######','#######','.#####.','..###..','...#...','.......'];
const EM_SMILE = ['.#####.','##.#.##','#######','#.###.#','##...##','.#####.','.......'];
const EM_STAR  = ['...#...','..###..','#######','.#####.','..###..','.##.##.','.#...#.'];

const CREW = [
  {sp:'F', o:'#1A2B3A', h:'#3A2B22', s:C.skin,   e:'#1A2B3A', b:C.coral, p:C.deep},
  {sp:'M', o:'#1A2B3A', h:'#F2A93B', s:C.skin,   e:'#1A2B3A', b:C.cream, p:C.green},
  {sp:'P', o:'#1A2B3A', h:'#8E4A2E', s:'#F0D0AE',e:'#1A2B3A', b:C.turq,  p:C.deep2},
  {sp:'M', o:'#1A2B3A', h:'#2A1F1A', s:'#C58C63',e:'#1A2B3A', b:C.gold,  p:C.deep2},
  {sp:'F', o:'#1A2B3A', h:'#1F1B18', s:'#B57A50',e:'#1A2B3A', b:C.green, p:C.deep},
  {sp:'M', o:'#1A2B3A', h:'#6B4A2A', s:C.skin,   e:'#1A2B3A', b:C.coral, p:C.dgreen}
];
const SPR = {M:[M_A,M_B], F:[F_A,F_B], P:[P_A,P_B]};
const P_ALAN = {d:C.dgreen, g:'#4F8B6C', c:'#D8CFA8', k:C.khaki, w:C.cream, e:'#0B1A16'};

const ST = 3300;
/* 0 spiaggia · 1 Roma · 2 Egitto · 3 Giappone · 4 Gran Canyon · 5 città notturna */
const BIOMES = [
  {st:C.sky,     sb:C.sky2,     mid:C.turq,     midD:C.turqD,   g:C.sand,    gd:C.sandD},
  {st:C.sky,     sb:'#E8DCC0',  mid:'#6F8F6A',  midD:'#3F5E4A', g:'#B9A98A', gd:'#8E805F'},
  {st:'#9CC6D2', sb:'#F4DFAE',  mid:'#E0BE86',  midD:'#C29A62', g:'#EBD3A0', gd:'#C2A874'},
  {st:'#9CBFCE', sb:'#EFDCDE',  mid:'#4F7A62',  midD:'#2E5A46', g:'#57876A', gd:'#2E5A46'},
  {st:'#7FB6C4', sb:'#F0D9B8',  mid:C.rock,     midD:'#8A4029', g:'#DEA96B', gd:'#B4804A'},
  {st:C.night,   sb:C.deep,     mid:'#0A2C44',  midD:C.night,   g:'#08202F', gd:C.night}
];
const NB = BIOMES.length - 1;

const FEATS = [
  {t:0.00,f:.35,k:'island'},{t:0.06,f:.35,k:'island'},{t:0.03,f:1,k:'palm'},{t:0.09,f:1,k:'palm'},{t:0.05,f:.7,k:'boat'},
  {t:0.14,f:.35,k:'hill'},{t:0.27,f:.35,k:'hill'},{t:0.19,f:.7,k:'colosseo'},{t:0.26,f:.7,k:'aqueduct'},
  {t:0.15,f:1,k:'cypress'},{t:0.17,f:1,k:'column'},{t:0.22,f:1,k:'cypress'},{t:0.24,f:1,k:'sign'},{t:0.29,f:1,k:'column'},
  {t:0.34,f:.35,k:'pyramid'},{t:0.39,f:.35,k:'pyramid2'},{t:0.45,f:.35,k:'pyramid'},{t:0.42,f:.7,k:'dune'},
  {t:0.35,f:1,k:'obelisk'},{t:0.41,f:1,k:'palm'},{t:0.47,f:1,k:'obelisk'},
  {t:0.53,f:.35,k:'hill'},{t:0.63,f:.35,k:'hill'},{t:0.57,f:.7,k:'pagoda'},{t:0.66,f:.7,k:'pagoda2'},
  {t:0.54,f:1,k:'torii'},{t:0.60,f:1,k:'sakura'},{t:0.64,f:1,k:'sakura'},{t:0.68,f:1,k:'sign'},
  {t:0.73,f:.35,k:'mesa'},{t:0.79,f:.35,k:'mesa'},{t:0.85,f:.35,k:'mesa'},{t:0.76,f:.7,k:'mesa'},{t:0.82,f:.7,k:'mesa'},
  {t:0.74,f:1,k:'cactus'},{t:0.78,f:1,k:'rock'},{t:0.83,f:1,k:'cactus'},{t:0.87,f:1,k:'rock'},
  {t:0.92,f:.35,k:'tower'},{t:0.97,f:.35,k:'tower'},{t:1.02,f:.35,k:'tower'},{t:0.94,f:.7,k:'block'},{t:1.00,f:.7,k:'block'},
  {t:0.93,f:1,k:'lamp'},{t:0.99,f:1,k:'lamp'},{t:1.04,f:1,k:'lamp'}
];
const FG = [
  {t:0.11,k:'grass'},{t:0.16,k:'grass'},{t:0.21,k:'grass'},{t:0.28,k:'grass'},
  {t:0.55,k:'grass'},{t:0.61,k:'grass'},{t:0.65,k:'grass'},{t:0.70,k:'grass'}
];

function hx(c){ return [parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)]; }
function mix(a,b,f){
  const A=hx(a),B=hx(b),q=v=>{v=Math.max(0,Math.min(255,Math.round(v/12)*12));return v.toString(16).padStart(2,'0');};
  return '#'+q(A[0]+(B[0]-A[0])*f)+q(A[1]+(B[1]-A[1])*f)+q(A[2]+(B[2]-A[2])*f);
}
function rnd(i){ const x=Math.sin(i*127.1)*43758.5453; return x-Math.floor(x); }
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const easeOut=t=>1-Math.pow(1-t,3);
const easeIO=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const bell=(p,c)=>clamp(1-Math.abs(p-c),0,1);

const T_WALK_IN=1.0, T_SCROLL=2.0, T_WALK_END=9.2, T_PULL=11.2, T_ROOM=13.0, T_TITLE=13.4, T_END=14.8;
const T_LOOP_A=2.35, T_LOOP_B=9.0, T_READY=4.5;

class Intro extends Component {
  state = { done:false, phase:null, ready:false };
  canvasRef = createRef();
  wrapRef = createRef();

  geom(H){
    this.H = H;
    this.CY = Math.round(H/2);
    this.HZ = Math.round(H*0.596);
    this.GR = Math.round(H*0.831);
    this.FT = this.GR + 4;
    this.TCY = Math.round(H*0.40);
    this.TRY = Math.round(H*0.085);
    this.WALL = Math.round(H*0.16);
    this.PH_Y = Math.round(H*0.475);
    this.PH_H = Math.round(H*0.235);
    this.TITLE_Y = Math.round(H*0.755);
  }

  fit(){
    const w = this.wrapRef.current, cv = this.canvasRef.current;
    if(!w||!cv) return;
    const r = w.getBoundingClientRect();
    if(r.width<2||r.height<2) return;
    const H = clamp(Math.round(200*r.height/r.width), 356, 480);
    if(H !== this.H){
      this.geom(H);
      cv.height = H; this.wc.height = H;
      this.ctx.imageSmoothingEnabled = false;
      this.wctx.imageSmoothingEnabled = false;
    }
    const sc = Math.max(0.5, Math.min(r.width/200, r.height/this.H));
    cv.style.width = Math.round(200*sc)+'px';
    cv.style.height = Math.round(this.H*sc)+'px';
    if(this.t!=null) this.draw(Math.min(this.t,T_END));
  }

  componentDidMount(){
    const cv = this.canvasRef.current;
    this.ctx = cv.getContext('2d');
    this.wc = document.createElement('canvas'); this.wc.width=200; this.wc.height=356;
    this.wctx = this.wc.getContext('2d');
    this.geom(356);
    this.ctx.imageSmoothingEnabled = false;
    this.wctx.imageSmoothingEnabled = false;
    this.t = 0; this.last = performance.now();
    this.fit();
    this.ro = new ResizeObserver(()=>this.fit()); this.ro.observe(this.wrapRef.current);
    window.__ALL41_INTRO_DEV__ = { seek:(t)=>{ cancelAnimationFrame(this.raf); this.exp0=null; this.hold=0; this.skipped=false; this.t=t; this.draw(t); }, end:T_END };
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);

    // ⚠️ La via d'uscita, e non e' teorica. Il tasto "Inizia" compare
    // quando l'animazione ha girato abbastanza, e "ha girato" lo decide
    // requestAnimationFrame. Se per qualunque motivo i fotogrammi non
    // partono — scheda in secondo piano, canvas che non parte, un
    // telefono che strozza tutto — il tasto non comparirebbe mai e si
    // resterebbe chiusi fuori dall'app da una copertina.
    //
    // Un orologio vero, che non dipende dal disegno.
    this.scappatoia = setTimeout(() => {
      if (!this.state.ready) this.setState({ ready: true });
    }, 6000);
  }
  componentWillUnmount(){ cancelAnimationFrame(this.raf); clearTimeout(this.expT); clearTimeout(this.scappatoia); if(this.ro) this.ro.disconnect(); }

  loop(now){
    const sp = this.props.speed ?? 1;
    const dt = Math.min(Math.max((now - this.last)/1000, 0), 0.05);
    this.last = now;
    if(this.exp0!=null){
      const e=(now-this.exp0)/1000;
      this.draw(this.t); this.expand(this.ctx,e);
      if(e>=0.40){ this.exp0=null; clearTimeout(this.expT); this.finita(); return; }
      this.raf = requestAnimationFrame(this.loop); return;
    }
    this.t += dt * sp;
    this.elapsed = (this.elapsed||0) + dt*sp;
    if(this.t >= T_LOOP_B) this.t = T_LOOP_A;
    if(!this.state.ready && this.elapsed > T_READY) this.setState({ready:true});
    this.draw(this.t);
    this.raf = requestAnimationFrame(this.loop);
  }
  expand(g,e){
    const H=this.H, q=easeOut(clamp(e/0.26,0,1));
    const w0=64, h0=Math.round(H*0.26);
    const w=w0+(200-w0)*q, h=h0+(H-h0)*q, x=100-w/2, y=H/2-h/2;
    this.r(g,x,y,w,h,C.deep);
    g.globalAlpha=0.28+0.30*q; this.r(g,x,y,w,h,C.gold); g.globalAlpha=1;
    if(e>0.22){
      const f=clamp(1-(e-0.22)/0.14,0,1);
      g.globalAlpha=f*0.95; this.r(g,0,0,200,H,'#FFF6E0'); g.globalAlpha=1;
    }
  }
  // Finita: si avvisa il genitore, che monta l'app. Una volta sola —
  // ci si arriva sia dal fotogramma che chiude l'espansione sia dal
  // timer di sicurezza, e senza guardia partirebbero due volte.
  finita(){
    if(this.state.phase === 'app') return;
    this.setState({phase:'app'});
    if(typeof this.props.onFine === 'function') this.props.onFine();
  }

  onTap(){
    if(this.exp0!=null || this.state.phase==='app') return;
    if(!this.state.ready) return;
    this.exp0 = performance.now();
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.loop);
    clearTimeout(this.expT);
    this.expT = setTimeout(()=>{ if(this.exp0!=null){ this.exp0=null; this.finita(); } },440);
  }
  /* ---------- primitive pixel ---------- */
  r(g,x,y,w,h,c){ g.fillStyle=c; g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h))); }
  rr(g,x,y,w,h,rad,c){
    x=Math.round(x);y=Math.round(y);w=Math.round(w);h=Math.round(h);rad=Math.max(0,Math.round(rad));
    this.r(g,x+rad,y,w-2*rad,h,c); this.r(g,x,y+rad,rad,h-2*rad,c); this.r(g,x+w-rad,y+rad,rad,h-2*rad,c);
    if(rad>1){ this.r(g,x+1,y+1,rad,rad,c); this.r(g,x+w-rad-1,y+1,rad,rad,c); this.r(g,x+1,y+h-rad-1,rad,rad,c); this.r(g,x+w-rad-1,y+h-rad-1,rad,rad,c); }
  }
  tri(g,cx,base,w,h,c){ const rows=Math.round(h); for(let i=0;i<rows;i++){ const ww=Math.max(1,Math.round(w*(i+1)/rows)); this.r(g,cx-ww/2,base-rows+i,ww,1,c); } }
  disc(g,cx,cy,rad,c){ for(let y=-rad;y<=rad;y++){ const w=Math.round(Math.sqrt(Math.max(0,rad*rad-y*y))); if(w>0) this.r(g,cx-w,cy+y,w*2,1,c); } }
  spr(g,sp,pal,x,y,px,flip){
    x=Math.round(x); y=Math.round(y);
    for(let ry=0;ry<sp.length;ry++){ const row=sp[ry];
      for(let rx=0;rx<row.length;rx++){ const ch=row[rx]; if(ch==='.'||ch===' ')continue; const col=pal[ch]; if(!col)continue;
        const cx = flip ? (row.length-1-rx) : rx;
        this.r(g,x+cx*px,y+ry*px,px,px,col); } }
  }
  text(g,str,x,y,px,col,diss){
    let cx=x;
    for(const ch of str.toUpperCase()){ const gl=GLYPH[ch]||GLYPH[' '];
      for(let ry=0;ry<7;ry++) for(let rx=0;rx<5;rx++){
        if(gl[ry][rx]!=='#') continue;
        if(diss>0 && rnd(rx*13+ry*31+cx) < diss) continue;
        this.r(g,cx+rx*px,y+ry*px,px,px,col);
      }
      cx += 6*px;
    }
    return cx-px;
  }
  textW(str,px){ return str.length*6*px-px; }

  /* ---------- mondo ---------- */
  world(s,t){
    const g=this.wctx, H=this.H, HZ=this.HZ, GR=this.GR;
    const b1=Math.round(HZ*0.34), b2=Math.round(HZ*0.68);
    const pAt=x=>clamp(x/ST,0,1)*NB;
    for(let x=0;x<200;x+=4){
      const p=pAt(s+x), i=Math.min(NB-1,Math.floor(p)), f=p-i;
      const a=BIOMES[i], b=BIOMES[i+1];
      const st=mix(a.st,b.st,f), sb=mix(a.sb,b.sb,f), md=mix(a.mid,b.mid,f), mdD=mix(a.midD,b.midD,f), gr=mix(a.g,b.g,f), grD=mix(a.gd,b.gd,f);
      this.r(g,x,0,4,b1,st); this.r(g,x,b1,4,b2-b1,mix(st,sb,.5)); this.r(g,x,b2,4,HZ-b2,sb);
      this.r(g,x,HZ,4,GR-HZ,md); this.r(g,x,GR-14,4,14,mdD);
      this.r(g,x,GR,4,H-GR,gr); this.r(g,x,Math.round(H*0.933),4,H,grD);
    }
    const p0=pAt(s+100), np=clamp((p0-4.15)/0.85,0,1), sunY=Math.round(HZ*0.28);
    this.disc(g,150,sunY,9,mix(C.gold,C.cream,np));
    this.disc(g,150,sunY,7,mix('#FFD98A',C.cream,np));
    const wsea=bell(p0,0);
    if(wsea>0){ g.globalAlpha=wsea*.8; for(let i=0;i<26;i++){ const y=HZ+6+((i*7)%(GR-HZ-10)); const x=((i*53+Math.floor(t*22))%200); this.r(g,x,y,3,1,C.cream);} g.globalAlpha=1; }
    const wjp=bell(p0,3);
    if(wjp>0){ g.globalAlpha=wjp*.9; for(let i=0;i<22;i++){ const x=(i*47+Math.round(Math.sin(t*.9+i)*14)+Math.round(t*9))%200; const y=(i*31+Math.round(t*20))%(H-26); this.r(g,x,y,2,2,i%3?C.pink:'#F0BCC0');} g.globalAlpha=1; }
    const weg=bell(p0,2);
    if(weg>0){ g.globalAlpha=weg*.45; for(let i=0;i<24;i++){ const x=(i*53+Math.round(t*38))%210-5; this.r(g,x,HZ-24+((i*23)%112),3,1,'#F4E3BE');} g.globalAlpha=1; }
    if(np>0){ g.globalAlpha=np; for(let i=0;i<30;i++){ const x=(i*67)%200, y=(i*37)%(HZ-70); if(Math.floor(t*3+i)%5) this.r(g,x,y,1,1,C.cream);} 
      g.globalAlpha=np*.6; for(let i=0;i<18;i++){ const x=(i*23+7)%200; this.r(g,x,GR+8+(i%4)*9,2,5,C.gold);} g.globalAlpha=1; }
    for(let i=0;i<FEATS.length;i++){
      const ft=FEATS[i], sx=100+(ft.t*ST-s)*ft.f;
      if(sx<-70||sx>270) continue;
      this.feat(g,ft.k,sx,i,t);
    }
    g.globalAlpha=.32;
    for(let i=0;i<40;i++){ const x=(Math.round(i*37-s)%220+220)%220-10; this.r(g,x,GR+6+(i%5)*11,2,2,C.night); }
    g.globalAlpha=1;
  }
  feat(g,k,x,i,t){
    const HORIZON=this.HZ, FEET=this.FT;
    if(k==='island'){ this.tri(g,x,HORIZON+2,44,16,C.dgreen); this.tri(g,x+16,HORIZON+2,26,9,C.green); }
    else if(k==='palm'){ this.r(g,x,FEET-34,3,34,C.khaki); for(let j=0;j<4;j++){ const d=j<2?-1:1, o=j%2; this.r(g,x+(d>0?3:-13),FEET-36-o*5,13,3,C.dgreen);} this.r(g,x-3,FEET-40,9,4,C.green); }
    else if(k==='boat'){ this.r(g,x-11,HORIZON+22,22,5,C.cream); this.r(g,x-8,HORIZON+27,16,3,C.coral); this.r(g,x-1,HORIZON+8,2,14,C.khaki); this.tri(g,x+5,HORIZON+22,10,14,C.cream); }
    else if(k==='hill'){ this.tri(g,x,HORIZON+8,80,30,mix(C.green,C.dgreen,.4)); }
    else if(k==='colosseo'){
      const base=HORIZON+16;
      this.rr(g,x-46,base-56,58,56,6,C.trav);
      this.rr(g,x+4,base-40,44,40,5,C.trav);
      for(let tier=0;tier<3;tier++){ const ay=base-50+tier*16;
        for(let j=0;j<5;j++) this.rr(g,x-40+j*11,ay,6,11,3,C.travD); }
      for(let tier=0;tier<2;tier++){ const ay=base-34+tier*16;
        for(let j=0;j<4;j++) this.rr(g,x+8+j*10,ay,6,11,3,C.travD); }
      this.r(g,x-49,base-4,100,6,C.travD);
    }
    else if(k==='aqueduct'){
      for(let j=0;j<5;j++) this.r(g,x-30+j*15,HORIZON+4,6,34,C.trav);
      this.r(g,x-32,HORIZON-4,78,9,C.trav);
      for(let j=0;j<4;j++) this.rr(g,x-24+j*15,HORIZON+4,9,20,4,C.travD);
    }
    else if(k==='cypress'){
      this.r(g,x+2,FEET-6,3,6,'#5A3F26');
      for(let r=0;r<28;r++){ const w=Math.max(2,Math.round(8*Math.sin((r+3)/34*Math.PI))); this.r(g,x+4-w/2,FEET-34+r,w,1,'#274A38'); }
    }
    else if(k==='pyramid'||k==='pyramid2'){
      const w=k==='pyramid2'?100:72, h=k==='pyramid2'?62:46, base=HORIZON+12;
      for(let r=0;r<h;r++){ const ww=Math.max(1,Math.round(w*(r+1)/h)), y=base-h+r;
        this.r(g,x-ww/2,y,Math.ceil(ww/2),1,'#EBD3A0'); this.r(g,x,y,Math.ceil(ww/2),1,'#C29A62'); }
      this.r(g,x-3,base-9,6,9,'#8A6A3C');
    }
    else if(k==='dune'){ for(let r=0;r<20;r++){ const ww=Math.round(96*(r+1)/20); this.r(g,x-ww/2,HORIZON+4+r,ww,1,'#D8B278'); } }
    else if(k==='obelisk'){ this.r(g,x,FEET-36,7,36,'#EBD3A0'); this.r(g,x+4,FEET-36,3,36,'#C29A62'); this.tri(g,x+3,FEET-36,7,6,C.gold); this.r(g,x-2,FEET-3,11,3,'#C29A62'); }
    else if(k==='pagoda'||k==='pagoda2'){
      const tiers=k==='pagoda2'?2:3, base=HORIZON+18;
      let w=54, y=base;
      this.r(g,x-30,base-3,60,7,C.travD);
      for(let ti=0;ti<tiers;ti++){
        y=base-4-ti*20;
        this.r(g,x-w/2-3,y-3,w+6,3,'#7E2E22');
        this.r(g,x-w/2,y-7,w,4,'#A8402F');
        this.r(g,x-w/2+5,y-10,w-10,4,'#A8402F');
        this.r(g,x-(w-16)/2,y-21,w-16,12,'#EFE3CE');
        for(let j=0;j<3;j++) this.r(g,x-9+j*8,y-18,4,7,'#3F2A22');
        w-=12;
      }
      this.tri(g,x,y-21,6,8,C.gold);
    }
    else if(k==='torii'){
      this.r(g,x,FEET-34,5,34,'#C24A34'); this.r(g,x+26,FEET-34,5,34,'#C24A34');
      this.r(g,x-6,FEET-34,43,5,'#C24A34'); this.r(g,x-4,FEET-29,39,3,'#8E2E22'); this.r(g,x-2,FEET-24,35,4,'#C24A34');
    }
    else if(k==='sakura'){
      this.r(g,x+6,FEET-16,4,16,'#5A3F26'); this.r(g,x+2,FEET-14,4,3,'#5A3F26'); this.r(g,x+10,FEET-18,4,3,'#5A3F26');
      this.disc(g,x+8,FEET-26,8,C.pink); this.disc(g,x-1,FEET-22,6,'#F0BCC0'); this.disc(g,x+17,FEET-21,6,'#F0BCC0');
    }
    else if(k==='column'){ this.r(g,x,FEET-30,7,30,C.trav); this.r(g,x-2,FEET-34,11,4,'#EFE3CE'); for(let j=0;j<4;j++) this.r(g,x+2,FEET-26+j*7,2,4,C.travD); }
    else if(k==='sign'){ this.r(g,x+4,FEET-18,3,18,C.khaki); this.rr(g,x-6,FEET-30,22,14,2,'#C4A472'); this.r(g,x-4,FEET-28,18,10,'#8A6A3C');
      this.r(g,x-2,FEET-25,6,2,C.cream); this.r(g,x-2,FEET-21,10,2,C.cream); }
    else if(k==='mesa'){ const h=30+((i*5)%3)*12, base=HORIZON+14;
      this.r(g,x-26,base-h,52,h+16,mix(C.rock,'#8A4029',.3));
      this.r(g,x-26,base-h,52,4,'#D0714B');
      this.r(g,x-26,base-h+9,52,3,'#8A4029');
      this.r(g,x-26,base-h+18,52,2,'#C4664A');
      this.r(g,x-26,base-h+26,52,3,'#8A4029'); }
    else if(k==='cactus'){ this.r(g,x,FEET-26,6,26,C.green); this.r(g,x-6,FEET-20,6,3,C.green); this.r(g,x-6,FEET-20,3,10,C.green); this.r(g,x+6,FEET-16,6,3,C.green); this.r(g,x+9,FEET-24,3,11,C.green); }
    else if(k==='rock'){ this.rr(g,x,FEET-10,16,10,3,'#8A4029'); this.r(g,x+3,FEET-9,7,2,'#B4573C'); }
    else if(k==='tower'){ const h=54+((i*7)%3)*16; this.r(g,x-14,HORIZON-h,28,h+8,'#0F4463');
      for(let a=0;a<3;a++) for(let b=0;b<Math.floor(h/12);b++){ if(Math.floor(t*2+i*3+a+b)%4) this.r(g,x-9+a*8,HORIZON-h+6+b*12,4,5,C.gold); } }
    else if(k==='block'){ const h=38; this.r(g,x-11,HORIZON+6-h,22,h+18,C.night);
      for(let a=0;a<2;a++) for(let b=0;b<3;b++){ if(Math.floor(t*3+i+a*2+b)%3) this.r(g,x-6+a*8,HORIZON+12-h+b*11,4,5,mix(C.gold,C.coral,(a+b)%2?.5:0)); } }
    else if(k==='lamp'){ this.r(g,x,FEET-40,3,40,C.night); this.r(g,x-4,FEET-44,11,4,C.night); this.disc(g,x+1,FEET-40,4,C.gold); g.globalAlpha=.25; this.disc(g,x+1,FEET-38,13,C.gold); g.globalAlpha=1; }
  }
  grass(g,x,i,t){
    const FEET=this.FT, sw=Math.sin(t*3+i)*1;
    for(let j=0;j<9;j++){
      const gx=x+j*5, h=8+((i+j)%3)*3;
      this.tri(g,gx,FEET+14,7,h,'#1E4536');
      this.tri(g,gx+sw,FEET+11,5,h-3,'#2F5A45');
    }
  }
  walkers(s,t){
    const g=this.wctx, FEET=this.FT;
    const step=t*5.6;
    const xs=[132,118,104,90,76,62];
    for(let i=0;i<CREW.length;i++){
      const inn=clamp((t-T_WALK_IN-i*0.09)/1.1,0,1);
      const c=CREW[i], fr=Math.floor(step+i*0.55)%2===0;
      const bob=Math.floor(Math.sin((step+i*0.7)*Math.PI)*1.4);
      const x=xs[i]-130*(1-easeOut(inn));
      this.spr(g,SPR[c.sp][fr?0:1],c,x,FEET-24+bob,2,false);
      g.globalAlpha=.22; this.r(g,x+1,FEET-1,12,2,C.night); g.globalAlpha=1;
    }
    /* Allan: cammina, e ogni tanto si stacca da terra */
    const ax0 = 40-150*(1-easeOut(clamp((t-T_WALK_IN-0.5)/1.2,0,1)));
    const fc=(t-(T_WALK_IN+1.8))/4.6, fp=fc>0?fc-Math.floor(fc):-1;
    const flying = fp>=0 && fp<0.44;
    let lift=0, sp=ALAN_A, ax=ax0;
    if(flying){
      const u=fp/0.44;
      lift = Math.sin(u*Math.PI)*30;
      ax = ax0 + Math.sin(u*Math.PI)*9;
      sp = Math.floor(t*11)%2 ? ALAN_UP : ALAN_DN;
    } else {
      sp = Math.floor(step*0.8)%2===0 ? ALAN_A : ALAN_B;
      lift = Math.floor(Math.sin(step*0.8*Math.PI)*1.2)*-1;
    }
    this.spr(g,sp,P_ALAN,ax,FEET-20-lift,2,true);
    const sh=clamp(1-lift/34,0.35,1);
    g.globalAlpha=.22*sh; this.r(g,ax+2+(1-sh)*4,FEET-1,20*sh,2,C.night); g.globalAlpha=1;
    for(let i=0;i<FG.length;i++){
      const sx=100+(FG[i].t*ST-s)*1.12;
      if(sx<-50||sx>250) continue;
      this.grass(g,sx,i,t);
    }
  }

  /* ---------- scena finale: POV al tavolo ---------- */
  phoneRect(){
    const w=56, h=this.PH_H, x=100-w/2, y=this.PH_Y;
    return {x, y, w, h, sx:x+4, sy:y+5, sw:w-8, sh:h-10};
  }
  povScene(g,t,a){
    const H=this.H, S=Math.round(H*0.475), rowB=Math.round(H*0.255), pal=CREWP;
    const P=(i,extra)=>Object.assign({h:pal[i].h,s:pal[i].s,b:pal[i].b,e:'#20303C',w:C.cream,o:'#0B1A26',p:C.deep},extra||{});
    g.save(); g.globalAlpha=a;
    this.r(g,-300,-400,800,1400,C.deep2);
    this.r(g,-300,S-4,800,H,'#0A2434');
    g.globalAlpha=a*.14; this.disc(g,100,S+30,120,C.gold); g.globalAlpha=a;

    /* ===== ZONA 2: angolo cucina (cella in alto a sinistra) ===== */
    const ax=4, ay=6, aw=92, ah=rowB-16;
    this.r(g,ax-2,ay-2,aw+4,ah+4,C.travD);
    this.r(g,ax,ay,aw,ah,'#0E3550');
    this.r(g,ax,ay+ah-16,aw,16,'#0A2434');
    /* piano cottura */
    this.r(g,ax+40,ay+ah-34,50,7,C.trav);
    this.r(g,ax+40,ay+ah-27,50,11,'#6E5227');
    for(let b=0;b<2;b++){
      const bx=ax+50+b*22, by=ay+ah-36;
      g.globalAlpha=a*.5; this.disc(g,bx,by+2,7,C.coral); g.globalAlpha=a;
      this.disc(g,bx,by+2,4,C.gold);
      /* pentola */
      this.r(g,bx-7,by-8,15,8,'#59636B'); this.r(g,bx-8,by-9,17,2,'#7E8A93');
      for(let s=0;s<3;s++){
        const sy=by-12-(((t*13+s*7+b*4)%20));
        g.globalAlpha=a*clamp(1-(by-12-sy)/20,0,1)*.55;
        this.r(g,bx-3+((s*5)%7),sy,3,3,C.cream);
      }
      g.globalAlpha=a;
    }
    /* amico di spalle che cucina */
    g.globalAlpha=a*.12; this.disc(g,ax+22,ay+ah-30,26,C.gold); g.globalAlpha=a;
    this.spr(g,COOK,P(3),ax+8,ay+ah-52,2,false);
    this.r(g,ax+30,ay+ah-34,10,3,pal[3].s);

    /* ===== ZONA 3: due amici in poltrona, si guardano ridendo ===== */
    const bx0=104, bw=92;
    this.r(g,bx0-2,ay-2,bw+4,ah+4,C.travD);
    this.r(g,bx0,ay,bw,ah,'#0E3550');
    this.r(g,bx0,ay+ah-14,bw,14,'#0A2434');
    /* finestra con cielo stellato */
    const wx=bx0+30, wy=ay+6, wh=Math.max(22,Math.round(ah*0.34)), ww=48;
    this.r(g,wx-3,wy-3,ww+6,wh+6,C.travD);
    this.r(g,wx,wy,ww,wh,'#04121F');
    this.r(g,wx,wy,ww,Math.round(wh*0.45),'#0A2440');
    for(let i=0;i<14;i++){
      const sx=wx+2+((i*13)%(ww-3)), sy=wy+2+((i*9)%(wh-3));
      const tw=Math.floor(t*1.7+i*0.7)%5;
      if(tw===0) continue;
      this.r(g,sx,sy,1,1,C.cream);
      if(tw>3){ this.r(g,sx-1,sy,1,1,'#9FC4D8'); this.r(g,sx+1,sy,1,1,'#9FC4D8'); }
    }
    this.disc(g,wx+ww-9,wy+8,5,'#EDE6D2'); this.disc(g,wx+ww-12,wy+6,4,'#0A2440');
    this.r(g,wx+Math.round(ww/2),wy,2,wh,C.travD);
    /* poltrone che si fronteggiano */
    const chY=ay+ah-40;
    this.rr(g,bx0+4,chY,30,34,4,C.green);   this.rr(g,bx0+8,chY+6,22,24,3,'#4A7E68');
    this.rr(g,bx0+58,chY,30,34,4,C.green);  this.rr(g,bx0+62,chY+6,22,24,3,'#4A7E68');
    /* i due amici, sguardi che si incrociano */
    this.spr(g,SEAT34,P(2),bx0+6,chY-14,2,false);
    this.spr(g,SEAT34,P(4),bx0+62,chY-14,2,true);
    /* i loro telefoni: neri con bagliore, mostrati all'altro */
    const ph=[{x:bx0+34,y:chY+2,s:pal[2].s},{x:bx0+50,y:chY+8,s:pal[4].s}];
    for(const q of ph){
      g.globalAlpha=a*.16; this.disc(g,q.x+5,q.y+3,11,C.gold); g.globalAlpha=a;
      this.rr(g,q.x,q.y,11,7,2,'#0B1A26'); this.r(g,q.x+2,q.y+2,7,3,'#7E5A18'); this.r(g,q.x+3,q.y+3,4,1,C.gold);
      this.r(g,q.x-3,q.y+1,4,5,q.s);
    }
    /* risate: piccoli segni */
    g.globalAlpha=a*.8;
    this.r(g,bx0+26,chY-20,2,2,C.gold); this.r(g,bx0+30,chY-24,2,2,C.gold);
    this.r(g,bx0+64,chY-22,2,2,C.gold);
    g.globalAlpha=a;

    /* ===== ZONA 1: camino, due amici a carte ===== */
    const cy0=rowB, cw=192, chh=S-6-rowB;
    this.r(g,2,cy0-2,cw+4,chh+4,C.travD);
    this.r(g,4,cy0,cw,chh,'#0E3550');
    this.r(g,4,cy0+chh-24,cw,24,'#0A2434');
    /* camino */
    const fx=10, fy=cy0+10, fh=chh-24;
    this.r(g,fx-4,fy-8,44,8,C.trav);
    this.r(g,fx,fy,36,fh,C.travD);
    this.r(g,fx+5,fy+7,26,fh-16,'#0B1A26');
    for(let j=0;j<4;j++){
      const flh=10+Math.round((Math.sin(t*7+j*1.6)+1)*7);
      this.tri(g,fx+9+j*6,fy+fh-11,7,flh,C.coral);
      this.tri(g,fx+9+j*6,fy+fh-11,4,Math.round(flh*0.6),C.gold);
    }
    this.r(g,fx+5,fy+fh-13,26,5,'#5A3F26');
    g.globalAlpha=a*.20; this.disc(g,fx+18,fy+fh-20,52,C.coral);
    g.globalAlpha=a*.13; this.disc(g,fx+18,fy+fh-20,84,C.gold); g.globalAlpha=a;
    /* zaino da viaggio e lampada d'angolo */
    this.rr(g,160,cy0+chh-34,22,18,4,'#3F5E4A');
    this.rr(g,164,cy0+chh-30,14,7,2,'#2E4A38');
    this.r(g,165,cy0+chh-38,4,4,C.khaki); this.r(g,174,cy0+chh-38,4,4,C.khaki);
    this.r(g,150,cy0+16,3,26,C.travD); this.r(g,146,cy0+40,11,3,C.travD);
    for(let i=0;i<9;i++) this.r(g,144+Math.round(i*0.4),cy0+7+i,18-i,1,i<2?'#FFD98A':C.gold);
    g.globalAlpha=a*.11; this.disc(g,152,cy0+18,34,C.gold); g.globalAlpha=a;
    g.globalAlpha=a*.16;
    for(let y=0;y<9;y++){ const w=Math.round(52*Math.sqrt(Math.max(0,1-((y-4)/5)*((y-4)/5)))); this.r(g,108-w,cy0+chh-16+y,w*2,1,'#8E4436'); }
    g.globalAlpha=a;
    /* cuscini + due amici uno di fronte all'altro */
    const gy=cy0+chh-30;
    this.rr(g,62,gy+18,28,10,4,'#8E4436'); this.rr(g,126,gy+18,28,10,4,'#3F5E4A');
    this.spr(g,CARDS,P(0),64,gy-6,2,false);
    this.spr(g,CARDS,P(3),126,gy-6,2,true);
    /* carte per terra */
    for(let i=0;i<6;i++){
      const cx2=98+((i*9)%22)+ (i%2?0:6), cy2=gy+16+((i*5)%9);
      this.r(g,cx2,cy2,6,8,C.cream); this.r(g,cx2+1,cy2+1,4,6,i%2?C.coral:'#5A6E7A');
    }
    this.r(g,90,gy+8,5,7,C.cream); this.r(g,124,gy+10,5,7,C.cream);
    g.restore();
  }
  hands(g,R,hs,a){
    const s1=C.skin, s2='#D8A97E', o='#0B1A26', ty=this.TITLE_Y;
    g.save(); g.globalAlpha=a;
    /* maglietta di chi guarda, ai lati del telefono */
    this.r(g,-10,ty-34,R.x-2,36,'#0E3550');
    this.r(g,R.x+R.w+2,ty-34,212-(R.x+R.w),36,'#0E3550');
    this.r(g,-10,ty-34,R.x-2,2,'#17567C');
    this.r(g,R.x+R.w+2,ty-34,212-(R.x+R.w),2,'#17567C');
    /* avambracci: un'unica sagoma piena fino alla maglietta */
    const w=25*hs, h=R.h*0.46, y=R.y+R.h*0.40;
    for(const sg of [-1,1]){
      const skin = sg<0 ? s1 : s2;
      const cx = sg<0 ? R.x-w+6*hs+w/2 : R.x+R.w-4*hs+w/2;
      const aw=24*hs, ay=y+h-14*hs, ah=Math.max(10,(ty-3)-ay);
      const ax=cx-aw/2+sg*7*hs;
      this.rr(g,ax-hs,ay-hs,aw+2*hs,ah+2*hs,9*hs,o);
      this.rr(g,ax,ay,aw,ah,9*hs,skin);
    }
    /* mani: sagome piene che stringono il telefono */
    this.rr(g,R.x-w+5*hs,y-hs,w+2*hs,h+2*hs,9*hs,o);
    this.rr(g,R.x-w+6*hs,y,w,h,9*hs,s1);
    this.rr(g,R.x+R.w-5*hs,y-hs,w+2*hs,h+2*hs,9*hs,o);
    this.rr(g,R.x+R.w-4*hs,y,w,h,9*hs,s2);
    g.restore();
  }
  bubble(g,x,y,w,h,em,pop,pulse){
    if(pop<=0) return;
    const sc=0.6+0.4*easeOut(Math.min(1,pop*2.2));
    const bw=Math.round(w*sc), bh=Math.round(h*sc);
    const yy=y+(h-bh)/2+Math.sin(pulse)*1.4;
    this.rr(g,x-1,yy-1,bw+2,bh+2,3,C.night);
    this.rr(g,x,yy,bw,bh,3,C.cream);
    this.r(g,x+4,yy+bh,4,3,C.cream); this.r(g,x+4,yy+bh+3,3,2,C.night);
    if(pop>0.35) this.spr(g,em.s,{'#':em.c},x+Math.round((bw-14)/2),yy+Math.round((bh-14)/2),2,false);
  }
  bubbles(g,t,forced){
    const H=this.H, rowB=Math.round(H*0.255), ah=rowB-16, S=Math.round(H*0.475);
    const chats=[
      {x:14,  y:9,    em:{s:EM_STAR,c:C.gold},   at:0.2, ph:3.1},
      {x:150, y:9,    em:{s:EM_SMILE,c:C.gold},  at:0.6, ph:2.6},
      {x:86,  y:S-72, em:{s:EM_HEART,c:C.coral}, at:1.0, ph:2.2}
    ];
    for(const ch of chats)
      this.bubble(g,ch.x,ch.y,26,21,ch.em,forced?1:clamp((t-(T_ROOM-1.6+ch.at))/0.5,0,1),t*ch.ph);
  }
  title(g,t){
    const H=this.H, p=clamp((t-T_TITLE)/0.5,0,1), px=H>=400?4:3;
    const ty=this.TITLE_Y;
    g.globalAlpha=p*.5; this.r(g,0,ty-16,200,16,C.night);
    g.globalAlpha=p; this.r(g,0,ty,200,H-ty,C.night); g.globalAlpha=1;
    const lines=['ALL FOR','ONE'];
    let shown=Math.floor(p*12), y1=ty+8;
    for(let li=0;li<2;li++){
      const l=lines[li], w=this.textW(l,px);
      let cx=Math.round((200-w)/2);
      for(let i=0;i<l.length;i++){
        if(shown<=0) break; shown--;
        this.text(g,l[i],cx+1,y1+1,px,'#8A5F14',0);
        this.text(g,l[i],cx,y1,px,C.gold,0);
        cx+=6*px;
      }
      y1 += 7*px+5;
    }
    if(p>0.8){
      const px2=2, l2='ALL41', w2=this.textW(l2,px2);
      g.globalAlpha=clamp((p-0.8)/0.2,0,1);
      this.r(g,Math.round((200-w2)/2)-4,y1,w2+8,1,C.gold);
      this.text(g,l2,Math.round((200-w2)/2),y1+6,px2,C.cream,0);
      g.globalAlpha=1;
    }
  }

  /* ---------- regia ---------- */
  draw(t){
    const g=this.ctx, H=this.H, CY=this.CY;
    this.r(g,0,0,200,H,C.night);

    const walkP=clamp((t-T_SCROLL)/(T_WALK_END-T_SCROLL),0,1);
    const se = walkP<0.08 ? easeOut(walkP/0.08)*0.08 : walkP;
    const drift=clamp((t-T_WALK_END)/(T_ROOM-T_WALK_END),0,1);
    const s = ST*(0.96*se + 0.04*easeOut(drift));

    if(t>0.7){
      this.world(s,t);
      this.walkers(s,t);
      g.drawImage(this.wc,0,0,200,H,0,0,200,H);
      const fade=Math.min(clamp((t-T_LOOP_A)/0.4,0,1),clamp((T_LOOP_B-t)/0.4,0,1));
      if(fade<1){ g.globalAlpha=(1-fade)*0.92; this.r(g,0,0,200,H,C.night); g.globalAlpha=1; }
    }

    /* sigla d'apertura */
    if(t<1.2){
      const fade = t<0.9 ? 1 : 1-(t-0.9)/0.3;
      g.globalAlpha=fade; this.r(g,0,0,200,H,C.night); g.globalAlpha=1;
      const app=clamp(t/0.35,0,1);
      const diss=clamp((t-0.72)/0.4,0,1);
      const px=4, w=this.textW('ALL41',px), x=Math.round((200-w)/2), y=CY-18;
      g.globalAlpha=fade*0.16*app*(0.6+0.4*Math.sin(t*9));
      this.rr(g,x-10,y-8,w+20,7*px+16,4,C.gold); g.globalAlpha=fade;
      if(t>0.55&&t<0.68){ g.globalAlpha=fade*0.4; this.r(g,0,0,200,H,C.cream); g.globalAlpha=fade; }
      g.globalAlpha=fade*app;
      this.text(g,'ALL41',x+1,y+1,px,'#8A5F14',diss);
      this.text(g,'ALL41',x,y,px,C.gold,diss);
      g.globalAlpha=fade*app*0.55; this.text(g,'ALL41',x,y-1,px,C.cream,clamp(diss+0.35,0,1));
      g.globalAlpha=fade*app*0.25;
      for(let i=0;i<4;i++) this.r(g,20,y-22+i*22,160,1,C.deep);
      g.globalAlpha=1;
    }

    if(this.props.scanlines ?? true){
      g.globalAlpha=0.10; g.fillStyle=C.night;
      for(let y=0;y<H;y+=3) g.fillRect(0,y,200,1);
      g.globalAlpha=1;
    }
  }


  render() {
    const pronta = this.state.ready && this.state.phase !== 'app'
    return (
      <div className="intro" ref={this.wrapRef} onClick={() => this.onTap()}>
        <canvas ref={this.canvasRef} width={200} className="intro-tela" />

        {/* Il tasto compare solo quando l'intro ha girato abbastanza da
            valere la pena averla vista: prima non c'e' niente da
            saltare, e un "Salta" al primo fotogramma e' un invito a
            saltarla. */}
        {pronta && (
          <button type="button" className="intro-inizia" onClick={() => this.onTap()}>
            {this.props.startLabel ?? 'Inizia \u25b8'}
          </button>
        )}
      </div>
    )
  }
}

export default Intro
