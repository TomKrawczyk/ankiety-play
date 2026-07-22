// ======================================================
// FLOW DEFINITIONS
// ======================================================

// --- QUICK PV ---
var FLOW_QPV = [
  {id:"imie", type:"text", title:"Imię i nazwisko", hint:"Wymagane", placeholder:"np. Jan Kowalski", req:true},
  {id:"tel", type:"text", title:"Numer telefonu", hint:"Obowiązkowe", placeholder:"600 000 000", req:true},
  {id:"kod", type:"text", title:"Kod pocztowy", hint:"Uzupełniony automatycznie z ustawień — zmień jeśli inny", placeholder:"np. 62-600", req:true, autofill:"location_kod"},
  {id:"msc", type:"text", title:"Miejscowość", hint:"Uzupełniona automatycznie — zmień jeśli inna", placeholder:"np. Kłodawa", req:true, autofill:"location_msc"},
  {id:"pv_status", type:"choice", title:"Czy ma już panele słoneczne?", choices:[
    {icon:"✅",text:"Tak, działają"},
    {icon:"⚠️",text:"Tak, ale coś nie działa"},
    {icon:"🔜",text:"Planuje w tym roku"},
    {icon:"❌",text:"Nie ma paneli"}
  ]},
  {id:"rachunek", type:"choice", title:"Miesięczny rachunek za prąd?", choices:[
    {icon:"💸",text:"Ponad 500 zł"},
    {icon:"💰",text:"300–500 zł"},
    {icon:"💵",text:"150–300 zł"},
    {icon:"🪙",text:"Poniżej 150 zł"}
  ]},
  {id:"bol", type:"choice", title:"Jak klient mówi o rachunkach?", choices:[
    {icon:"📈",text:"Rosną i jest tym zdenerwowany"},
    {icon:"🤷",text:"Nie rozumie za co płaci"},
    {icon:"😴",text:"Nie śledzi — płaci i tyle"},
    {icon:"👍",text:"Jest zadowolony"}
  ]},
  {id:"temp", type:"temp", title:"Jak oceniasz zainteresowanie klienta?"},
  {id:"uwagi", type:"textarea", title:"Notatki", hint:"Opcjonalne", placeholder:"np. pyta o dotacje, jest zainteresowany magazynem..."}
];

// --- QUICK HEAT ---
var FLOW_QHEAT = [
  {id:"imie", type:"text", title:"Imię i nazwisko", hint:"Wymagane", placeholder:"np. Jan Kowalski", req:true},
  {id:"tel", type:"text", title:"Numer telefonu", hint:"Obowiązkowe", placeholder:"600 000 000", req:true},
  {id:"kod", type:"text", title:"Kod pocztowy", hint:"Uzupełniony automatycznie — zmień jeśli inny", placeholder:"np. 62-600", req:true, autofill:"location_kod"},
  {id:"msc", type:"text", title:"Miejscowość", hint:"Uzupełniona automatycznie — zmień jeśli inna", placeholder:"np. Kłodawa", req:true, autofill:"location_msc"},
  {id:"ogrzew", type:"choice", title:"Czym ogrzewa dom?", choices:[
    {icon:"🪨",text:"Węgiel / ekogroszek"},
    {icon:"🔵",text:"Gaz ziemny"},
    {icon:"⚡",text:"Prąd / bojler"},
    {icon:"🌡️",text:"Ma już pompę ciepła"},
    {icon:"🪵",text:"Drewno / inne"}
  ]},
  {id:"koszt", type:"choice", title:"Roczny koszt ogrzewania?", choices:[
    {icon:"🥵",text:"Ponad 10 000 zł"},
    {icon:"😰",text:"6 000–10 000 zł"},
    {icon:"😐",text:"3 000–6 000 zł"},
    {icon:"😊",text:"Poniżej 3 000 zł"}
  ]},
  {id:"wiek_budynku", type:"choice", title:"Wiek budynku?", choices:[
    {icon:"🏚️",text:"Stary — przed 1990"},
    {icon:"🏠",text:"1990–2005"},
    {icon:"🏡",text:"2005–2015"},
    {icon:"🏗️",text:"Nowy — po 2015"}
  ]},
  {id:"temp", type:"temp", title:"Jak oceniasz zainteresowanie klienta?"},
  {id:"uwagi", type:"textarea", title:"Notatki", hint:"Opcjonalne", placeholder:"np. żona decyduje, pyta o dotacje..."}
];

// --- QUICK NEW ---
var FLOW_QNEW = [
  {id:"imie", type:"text", title:"Imię i nazwisko", hint:"Wymagane", placeholder:"np. Jan Kowalski", req:true},
  {id:"tel", type:"text", title:"Numer telefonu", hint:"Obowiązkowe", placeholder:"600 000 000", req:true},
  {id:"kod", type:"text", title:"Kod pocztowy", hint:"Uzupełniony automatycznie — zmień jeśli inny", placeholder:"np. 62-600", req:true, autofill:"location_kod"},
  {id:"msc", type:"text", title:"Miejscowość", hint:"Uzupełniona automatycznie — zmień jeśli inna", placeholder:"np. Kłodawa", req:true, autofill:"location_msc"},
  {id:"typ", type:"choice", title:"Typ nieruchomości?", choices:[
    {icon:"🏠",text:"Dom jednorodzinny"},
    {icon:"🌾",text:"Gospodarstwo rolne"},
    {icon:"🏢",text:"Firma / lokal"},
    {icon:"🏘️",text:"Inne"}
  ]},
  {id:"rachunki_ogol", type:"emoji", title:"Rachunki za energię — jak klient to ocenia?", opts:[
    {emoji:"😌",label:"Spokojnie"},
    {emoji:"😐",label:"Średnio"},
    {emoji:"😟",label:"Drogo"},
    {emoji:"😡",label:"Horror"}
  ]},
  {id:"int", type:"multi", title:"Co klienta interesuje? (można zaznaczyć kilka)", choices:[
    {icon:"☀️",text:"Panele słoneczne"},
    {icon:"🌡️",text:"Pompa ciepła"},
    {icon:"🔋",text:"Magazyn energii"},
    {icon:"🏠",text:"Ocieplenie domu"},
    {icon:"❄️",text:"Klimatyzacja"}
  ]},
  {id:"decyzja", type:"choice", title:"Kiedy klient planuje decyzję?", choices:[
    {icon:"🚀",text:"Jak najszybciej"},
    {icon:"📅",text:"W ciągu pół roku"},
    {icon:"🕐",text:"Za rok lub dłużej"},
    {icon:"🤔",text:"Jeszcze nie wie"}
  ]},
  {id:"temp", type:"temp", title:"Jak oceniasz zainteresowanie klienta?"},
  {id:"uwagi", type:"textarea", title:"Notatki", hint:"Opcjonalne", placeholder:"np. oboje domownicy zainteresowani, pyta o dofinansowanie..."}
];

// --- FULL SURVEY ---
// --- RACHUNKI / ZUŻYCIE (bez PV — otwarcie przez rachunek za prąd) ---
// Flow zbudowany jako rozmowa: zaczepka -> liczenie na miejscu -> zgoda na dane.
// 5 założeń (bezpłatnie, personalizacja, jeden telefon, lokalność, kontrola)
// wplecione w pytanie "zgoda".
var FLOW_RACHUNKI = [
  {id:"otwarcie", type:"choice", title:"Zaczepka: jak zareagował na pytanie o rachunki?", hint:"\"Robimy sondę w okolicy — ile teraz płacicie za prąd? Ludzie łapią się za głowę…\"", choices:[
    {icon:"🗣️",text:"Chętnie zaczął rozmawiać"},
    {icon:"🤔",text:"Ostrożnie, ale słucha"},
    {icon:"🚪",text:"Zbywa, mało czasu"},
    {icon:"❌",text:"Nie chce rozmawiać"}
  ]},
  {id:"rachunek", type:"choice", title:"Miesięczny rachunek za prąd?", hint:"\"Ile teraz wychodzi co miesiąc?\"", choices:[
    {icon:"💸",text:"Ponad 500 zł"},
    {icon:"💰",text:"300–500 zł"},
    {icon:"💵",text:"150–300 zł"},
    {icon:"🪙",text:"Poniżej 150 zł"}
  ]},
  {id:"skok", type:"choice", title:"Czy rachunki ostatnio wzrosły?", hint:"\"Zauważył Pan, że podskoczyły? U Was też?\"", choices:[
    {icon:"📈",text:"Mocno wzrosły"},
    {icon:"↗️",text:"Trochę wzrosły"},
    {icon:"➡️",text:"Bez zmian"},
    {icon:"🤷",text:"Nie śledzi"}
  ]},
  {id:"rozliczenie", type:"choice", title:"Jak się rozlicza za prąd?", hint:"\"Płacicie po równo, czy z prognozy i dopłata na koniec?\"", choices:[
    {icon:"📅",text:"Stała kwota co miesiąc"},
    {icon:"🧾",text:"Prognoza + dopłata na koniec"},
    {icon:"😬",text:"Dopłaca spore kwoty"},
    {icon:"❓",text:"Nie wie / nie pamięta"}
  ]},
  {id:"zjadacz", type:"multi", title:"Co najwięcej zjada prądu? (można kilka)", hint:"\"Co u Was bierze najwięcej — grzanie, klima, pompa, auto?\"", choices:[
    {icon:"🔥",text:"Ogrzewanie / bojler"},
    {icon:"❄️",text:"Klimatyzacja"},
    {icon:"🌡️",text:"Pompa ciepła"},
    {icon:"🚗",text:"Auto elektryczne"},
    {icon:"🏠",text:"Zwykłe AGD / dom"}
  ]},
  {id:"mostek", type:"emoji", title:"Mostek: \"Gdyby dało się ściąć rachunek o połowę bez zmiany przyzwyczajeń — ciekawe?\"", opts:[
    {emoji:"🔥",label:"Bardzo"},
    {emoji:"🙂",label:"Może"},
    {emoji:"😐",label:"Obojętnie"},
    {emoji:"🙅",label:"Nie"}
  ]},
  {id:"zgoda", type:"choice", title:"Domknięcie — czy zgadza się na bezpłatne wyliczenie?", hint:"\"Zostawia Pan numer, my BEZPŁATNIE i BEZ ZOBOWIĄZAŃ liczymy POD PANA RACHUNEK, dzwonię RAZ umówić termin, a jak to nie to — KASUJEMY dane. Pasuje?\"", choices:[
    {icon:"✅",text:"Tak — zostawia dane"},
    {icon:"📞",text:"Tak, ale woli sam zadzwonić"},
    {icon:"🕐",text:"Niezdecydowany — dopytać później"},
    {icon:"❌",text:"Nie wyraża zgody"}
  ]},
  {id:"imie", type:"text", title:"Imię i nazwisko", hint:"Wymagane", placeholder:"np. Jan Kowalski", req:true},
  {id:"tel", type:"text", title:"Numer telefonu", hint:"Obowiązkowe", placeholder:"600 000 000", req:true},
  {id:"kod", type:"text", title:"Kod pocztowy", hint:"Uzupełniony automatycznie — zmień jeśli inny", placeholder:"np. 62-600", req:true, autofill:"location_kod"},
  {id:"msc", type:"text", title:"Miejscowość", hint:"Uzupełniona automatycznie — zmień jeśli inna", placeholder:"np. Kłodawa", req:true, autofill:"location_msc"},
  {id:"temp", type:"temp", title:"Jak oceniasz zainteresowanie klienta?"},
  {id:"uwagi", type:"textarea", title:"Notatki", hint:"Opcjonalne", placeholder:"np. dopłacił 1500 zł na koniec roku, ma klimę..."}
];

// --- AUDYT PV (dla właścicieli fotowoltaiki — Cialdini + bezpłatny audyt) ---
// Cel: właściciele PV, którzy zainwestowali własne środki a rachunki nadal wysokie.
// Reguły Cialdiniego: dowód społeczny, autorytet, wzajemność (darmowy audyt),
// zaangażowanie/konsekwencja (mikro-tak -> duże tak), niedostępność (limit audytów).
// Domknięcie: umówienie spotkania z doradcą technicznym.
var FLOW_AUDYT_PV = [
  {id:"ma_pv", type:"choice", title:"Ma instalację fotowoltaiczną?", hint:"\"Widzę panele na dachu — działają u Państwa na full?\"", choices:[
    {icon:"✅",text:"Tak, ma"},
    {icon:"🔧",text:"W trakcie montażu"},
    {icon:"🤔",text:"Rozważa"},
    {icon:"❌",text:"Nie ma"}
  ]},
  {id:"finansowanie", type:"choice", title:"Z czego finansował fotowoltaikę?", hint:"\"Brał Pan z własnej kieszeni czy na kredyt?\"", choices:[
    {icon:"💰",text:"Własne środki"},
    {icon:"🏦",text:"Kredyt"},
    {icon:"🤝",text:"Dotacja + własne"}
  ]},
  {id:"od_kiedy", type:"choice", title:"Od jak dawna działa instalacja?", hint:"\"Ile to już u Państwa pracuje?\"", choices:[
    {icon:"🆕",text:"do 1 roku"},
    {icon:"📆",text:"1–3 lata"},
    {icon:"📅",text:"3–5 lat"},
    {icon:"⏳",text:"ponad 5 lat"}
  ]},
  {id:"rachunki_mimo", type:"choice", title:"Czy mimo PV rachunki nadal wysokie?", hint:"\"Najgorsze, że ludziom mimo paneli rachunki dalej rosną — u Pana jak?\"", choices:[
    {icon:"😡",text:"Tak, zaskakująco wysokie"},
    {icon:"😟",text:"Trochę za wysokie"},
    {icon:"😊",text:"Są w porządku"}
  ]},
  {id:"netbilling", type:"choice", title:"Dowód społeczny: net-billing 2022", hint:"\"Wie Pan, że po zmianie rozliczeń od 2022 TYSIĄCE właścicieli PV w Polsce dopłaca więcej niż zakładali? Sprawdzał Pan u siebie?\"", choices:[
    {icon:"✅",text:"Tak, sprawdzał"},
    {icon:"🙁",text:"Nie sprawdzał"},
    {icon:"😮",text:"Nie wiedział o tym"}
  ]},
  {id:"uzyski", type:"choice", title:"Czy ktoś sprawdzał realne uzyski?", hint:"\"Po montażu ktoś wracał sprawdzić, czy instalacja faktycznie tyle produkuje, ile miała?\"", choices:[
    {icon:"✅",text:"Tak"},
    {icon:"❌",text:"Nie"},
    {icon:"🤷",text:"Nie wie jak"}
  ]},
  {id:"pewnosc", type:"choice", title:"Pewność, że panele i falownik grają w 100%?", hint:"\"Ma Pan pewność, że żaden panel ani falownik nie obniża produkcji?\"", choices:[
    {icon:"💪",text:"Tak, pewność"},
    {icon:"😬",text:"Nie jestem pewien"},
    {icon:"❓",text:"Nie wie jak sprawdzić"}
  ]},
  {id:"potrzeba", type:"multi", title:"Co najbardziej by pomogło? (można kilka)", hint:"\"Co by Panu najbardziej zmieniło sytuację?\"", choices:[
    {icon:"📉",text:"Niższe rachunki"},
    {icon:"🔎",text:"Pewność, że PV działa"},
    {icon:"🔋",text:"Magazyn energii"},
    {icon:"🌡️",text:"Pompa ciepła"}
  ]},
  {id:"oddaje_darmo", type:"emoji", title:"Mostek: \"Gdyby okazało się, że Pana instalacja oddaje prąd za grosze do sieci — chciałby Pan to zmienić?\"", opts:[
    {emoji:"🔥",label:"Zdecydowanie"},
    {emoji:"🙂",label:"Może"},
    {emoji:"😐",label:"Obojętnie"},
    {emoji:"🙅",label:"Nie"}
  ]},
  {id:"audyt", type:"choice", title:"Domknięcie — bezpłatny audyt techniczny", hint:"\"Nasz doradca BEZPŁATNIE i BEZ ZOBOWIĄZAŃ sprawdzi realne uzyski Pana instalacji i pokaże gdzie tracicie pieniądze. W tym miesiącu mamy ograniczoną liczbę audytów w okolicy. Umówmy termin?\"", choices:[
    {icon:"✅",text:"Tak, chętnie umawiam"},
    {icon:"📞",text:"Tak, ale najpierw więcej info"},
    {icon:"🕐",text:"Niezdecydowany — dopytać"},
    {icon:"❌",text:"Nie teraz"}
  ]},
  {id:"imie", type:"text", title:"Imię i nazwisko", hint:"Wymagane", placeholder:"np. Jan Kowalski", req:true},
  {id:"tel", type:"text", title:"Numer telefonu", hint:"Obowiązkowe", placeholder:"600 000 000", req:true},
  {id:"kod", type:"text", title:"Kod pocztowy", hint:"Uzupełniony automatycznie — zmień jeśli inny", placeholder:"np. 62-600", req:true, autofill:"location_kod"},
  {id:"msc", type:"text", title:"Miejscowość", hint:"Uzupełniona automatycznie — zmień jeśli inna", placeholder:"np. Kłodawa", req:true, autofill:"location_msc"},
  {id:"pora", type:"choice", title:"Dogodna pora kontaktu doradcy?", choices:[
    {icon:"🌅",text:"Rano"},
    {icon:"☀️",text:"Popołudnie"},
    {icon:"🌙",text:"Wieczór"},
    {icon:"📅",text:"Weekend"}
  ]},
  {id:"temp", type:"temp", title:"Jak oceniasz zainteresowanie klienta?"},
  {id:"uwagi", type:"textarea", title:"Notatki", hint:"Opcjonalne", placeholder:"np. ma falownik Huawei 8kW, narzeka na zimowe dopłaty, żona decyduje..."}
];

var FLOW_PV_SKROCONA = [
  {id:"finansowanie", type:"choice", title:"Fotowoltaikę finansowałeś/aś z własnych środków?", hint:"\"Brał Pan z własnej kieszeni czy na kredyt?\"", choices:[
    {icon:"💰",text:"Własne"},
    {icon:"🏦",text:"Kredyt"},
    {icon:"🤝",text:"Dotacja + własne"}
  ]},
  {id:"od_kiedy", type:"choice", title:"Od jak dawna działa Twoja instalacja?", hint:"\"Ile to już u Państwa pracuje?\"", choices:[
    {icon:"🆕",text:"do 1 roku"},
    {icon:"📆",text:"1–3 lata"},
    {icon:"📅",text:"3–5 lat"},
    {icon:"⏳",text:"ponad 5 lat"}
  ]},
  {id:"rachunki_mimo", type:"choice", title:"Mimo fotowoltaiki rachunki za prąd nadal są wysokie?", hint:"\"Najgorsze, że ludziom mimo paneli rachunki dalej rosną — u Pana jak?\"", choices:[
    {icon:"😡",text:"Tak, zaskakująco"},
    {icon:"😟",text:"Trochę za wysokie"},
    {icon:"😊",text:"Są w porządku"}
  ]},
  {id:"uzyski", type:"choice", title:"Czy ktoś po montażu sprawdzał realne uzyski Twojej instalacji?", hint:"\"Po montażu ktoś wracał sprawdzić, czy instalacja faktycznie tyle produkuje, ile miała?\"", choices:[
    {icon:"✅",text:"Tak"},
    {icon:"❌",text:"Nie"},
    {icon:"🤷",text:"Nie wiem jak"}
  ]},
  {id:"pewnosc", type:"choice", title:"Masz pewność, że wszystkie panele i falownik pracują w 100%?", hint:"\"Ma Pan pewność, że żaden panel ani falownik nie obniża produkcji?\"", choices:[
    {icon:"💪",text:"Tak"},
    {icon:"😬",text:"Nie jestem pewien"},
    {icon:"❓",text:"Nie wiem jak sprawdzić"}
  ]},
  {id:"potrzeba", type:"multi", title:"Co najbardziej by Ci pomogło? (można kilka)", hint:"\"Co by Panu najbardziej zmieniło sytuację?\"", choices:[
    {icon:"📉",text:"Niższe rachunki"},
    {icon:"🔎",text:"Pewność, że PV działa"},
    {icon:"🔋",text:"Magazyn energii"},
    {icon:"🌡️",text:"Pompa ciepła"}
  ]},
  {id:"audyt", type:"choice", title:"Chciałbyś, aby doradca bezpłatnie sprawdził Twoją instalację?", hint:"\"Nasz doradca BEZPŁATNIE i bez zobowiązań sprawdzi realne uzyski Pana instalacji. Umówmy termin?\"", choices:[
    {icon:"✅",text:"Tak, chętnie"},
    {icon:"📞",text:"Najpierw więcej info"},
    {icon:"🕐",text:"Nie teraz"}
  ]},
  {id:"imie", type:"text", title:"Imię i nazwisko", hint:"Wymagane", placeholder:"np. Jan Kowalski", req:true},
  {id:"tel", type:"text", title:"Numer telefonu", hint:"Obowiązkowe", placeholder:"600 000 000", req:true},
  {id:"kod", type:"text", title:"Kod pocztowy", hint:"Uzupełniony automatycznie — zmień jeśli inny", placeholder:"np. 62-600", req:true, autofill:"location_kod"},
  {id:"msc", type:"text", title:"Miejscowość", hint:"Uzupełniona automatycznie — zmień jeśli inna", placeholder:"np. Kłodawa", req:true, autofill:"location_msc"},
  {id:"pora", type:"choice", title:"Dogodna pora kontaktu doradcy?", choices:[
    {icon:"🌅",text:"Rano"},
    {icon:"☀️",text:"Popołudnie"},
    {icon:"🌙",text:"Wieczór"},
    {icon:"📅",text:"Weekend"}
  ]},
  {id:"temp", type:"temp", title:"Jak oceniasz zainteresowanie klienta?"},
  {id:"uwagi", type:"textarea", title:"Notatki", hint:"Opcjonalne", placeholder:"np. szczegóły, kto decyduje, kiedy oddzwonić..."}
];

var FLOW_KLIMA = [
  {id:"ile_pomieszczen", type:"choice", title:"Ile pomieszczeń chcesz klimatyzować?", hint:"\"Ile pokoi chcielibyście schłodzić?\"", choices:[
    {icon:"1️⃣",text:"1"},
    {icon:"2️⃣",text:"2"},
    {icon:"3️⃣",text:"3"},
    {icon:"🏠",text:"4 i więcej"}
  ]},
  {id:"powierzchnia", type:"choice", title:"Orientacyjna powierzchnia do schłodzenia?", hint:"\"Z grubsza ile to metrów?\"", choices:[
    {icon:"📏",text:"do 25 m²"},
    {icon:"📐",text:"25–50 m²"},
    {icon:"🏡",text:"50–100 m²"},
    {icon:"🏰",text:"ponad 100 m²"}
  ]},
  {id:"goraco", type:"choice", title:"Czy latem w Twoim domu robi się nieznośnie gorąco?", hint:"\"Latem da się u Państwa wytrzymać, czy to udręka?\"", choices:[
    {icon:"🥵",text:"Tak, nie da się funkcjonować"},
    {icon:"😓",text:"Bywa uciążliwie"},
    {icon:"🙂",text:"Da się wytrzymać"}
  ]},
  {id:"grzanie_zima", type:"choice", title:"Interesuje Cię, że klimatyzacja zimą działa też jako ogrzewanie (niższe rachunki za grzanie)?", hint:"\"Wie Pan, że to samo urządzenie zimą tanio grzeje? To realnie obniża rachunki.\"", choices:[
    {icon:"🔥",text:"Tak, bardzo"},
    {icon:"🤔",text:"Może"},
    {icon:"🚫",text:"Nie potrzebuję"}
  ]},
  {id:"najwazniejsze", type:"choice", title:"Co jest dla Ciebie najważniejsze?", hint:"\"Na czym Panu najbardziej zależy?\"", choices:[
    {icon:"🤫",text:"Komfort i cisza"},
    {icon:"💡",text:"Niski koszt prądu"},
    {icon:"🔥",text:"Grzanie zimą"},
    {icon:"✨",text:"Estetyka montażu"}
  ]},
  {id:"termin", type:"choice", title:"W jakim czasie chciałbyś mieć zamontowaną klimatyzację?", hint:"\"Kiedy najchętniej byście to mieli zrobione?\"", choices:[
    {icon:"⚡",text:"Jak najszybciej"},
    {icon:"📆",text:"W ciągu kilku miesięcy"},
    {icon:"👀",text:"Dopiero się rozglądam"}
  ]},
  {id:"wycena", type:"choice", title:"Chciałbyś, aby doradca bezpłatnie dobrał i wycenił klimatyzację?", hint:"\"Nasz doradca BEZPŁATNIE dobierze moc i przygotuje wycenę pod Pana dom. Umówmy się?\"", choices:[
    {icon:"✅",text:"Tak, chętnie"},
    {icon:"📞",text:"Najpierw więcej info"},
    {icon:"🕐",text:"Nie teraz"}
  ]},
  {id:"imie", type:"text", title:"Imię i nazwisko", hint:"Wymagane", placeholder:"np. Jan Kowalski", req:true},
  {id:"tel", type:"text", title:"Numer telefonu", hint:"Obowiązkowe", placeholder:"600 000 000", req:true},
  {id:"kod", type:"text", title:"Kod pocztowy", hint:"Uzupełniony automatycznie — zmień jeśli inny", placeholder:"np. 62-600", req:true, autofill:"location_kod"},
  {id:"msc", type:"text", title:"Miejscowość", hint:"Uzupełniona automatycznie — zmień jeśli inna", placeholder:"np. Kłodawa", req:true, autofill:"location_msc"},
  {id:"pora", type:"choice", title:"Dogodna pora kontaktu doradcy?", choices:[
    {icon:"🌅",text:"Rano"},
    {icon:"☀️",text:"Popołudnie"},
    {icon:"🌙",text:"Wieczór"},
    {icon:"📅",text:"Weekend"}
  ]},
  {id:"temp", type:"temp", title:"Jak oceniasz zainteresowanie klienta?"},
  {id:"uwagi", type:"textarea", title:"Notatki", hint:"Opcjonalne", placeholder:"np. szczegóły, kto decyduje, kiedy oddzwonić..."}
];

var FLOW_FULL = [
  {id:"imie", type:"text", title:"Imię i nazwisko", hint:"Wymagane", placeholder:"np. Jan Kowalski", req:true},
  {id:"tel", type:"text", title:"Numer telefonu", hint:"Obowiązkowe", placeholder:"600 000 000", req:true},
  {id:"kod", type:"text", title:"Kod pocztowy", hint:"Uzupełniony automatycznie — zmień jeśli inny", placeholder:"np. 62-600", req:true, autofill:"location_kod"},
  {id:"msc", type:"text", title:"Miejscowość", hint:"Uzupełniona automatycznie — zmień jeśli inna", placeholder:"np. Kłodawa", req:true, autofill:"location_msc"},
  {id:"typ", type:"choice", title:"Typ nieruchomości?", choices:[
    {icon:"🏠",text:"Dom jednorodzinny"},
    {icon:"🌾",text:"Gospodarstwo rolne"},
    {icon:"🏢",text:"Firma / lokal"},
    {icon:"🏘️",text:"Inne"}
  ]},
  {id:"pv", type:"choice", title:"Czy ma panele fotowoltaiczne?", choices:[
    {icon:"✅",text:"Tak, działają dobrze"},
    {icon:"⚠️",text:"Tak, ale ma problemy"},
    {icon:"🔜",text:"Planuje instalację"},
    {icon:"❌",text:"Nie ma paneli"}
  ]},
  {id:"rachunek", type:"choice", title:"Miesięczny rachunek za prąd?", choices:[
    {icon:"💸",text:"Ponad 500 zł"},
    {icon:"💰",text:"300–500 zł"},
    {icon:"💵",text:"150–300 zł"},
    {icon:"🪙",text:"Poniżej 150 zł"}
  ]},
  {id:"ogrzew", type:"choice", title:"Czym ogrzewa dom?", choices:[
    {icon:"🪨",text:"Węgiel / ekogroszek"},
    {icon:"🔵",text:"Gaz"},
    {icon:"⚡",text:"Prąd / bojler"},
    {icon:"🌡️",text:"Pompa ciepła"},
    {icon:"🪵",text:"Drewno / inne"}
  ]},
  {id:"koszt_ogrzew", type:"choice", title:"Roczny koszt ogrzewania?", choices:[
    {icon:"🥵",text:"Ponad 10 000 zł"},
    {icon:"😰",text:"6 000–10 000 zł"},
    {icon:"😐",text:"3 000–6 000 zł"},
    {icon:"😊",text:"Poniżej 3 000 zł"}
  ]},
  {id:"int", type:"multi", title:"Co klienta interesuje? (można zaznaczyć kilka)", choices:[
    {icon:"☀️",text:"Panele słoneczne"},
    {icon:"🌡️",text:"Pompa ciepła"},
    {icon:"🔋",text:"Magazyn energii"},
    {icon:"🏠",text:"Ocieplenie domu"},
    {icon:"❄️",text:"Klimatyzacja"}
  ]},
  {id:"motyw", type:"emoji", title:"Główna motywacja klienta?", opts:[
    {emoji:"💰",label:"Oszczędności"},
    {emoji:"🔌",label:"Niezależność"},
    {emoji:"🌿",label:"Ekologia"},
    {emoji:"📋",label:"Dotacje"}
  ]},
  {id:"decyzja", type:"choice", title:"Kiedy klient planuje decyzję?", choices:[
    {icon:"🚀",text:"Jak najszybciej"},
    {icon:"📅",text:"W ciągu pół roku"},
    {icon:"🕐",text:"Za rok lub dłużej"},
    {icon:"🤔",text:"Jeszcze nie wie"}
  ]},
  {id:"temp", type:"temp", title:"Jak oceniasz zainteresowanie klienta?"},
  {id:"uwagi", type:"textarea", title:"Notatki z rozmowy", hint:"Opcjonalne", placeholder:"Obiekcje, pytania, zainteresowania..."}
];

// ======================================================
// FLOW ENGINE
// ======================================================
var flows = {};

function buildFlow(containerId, questions, sheetName, color, xpAmount) {
  var container = document.getElementById(containerId);
  var answers = {};
  // Autofill pól lokalizacyjnych z zapisanej lokalizacji
  questions.forEach(function(q) {
    if(q.autofill) {
      var saved = localStorage.getItem('4eco_loc_' + q.autofill);
      if(saved) answers[q.id] = saved;
    }
  });
  var state = { current: 0, answers: answers, questions: questions, sheetName: sheetName, color: color||'', xpAmount: xpAmount||50, _params: { questions: questions, sheetName: sheetName, color: color||'', xpAmount: xpAmount||50 } };
  flows[containerId] = state;
  renderQ(containerId);
}

function renderQ(fid) {
  var s = flows[fid];
  var container = document.getElementById(fid);
  var q = s.questions[s.current];
  var total = s.questions.length;
  var pct = Math.round((s.current / total) * 100);
  var isLast = s.current === total - 1;

  var html = '<div class="qflow-header"><div class="qflow-prog-wrap"><div class="qflow-prog" style="width:'+pct+'%"></div></div><div class="qflow-count">'+(s.current+1)+'/'+total+'</div></div>';
  html += '<div class="qslide active"><div class="qcard '+(s.color||'')+'">';
  html += '<div class="qnum">Pytanie '+(s.current+1)+'</div>';
  html += '<div class="qtitle">'+q.title+'</div>';
  if(q.hint) html += '<div class="qhint">'+q.hint+'</div>';

  var savedVal = s.answers[q.id];

  if(q.type==='text') {
    html += '<input class="q-input" id="qi_'+fid+'" type="'+(q.id==='tel'?'tel':'text')+'" placeholder="'+(q.placeholder||'')+'" value="'+(savedVal||'')+'" inputmode="'+(q.id==='tel'?'tel':'text')+'">';
  } else if(q.type==='textarea') {
    html += '<textarea class="q-input" id="qi_'+fid+'" rows="3" placeholder="'+(q.placeholder||'')+'" style="resize:none">'+(savedVal||'')+'</textarea>';
  } else if(q.type==='choice') {
    html += '<div class="choices">';
    q.choices.forEach(function(c,i){
      var sel = savedVal===c.text?' selected':'';
      html += '<button class="choice'+sel+'" onclick="selectChoice(\''+fid+'\',\''+c.text.replace(/'/g,'\\\'')+'\')" >';
      html += '<span class="choice-icon">'+c.icon+'</span><span class="choice-text">'+c.text+'</span>';
      html += '<span class="choice-check">'+(sel?' ✓':'')+'</span></button>';
    });
    html += '</div>';
  } else if(q.type==='multi') {
    var savedArr = savedVal || [];
    html += '<div class="choices multi">';
    q.choices.forEach(function(c){
      var sel = savedArr.indexOf(c.text)>-1?' selected':'';
      html += '<button class="choice'+sel+'" onclick="toggleMulti(\''+fid+'\',\''+c.text.replace(/'/g,'\\\'')+'\')">';
      html += '<span class="choice-icon">'+c.icon+'</span><span class="choice-text">'+c.text+'</span>';
      html += '<span class="choice-check">'+(sel?' ✓':'')+'</span></button>';
    });
    html += '</div>';
  } else if(q.type==='emoji') {
    html += '<div class="emoji-scale">';
    q.opts.forEach(function(o){
      var sel = savedVal===o.label?' selected':'';
      html += '<button class="es-btn'+sel+'" onclick="selectEmoji(\''+fid+'\',\''+o.label+'\')"><span class="es-emoji">'+o.emoji+'</span><span class="es-label">'+o.label+'</span></button>';
    });
    html += '</div>';
  } else if(q.type==='temp') {
    html += '<div class="temp-sel">';
    [{v:'Zimny',icon:'🔵',desc:'Mało zainteresowany'},{v:'Letni',icon:'🟡',desc:'Słucha, zastanawia się'},{v:'Ciepły',icon:'🟠',desc:'Wyraźnie zainteresowany'},{v:'Gorący',icon:'🔥',desc:'Chce spotkania!'}].forEach(function(t){
      var sel = savedVal===t.v?' sel':'';
      html += '<button class="ts-btn'+sel+'" data-v="'+t.v+'" onclick="selectTemp2(\''+fid+'\',\''+t.v+'\')">';
      html += '<span class="ts-icon">'+t.icon+'</span><span class="ts-label">'+t.v+'</span><span class="ts-desc">'+t.desc+'</span></button>';
    });
    html += '</div>';
  }

  // Nav
  html += '<div class="qnav">';
  if(s.current > 0) html += '<button class="btn-back" onclick="prevQ(\''+fid+'\')">← Wróć</button>';
  if(isLast) {
    html += '<button class="btn-submit '+(s.color||'')+'" onclick="submitFlow(\''+fid+'\')">✅ Zapisz +'+s.xpAmount+' XP</button>';
  } else {
    html += '<button class="btn-next '+(s.color||'')+'" onclick="nextQ(\''+fid+'\')">Dalej →</button>';
  }
  html += '</div>';

  html += '</div></div>';
  container.innerHTML = html;
  // Focus input + przewiń pole nad klawiaturę (mobile)
  setTimeout(function(){
    var inp=document.getElementById('qi_'+fid);
    if(inp){
      inp.focus();
      // po pojawieniu się klawiatury przewiń pole do widoku
      setTimeout(function(){ scrollFieldIntoView(inp); }, 350);
    }
  },300);
}

// Przewija aktywne pole tak, by było widoczne nad klawiaturą
function scrollFieldIntoView(el){
  if(!el) return;
  try {
    el.scrollIntoView({block:'center', behavior:'smooth'});
  } catch(e){
    el.scrollIntoView();
  }
}

function selectChoice(fid, val) {
  flows[fid].answers[flows[fid].questions[flows[fid].current].id] = val;
  renderQ(fid);
  setTimeout(function(){ nextQ(fid); }, 220);
}

function toggleMulti(fid, val) {
  var q = flows[fid].questions[flows[fid].current];
  var arr = flows[fid].answers[q.id] || [];
  var idx = arr.indexOf(val);
  if(idx>-1) arr.splice(idx,1); else arr.push(val);
  flows[fid].answers[q.id] = arr;
  renderQ(fid);
}

function selectEmoji(fid, val) {
  flows[fid].answers[flows[fid].questions[flows[fid].current].id] = val;
  renderQ(fid);
  setTimeout(function(){ nextQ(fid); }, 220);
}

function selectTemp2(fid, val) {
  flows[fid].answers[flows[fid].questions[flows[fid].current].id] = val;
  renderQ(fid);
}

function nextQ(fid) {
  var s = flows[fid];
  var q = s.questions[s.current];
  // Save text/textarea
  var inp = document.getElementById('qi_'+fid);
  if(inp) s.answers[q.id] = inp.value;
  // Validate required
  if(q.req) {
    var val = s.answers[q.id];
    if(!val||val.toString().trim()===''){
      var inpEl = document.getElementById('qi_'+fid);
      if(inpEl){ inpEl.style.borderColor='var(--red)'; inpEl.focus(); }
      showToast('⚠️ To pole jest wymagane!');
      return;
    }
  }
  if(s.current < s.questions.length-1){
    s.current++;
    renderQ(fid);
    window.scrollTo(0, document.querySelector('#'+fid+' .qflow-header') ? document.querySelector('#'+fid).offsetTop - 10 : 0);
  }
}

function prevQ(fid) {
  var s = flows[fid];
  var inp = document.getElementById('qi_'+fid);
  if(inp) s.answers[s.questions[s.current].id] = inp.value;
  if(s.current > 0){ s.current--; renderQ(fid); }
}

function submitFlow(fid) {
  var s = flows[fid];
  var inp = document.getElementById('qi_'+fid);
  if(inp) s.answers[s.questions[s.current].id] = inp.value;
  var a = s.answers;
  // Build payload
  var interesy = Array.isArray(a.int) ? a.int.join(', ') : (a.int||'');
  var data = {
    sheet_name: s.sheetName,
    typ_ankiety: fid,
    ankieter: window._user||'',
    data_wizyty: new Date().toLocaleDateString('pl-PL'),
    miejscowosc: a.msc||'',
    imie: a.imie||'',
    telefon: a.tel||'',
    kod_pocztowy: a.kod||'',
    typ_obj: a.typ||'',
    rachunek_prad: a.rachunek||'',
    koszt_ogrzew: a.koszt||a.koszt_ogrzew||'',
    ma_pv: a.pv||a.pv_status||'',
    zrodlo_ciepla: a.ogrzew||'',
    wiek_kotla: a.wiek_budynku||'',
    interesy: interesy,
    motyw: a.motyw||'',
    decyzja: a.decyzja||'',
    bol: a.bol||'',
    rachunki_ogol: a.rachunki_ogol||'',
    // --- pola Audytu PV ---
    finansowanie: a.finansowanie||'',
    pv_od_kiedy: a.od_kiedy||'',
    rachunki_mimo_pv: a.rachunki_mimo||'',
    netbilling_swiadomosc: a.netbilling||'',
    uzyski_sprawdzane: a.uzyski||'',
    pewnosc_instalacji: a.pewnosc||'',
    potrzeba_klienta: Array.isArray(a.potrzeba) ? a.potrzeba.join(', ') : (a.potrzeba||''),
    chce_zmiany: a.oddaje_darmo||'',
    zgoda_audyt: a.audyt||'',
    // --- pola Klimatyzacji (skrócona) ---
    klima_pomieszczenia: a.ile_pomieszczen||'',
    klima_powierzchnia: a.powierzchnia||'',
    klima_goraco: a.goraco||'',
    klima_grzanie_zima: a.grzanie_zima||'',
    klima_najwazniejsze: a.najwazniejsze||'',
    klima_termin: a.termin||'',
    klima_wycena: a.wycena||'',
    pora_kontaktu: a.pora||'',
    temp_leada: a.temp||'',
    uwagi: a.uwagi||'',
    // pelny zrzut wszystkich odpowiedzi (zabezpieczenie — nic nie ginie)
    wszystkie_odpowiedzi: JSON.stringify(a),
    // zdjecie papierowej kartki (jesli ankieter uzyl "Wpisz z kartki") — dowod/kopia zapasowa
    zdjecie: s.photo || ''
  };
  if(!data.telefon){showToast('⚠️ Brak telefonu klienta!'); s.current=0; renderQ(fid); return;}
  sendData(data, s.xpAmount, data.temp_leada==='Gorący', fid);
}

// ============================================================
// KOLEJKA DOSTARCZANIA (retry) — apka w polu ma slaby/zrywany internet.
// Wczesniej: blad sieci przy zapisie ankiety byl CICHO ignorowany (zakladano
// ze to tylko "sztuczny" blad z przekierowania Apps Script) — w rzeczywistosci
// realny brak polaczenia = dane NIGDY nie trafialy do arkusza, a ankieter i tak
// widzial "Zapisano!". Teraz: UI dalej dziala optymistycznie (bez blokowania
// pracy w terenie), ale kazdy nieudany zapis idzie do trwalej kolejki w
// localStorage i jest automatycznie wysylany ponownie (przy starcie apki,
// powrocie polaczenia i co ~45s), az serwer faktycznie potwierdzi {status:"ok"}.
// ============================================================
var PENDING_KEY = '4eco_pending_sends';

function _getPending(){
  try { return JSON.parse(localStorage.getItem(PENDING_KEY)) || []; } catch(e){ return []; }
}
function _savePending(list){
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(list)); } catch(e){}
}
function _queuePending(rawBody){
  var list = _getPending();
  list.push({ body: rawBody, ts: Date.now(), tries: 0 });
  // limit rozrostu — max 300 wpisow, najstarsze najpierw wyleca
  if (list.length > 300) list = list.slice(list.length - 300);
  _savePending(list);
  _updatePendingBadge();
}
function _updatePendingBadge(){
  try {
    var n = _getPending().length;
    var b = document.getElementById('pendingBadge');
    if (!b) return;
    if (n > 0) { b.style.display = 'inline-block'; b.textContent = '⏳ ' + n + ' do wysłania'; }
    else b.style.display = 'none';
  } catch(e){}
}
var _flushingPending = false;
function flushPendingQueue(){
  if (_flushingPending) return;
  var list = _getPending();
  if (!list.length) return;
  _flushingPending = true;
  var remaining = list.slice();
  var next = function(){
    if (!remaining.length) { _flushingPending = false; _updatePendingBadge(); return; }
    var item = remaining[0];
    fetch(WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: item.body })
      .then(function(r){ return r.text(); })
      .then(function(txt){
        var ok = false;
        try { var res = JSON.parse(txt); ok = (res.status === 'ok'); } catch(e){}
        if (ok) {
          remaining.shift();
          var all = _getPending();
          var idx = all.findIndex(function(x){ return x.ts === item.ts && x.body === item.body; });
          if (idx > -1) { all.splice(idx,1); _savePending(all); }
        } else {
          item.tries = (item.tries||0)+1;
          remaining.shift(); // spróbuj kolejny, ten wróci w następnym cyklu
        }
        next();
      })
      .catch(function(){ remaining.shift(); next(); }); // brak sieci — spróbujemy w kolejnym cyklu
  };
  next();
}
window.addEventListener('online', flushPendingQueue);
window.addEventListener('DOMContentLoaded', function(){ _updatePendingBadge(); setTimeout(flushPendingQueue, 2000); });
setInterval(flushPendingQueue, 45000);

function sendData(data, xp, isHot, fid) {
  var btns = document.querySelectorAll('#'+fid+' .btn-submit, #'+fid+' .btn-next');
  btns.forEach(function(b){b.disabled=true;b.textContent='Zapisuję...';});

  var rawBody = JSON.stringify(authBody(data));

  // Content-Type: text/plain omija preflight CORS i redirect w Apps Script
  fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: rawBody
  })
  .then(function(r){ return r.text(); })
  .then(function(txt){
    try {
      var res = JSON.parse(txt);
      if(res.status === 'error') { showToast('⚠️ Błąd arkusza: ' + res.message); _queuePending(rawBody); }
    } catch(e) {
      // odpowiedz nie jest poprawnym JSON-em — nie mamy potwierdzenia, dogrywamy w kolejce
      _queuePending(rawBody);
    }
    afterSave(data, xp, isHot, fid);
  })
  .catch(function(){
    // realny brak polaczenia / blad sieci — dane NIE dotarly, wsadz do kolejki retry
    _queuePending(rawBody);
    afterSave(data, xp, isHot, fid);
  });
}

function pushRanking(name, xp, total, hot, streak, todayCount) {
  var today = new Date().toLocaleDateString('pl-PL');
  var payload = {
    action:  'updateRanking',
    name:    name,
    xp:      xp,
    total:   total,
    hot:     hot,
    streak:  streak,
    today:   todayCount,
    date:    today
  };
  var rawBody = JSON.stringify(authBody(payload));
  fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: rawBody
  })
  .then(function(r){ return r.text(); })
  .then(function(txt){
    try { var res = JSON.parse(txt); if (res.status !== 'ok') _queuePending(rawBody); } catch(e){ _queuePending(rawBody); }
  })
  .catch(function(){ _queuePending(rawBody); }); // wczesniej: catch(function(){}) — ranking gubiony bez sladu
}

function afterSave(data, xp, isHot, fid) {
  // Oblicz XP z mnożnikiem combo
  var mult = getMultiplier();
  var finalXp = Math.round(xp * mult);
  saveToHistory(data);
  if(window._user) addXP(window._user, finalXp, isHot);

  // ── CEL DNIA: zaktualizuj licznik dnia i sprawdź domknięcie celu ──
  try {
    if (window._user && typeof dgOnSurvey === 'function') {
      var _dg = dgOnSurvey(window._user);
      if (typeof dgRender === 'function') dgRender(window._user);
      if (_dg && _dg.hit && typeof dgCelebrate === 'function') {
        setTimeout(function(){ dgCelebrate(_dg); }, 1100); // po confetti za ankietę
      }
    }
  } catch(e) { /* cel dnia opcjonalny — nigdy nie blokuje zapisu */ }
  // Zwiększ combo na następną ankietę
  comboHit();
  confettiBlast();
  floatXP('+'+finalXp+' XP' + (mult > 1 ? ' ×'+mult.toFixed(2) : ''));
  if(isHot) setTimeout(function(){floatXP('🔥 HOT!');},400);
  var multTxt = mult > 1 ? ' (×'+mult.toFixed(2)+' combo!)' : '';
  showToast(isHot?'🔥 GORĄCY LEAD! +'+finalXp+' XP'+multTxt:'✅ Zapisano! +'+finalXp+' XP'+multTxt);

  // ── ŁAPANIE NA MAPIE (Pokémon GO): pin w pozycji GPS + bonus za nowy teren ──
  try {
    if (typeof catchLead === 'function') {
      var temp = data.temp_leada || 'Zimny';
      var res = catchLead(temp, data.imie, data.miejscowosc, finalXp);
      if (res && res.caught) {
        playCatchAnim(temp, res.newTerritory);
        if (res.newTerritory) {
          // bonus XP za odkrycie nowej strefy terenu
          var BONUS = 30;
          if (window._user) addXP(window._user, BONUS, false);
          setTimeout(function(){ floatXP('🗺️ +'+BONUS+' XP nowy teren!'); }, 900);
        }
      } else if (res && res.reason === 'no_gps') {
        setTimeout(function(){ showToast('📍 Włącz lokalizację w zakładce Mapa, by łapać leady na mapie'); }, 1400);
      }
    }
  } catch (e) { /* mapa opcjonalna — nigdy nie blokuje zapisu */ }

  setTimeout(function(){showSuccess(data.typ_ankiety, data.temp_leada, finalXp, fid);},700);
}

function showSuccess(typ, temp, xp, fid) {
  var stats = getStats(window._user||'');
  var lv = getLv(stats.xp);
  var tCol = {Zimny:'#60a5fa',Letni:'#fbbf24',Ciepły:'#fb923c',Gorący:'#10d873'}[temp]||'#aaa';
  var tEm = {Zimny:'🔵',Letni:'🟡',Ciepły:'🟠',Gorący:'🔥'}[temp]||'';
  // Combo info
  var curStep = getCurrentStep();
  var mult    = COMBO_STEPS[curStep];
  var nextMult= curStep < COMBO_STEPS.length-1 ? COMBO_STEPS[curStep+1] : null;
  var comboCls= COMBO_CLASSES[curStep];
  var comboColors = {x1:'#aaa', x125:'#fbbf24', x150:'#fb923c', x175:'#f87171', x200:'#10d873'};
  var comboCol = comboColors[comboCls]||'#aaa';
  var comboRow = '<div class="srow" style="border-top:1px solid rgba(255,255,255,0.07);margin-top:8px;padding-top:8px">'+
    '<span class="srow-label">⚡ Mnożnik XP</span>'+
    '<span class="srow-val" style="color:'+comboCol+';font-size:1.1em">×'+mult.toFixed(2)+'</span></div>';
  var nextRow = nextMult ?
    '<div class="srow"><span class="srow-label">Kolejna ankieta</span>'+
    '<span class="srow-val" style="color:#10d873">→ ×'+nextMult.toFixed(2)+'</span></div>' :
    '<div class="srow"><span class="srow-label">⚡ MAX COMBO!</span>'+
    '<span class="srow-val" style="color:#10d873">🏆 ×2.00</span></div>';
  // Zapisz lokalizację do autofill na następne ankiety
  if(data.kod_pocztowy) localStorage.setItem('4eco_loc_location_kod', data.kod_pocztowy);
  if(data.miejscowosc) localStorage.setItem('4eco_loc_location_msc', data.miejscowosc);

  var ov = document.getElementById('successOverlay');
  if (ov) ov.remove();
  ov = document.createElement('div');
  ov.id = 'successOverlay';
  ov.className = 'success-overlay';
  ov.innerHTML = '<div class="success-screen">'+
    '<div class="success-icon">✅</div>'+
    '<div class="success-xp">+'+xp+' XP!</div>'+
    '<div class="success-card">'+
      '<div class="srow"><span class="srow-label">Typ ankiety</span><span class="srow-val" style="color:var(--blue)">'+typ+'</span></div>'+
      '<div class="srow"><span class="srow-label">Lead</span><span class="srow-val" style="color:'+tCol+'">'+tEm+' '+(temp||'brak')+'</span></div>'+
    comboRow + nextRow +
    '</div>'+
    '<div class="success-card glow">'+
      '<div style="font-size:0.68em;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Twój progres</div>'+
      '<div style="font-size:1.1em;font-weight:900;color:var(--green)">'+lv.icon+' Level '+lv.level+' — '+lv.name+'</div>'+
      '<div class="sgrid">'+
        '<div class="sgrid-item"><div class="sv" style="color:var(--green)">'+stats.xp+'</div><div class="sl">XP</div></div>'+
        '<div class="sgrid-item"><div class="sv" style="color:var(--purple)">'+stats.total+'</div><div class="sl">Ankiet</div></div>'+
        '<div class="sgrid-item"><div class="sv" style="color:var(--orange)">'+stats.streak+'🔥</div><div class="sl">Streak</div></div>'+
      '</div>'+
      '<div style="height:7px;background:var(--bg3);border-radius:7px;overflow:hidden">'+
        '<div style="height:100%;width:'+lv.progress+'%;background:linear-gradient(90deg,var(--green),var(--blue));border-radius:7px;box-shadow:0 0 8px rgba(16,216,115,0.4)"></div>'+
      '</div>'+
      '<div style="display:flex;justify-content:space-between;font-size:0.68em;color:var(--muted);margin-top:4px"><span>Level '+lv.level+'</span><span>'+stats.xp+' / '+lv.nextXp+' XP</span></div>'+
    '</div>'+
    '<button onclick="nextAnkieta(\''+fid+'\')" class="btn-primary" style="max-width:400px;font-size:1.05em">➕ Następna ankieta</button>'+
  '</div>';
  document.body.appendChild(ov);
  window.scrollTo(0, 0);
}

// Szybki restart ankiety bez przeladowania strony (zachowuje combo)
function nextAnkieta(fid) {
  var ov = document.getElementById('successOverlay');
  if (ov) ov.remove();
  var st = flows[fid];
  if (st && st._params) {
    var p = st._params;
    buildFlow(fid, p.questions, p.sheetName, p.color, p.xpAmount);
  }
  // przewin do gory i sfokusuj pierwszy input jesli jest
  window.scrollTo(0, 0);
  setTimeout(function(){
    var first = document.querySelector('#'+fid+' .q-input');
    if (first) try { first.focus(); } catch(e){}
  }, 200);
}


/* ─────────────────────────────────────────────────────────────
   MOBILE: klawiatura nie może zasłaniać aktywnego pola.
   Używamy visualViewport (reaguje na pojawienie się klawiatury)
   + reakcja na focus/scroll, by zawsze trzymać input w widoku.
   ───────────────────────────────────────────────────────────── */
(function(){
  function isField(el){
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
  }
  function keepInView(){
    var el = document.activeElement;
    if(!isField(el)) return;
    var vv = window.visualViewport;
    if(!vv){ el.scrollIntoView({block:'center'}); return; }
    var rect = el.getBoundingClientRect();
    // dolna krawędź widocznego obszaru (nad klawiaturą)
    var safeBottom = vv.height - 16;
    var safeTop = 70; // miejsce na nagłówek
    if(rect.bottom > safeBottom){
      window.scrollBy({top: rect.bottom - safeBottom + 12, behavior:'smooth'});
    } else if(rect.top < safeTop){
      window.scrollBy({top: rect.top - safeTop - 8, behavior:'smooth'});
    }
  }
  // Gdy pole dostaje fokus — włącz tryb klawiatury + przewiń je w widok
  document.addEventListener('focusin', function(e){
    if(isField(e.target)){
      document.body.classList.add('kb-open');
      setTimeout(keepInView, 300);
      setTimeout(keepInView, 600);
    }
  });
  // Gdy pole traci fokus — wyłącz tryb klawiatury
  document.addEventListener('focusout', function(e){
    if(isField(e.target)){
      setTimeout(function(){
        if(!isField(document.activeElement)) document.body.classList.remove('kb-open');
      }, 120);
    }
  });
  // Gdy klawiatura zmienia rozmiar viewportu — popraw pozycję
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', function(){
      if(isField(document.activeElement)) setTimeout(keepInView, 60);
    });
  }
})();
