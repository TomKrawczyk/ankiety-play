/* ═══════════════════════════════════════════════════════════════
   GAME-FX — silnik soczystości dla 4ECO Field Agent
   Podpina efekty do ISTNIEJĄCYCH zdarzeń bez zmiany logiki gry.
   Techniki: delegacja zdarzeń, MutationObserver, wrapowanie globali.
   ═══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- haptyka ---------- */
  function buzz(ms){ try{ if(navigator.vibrate && !reduce) navigator.vibrate(ms); }catch(e){} }

  /* ---------- ripple na tapniecie ---------- */
  function ripple(el, x, y){
    if(reduce) return;
    var r = el.getBoundingClientRect();
    var size = Math.max(r.width, r.height) * 1.4;
    var s = document.createElement('span');
    s.className = 'fx-ripple';
    s.style.width = s.style.height = size + 'px';
    s.style.left = (x - r.left) + 'px';
    s.style.top  = (y - r.top)  + 'px';
    el.appendChild(s);
    setTimeout(function(){ if(s.parentNode) s.parentNode.removeChild(s); }, 600);
  }

  /* delegacja: klikalne elementy dostaja ripple + buzz */
  document.addEventListener('pointerdown', function(e){
    var t = e.target.closest('.nav-tile, .choice, .btn-next, .btn-submit, .btn-auth, .btn-primary, .sub-tile, .sc');
    if(!t) return;
    ripple(t, e.clientX, e.clientY);
    buzz(t.classList.contains('btn-submit') ? 18 : 8);
  }, {passive:true});

  /* ---------- latajacy +XP ---------- */
  function xpFly(amount){
    if(reduce) return;
    var pill = document.querySelector('.xp-pill');
    if(!pill) return;
    var r = pill.getBoundingClientRect();
    var f = document.createElement('div');
    f.className = 'fx-xpfly';
    f.textContent = '+' + amount + ' XP';
    f.style.left = (r.left + r.width/2 - 24) + 'px';
    f.style.top  = (r.bottom + 4) + 'px';
    document.body.appendChild(f);
    setTimeout(function(){ if(f.parentNode) f.parentNode.removeChild(f); }, 1050);
  }
  function bump(el){ if(!el) return; el.classList.remove('fx-bump'); void el.offsetWidth; el.classList.add('fx-bump'); }

  /* ---------- obserwuj licznik XP (bump + fly na przyrost) ---------- */
  var xpEl = null, lastXP = null;
  function watchXP(){
    xpEl = document.getElementById('xpTotal');
    if(!xpEl) return;
    var mo = new MutationObserver(function(){
      var v = parseInt((xpEl.textContent||'0').replace(/\D/g,''),10) || 0;
      if(lastXP !== null && v > lastXP){
        var pill = xpEl.closest('.xp-pill'); bump(pill);
        xpFly(v - lastXP);
        buzz(14);
      }
      lastXP = v;
    });
    mo.observe(xpEl, {childList:true, characterData:true, subtree:true});
    lastXP = parseInt((xpEl.textContent||'0').replace(/\D/g,''),10) || 0;
  }

  /* ---------- obserwuj combo (bump wartosci + hot glow) ---------- */
  var comboEl=null, comboBar=null, lastCombo=null;
  function watchCombo(){
    comboEl = document.getElementById('comboVal');
    comboBar = document.getElementById('comboBar');
    if(!comboEl) return;
    var mo = new MutationObserver(function(){
      var txt = comboEl.textContent||'';
      var v = parseFloat(txt.replace(/[^\d.]/g,'')) || 1;
      if(lastCombo !== null && v !== lastCombo){ bump(comboEl); if(v>lastCombo) buzz(20); }
      lastCombo = v;
      if(comboBar){ comboBar.classList.toggle('fx-hot', v >= 2); }
    });
    mo.observe(comboEl, {childList:true, characterData:true, subtree:true});
    lastCombo = parseFloat((comboEl.textContent||'').replace(/[^\d.]/g,'')) || 1;
  }

  /* ---------- obserwuj stat cards (bump na zmiane) ---------- */
  function watchStats(){
    ['stTotal','stStreak','stHot','stToday'].forEach(function(id){
      var el = document.getElementById(id); if(!el) return;
      var card = el.closest('.sc');
      var mo = new MutationObserver(function(){ bump(card); });
      mo.observe(el, {childList:true, characterData:true, subtree:true});
    });
  }

  /* ---------- LEVEL UP pelnoekranowy ---------- */
  function levelUpFx(text){
    if(reduce) return;
    var o = document.createElement('div');
    o.className = 'fx-levelup';
    o.innerHTML = '<div class="lu-inner"><div class="lu-badge">LEVEL UP!</div><div class="lu-sub">'+(text||'')+'</div></div>';
    document.body.appendChild(o);
    buzz([30,40,30]);
    setTimeout(function(){ if(o.parentNode) o.parentNode.removeChild(o); }, 1700);
  }
  /* wrap istniejacej lvFlash, jesli jest */
  function wrapLvFlash(){
    if(typeof window.lvFlash === 'function' && !window.lvFlash.__fx){
      var orig = window.lvFlash;
      window.lvFlash = function(){
        try{ orig.apply(this, arguments); }catch(e){}
        var lv=''; try{ lv=(document.getElementById('hdrLv')||{}).textContent||''; }catch(e){}
        levelUpFx(lv);
      };
      window.lvFlash.__fx = true;
    }
  }

  /* ---------- shake przy bledzie logowania/walidacji ---------- */
  function watchErrors(){
    ['loginErr','regErr'].forEach(function(id){
      var el = document.getElementById(id); if(!el) return;
      var mo = new MutationObserver(function(){
        if((el.textContent||'').trim()){
          var card = el.closest('.auth-card') || el.closest('.aform') || el;
          card.classList.remove('fx-shake'); void card.offsetWidth; card.classList.add('fx-shake');
          buzz([10,30,10]);
        }
      });
      mo.observe(el, {childList:true, characterData:true, subtree:true});
    });
  }

  /* ---------- init (po zaladowaniu appScreen) ---------- */
  function init(){
    watchXP(); watchCombo(); watchStats(); watchErrors(); wrapLvFlash();
    // lvFlash moze byc zdefiniowana pozniej — dobij po chwili
    setTimeout(wrapLvFlash, 1500);
    setTimeout(wrapLvFlash, 4000);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  /* re-init obserwatorow gdy appScreen sie pojawia (po logowaniu) */
  var appMo = new MutationObserver(function(){
    var app = document.getElementById('appScreen');
    if(app && app.style.display !== 'none' && !app.__fxReady){
      app.__fxReady = true;
      watchXP(); watchCombo(); watchStats(); wrapLvFlash();
    }
  });
  try{ appMo.observe(document.body, {attributes:true, subtree:true, attributeFilter:['style']}); }catch(e){}

  window.__gameFx = { levelUpFx: levelUpFx, xpFly: xpFly, buzz: buzz };
})();
