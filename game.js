// PLATRIS - Competitive 2-Player Tetris (Platanus + Tetris)
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

let g,p1,p2,st=0,win=0,txt=[],menu=0,at=0,bestOf=3,p1Wins=0,p2Wins=0,spMode=false,score=0,lvl=1,lns=0,aiTm=0,lb=[],nmEntry=['A','A','A'],nmIdx=0,rulesMode=0;

new Phaser.Game({type:Phaser.AUTO,width:800,height:600,backgroundColor:'#000',scene:{create,update}});

// Helper functions
function mkP(id,x){
  return{id,x,y:50,b:Array(20).fill(0).map(()=>Array(10).fill(0)),t:null,r:0,px:3,py:0,bag:[],nxt:[],hld:null,hu:false,pg:0,tm:0,spd:800,sd:false,cmb:0,lns:0,ts:false};
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
    if(spMode&&p.id===1){
      st=2;
      win=1;
    }else if(!spMode){
      st=2;
      win=p.id===1?2:1;
    }
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
    if(spMode&&p.id===1){
      const pts=[0,100,300,500,800];
      score+=pts[cl.length]*lvl;
      score+=p.cmb>1?(p.cmb-1)*50*lvl:0;
      lns+=cl.length;
      const newLvl=Math.floor(lns/10)+1;
      if(newLvl>lvl){
        lvl=newLvl;
        p.spd=Math.max(100,800-lvl*70);
      }
    }
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
    p.b.shift();
    const ln=Array(10).fill(0x666666);
    ln[h]=0;
    p.b.push(ln);
  }
  p.pg=0;
}

function create(){
  g=this.add.graphics();
  p1=mkP(1,60);
  p2=mkP(2,480);
  
  txt.push(this.add.text(400,15,'',{fontSize:'28px',color:'#0ff'}).setOrigin(0.5));
  txt.push(this.add.text(155,30,'',{fontSize:'16px',color:'#0f0'}).setOrigin(0.5));
  txt.push(this.add.text(575,30,'',{fontSize:'16px',color:'#f00'}).setOrigin(0.5));
  txt.push(this.add.text(400,575,'',{fontSize:'14px',color:'#ff0'}).setOrigin(0.5));
  txt.push(this.add.text(95,508,'NEXT',{fontSize:'11px',color:'#888',fontStyle:'bold'}).setOrigin(0.5));
  txt.push(this.add.text(285,508,'HOLD',{fontSize:'11px',color:'#888',fontStyle:'bold'}).setOrigin(0.5));
  txt.push(this.add.text(515,508,'NEXT',{fontSize:'11px',color:'#888',fontStyle:'bold'}).setOrigin(0.5));
  txt.push(this.add.text(705,508,'HOLD',{fontSize:'11px',color:'#888',fontStyle:'bold'}).setOrigin(0.5));
  txt.push(this.add.text(305,520,'INCOMING',{fontSize:'10px',color:'#f00',fontStyle:'bold'}).setOrigin(0.5).setAngle(90));
  txt.push(this.add.text(725,520,'INCOMING',{fontSize:'10px',color:'#f00',fontStyle:'bold'}).setOrigin(0.5).setAngle(90));
  
  this.input.keyboard.on('keydown',e=>{
    const k=K2A[e.key]||e.key;
    
    if(st===0){
      if(k==='P1U'||k==='P2U'){menu=menu>0?menu-1:0;}
      else if(k==='P1D'||k==='P2D'){menu=menu<2?menu+1:2;}
      else if(k==='START1'||k==='START2'){
        if(menu===0){
          spMode=true;score=0;lvl=1;lns=0;
          p1=mkP(1,60);p2=mkP(2,480);
          fillNxt(p1);newPc(p1);p1.spd=800;st=1;
        }else if(menu===1){spMode=false;st=5;}
        else{st=4;}
      }
      return;
    }
    
    if(st===5){
      if(k==='P1L'||k==='P2L'){bestOf=bestOf>3?bestOf-2:3;}
      else if(k==='P1R'||k==='P2R'){bestOf=bestOf<7?bestOf+2:7;}
      else if(k==='START1'||k==='START2'){
        p1Wins=0;p2Wins=0;
        fillNxt(p1);fillNxt(p2);newPc(p1);newPc(p2);st=1;
      }else if(k==='P1A'||k==='P2A'){st=0;}
      return;
    }
    
    if(st===1&&(k==='START1'||k==='START2')){st=3;return;}
    if(st===3&&(k==='START1'||k==='START2')){st=1;return;}
    
    if(st===2&&(k==='START1'||k==='START2')){
      if(spMode){
        if(lb.length<10||score>lb[lb.length-1].s){
          nmEntry=['A','A','A'];nmIdx=0;st=7;
        }else{st=8;}
      }else{
        const winsNeeded=Math.floor(bestOf/2)+1;
        if(win===1)p1Wins++;
        else p2Wins++;
        
        if(p1Wins>=winsNeeded||p2Wins>=winsNeeded){
          st=6;
        }else{
          p1=mkP(1,60);p2=mkP(2,480);
          fillNxt(p1);fillNxt(p2);newPc(p1);newPc(p2);
          st=1;win=0;
        }
      }
      return;
    }
    
    if(st===4){
      if(k==='START1'||k==='START2'||k==='P1A'||k==='P2A'){st=0;return;}
      if(k==='P1L'||k==='P2L'){rulesMode=0;}
      if(k==='P1R'||k==='P2R'){rulesMode=1;}
      return;
    }
    
    if(st===7){
      if(k==='P1U'||k==='P2U'){nmEntry[nmIdx]=String.fromCharCode(((nmEntry[nmIdx].charCodeAt(0)-65+1)%26)+65);}
      else if(k==='P1D'||k==='P2D'){nmEntry[nmIdx]=String.fromCharCode(((nmEntry[nmIdx].charCodeAt(0)-65+25)%26)+65);}
      else if(k==='P1R'||k==='P2R'){nmIdx=nmIdx<2?nmIdx+1:2;}
      else if(k==='P1L'||k==='P2L'){nmIdx=nmIdx>0?nmIdx-1:0;}
      else if(k==='START1'||k==='START2'){
        lb.push({n:nmEntry.join(''),s:score});
        lb.sort((a,b)=>b.s-a.s);
        if(lb.length>10)lb=lb.slice(0,10);
        st=8;
      }
      return;
    }
    
    if(st===8&&(k==='START1'||k==='START2')){
      p1=mkP(1,60);p2=mkP(2,480);st=0;menu=0;spMode=false;return;
    }
    
    if(st===6&&(k==='START1'||k==='START2')){
      p1=mkP(1,60);p2=mkP(2,480);
      p1Wins=0;p2Wins=0;bestOf=3;st=0;win=0;menu=0;
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
  at+=d;
  if(st===1){
    p1.tm+=d;
    p2.tm+=d;
    const s1=p1.sd?30:p1.spd;
    const s2=p2.sd?30:p2.spd;
    if(p1.tm>=s1){
      p1.tm=0;
      if(!mv(p1,0,1))lock(p1,p2);
    }
    if(!spMode){
      if(p2.tm>=s2){
        p2.tm=0;
        if(!mv(p2,0,1))lock(p2,p1);
      }
    }
  }
  draw();
}

function draw(){
  g.clear();
  
  if(st===0){
    drwMenu();
  }else if(st===4){
    drwRules();
  }else if(st===5){
    drwRoundSelect();
  }else if(st===6){
    drwSeriesWinner();
  }else if(st===7){
    drwNameEntry();
  }else if(st===8){
    drwLeaderboard();
  }else{
    const t=at*0.0005;
    for(let i=0;i<4;i++){
      const h=(i/4+t*0.05)%1;
      const c=Phaser.Display.Color.HSVToRGB(h,0.3,0.15).color;
      g.fillStyle(c);
      g.fillRect(0,i*150,800,150);
    }
    
    for(let i=0;i<15;i++){
      const sx=((i*234)%800);
      const sy=((i*567+t*30)%600);
      g.fillStyle(0xFFFFFF,0.1);
      g.fillCircle(sx,sy,1);
    }
    
    if(spMode){
      txt[0].setText('');txt[1].setText('');txt[2].setText('');txt[3].setText('');
      txt[4].setVisible(false);txt[5].setVisible(false);
      txt[6].setVisible(false);txt[7].setVisible(false);
      txt[8].setVisible(false);txt[9].setVisible(false);
      
      g.fillStyle(0x000000,0.85);
      g.fillRect(20,60,170,480);
      g.lineStyle(4,0xFFDD00);
      g.strokeRect(22,62,166,476);
      
      g.fillStyle(0x8B4513,0.3);
      g.fillRect(25,65,160,470);
      
      drwTxt('PLATRIS',40,85,2,0xFFDD00);
      
      const bx=140,by=80;
      g.fillStyle(0xFFFF00);
      g.fillRect(bx+3,by,3,20);
      g.fillRect(bx+6,by-3,3,3);
      g.fillRect(bx,by+6,9,13);
      g.fillStyle(0xFFDD00);
      g.fillRect(bx+2,by+8,5,9);
      g.fillStyle(0x8B4513);
      g.fillRect(bx+4,by+18,2,5);
      
      g.fillStyle(0xFFDD00,0.5);
      g.fillRect(35,125,130,3);
      
      const spd=p1.spd;
      const spdPct=Math.round((800-spd)/700*100);
      
      txt[0].setText('SCORE');
      txt[0].setPosition(105,150);
      txt[0].setStyle({fontSize:'13px',color:'#999',fontStyle:'bold'});
      txt[0].setOrigin(0.5);
      
      txt[1].setText(score.toString());
      txt[1].setPosition(105,172);
      txt[1].setStyle({fontSize:'26px',color:'#FFFF00',fontStyle:'bold'});
      txt[1].setOrigin(0.5);
      
      g.fillStyle(0xFFDD00,0.3);
      g.fillRect(35,200,130,2);
      
      txt[2].setText('LEVEL');
      txt[2].setPosition(105,220);
      txt[2].setStyle({fontSize:'13px',color:'#999',fontStyle:'bold'});
      txt[2].setOrigin(0.5);
      
      txt[3].setText(lvl.toString());
      txt[3].setPosition(105,242);
      txt[3].setStyle({fontSize:'26px',color:'#00FFFF',fontStyle:'bold'});
      txt[3].setOrigin(0.5);
      
      g.fillStyle(0xFFDD00,0.3);
      g.fillRect(35,270,130,2);
      
      txt[4].setText('LINES');
      txt[4].setPosition(105,290);
      txt[4].setStyle({fontSize:'13px',color:'#999',fontStyle:'bold'});
      txt[4].setOrigin(0.5);
      txt[4].setVisible(true);
      
      txt[5].setText(lns.toString());
      txt[5].setPosition(105,312);
      txt[5].setStyle({fontSize:'26px',color:'#00FF00',fontStyle:'bold'});
      txt[5].setOrigin(0.5);
      txt[5].setVisible(true);
      
      g.fillStyle(0xFFDD00,0.3);
      g.fillRect(35,340,130,2);
      
      txt[6].setText('SPEED');
      txt[6].setPosition(105,360);
      txt[6].setStyle({fontSize:'13px',color:'#999',fontStyle:'bold'});
      txt[6].setOrigin(0.5);
      txt[6].setVisible(true);
      
      txt[7].setText(spdPct+'%');
      txt[7].setPosition(105,382);
      txt[7].setStyle({fontSize:'26px',color:'#FF00FF',fontStyle:'bold'});
      txt[7].setOrigin(0.5);
      txt[7].setVisible(true);
      
      g.fillStyle(0x222222);
      g.fillRect(45,415,120,16);
      g.fillStyle(0xFF00FF);
      g.fillRect(45,415,120*spdPct/100,16);
      g.lineStyle(2,0xFFDD00);
      g.strokeRect(45,415,120,16);
      
      txt[8].setText(spd+'ms');
      txt[8].setPosition(105,450);
      txt[8].setStyle({fontSize:'11px',color:'#777',fontStyle:'italic'});
      txt[8].setOrigin(0.5);
      txt[8].setVisible(true);
      
      g.fillStyle(0xFFDD00,0.3);
      g.fillRect(35,480,130,2);
      
      txt[9].setText('SINGLE PLAYER');
      txt[9].setPosition(105,505);
      txt[9].setStyle({fontSize:'10px',color:'#FFDD00',fontStyle:'bold'});
      txt[9].setOrigin(0.5);
      txt[9].setVisible(true);
      
      const oldX=p1.x;
      p1.x=360;
      drwP(p1);
      drwUI(p1,360);
      p1.x=oldX;
    }else{
      txt[0].setText('PLATRIS');
      txt[1].setText('');
      txt[2].setText('');
      txt[4].setVisible(true);txt[5].setVisible(true);
      txt[6].setVisible(true);txt[7].setVisible(true);
      txt[8].setVisible(true);txt[9].setVisible(true);
      
      drwRoundIndicators();
      
      drwP(p1);
      drwP(p2);
      drwUI(p1,60);
      drwUI(p2,480);
    }
    
    if(st===2){
      txt[0].setText('');txt[1].setText('');txt[2].setText('');
      txt[4].setVisible(false);txt[5].setVisible(false);
      txt[6].setVisible(false);txt[7].setVisible(false);
      txt[8].setVisible(false);txt[9].setVisible(false);
      
      g.fillStyle(0x000000,0.8);
      g.fillRect(200,180,400,240);
      g.fillStyle(0xFFFFFF);
      g.fillRect(202,182,396,236);
      g.fillStyle(0x000000);
      g.fillRect(204,184,392,232);
      
      if(spMode){
        txt[3].setText('GAME OVER!\n\nFINAL SCORE: '+score+'\nLEVEL: '+lvl+'\nLINES: '+lns+'\n\nPress START');
        txt[3].setPosition(400,300);
        txt[3].setStyle({fontSize:'20px',color:'#ff0',align:'center'});
      }else{
        const nextP1=p1Wins+(win===1?1:0);
        const nextP2=p2Wins+(win===2?1:0);
        const winsNeeded=Math.floor(bestOf/2)+1;
        
        txt[3].setText((win===1?'PLAYER 1':'PLAYER 2')+' WINS ROUND!\n\nSeries: '+nextP1+' - '+nextP2+'\n\nFirst to '+winsNeeded+' wins!\n\nPress START');
        txt[3].setPosition(400,300);
        txt[3].setStyle({fontSize:'20px',color:'#ff0',align:'center'});
      }
    }else if(st===3){
      txt[0].setText('');txt[1].setText('');txt[2].setText('');
      txt[4].setVisible(false);txt[5].setVisible(false);
      txt[6].setVisible(false);txt[7].setVisible(false);
      txt[8].setVisible(false);txt[9].setVisible(false);
      
      g.fillStyle(0x000000,0.7);
      g.fillRect(0,0,800,600);
      txt[3].setText('PAUSED\nPress START to Resume');
      txt[3].setPosition(400,300);
      txt[3].setStyle({fontSize:'32px',color:'#ff0',align:'center'});
    }else{
      txt[3].setText('');
    }
  }
}

function drwRoundIndicators(){
  const winsNeeded=Math.floor(bestOf/2)+1;
  
  for(let i=0;i<winsNeeded;i++){
    const filled=i<p1Wins;
    const x=80+i*22;
    const y=30;
    
    if(filled){
      g.fillStyle(0xFFFF00);
      g.fillRect(x+3,y,3,18);
      g.fillRect(x+6,y-3,3,3);
      g.fillRect(x,y+5,9,12);
      g.fillStyle(0xFFDD00);
      g.fillRect(x+2,y+7,5,8);
      g.fillStyle(0x8B4513);
      g.fillRect(x+4,y+16,2,4);
    }else{
      g.lineStyle(2,0x666666);
      g.strokeRect(x,y,9,20);
    }
  }
  
  for(let i=0;i<winsNeeded;i++){
    const filled=i<p2Wins;
    const x=720-i*22;
    const y=30;
    
    if(filled){
      g.fillStyle(0xFFFF00);
      g.fillRect(x+3,y,3,18);
      g.fillRect(x+6,y-3,3,3);
      g.fillRect(x,y+5,9,12);
      g.fillStyle(0xFFDD00);
      g.fillRect(x+2,y+7,5,8);
      g.fillStyle(0x8B4513);
      g.fillRect(x+4,y+16,2,4);
    }else{
      g.lineStyle(2,0x666666);
      g.strokeRect(x,y,9,20);
    }
  }
}

function drwRoundSelect(){
  txt[0].setText('');txt[1].setText('');txt[2].setText('');txt[3].setText('');
  txt[4].setVisible(false);txt[5].setVisible(false);
  txt[6].setVisible(false);txt[7].setVisible(false);
  txt[8].setVisible(false);txt[9].setVisible(false);
  
  const t=at*0.001;
  const bananaColors=[0xFFFF33,0xFFDD00,0xFFCC00,0xDD9900,0xAA7700,0x8B4513];
  for(let i=0;i<6;i++){
    const idx=Math.floor((i+t)%bananaColors.length);
    g.fillStyle(bananaColors[idx],0.7);
    g.fillRect(0,i*100,800,100);
  }
  
  for(let i=0;i<20;i++){
    const sx=((i*156)%800);
    const sy=((i*389+t*50)%600);
    const bx=sx,by=sy;
    
    g.fillStyle(0xFFFF00,0.3);
    g.fillRect(bx+2,by,2,12);
    g.fillRect(bx+4,by-2,2,2);
    g.fillRect(bx,by+3,6,8);
  }
  
  txt[0].setText('SELECT ROUNDS');
  txt[0].setPosition(400,100);
  txt[0].setStyle({fontSize:'32px',color:'#000',fontStyle:'bold'});
  txt[0].setOrigin(0.5);
  
  txt[1].setText('BEST OF '+bestOf);
  txt[1].setPosition(400,250);
  txt[1].setStyle({fontSize:'48px',color:'#8B4513',fontStyle:'bold'});
  txt[1].setOrigin(0.5);
  
  txt[2].setText('First to win '+(Math.floor(bestOf/2)+1)+' rounds!');
  txt[2].setPosition(400,330);
  txt[2].setStyle({fontSize:'20px',color:'#000',fontStyle:'bold'});
  txt[2].setOrigin(0.5);
  
  g.fillStyle(0x000000,0.6);
  g.fillRect(150,430,500,50);
  txt[3].setText('← →  CHANGE  •  START  BEGIN  •  BUTTON A  BACK');
  txt[3].setPosition(400,455);
  txt[3].setStyle({fontSize:'14px',color:'#FFFF00',fontStyle:'bold'});
  txt[3].setOrigin(0.5);
}

function drwSeriesWinner(){
  txt[0].setText('');txt[1].setText('');txt[2].setText('');txt[3].setText('');
  txt[4].setVisible(false);txt[5].setVisible(false);
  txt[6].setVisible(false);txt[7].setVisible(false);
  txt[8].setVisible(false);txt[9].setVisible(false);
  
  const t=at*0.001;
  const bananaColors=[0xFFFF33,0xFFDD00,0xFFCC00,0xDD9900,0xAA7700,0x8B4513];
  for(let i=0;i<6;i++){
    const idx=Math.floor((i+t*2)%bananaColors.length);
    g.fillStyle(bananaColors[idx]);
    g.fillRect(0,i*100,800,100);
  }
  
  for(let i=0;i<50;i++){
    const sx=((i*234)%800);
    const sy=((i*567+t*100)%600);
    const bx=sx,by=sy;
    
    g.fillStyle(0xFFFF00,0.6);
    g.fillRect(bx+3,by,3,15);
    g.fillRect(bx+6,by-2,3,3);
    g.fillRect(bx,by+4,9,10);
    g.fillStyle(0xFFDD00,0.5);
    g.fillRect(bx+2,by+6,5,6);
    g.fillStyle(0x8B4513,0.6);
    g.fillRect(bx+4,by+13,2,3);
  }
  
  const winner=p1Wins>p2Wins?'PLAYER 1':'PLAYER 2';
  const wc=p1Wins>p2Wins?0x00FF88:0xFF0088;
  
  txt[0].setText('SERIES WINNER');
  txt[0].setPosition(400,150);
  txt[0].setStyle({fontSize:'32px',color:'#fff',fontStyle:'bold'});
  txt[0].setOrigin(0.5);
  
  txt[1].setText(winner);
  txt[1].setPosition(400,250);
  txt[1].setStyle({fontSize:'64px',color:'#'+wc.toString(16).padStart(6,'0'),fontStyle:'bold'});
  txt[1].setOrigin(0.5);
  
  txt[2].setText(p1Wins+' - '+p2Wins);
  txt[2].setPosition(400,350);
  txt[2].setStyle({fontSize:'36px',color:'#000',fontStyle:'bold'});
  txt[2].setOrigin(0.5);
  
  g.fillStyle(0x000000,0.6);
  g.fillRect(200,465,400,40);
  txt[3].setText('Press START to return to menu');
  txt[3].setPosition(400,485);
  txt[3].setStyle({fontSize:'18px',color:'#FFFF00',fontStyle:'bold'});
  txt[3].setOrigin(0.5);
}

function drwMenu(){
  txt[0].setText('');txt[1].setText('');txt[2].setText('');txt[3].setText('');
  txt[4].setVisible(false);txt[5].setVisible(false);
  txt[6].setVisible(false);txt[7].setVisible(false);
  txt[8].setVisible(false);txt[9].setVisible(false);
  
  const t=at*0.001;
  const bananaColors=[0xFFFF33,0xFFDD00,0xFFCC00,0xDD9900,0xAA7700,0x8B4513];
  for(let i=0;i<6;i++){
    const idx=Math.floor((i+t*0.5)%bananaColors.length);
    g.fillStyle(bananaColors[idx]);
    g.fillRect(0,i*100,800,100);
  }
  
  for(let i=0;i<30;i++){
    const sx=((i*123)%800);
    const sy=((i*456+t*40)%600);
    const bx=sx,by=sy;
    
    g.fillStyle(0xFFFF00,0.4);
    g.fillRect(bx+3,by,3,18);
    g.fillRect(bx+6,by-3,3,3);
    g.fillRect(bx,by+5,9,12);
    g.fillStyle(0xFFDD00,0.3);
    g.fillRect(bx+2,by+7,5,8);
    g.fillStyle(0x8B4513,0.4);
    g.fillRect(bx+4,by+16,2,4);
  }
  
  g.fillStyle(0x000000,0.7);
  g.fillRect(30,180,90,120);
  
  const bx=50,by=200;
  g.fillStyle(0xFFFF00);
  g.fillRect(bx+10,by,10,60);g.fillRect(bx+20,by-10,10,10);
  g.fillRect(bx,by+15,30,35);
  g.fillStyle(0xFFDD00);
  g.fillRect(bx+5,by+20,20,25);
  g.fillStyle(0x000000);
  g.fillRect(bx+8,by+60,5,5);g.fillRect(bx+17,by+60,5,5);
  g.fillRect(bx+10,by+68,10,3);
  g.fillRect(bx+12,by+30,6,2);
  g.fillStyle(0x8B4513);
  g.fillRect(bx+13,by+50,4,15);
  
  g.lineStyle(3,0x000000);
  g.strokeRect(bx-2,by-12,34,82);
  
  const ofs=Math.sin(t*3)*3;
  const titleColors=[0x8B4513,0x654321,0x4A2511];
  const tc=titleColors[Math.floor(t*2)%titleColors.length];
  
  for(let ox=-3;ox<=3;ox++){
    for(let oy=-3;oy<=3;oy++){
      if(ox||oy)drwTxt('PLATRIS',220+ox,80+ofs+oy,7,0xFFFF00);
    }
  }
  drwTxt('PLATRIS',220,80+ofs,7,tc);
  
  const c1=menu===0?0xFFDD00:0x8B4513;
  const c2=menu===1?0xFFDD00:0x8B4513;
  const c3=menu===2?0xFFDD00:0x8B4513;
  const p1=menu===0?1.05:1;
  const p2=menu===1?1.05:1;
  const p3=menu===2?1.05:1;
  
  g.fillStyle(c1);
  g.fillRect(250,280,300*p1,45);
  g.fillStyle(0x000000,0.7);
  g.fillRect(255,284,290*p1,37);
  g.fillStyle(c1,0.3);
  g.fillRect(258,287,284*p1,31);
  
  g.fillStyle(c2);
  g.fillRect(250,340,300*p2,45);
  g.fillStyle(0x000000,0.7);
  g.fillRect(255,344,290*p2,37);
  g.fillStyle(c2,0.3);
  g.fillRect(258,347,284*p2,31);
  
  g.fillStyle(c3);
  g.fillRect(250,400,300*p3,45);
  g.fillStyle(0x000000,0.7);
  g.fillRect(255,404,290*p3,37);
  g.fillStyle(c3,0.3);
  g.fillRect(258,407,284*p3,31);
  
  txt[0].setText('SINGLE PLAYER');
  txt[0].setPosition(400,302);
  txt[0].setStyle({fontSize:'20px',color:menu===0?'#FFFF00':'#999',fontStyle:'bold'});
  txt[0].setOrigin(0.5);
  
  txt[1].setText('MULTIPLAYER');
  txt[1].setPosition(400,362);
  txt[1].setStyle({fontSize:'20px',color:menu===1?'#FFFF00':'#999',fontStyle:'bold'});
  txt[1].setOrigin(0.5);
  
  txt[2].setText('HOW TO PLAY');
  txt[2].setPosition(400,422);
  txt[2].setStyle({fontSize:'20px',color:menu===2?'#FFFF00':'#999',fontStyle:'bold'});
  txt[2].setOrigin(0.5);
  
  g.fillStyle(0x000000,0.6);
  g.fillRect(220,530,360,35);
  txt[3].setText('▲ ▼  SELECT  •  START  CONFIRM');
  txt[3].setPosition(400,547);
  txt[3].setStyle({fontSize:'14px',color:'#FFFF00',fontStyle:'bold'});
  txt[3].setOrigin(0.5);
}

function drwRules(){
  txt[0].setText('');txt[1].setText('');txt[2].setText('');txt[3].setText('');txt[4].setText('');
  txt[4].setVisible(false);txt[5].setVisible(false);
  txt[6].setVisible(false);txt[7].setVisible(false);
  txt[8].setVisible(false);txt[9].setVisible(false);
  
  g.fillStyle(0x000000);
  g.fillRect(0,0,800,600);
  g.fillStyle(0x00FFFF);
  g.fillRect(20,20,760,560);
  g.fillStyle(0x000000);
  g.fillRect(25,25,750,550);
  
  txt[0].setText('HOW TO PLAY - '+(rulesMode===0?'MULTIPLAYER':'SINGLE PLAYER'));
  txt[0].setPosition(400,45);
  txt[0].setStyle({fontSize:'18px',color:'#0ff',fontStyle:'bold'});
  txt[0].setOrigin(0.5);
  
  const mp='GOAL: Fill opponent board to the top!\n\nCONTROLS:\n  A/D = Move  |  W = Rotate  |  S = Soft Drop\n  J = Hard Drop  |  K = Hold  |  START = Pause\n\nATTACK SYSTEM:\n  2 Lines = 1 Garbage  |  3 Lines = 2 Garbage\n  4 Lines (Tetris) = 4 Garbage\n  T-Spin Double = 4  |  T-Spin Triple = 6\n  Combo +1 = +1 Garbage per consecutive clear\n\nDEFENSE: Clear lines to cancel incoming!\n\n← → Switch Mode  |  START Return';
  const sp='GOAL: Survive and score as high as possible!\n\nCONTROLS:\n  A/D = Move  |  W = Rotate  |  S = Soft Drop\n  J = Hard Drop  |  K = Hold  |  START = Pause\n\nSCORING:\n  1 Line = 100 pts  |  2 Lines = 300 pts\n  3 Lines = 500 pts  |  4 Lines (Tetris) = 800 pts\n  Points multiplied by current level!\n  Combo Bonus: +50 pts per combo * level\n\nSPEED: Every 10 lines = Level Up!\n  Higher levels = Faster speed + More points\n\n← → Switch Mode  |  START Return';
  
  txt[1].setText(rulesMode===0?mp:sp);
  txt[1].setPosition(50,75);
  txt[1].setStyle({fontSize:'13px',color:'#fff',align:'left',lineSpacing:4});
  txt[1].setOrigin(0,0);
}

function drwNameEntry(){
  txt[0].setText('');txt[1].setText('');txt[2].setText('');txt[3].setText('');txt[4].setText('');
  txt[5].setVisible(false);txt[6].setVisible(false);
  txt[7].setVisible(false);txt[8].setVisible(false);txt[9].setVisible(false);
  
  const t=at*0.001;
  const bananaColors=[0xFFFF33,0xFFDD00,0xFFCC00,0xDD9900,0xAA7700,0x8B4513];
  for(let i=0;i<6;i++){
    const idx=Math.floor((i+t*2)%bananaColors.length);
    g.fillStyle(bananaColors[idx]);
    g.fillRect(0,i*100,800,100);
  }
  
  txt[0].setText('NEW HIGH SCORE!');
  txt[0].setPosition(400,100);
  txt[0].setStyle({fontSize:'32px',color:'#000',fontStyle:'bold'});
  txt[0].setOrigin(0.5);
  
  txt[1].setText('SCORE: '+score);
  txt[1].setPosition(400,160);
  txt[1].setStyle({fontSize:'28px',color:'#8B4513',fontStyle:'bold'});
  txt[1].setOrigin(0.5);
  
  txt[2].setText('ENTER YOUR NAME');
  txt[2].setPosition(400,230);
  txt[2].setStyle({fontSize:'20px',color:'#000',fontStyle:'bold'});
  txt[2].setOrigin(0.5);
  
  for(let i=0;i<3;i++){
    const blink=nmIdx===i&&Math.floor(t*2)%2===0;
    g.fillStyle(blink?0xFFDD00:0x000000,0.7);
    g.fillRect(280+i*80,280,60,80);
    g.lineStyle(4,nmIdx===i?0xFFFF00:0x8B4513);
    g.strokeRect(282+i*80,282,56,76);
  }
  
  txt[3].setText(nmEntry[0]+'    '+nmEntry[1]+'    '+nmEntry[2]);
  txt[3].setPosition(400,320);
  txt[3].setStyle({fontSize:'48px',color:'#FFFF00',fontStyle:'bold',fontFamily:'monospace'});
  txt[3].setOrigin(0.5);
  
  g.fillStyle(0x000000,0.6);
  g.fillRect(150,415,500,70);
  txt[4].setText('▲ ▼  CHANGE  •  ← →  MOVE  •  START  CONFIRM');
  txt[4].setPosition(400,450);
  txt[4].setStyle({fontSize:'14px',color:'#FFFF00',fontStyle:'bold'});
  txt[4].setOrigin(0.5);
  txt[4].setVisible(true);
}

function drwLeaderboard(){
  txt[0].setText('');txt[1].setText('');txt[2].setText('');txt[3].setText('');
  txt[4].setVisible(false);txt[5].setVisible(false);
  txt[6].setVisible(false);txt[7].setVisible(false);
  txt[8].setVisible(false);txt[9].setVisible(false);
  
  const t=at*0.001;
  const bananaColors=[0xFFFF33,0xFFDD00,0xFFCC00,0xDD9900,0xAA7700,0x8B4513];
  for(let i=0;i<6;i++){
    const idx=Math.floor((i+t)%bananaColors.length);
    g.fillStyle(bananaColors[idx],0.8);
    g.fillRect(0,i*100,800,100);
  }
  
  txt[0].setText('LEADERBOARD');
  txt[0].setPosition(400,50);
  txt[0].setStyle({fontSize:'36px',color:'#000',fontStyle:'bold'});
  txt[0].setOrigin(0.5);
  
  g.fillStyle(0x000000,0.7);
  g.fillRect(150,100,500,420);
  g.lineStyle(4,0xFFDD00);
  g.strokeRect(152,102,496,416);
  
  let lbTxt='RANK  NAME   SCORE\n\n';
  for(let i=0;i<10;i++){
    const rank=(i+1).toString().padStart(2,' ');
    if(i<lb.length){
      const isNew=lb[i].s===score;
      const marker=isNew?' ►':'  ';
      lbTxt+=marker+rank+'.  '+lb[i].n+'    '+lb[i].s+'\n';
    }else{
      lbTxt+='  '+rank+'.  ---    0\n';
    }
  }
  
  txt[1].setText(lbTxt);
  txt[1].setPosition(200,120);
  txt[1].setStyle({fontSize:'16px',color:'#FFFF00',fontStyle:'bold',fontFamily:'monospace',align:'left',lineSpacing:5});
  txt[1].setOrigin(0,0);
  
  g.fillStyle(0x000000,0.6);
  g.fillRect(200,530,400,40);
  txt[3].setText('Press START to return to menu');
  txt[3].setPosition(400,550);
  txt[3].setStyle({fontSize:'14px',color:'#FFFF00',fontStyle:'bold'});
  txt[3].setOrigin(0.5);
}

function drwTxt(t,x,y,s,c){
  const px=[[1,1,1,0],[1,0,1,0],[1,1,1,0],[1,0,0,0],[1,0,0,0]];
  const chars={
    P:[[1,1,1,0],[1,0,1,0],[1,1,1,0],[1,0,0,0],[1,0,0,0]],
    L:[[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,1,1,0]],
    A:[[0,1,0,0],[1,0,1,0],[1,1,1,0],[1,0,1,0],[1,0,1,0]],
    T:[[1,1,1,0],[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
    R:[[1,1,0,0],[1,0,1,0],[1,1,0,0],[1,0,1,0],[1,0,1,0]],
    I:[[1,1,1,0],[0,1,0,0],[0,1,0,0],[0,1,0,0],[1,1,1,0]],
    S:[[0,1,1,0],[1,0,0,0],[0,1,0,0],[0,0,1,0],[1,1,0,0]],
    B:[[1,1,1,0],[1,0,1,0],[1,1,1,0],[1,0,1,0],[1,1,1,0]],
    E:[[1,1,1,0],[1,0,0,0],[1,1,0,0],[1,0,0,0],[1,1,1,0]]
  };
  let ox=x;
  for(const ch of t){
    if(ch===' '){ox+=s*5;continue;}
    const p=chars[ch]||px;
    for(let r=0;r<5;r++){
      for(let cl=0;cl<4;cl++){
        if(p[r][cl]){
          g.fillStyle(c);
          g.fillRect(ox+cl*s,y+r*s,s-1,s-1);
        }
      }
    }
    ox+=s*5;
  }
}

function drwP(p){
  const bs=24;
  
  g.fillStyle(0x000000,0.6);
  g.fillRect(p.x-5,p.y-5,10*bs+10,20*bs+10);
  
  for(let y=0;y<20;y++){
    for(let x=0;x<10;x++){
      g.fillStyle(0x111111,0.3);
      g.fillRect(p.x+x*bs,p.y+y*bs,bs-1,bs-1);
    }
  }
  
  for(let y=0;y<20;y++){
    for(let x=0;x<10;x++){
      const c=p.b[y][x];
      if(c){
        g.fillStyle(c);
        g.fillRect(p.x+x*bs+1,p.y+y*bs+1,bs-3,bs-3);
        g.fillStyle(0xFFFFFF,0.3);
        g.fillRect(p.x+x*bs+2,p.y+y*bs+2,bs-6,4);
        g.fillStyle(0x000000,0.3);
        g.fillRect(p.x+x*bs+2,p.y+y*bs+bs-6,bs-6,3);
      }
    }
  }
  
  const bc=p.id===1?0x00FF88:0xFF0088;
  g.lineStyle(3,bc,0.8);
  g.strokeRect(p.x-2,p.y-2,10*bs+4,20*bs+4);
  g.lineStyle(1,0xFFFFFF,0.3);
  g.strokeRect(p.x-1,p.y-1,10*bs+2,20*bs+2);
  
  if(p.t&&st===1){
    const s=PC[p.t].s[p.r];
    const c=PC[p.t].c;
    g.fillStyle(c,0.9);
    for(let row=0;row<4;row++){
      for(let col=0;col<4;col++){
        if(s[row][col]){
          const bx=p.px+col;
          const by=p.py+row;
          if(by>=0){
            g.fillRect(p.x+bx*bs+1,p.y+by*bs+1,bs-3,bs-3);
            g.fillStyle(0xFFFFFF,0.4);
            g.fillRect(p.x+bx*bs+2,p.y+by*bs+2,bs-6,4);
            g.fillStyle(c,0.9);
          }
        }
      }
    }
  }
}

function drwUI(p,bx){
  const bs=16;
  let ny=530;
  
  g.fillStyle(0x000000,0.4);
  g.fillRect(bx-5,ny-5,70,220);
  g.lineStyle(2,p.id===1?0x00FF88:0xFF0088,0.5);
  g.strokeRect(bx-5,ny-5,70,220);
  
  for(let i=0;i<3;i++){
    if(p.nxt[i]){
      const s=PC[p.nxt[i]].s[0];
      const c=PC[p.nxt[i]].c;
      g.fillStyle(c);
      for(let row=0;row<4;row++){
        for(let col=0;col<4;col++){
          if(s[row][col]){
            g.fillRect(bx+col*bs,ny+row*bs,bs-2,bs-2);
            g.fillStyle(0xFFFFFF,0.3);
            g.fillRect(bx+col*bs+1,ny+row*bs+1,bs-4,3);
            g.fillStyle(c);
          }
        }
      }
      ny+=70;
    }
  }
  
  if(p.hld){
    g.fillStyle(0x000000,0.4);
    g.fillRect(bx+155,525,70,70);
    g.lineStyle(2,p.id===1?0x00FF88:0xFF0088,0.5);
    g.strokeRect(bx+155,525,70,70);
    
    const s=PC[p.hld].s[0];
    const c=PC[p.hld].c;
    g.fillStyle(c);
    for(let row=0;row<4;row++){
      for(let col=0;col<4;col++){
        if(s[row][col]){
          g.fillRect(bx+160+col*bs,530+row*bs,bs-2,bs-2);
          g.fillStyle(0xFFFFFF,0.3);
          g.fillRect(bx+161+col*bs,531+row*bs,bs-4,3);
          g.fillStyle(c);
        }
      }
    }
  }
  
  if(p.pg>0){
    const bh=Math.min(p.pg*15,100);
    g.fillStyle(0x000000,0.5);
    g.fillRect(p.x+240+3,p.y+480-102,26,104);
    g.lineStyle(2,0xFF0000);
    g.strokeRect(p.x+240+5,p.y+480-100,22,100);
    g.fillStyle(0xFF0000,0.8);
    g.fillRect(p.x+240+6,p.y+480-bh+1,20,bh-2);
    g.fillStyle(0xFF6666);
    g.fillRect(p.x+240+8,p.y+481-bh,16,Math.max(2,bh-5));
  }
}
