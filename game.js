// Battle Tetris - Competitive 2-Player Tetris
// P1: A/D=Move W=Rotate S=SoftDrop J=HardDrop K=Hold | P2: Arrows R=HardDrop T=Hold

const ARCADE_CONTROLS = {
  'P1U':['w'],'P1D':['s'],'P1L':['a'],'P1R':['d'],'P1A':['u'],'P1B':['i'],'P1C':['o'],'P1X':['j'],'P1Y':['k'],'P1Z':['l'],'START1':['1','Enter'],
  'P2U':['ArrowUp'],'P2D':['ArrowDown'],'P2L':['ArrowLeft'],'P2R':['ArrowRight'],'P2A':['r'],'P2B':['t'],'P2C':['y'],'P2X':['f'],'P2Y':['g'],'P2Z':['h'],'START2':['2']
};

const K2A={};
for(const[a,keys]of Object.entries(ARCADE_CONTROLS)){
  if(keys)(Array.isArray(keys)?keys:[keys]).forEach(k=>K2A[k]=a);
}

// Tetromino pieces (7 types with rotations)
const PC={
  I:{c:0x00FFFF,s:[[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],[[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],[[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],[[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]]},
  O:{c:0xFFFF00,s:[[[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]]]},
  T:{c:0xAA00FF,s:[[[0,1,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],[[0,1,0,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]],[[0,0,0,0],[1,1,1,0],[0,1,0,0],[0,0,0,0]],[[0,1,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]]]},
  S:{c:0x00FF00,s:[[[0,1,1,0],[1,1,0,0],[0,0,0,0],[0,0,0,0]],[[0,1,0,0],[0,1,1,0],[0,0,1,0],[0,0,0,0]],[[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]],[[1,0,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]]]},
  Z:{c:0xFF0000,s:[[[1,1,0,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],[[0,0,1,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]],[[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]],[[0,1,0,0],[1,1,0,0],[1,0,0,0],[0,0,0,0]]]},
  J:{c:0x0000FF,s:[[[1,0,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],[[0,1,1,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]],[[0,0,0,0],[1,1,1,0],[0,0,1,0],[0,0,0,0]],[[0,1,0,0],[0,1,0,0],[1,1,0,0],[0,0,0,0]]]},
  L:{c:0xFF8800,s:[[[0,0,1,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],[[0,1,0,0],[0,1,0,0],[0,1,1,0],[0,0,0,0]],[[0,0,0,0],[1,1,1,0],[1,0,0,0],[0,0,0,0]],[[1,1,0,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]]]}
};
const TYP=['I','O','T','S','Z','J','L'];

let g,p1,p2,st=0,win=0,txt=[];

new Phaser.Game({type:Phaser.AUTO,width:800,height:600,backgroundColor:'#000',scene:{create,update}});

// Helper functions
function mkP(id,x){
  return{id,x,y:50,b:Array(20).fill(0).map(()=>Array(10).fill(0)),t:null,r:0,px:3,py:0,bag:[],nxt:[],hld:null,hu:false,pg:0,tm:0,spd:600,sd:false,cmb:0,lns:0,ts:false};
}

function shuf(){
  const b=[...TYP];
  for(let i=b.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [b[i],b[j]]=[b[j],b[i]];
  }
  return b;
}

function nxt(p){
  if(p.bag.length===0)p.bag=shuf();
  return p.bag.shift();
}

function fillNxt(p){
  while(p.nxt.length<4)p.nxt.push(nxt(p));
}

function newPc(p){
  fillNxt(p);
  p.t=p.nxt.shift();
  p.r=0;
  p.px=3;
  p.py=0;
  p.hu=false;
  p.ts=false;
  if(hit(p,p.px,p.py,p.r)){
    st=2;
    win=p.id===1?2:1;
  }
}

function hit(p,x,y,r){
  const s=PC[p.t].s[r];
  for(let row=0;row<4;row++){
    for(let col=0;col<4;col++){
      if(s[row][col]){
        const bx=x+col;
        const by=y+row;
        if(bx<0||bx>=10||by>=20)return true;
        if(by>=0&&p.b[by][bx])return true;
      }
    }
  }
  return false;
}

function mv(p,dx,dy){
  if(!hit(p,p.px+dx,p.py+dy,p.r)){
    p.px+=dx;
    p.py+=dy;
    return true;
  }
  return false;
}

function rot(p){
  const ns=PC[p.t].s.length;
  const nr=(p.r+1)%ns;
  const old=p.r;
  if(!hit(p,p.px,p.py,nr)){
    p.r=nr;
    if(p.t==='T')chkTS(p,old);
    return true;
  }
  const kck=[[1,0],[-1,0],[0,-1],[1,-1],[-1,-1],[2,0],[-2,0]];
  for(const[kx,ky]of kck){
    if(!hit(p,p.px+kx,p.py+ky,nr)){
      p.px+=kx;
      p.py+=ky;
      p.r=nr;
      if(p.t==='T')chkTS(p,old);
      return true;
    }
  }
  return false;
}

function chkTS(p,old){
  let c=0;
  const chk=[[-1,-1],[1,-1],[-1,1],[1,1]];
  for(const[dx,dy]of chk){
    const cx=p.px+1+dx;
    const cy=p.py+1+dy;
    if(cx<0||cx>=10||cy>=20||(cy>=0&&p.b[cy][cx]))c++;
  }
  p.ts=c>=3;
}

function hrd(p,opp){
  while(mv(p,0,1));
  lock(p,opp);
}

function hld(p){
  if(p.hu)return;
  if(p.hld===null){
    p.hld=p.t;
    newPc(p);
  }else{
    [p.hld,p.t]=[p.t,p.hld];
    p.r=0;
    p.px=3;
    p.py=0;
  }
  p.hu=true;
}

function lock(p,opp){
  const s=PC[p.t].s[p.r];
  const c=PC[p.t].c;
  for(let row=0;row<4;row++){
    for(let col=0;col<4;col++){
      if(s[row][col]){
        const bx=p.px+col;
        const by=p.py+row;
        if(by>=0&&by<20&&bx>=0&&bx<10)p.b[by][bx]=c;
      }
    }
  }
  const cl=clr(p);
  if(cl>0){
    atk(p,opp,cl);
    p.cmb++;
  }else{
    p.cmb=0;
  }
  addGrb(p);
  newPc(p);
}

function clr(p){
  let cl=[];
  for(let y=0;y<20;y++){
    if(p.b[y].every(c=>c!==0))cl.push(y);
  }
  if(cl.length>0){
    for(const y of cl){
      p.b.splice(y,1);
      p.b.unshift(Array(10).fill(0));
    }
    p.lns+=cl.length;
  }
  return cl.length;
}

function atk(p,opp,lns){
  let g=0;
  if(lns===1)g=0;
  else if(lns===2)g=1;
  else if(lns===3)g=2;
  else if(lns===4)g=4;
  if(p.ts){
    if(lns===2)g=4;
    else if(lns===3)g=6;
  }
  if(p.cmb>1)g+=p.cmb-1;
  if(g>0){
    if(opp.pg>0){
      const cnc=Math.min(g,opp.pg);
      opp.pg-=cnc;
      g-=cnc;
    }
    if(g>0)opp.pg+=g;
  }
}

function addGrb(p){
  if(p.pg===0)return;
  const h=Math.floor(Math.random()*10);
  for(let i=0;i<p.pg;i++){
    p.b.pop();
    const ln=Array(10).fill(0x666666);
    ln[h]=0;
    p.b.unshift(ln);
  }
  p.pg=0;
}

function create(){
  g=this.add.graphics();
  p1=mkP(1,60);
  p2=mkP(2,480);
  fillNxt(p1);
  fillNxt(p2);
  newPc(p1);
  newPc(p2);
  txt.push(this.add.text(400,15,'BATTLE TETRIS',{fontSize:'28px',color:'#0ff'}).setOrigin(0.5));
  txt.push(this.add.text(155,30,'PLAYER 1',{fontSize:'16px',color:'#0f0'}).setOrigin(0.5));
  txt.push(this.add.text(575,30,'PLAYER 2',{fontSize:'16px',color:'#f00'}).setOrigin(0.5));
  txt.push(this.add.text(400,575,'Press START to begin',{fontSize:'14px',color:'#ff0'}).setOrigin(0.5));
  
  this.input.keyboard.on('keydown',e=>{
    const k=K2A[e.key]||e.key;
    if(st===0&&(k==='START1'||k==='START2')){
      st=1;
      txt[3].setText('');
      return;
    }
    if(st===2&&(k==='START1'||k==='START2')){
      p1=mkP(1,60);
      p2=mkP(2,480);
      fillNxt(p1);
      fillNxt(p2);
      newPc(p1);
      newPc(p2);
      st=1;
      win=0;
      txt[3].setText('');
      return;
    }
    if(st!==1)return;
    if(k==='P1L')mv(p1,-1,0);
    else if(k==='P1R')mv(p1,1,0);
    else if(k==='P1U')rot(p1);
    else if(k==='P1D')p1.sd=true;
    else if(k==='P1X')hrd(p1,p2);
    else if(k==='P1Y')hld(p1);
    else if(k==='P2L')mv(p2,-1,0);
    else if(k==='P2R')mv(p2,1,0);
    else if(k==='P2U')rot(p2);
    else if(k==='P2D')p2.sd=true;
    else if(k==='P2X')hrd(p2,p1);
    else if(k==='P2Y')hld(p2);
  });
  
  this.input.keyboard.on('keyup',e=>{
    const k=K2A[e.key]||e.key;
    if(k==='P1D')p1.sd=false;
    if(k==='P2D')p2.sd=false;
  });
}

function update(_,d){
  if(st!==1)return;
  p1.tm+=d;
  p2.tm+=d;
  const s1=p1.sd?50:p1.spd;
  const s2=p2.sd?50:p2.spd;
  if(p1.tm>=s1){
    p1.tm=0;
    if(!mv(p1,0,1))lock(p1,p2);
  }
  if(p2.tm>=s2){
    p2.tm=0;
    if(!mv(p2,0,1))lock(p2,p1);
  }
  draw();
}

function draw(){
  g.clear();
  drwP(p1);
  drwP(p2);
  drwUI(p1,60);
  drwUI(p2,480);
  if(st===2){
    g.fillStyle(0x000000,0.8);
    g.fillRect(250,200,300,200);
    g.fillStyle(0xFFFFFF);
    g.fillRect(252,202,296,196);
    g.fillStyle(0x000000);
    g.fillRect(254,204,292,192);
    const w=(win===1?'PLAYER 1':'PLAYER 2')+' WINS!';
    txt[3].setText(w);
    txt[3].setPosition(400,280);
    txt[3].setStyle({fontSize:'24px',color:'#ff0'});
  }
}

function drwP(p){
  const bs=24;
  for(let y=0;y<20;y++){
    for(let x=0;x<10;x++){
      const c=p.b[y][x];
      if(c){
        g.fillStyle(c);
        g.fillRect(p.x+x*bs,p.y+y*bs,bs-1,bs-1);
      }
    }
  }
  g.lineStyle(2,0x444444);
  g.strokeRect(p.x-1,p.y-1,10*bs+2,20*bs+2);
  
  if(p.t&&st===1){
    const s=PC[p.t].s[p.r];
    const c=PC[p.t].c;
    g.fillStyle(c,0.8);
    for(let row=0;row<4;row++){
      for(let col=0;col<4;col++){
        if(s[row][col]){
          const bx=p.px+col;
          const by=p.py+row;
          if(by>=0)g.fillRect(p.x+bx*bs,p.y+by*bs,bs-1,bs-1);
        }
      }
    }
  }
}

function drwUI(p,bx){
  const bs=16;
  let ny=530;
  for(let i=0;i<3;i++){
    if(p.nxt[i]){
      const s=PC[p.nxt[i]].s[0];
      const c=PC[p.nxt[i]].c;
      g.fillStyle(c);
      for(let row=0;row<4;row++){
        for(let col=0;col<4;col++){
          if(s[row][col])g.fillRect(bx+col*bs,ny+row*bs,bs-2,bs-2);
        }
      }
      ny+=70;
    }
  }
  
  if(p.hld){
    const s=PC[p.hld].s[0];
    const c=PC[p.hld].c;
    g.fillStyle(c);
    for(let row=0;row<4;row++){
      for(let col=0;col<4;col++){
        if(s[row][col])g.fillRect(bx+160+col*bs,530+row*bs,bs-2,bs-2);
      }
    }
  }
  
  if(p.pg>0){
    g.fillStyle(0xFF0000);
    g.fillRect(bx,500,p.pg*20,8);
  }
}
