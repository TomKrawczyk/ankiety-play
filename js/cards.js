
// ── DEFINICJE KART (pełna lista do zdobycia) ─────────────────────────────────
var CARD_DEFINITIONS = [
  // COMMON
  {id:'c1', icon:'⚡', name:'Quickshot',      rarity:'common',    desc:'Szybka ankieta w terenie — 5 pytań, cel osiągnięty.', bonus:'+10 XP'},
  {id:'c2', icon:'📋', name:'Ankieter',        rarity:'common',    desc:'Wypełniona pierwsza ankieta. Witaj w grze!',           bonus:'+15 XP'},
  {id:'c3', icon:'🚗', name:'Road Warrior',    rarity:'common',    desc:'Zebrałeś 3 ankiety w jeden dzień terenowy.',           bonus:'+20 XP'},
  {id:'c4', icon:'🌱', name:'Zielony Rekrut',  rarity:'common',    desc:'Pierwszy tydzień w polu. Dobry start!',                bonus:''},
  {id:'c5', icon:'📍', name:'Lokalizator',     rarity:'common',    desc:'Uzupełniłeś lokalizację we wszystkich ankietach.',     bonus:'+5 XP'},
  {id:'c6', icon:'☀️', name:'Solarny Gracz',   rarity:'common',    desc:'Pierwsza ankieta PV w Twoim portfolio.',               bonus:'+10 XP'},
  {id:'c7', icon:'🔋', name:'Bateria',         rarity:'common',    desc:'Odnotowałeś zainteresowanie magazynem energii.',       bonus:'+10 XP'},
  {id:'c8', icon:'📅', name:'Punktualność',    rarity:'common',    desc:'3 ankiety złożone przed 12:00.',                       bonus:'+15 XP'},
  // RARE
  {id:'r1', icon:'🔥', name:'Hot Lead Hunter', rarity:'rare',      desc:'Zdobyłeś 3 gorące leady — ktoś jest zainteresowany!', bonus:'+50 XP'},
  {id:'r2', icon:'💼', name:'Pro Networker',   rarity:'rare',      desc:'10 ankiet łącznie. Prawdziwy gracz terenowy.',         bonus:'+75 XP'},
  {id:'r3', icon:'🎯', name:'Snajper',         rarity:'rare',      desc:'5 ankiet w jeden dzień. Skupiony jak laser.',          bonus:'+60 XP'},
  {id:'r4', icon:'🔗', name:'Streak Master',   rarity:'rare',      desc:'3 dni z rzędu aktywności w terenie.',                  bonus:'+75 XP'},
  {id:'r5', icon:'🌡️', name:'Termometr Leadów',rarity:'rare',      desc:'Oceniłeś temperaturę 20 klientów.',                    bonus:'+40 XP'},
  {id:'r6', icon:'🏃', name:'Speed Runner',    rarity:'rare',      desc:'5 ankiet dziennie przez 2 dni z rzędu.',               bonus:'+80 XP'},
  // EPIC
  {id:'e1', icon:'💎', name:'Diamond Closer',  rarity:'epic',      desc:'20 gorących leadów łącznie. Jesteś maszyną.',          bonus:'+200 XP'},
  {id:'e2', icon:'👑', name:'Top Performer',   rarity:'epic',      desc:'Najwyższy wynik tygodniowy w rankingu.',               bonus:'+250 XP'},
  {id:'e3', icon:'⚡', name:'Elite Agent',     rarity:'epic',      desc:'Poziom 5 Elite osiągnięty. Mało kto tu dotarło.',      bonus:'+300 XP'},
  {id:'e4', icon:'🌪️', name:'Whirlwind',       rarity:'epic',      desc:'50 ankiet łącznie. Absolutna dedykacja.',              bonus:'+200 XP'},
  {id:'e5', icon:'🧲', name:'Lead Magnet',     rarity:'epic',      desc:'10 gorących leadów w jednym tygodniu.',                bonus:'+180 XP'},
  // LEGENDARY
  {id:'l1', icon:'🌟', name:'Field Legend',    rarity:'legendary', desc:'100 ankiet łącznie. Legenda terenowa 4ECO.',           bonus:'+500 XP'},
  {id:'l2', icon:'🏆', name:'Season Champion', rarity:'legendary', desc:'Mistrz sezonu — #1 w rankingu przez miesiąc.',         bonus:'+600 XP'},
  {id:'l3', icon:'🦁', name:'GOD MODE',        rarity:'legendary', desc:'Osiągnięto najwyższy poziom. Tylko nieliczni.',        bonus:'+1000 XP'},
];

function showCardDetail(card) {
  var RARITY_CFG = {
    common:    {label:'Common',    color:'#94a3b8', bg:'linear-gradient(135deg,#1e293b,#334155)', glow:'rgba(148,163,184,0.3)'},
    rare:      {label:'Rare',      color:'#60a5fa', bg:'linear-gradient(135deg,#1e3a5f,#1d4ed8)', glow:'rgba(96,165,250,0.4)'},
    epic:      {label:'Epic',      color:'#a78bfa', bg:'linear-gradient(135deg,#2d1b69,#7c3aed)', glow:'rgba(167,139,250,0.5)'},
    legendary: {label:'Legendary', color:'#fbbf24', bg:'linear-gradient(135deg,#451a03,#b45309)', glow:'rgba(251,191,36,0.6)'}
  };
  var cfg = RARITY_CFG[card.rarity]||RARITY_CFG.common;

  var ov = document.getElementById('cardDetailOverlay');
  if(!ov) {
    ov = document.createElement('div');
    ov.id = 'cardDetailOverlay';
    ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px)';
    ov.onclick = function(e){ if(e.target===ov) ov.remove(); };
    document.body.appendChild(ov);
  }
  ov.innerHTML =
    '<div style="background:'+cfg.bg+';border:2px solid '+cfg.color+';border-radius:24px;padding:32px 24px;text-align:center;max-width:300px;width:100%;box-shadow:0 0 40px '+cfg.glow+';animation:cardIn 0.35s cubic-bezier(.34,1.56,.64,1)">'
    +'<div style="font-size:0.6em;font-weight:900;color:'+cfg.color+';letter-spacing:2px;text-transform:uppercase;margin-bottom:12px">'+cfg.label+'</div>'
    +'<div style="font-size:4em;margin:8px 0;filter:drop-shadow(0 0 12px '+cfg.glow+')">'+card.icon+'</div>'
    +'<div style="font-size:1.1em;font-weight:900;color:#fff;margin:8px 0">'+card.name+'</div>'
    +'<div style="font-size:0.75em;color:rgba(255,255,255,0.7);margin:8px 0 16px;line-height:1.4">'+card.desc+'</div>'
    +(card.bonus?'<div style="display:inline-block;background:rgba(0,0,0,0.3);border:1px solid '+cfg.color+';border-radius:20px;padding:6px 16px;font-size:0.72em;font-weight:900;color:'+cfg.color+';margin-bottom:16px">'+card.bonus+'</div><br>':'')
    +(card.date?'<div style="font-size:0.6em;color:rgba(255,255,255,0.4);margin-bottom:20px">Zdobyta: '+card.date+'</div>':'')
    +'<button onclick="document.getElementById(\'cardDetailOverlay\').remove()" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:10px 28px;color:#fff;font-size:0.8em;font-weight:800;cursor:pointer;font-family:Inter,sans-serif">Zamknij</button>'
    +'</div>';
  ov.style.display='flex';
}

function showCardReveal(card) {
  var RARITY_CFG = {
    common:    {label:'Common',    color:'#94a3b8', bg:'linear-gradient(135deg,#1e293b,#334155)', glow:'148,163,184', fanfare:''},
    rare:      {label:'Rare',      color:'#60a5fa', bg:'linear-gradient(135deg,#1e3a5f,#1d4ed8)', glow:'96,165,250',  fanfare:'🎉'},
    epic:      {label:'Epic',      color:'#a78bfa', bg:'linear-gradient(135deg,#2d1b69,#7c3aed)', glow:'167,139,250', fanfare:'✨ EPIC! ✨'},
    legendary: {label:'Legendary', color:'#fbbf24', bg:'linear-gradient(135deg,#451a03,#b45309)', glow:'251,191,36',  fanfare:'🌟 LEGENDARY! 🌟'}
  };
  var cfg = RARITY_CFG[card.rarity] || RARITY_CFG.common;
  var glowRgb = cfg.glow;

  var ov = document.createElement('div');
  ov.id = 'chestRevealOv';
  ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:10000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;overflow:hidden';
  ov.style.background = card.rarity==='legendary'
    ? 'radial-gradient(circle at 50% 60%, rgba('+glowRgb+',0.22) 0%, #0a0a0f 65%)'
    : card.rarity==='epic'
    ? 'radial-gradient(circle at 50% 60%, rgba('+glowRgb+',0.15) 0%, #0a0a12 65%)'
    : 'rgba(0,0,0,0.93)';

  ov.innerHTML = `
  <style>
    @keyframes chestShake {
      0%,100%{transform:rotate(0deg) scale(1)}
      15%{transform:rotate(-6deg) scale(1.05)}
      30%{transform:rotate(6deg) scale(1.08)}
      45%{transform:rotate(-4deg) scale(1.06)}
      60%{transform:rotate(4deg) scale(1.1)}
      75%{transform:rotate(-2deg) scale(1.07)}
    }
    @keyframes cardFlyUp {
      0%  {opacity:0;transform:translateY(60px) scale(0.5) rotate(-8deg)}
      60% {opacity:1;transform:translateY(-20px) scale(1.08) rotate(2deg)}
      100%{opacity:1;transform:translateY(0px) scale(1) rotate(0deg)}
    }
    @keyframes sparkle {
      0%  {opacity:0;transform:scale(0) translateY(0)}
      50% {opacity:1;transform:scale(1) translateY(-30px)}
      100%{opacity:0;transform:scale(0.5) translateY(-60px)}
    }
    @keyframes glowPulse {
      0%,100%{box-shadow:0 0 30px rgba(${glowRgb},0.5),0 0 60px rgba(${glowRgb},0.2)}
      50%    {box-shadow:0 0 60px rgba(${glowRgb},0.9),0 0 120px rgba(${glowRgb},0.4)}
    }
    @keyframes tapHint {0%,100%{opacity:0.5}50%{opacity:1}}
    #chestWrap2{position:relative;display:flex;flex-direction:column;align-items:center;}
    #chestBody2{font-size:7em;line-height:1;cursor:pointer;user-select:none;transition:filter 0.3s;filter:drop-shadow(0 0 20px rgba(${glowRgb},0.6));}
    #chestBody2:active{transform:scale(0.95);}
    #chestLid2{font-size:4em;position:absolute;top:-0.3em;left:50%;transform:translateX(-50%);transform-origin:bottom center;}
    #cardResult2{display:none;animation:cardFlyUp 0.6s cubic-bezier(.34,1.56,.64,1) both;}
    .spark2{position:absolute;font-size:1.4em;animation:sparkle 0.8s ease-out both;pointer-events:none;}
    #chestTapHint2{font-size:0.75em;color:rgba(255,255,255,0.5);margin-top:12px;animation:tapHint 1.5s ease-in-out infinite;}
  </style>
  <div id="chestFanfare2" style="font-size:0.9em;color:rgba(255,255,255,0.7);margin-bottom:18px;min-height:1.4em;text-align:center;font-weight:800;letter-spacing:1px"></div>
  <div id="chestWrap2">
    <div id="chestLid2">🪄</div>
    <div id="chestBody2" onclick="openChest2()">🎁</div>
    <div id="chestTapHint2">Kliknij żeby otworzyć!</div>
  </div>
  <div id="cardResult2" style="text-align:center;margin-top:20px">
    <div style="background:${cfg.bg};border:2px solid ${cfg.color};border-radius:24px;padding:28px 24px;max-width:270px;width:100%;animation:glowPulse 2s ease-in-out infinite">
      <div style="font-size:0.55em;font-weight:900;color:${cfg.color};letter-spacing:2px;text-transform:uppercase;margin-bottom:10px">${cfg.label}</div>
      <div style="font-size:4em;margin:4px 0 12px;filter:drop-shadow(0 0 12px rgba(${glowRgb},0.8))">${card.icon}</div>
      <div style="font-size:1.05em;font-weight:900;color:#fff;margin-bottom:6px">${card.name}</div>
      <div style="font-size:0.7em;color:rgba(255,255,255,0.7);line-height:1.4;margin-bottom:12px">${card.desc}</div>
      ${card.bonus ? '<div style="display:inline-block;background:rgba(0,0,0,0.35);border:1px solid '+cfg.color+';border-radius:20px;padding:5px 14px;font-size:0.7em;font-weight:900;color:'+cfg.color+';margin-bottom:12px">'+card.bonus+'</div><br>' : ''}
      <div style="font-size:0.55em;color:rgba(255,255,255,0.35);margin-bottom:16px">Zdobyta: ${card.date}</div>
      <button onclick="document.getElementById('chestRevealOv').remove()" style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);border-radius:12px;padding:10px 32px;color:#fff;font-size:0.82em;font-weight:900;cursor:pointer;font-family:Inter,sans-serif">Super! 🎉</button>
    </div>
  </div>`;

  document.body.appendChild(ov);

  window.openChest2 = function() {
    var chestBody = document.getElementById('chestBody2');
    var chestLid  = document.getElementById('chestLid2');
    var chestWrap = document.getElementById('chestWrap2');
    var hint      = document.getElementById('chestTapHint2');
    var fanfare   = document.getElementById('chestFanfare2');
    var cardResult= document.getElementById('cardResult2');
    if(chestBody.dataset.opened) return;
    chestBody.dataset.opened = '1';
    hint.style.display = 'none';
    chestBody.style.animation = 'chestShake 0.6s ease-in-out';
    setTimeout(function() {
      chestLid.style.animation = 'lidOpen 0.4s ease-out forwards';
      var sparks = card.rarity==='legendary'?['✨','⭐','💫','🌟','✨','💥','⭐']:
                   card.rarity==='epic'      ?['✨','💫','⭐','✨','💫']:
                   card.rarity==='rare'      ?['✨','💫','✨']:['✨'];
      sparks.forEach(function(s,i){
        var sp=document.createElement('div');sp.className='spark2';sp.textContent=s;
        sp.style.left=(30+Math.random()*40)+'%';sp.style.top=(10+Math.random()*30)+'%';
        sp.style.animationDelay=(i*0.08)+'s';chestWrap.appendChild(sp);
      });
      setTimeout(function(){
        chestBody.style.display='none';chestLid.style.display='none';hint.style.display='none';
        if(cfg.fanfare){fanfare.textContent=cfg.fanfare;fanfare.style.color=cfg.color;fanfare.style.fontSize=card.rarity==='legendary'?'1.1em':'0.9em';}
        cardResult.style.display='block';
      },450);
    },650);
  };
}
