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
  {id:"first",   icon:"🎉", name:"Pierwsze kroki",     xp:25,   check:function(s){return s.total>=1;}},
  {id:"speed3",  icon:"⚡", name:"3 ankiety dziś",     xp:50,   check:function(s){return s.today>=3;}},
  {id:"streak3", icon:"🔗", name:"3 dni z rzędu",      xp:75,   check:function(s){return s.streak>=3;}},
  {id:"hot1",    icon:"🌶️", name:"Pierwszy Gorący lead",xp:60,  check:function(s){return s.hot>=1;}},
  {id:"hot5",    icon:"🔥", name:"5x Gorący lead",     xp:100,  check:function(s){return s.hot>=5;}},
  {id:"ten",     icon:"💎", name:"10 ankiet total",    xp:150,  check:function(s){return s.total>=10;}},
  {id:"daily5",  icon:"🚀", name:"5 ankiet w 1 dzień", xp:120,  check:function(s){return s.today>=5;}},
  {id:"streak7", icon:"📅", name:"Tydzień z rzędu",    xp:200,  check:function(s){return s.streak>=7;}},
  {id:"twenty",  icon:"🏆", name:"20 ankiet total",    xp:300,  check:function(s){return s.total>=20;}},
  {id:"hot10",   icon:"🌋", name:"10x Gorący lead",    xp:250,  check:function(s){return s.hot>=10;}},
  {id:"daily10", icon:"💥", name:"10 ankiet w 1 dzień",xp:300,  check:function(s){return s.today>=10;}},
  {id:"fifty",   icon:"👑", name:"50 ankiet total",    xp:500,  check:function(s){return s.total>=50;}},
  {id:"streak14",icon:"🗓️", name:"14 dni z rzędu",     xp:400,  check:function(s){return s.streak>=14;}},
  {id:"hot25",   icon:"☄️", name:"25x Gorący lead",    xp:500,  check:function(s){return s.hot>=25;}},
  {id:"hundred", icon:"🎖️", name:"100 ankiet total",   xp:1000, check:function(s){return s.total>=100;}},
  {id:"streak30",icon:"🔱", name:"30 dni z rzędu",     xp:1000, check:function(s){return s.streak>=30;}},
  {id:"hot50",   icon:"🌟", name:"50x Gorący lead",    xp:1000, check:function(s){return s.hot>=50;}},
  {id:"machine", icon:"🤖", name:"250 ankiet total",   xp:2000, check:function(s){return s.total>=250;}},
  {id:"legend500",icon:"♾️", name:"500 ankiet total",  xp:4000, check:function(s){return s.total>=500;}}
];
