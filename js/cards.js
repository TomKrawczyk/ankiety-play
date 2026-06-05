



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
    +'<div style="font-size:0.6em;color:rgba(255,255,255,0.4);margin-bottom:20px">Zdobyta: '+card.date+'</div>'
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

  // Overlay
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
    @keyframes lidOpen {
      0%  {transform:rotateX(0deg); transform-origin:bottom center}
      100%{transform:rotateX(-130deg); transform-origin:bottom center}
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
    @keyframes tapHint {
      0%,100%{opacity:0.5} 50%{opacity:1}
    }
    #chestWrap { position:relative; display:flex; flex-direction:column; align-items:center; }
    #chestBody { font-size:7em; line-height:1; cursor:pointer; user-select:none; transition:filter 0.3s; filter:drop-shadow(0 0 20px rgba(${glowRgb},0.6)); }
    #chestBody:active { transform:scale(0.95); }
    #chestLid  { font-size:4em; position:absolute; top:-0.3em; left:50%; transform:translateX(-50%); transform-origin:bottom center; }
    #cardResult { display:none; animation:cardFlyUp 0.6s cubic-bezier(.34,1.56,.64,1) both; }
    .spark { position:absolute; font-size:1.4em; animation:sparkle 0.8s ease-out both; pointer-events:none; }
    #chestTapHint { font-size:0.75em; color:rgba(255,255,255,0.5); margin-top:12px; animation:tapHint 1.5s ease-in-out infinite; }
  </style>

  <div id="chestFanfare" style="font-size:0.9em;color:rgba(255,255,255,0.7);margin-bottom:18px;min-height:1.4em;text-align:center;font-weight:800;letter-spacing:1px"></div>

  <div id="chestWrap">
    <div id="chestLid">🪄</div>
    <div id="chestBody" onclick="openChest()">🎁</div>
    <div id="chestTapHint">Kliknij żeby otworzyć!</div>
  </div>

  <div id="cardResult" style="text-align:center;margin-top:20px">
    <div style="background:${cfg.bg};border:2px solid ${cfg.color};border-radius:24px;padding:28px 24px;max-width:270px;width:100%;animation:glowPulse 2s ease-in-out infinite">
      <div style="font-size:0.55em;font-weight:900;color:${cfg.color};letter-spacing:2px;text-transform:uppercase;margin-bottom:10px">${cfg.label}</div>
      <div style="font-size:4em;margin:4px 0 12px;filter:drop-shadow(0 0 12px rgba(${glowRgb},0.8))">${card.icon}</div>
      <div style="font-size:1.05em;font-weight:900;color:#fff;margin-bottom:6px">${card.name}</div>
      <div style="font-size:0.7em;color:rgba(255,255,255,0.7);line-height:1.4;margin-bottom:12px">${card.desc}</div>
      ${card.bonus ? '<div style="display:inline-block;background:rgba(0,0,0,0.35);border:1px solid '+cfg.color+';border-radius:20px;padding:5px 14px;font-size:0.7em;font-weight:900;color:'+cfg.color+';margin-bottom:12px">'+card.bonus+'</div><br>' : ''}
      <div style="font-size:0.55em;color:rgba(255,255,255,0.35);margin-bottom:16px">Zdobyta: ${card.date}</div>
      <button onclick="document.getElementById('chestRevealOv').remove()" style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);border-radius:12px;padding:10px 32px;color:#fff;font-size:0.82em;font-weight:900;cursor:pointer;font-family:Inter,sans-serif">Super! 🎉</button>
    </div>
  </div>
  `;

  document.body.appendChild(ov);

  // --- Logika otwarcia skrzyni ---
  window.openChest = function() {
    var chestBody = document.getElementById('chestBody');
    var chestLid  = document.getElementById('chestLid');
    var chestWrap = document.getElementById('chestWrap');
    var hint      = document.getElementById('chestTapHint');
    var fanfare   = document.getElementById('chestFanfare');
    var cardResult= document.getElementById('cardResult');

    if(chestBody.dataset.opened) return;
    chestBody.dataset.opened = '1';
    hint.style.display = 'none';

    // Faza 1: Skrzynia drży
    chestBody.style.animation = 'chestShake 0.6s ease-in-out';

    setTimeout(function() {
      // Faza 2: Otwieranie wieka
      chestLid.style.animation   = 'lidOpen 0.4s ease-out forwards';
      chestBody.textContent = '🎁';

      // Iskry
      var sparks = card.rarity==='legendary' ? ['✨','⭐','💫','🌟','✨','💥','⭐'] :
                   card.rarity==='epic'       ? ['✨','💫','⭐','✨','💫'] :
                   card.rarity==='rare'       ? ['✨','💫','✨'] : ['✨'];
      sparks.forEach(function(s, i) {
        var sp = document.createElement('div');
        sp.className = 'spark';
        sp.textContent = s;
        sp.style.left  = (30+Math.random()*40)+'%';
        sp.style.top   = (10+Math.random()*30)+'%';
        sp.style.animationDelay = (i*0.08)+'s';
        chestWrap.appendChild(sp);
      });

      // Faza 3: Karta wyskakuje
      setTimeout(function() {
        chestBody.style.display = 'none';
        chestLid.style.display  = 'none';
        hint.style.display      = 'none';

        if(cfg.fanfare) {
          fanfare.textContent = cfg.fanfare;
          fanfare.style.color = cfg.color;
          fanfare.style.fontSize = card.rarity==='legendary' ? '1.1em' : '0.9em';
        }

        cardResult.style.display = 'block';
        if(card.rarity==='legendary') {
          setTimeout(function(){ floatXP('🌟 LEGENDARY! 🌟'); }, 400);
        } else if(card.rarity==='epic') {
          setTimeout(function(){ floatXP('✨ EPIC! ✨'); }, 400);
        }
      }, 450);
    }, 650);
  };
}


