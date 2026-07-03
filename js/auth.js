// ======================================================
// AUTH
// ======================================================
var UK='4eco_u', SK='4eco_s';
// Klucz konta znormalizowany: bez ogonkow, male litery, pojedyncze spacje.
// Dzieki temu "Przemek Osciak" == "Przemek Ościak", " TK " == "tk".
function normKey(n){
  return (n||'').toString().trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')  // usun znaki diakrytyczne
    .replace(/\u0142/g,'l')                            // ł -> l (NFD nie rozklada ł)
    .replace(/\s+/g,' ');                              // wielokrotne spacje -> jedna
}
function getUsers(){try{return JSON.parse(localStorage.getItem(UK))||{};}catch(e){return {};}}
function saveUsers(u){localStorage.setItem(UK,JSON.stringify(u));}
function getSession(){try{return JSON.parse(localStorage.getItem(SK));}catch(e){return null;}}
function saveSession(n){localStorage.setItem(SK,JSON.stringify({name:n}));}
function clearSession(){localStorage.removeItem(SK);}

// Jednorazowa migracja: przeklucz istniejace konta na znormalizowane klucze.
// Scala lokalne duplikaty (np. "Ościak"/"Osciak") sumujac XP/statystyki.
function migrateUserKeys(){
  var us=getUsers(), out={}, changed=false;
  Object.keys(us).forEach(function(oldK){
    var u=us[oldK]; if(!u) return;
    var nk=normKey(u.name||oldK);
    if(nk!==oldK) changed=true;
    if(out[nk]){
      // duplikat -> scal: sumuj liczby, zachowaj wyzszy streak i istniejacy PIN/nazwe
      var a=out[nk];
      a.xp=(+a.xp||0)+(+u.xp||0);
      a.total=(+a.total||0)+(+u.total||0);
      a.hot=(+a.hot||0)+(+u.hot||0);
      a.streak=Math.max(+a.streak||0,+u.streak||0);
      a.achs=(a.achs||[]).concat(u.achs||[]).filter(function(v,i,arr){return arr.indexOf(v)===i;});
      if(!a.pin && u.pin) a.pin=u.pin;
      changed=true;
    } else {
      out[nk]=u;
    }
  });
  if(changed) saveUsers(out);
}
try{ migrateUserKeys(); }catch(e){}

function switchTab(tab,btn){
  document.querySelectorAll('.atab').forEach(function(t){t.classList.remove('active');});
  document.querySelectorAll('.aform').forEach(function(f){f.classList.remove('active');});
  btn.classList.add('active');
  document.getElementById(tab==='login'?'loginForm':'regForm').classList.add('active');
}

function doRegister(){
  var n=document.getElementById('rName').value.trim(),p=document.getElementById('rPin').value,p2=document.getElementById('rPin2').value;
  var err=document.getElementById('regErr'),ok=document.getElementById('regOk');
  err.style.display='none';ok.style.display='none';
  if(!n){err.textContent='Wpisz imię i nazwisko.';err.style.display='block';return;}
  if(!/^\d{4}$/.test(p)){err.textContent='PIN musi mieć 4 cyfry.';err.style.display='block';return;}
  if(p!==p2){err.textContent='PINy się nie zgadzają.';err.style.display='block';return;}
  var us=getUsers(),k=normKey(n);
  if(us[k]){err.textContent='Konto o tej nazwie już istnieje — zaloguj się.';err.style.display='block';return;}
  us[k]={name:n,pin:p,xp:0,total:0,hot:0,streak:0,lastDay:'',achs:[]};
  saveUsers(us);ok.textContent='Konto utworzone!';ok.style.display='block';
  setTimeout(function(){document.getElementById('lName').value=n;switchTab('login',document.querySelector('.atab'));},1200);
}

function doLogin(){
  var n=document.getElementById('lName').value.trim(),p=document.getElementById('lPin').value;
  var err=document.getElementById('loginErr');err.style.display='none';
  var us=getUsers(),u=us[normKey(n)];
  if(!u||u.pin!==p){err.textContent='Nieprawidłowe dane.';err.style.display='block';return;}
  if(document.getElementById('lRemember').checked) saveSession(u.name);
  launchApp(u.name);
}

function doLogout(){clearSession();location.reload();}

