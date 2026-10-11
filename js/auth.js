/* Auth + RBAC layer. Replace storage/hash calls with API requests when a backend exists. */
const Auth=(()=>{
const KU='th_users',KA='th_audit',KS='th_sess',IDLE=9e5,NAVS=['calendar','bookings'],enc=new TextEncoder(),hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''),rnd=n=>hex(crypto.getRandomValues(new Uint8Array(n)));
const ld=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch{return d}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
let U=[],AU=[],cur=null,fails=0,lock=0,exp=0,tm=0,wired=0;
async function hash(pw,salt){if(crypto.subtle){const k=await crypto.subtle.importKey('raw',enc.encode(pw),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:100000,hash:'SHA-256'},k,256))}let h=5381;for(const c of salt+pw)h=(h*33^c.charCodeAt(0))>>>0;return h.toString(16)}
async function mk(o,pw){const salt=rnd(8);return{id:'u'+rnd(3),role:'Manager',status:'active',phone:'',created:Date.now(),lastLogin:0,perms:{calendar:1,bookings:1},...o,salt,hash:await hash(pw,salt)}}
const save=()=>{sv(KU,U);sv(KA,AU)},own=()=>cur?.role==='Owner';
const audit=(act,by)=>{AU.unshift({t:Date.now(),by:by||cur?.name||'System',act});AU.length=Math.min(AU.length,200);sv(KA,AU)};
async function init(){U=ld(KU,null);AU=ld(KA,[]);if(U)return;const d=864e5,t=Date.now();
U=[await mk({name:'Rashid Tahzeeb',username:'owner',role:'Owner',phone:'0300-5550142',created:t-400*d,perms:{}},'Owner@2026'),await mk({name:'Kamran Yousaf',username:'kamran.yousaf',phone:'0321-4408812',created:t-120*d,lastLogin:t-3*36e5},'Manager@2026'),await mk({name:'Sadia Rehman',username:'sadia.rehman',phone:'0333-7719045',created:t-60*d,lastLogin:t-2*d,perms:{calendar:1,bookings:1}},'Manager@2026'),await mk({name:'Jawad Ahmed',username:'jawad.ahmed',status:'inactive',created:t-30*d,lastLogin:t-20*d},'Manager@2026')];
AU=[{t:t-3*36e5,by:'Kamran Yousaf',act:'Signed in'},{t:t-2*d,by:'Sadia Rehman',act:'Signed in'},{t:t-12*d,by:'Rashid Tahzeeb',act:'Deactivated manager Jawad Ahmed'},{t:t-30*d,by:'Rashid Tahzeeb',act:'Created manager Jawad Ahmed'}];save()}
const touch=()=>{exp=Date.now()+IDLE};
function chk(){if(!cur)return;const f=U.find(y=>y.id===cur.id);if(!f||f.status!=='active')return A.logout('Your access was changed by the Owner.');if(Date.now()>exp)A.logout('Session expired after 15 minutes of inactivity.')}
function start(x){cur=x;x.lastLogin=Date.now();save();audit('Signed in');touch();try{sessionStorage.setItem(KS,x.id)}catch{}S.role=x.name;clearInterval(tm);tm=setInterval(chk,5000);if(!wired){wired=1;['click','keydown'].forEach(v=>addEventListener(v,()=>cur&&touch()))}}
async function login(u,p){if(Date.now()<lock)return{err:'Too many attempts. Try again in '+Math.ceil((lock-Date.now())/1e3)+'s.'};
const x=U.find(y=>y.username===u.trim().toLowerCase()),ok=x&&await hash(p,x.salt)===x.hash;
if(!ok){if(++fails>=5){fails=0;lock=Date.now()+3e4}audit('Failed sign-in attempt','System');return{err:'Invalid username or password.'}}
fails=0;if(x.status!=='active'){audit('Blocked sign-in: account '+x.status,x.name);return{err:'This account is not active. Contact the Owner.'}}start(x);return{ok:1}}
const A={
async boot(){render();await init();let id;try{id=sessionStorage.getItem(KS)}catch{}const u=U.find(x=>x.id===id&&x.status==='active');
if(u){start(u);S.app=1;const h=location.hash.slice(2);S.view=A.allowed(h)?h:A.nav()[0];go(S.view)}else if(location.hash.length>1)A.showLogin('Please sign in to continue.');
addEventListener('hashchange',()=>{if(!cur){location.hash.length>1&&A.showLogin('Please sign in to continue.')}else{const h=location.hash.slice(2);if(h&&h!==S.view)go(h)}})},
me:()=>cur||{name:'',role:''},list:()=>U,log:()=>AU,audit,
allowed:v=>!!cur&&(own()?['calendar','bookings','managers'].includes(v):NAVS.includes(v)&&(cur.perms?.[v]??1)>0),
nav:()=>NAVS.filter(A.allowed).concat(own()?['managers']:[]),
async add(o,pw){if(!own())return;const u=await mk(o,pw);U.push(u);audit('Created manager '+u.name);save();return u},
update(id,p,act){if(!own())return;Object.assign(U.find(u=>u.id===id),p);act&&audit(act);save()},
async setPw(id,pw){if(!own())return;const u=U.find(x=>x.id===id);u.salt=rnd(8);u.hash=await hash(pw,u.salt);audit('Reset password for '+u.name);save()},
del(id){if(!own())return;const u=U.find(x=>x.id===id);U=U.filter(x=>x.id!==id);audit('Deleted manager '+u.name);save()},
logout(msg){if(cur)audit(msg?'Session ended: '+msg:'Signed out');cur=null;clearInterval(tm);try{sessionStorage.removeItem(KS)}catch{}S.app=0;S.open=null;S.w=null;$('#md').hidden=true;try{history.replaceState(null,'',location.pathname)}catch{};msg?A.showLogin(msg,1):(render(),toast('Signed out'))},
showLogin(msg,bad){const L=$('#login');L.hidden=false;render();
L.innerHTML=`<section class="lg-brand"><div class="logo"><svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 25V13a10 10 0 0 1 20 0v12M9 25V14a5 5 0 0 1 10 0v11"/></svg>Tahzeeb Hall</div><div><h1>Every date, every hall, one calm screen.</h1><p>Management access for the Owner and authorized managers. Accounts are created by the Owner.</p></div><svg class="arch" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width=".6"><path d="M4 25V13a10 10 0 0 1 20 0v12M9 25V14a5 5 0 0 1 10 0v11M2 25h24"/></svg></section>
<section class="lg-form"><form id="lf" novalidate><h2>Sign in</h2>${msg?`<div class="al ${bad?'bad':'blue'}" role="alert">${e(msg)}</div>`:'<p class="mut">Authorized users only.</p>'}<label>Username<input id="lu" autocomplete="username" autocapitalize="off"></label><label>Password<div class="pw"><input id="lp" type="password" autocomplete="current-password"><button type="button" id="lt" aria-label="Show password">Show</button></div></label><button class="btn p l" id="lb">Sign in</button><button type="button" class="btn" id="lx">Back to website</button><p class="mut" style="font-size:13px">Demo accounts: owner / Owner@2026, kamran.yousaf / Manager@2026</p></form></section>`;
$('#lu').focus();$('#lt').onclick=()=>{const p=$('#lp'),s=p.type==='password';p.type=s?'text':'password';$('#lt').textContent=s?'Hide':'Show'};
$('#lx').onclick=()=>{L.hidden=true;render()};
$('#lf').onsubmit=async ev=>{ev.preventDefault();const b=$('#lb'),f=$('#lf');b.disabled=true;b.textContent='Signing in…';const r=await login($('#lu').value,$('#lp').value);
if(r.ok){L.hidden=true;S.app=1;S.view=A.nav()[0];toast('Welcome back, '+cur.name.split(' ')[0]);go(S.view)}else{b.disabled=false;b.textContent='Sign in';f.querySelector('.al')?.remove();f.querySelector('h2').insertAdjacentHTML('afterend',`<div class="al bad" role="alert">${e(r.err)}</div>`);f.classList.remove('shake');void f.offsetWidth;f.classList.add('shake');$('#lp').value='';$('#lp').focus()}}}};
return A})();
