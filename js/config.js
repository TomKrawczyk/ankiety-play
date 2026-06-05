// ============================================================
// CONFIG — stałe, poziomy, osiągnięcia
// ============================================================
var WEBHOOK = "https://script.google.com/macros/s/AKfycbxGGEYEGMpwFZiqwCyBnlaBH0bRLzQF-2VESryxIq7JnzDYaG-1Ldz2tDU2ckgW2TE2/exec";

var LEVELS = [
  {min:0,    name:"Rookie",     icon:"🌱"},
  {min:100,  name:"Prospector", icon:"⛏️"},
  {min:300,  name:"Hunter",     icon:"🎯"},
  {min:600,  name:"Closer",     icon:"🔥"},
  {min:1000, name:"Elite",      icon:"⚡"},
  {min:1800, name:"Legend",     icon:"👑"},
  {min:3000, name:"GOD MODE",   icon:"🌟"}
];

var ACHS = [
  {id:"first",  icon:"🎉", name:"Pierwsze kroki",  xp:25,  check:function(s){return s.total>=1;}},
  {id:"hot5",   icon:"🔥", name:"5x Gorący lead",  xp:100, check:function(s){return s.hot>=5;}},
  {id:"streak3",icon:"🔗", name:"3 dni z rzędu",   xp:75,  check:function(s){return s.streak>=3;}},
  {id:"speed3", icon:"⚡", name:"3 ankiety dziś",  xp:50,  check:function(s){return s.today>=3;}},
  {id:"ten",    icon:"💎", name:"10 ankiet total", xp:150, check:function(s){return s.total>=10;}},
  {id:"twenty", icon:"🏆", name:"20 ankiet total", xp:300, check:function(s){return s.total>=20;}},
  {id:"fifty",  icon:"👑", name:"50 ankiet total", xp:500, check:function(s){return s.total>=50;}}
];
