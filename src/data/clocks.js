// ── Famous Clocks (00:00–23:00) ───────────────────────────────────────────────
// Quiz answer = clock name

const CLOCKS_DATA = {
  "12:00":"Wells Cathedral clock",
  "13:00":"Zytglogge",
  "14:00":"Prague Astronomical Clock",
  "15:00":"St Mark's Clock",
  "16:00":"Ulm Town Hall Astronomical Clock",
  "17:00":"Sighișoara Clock Tower",
  "18:00":"Astronomical Clock of Lyon",
  "19:00":"Spasskaya Tower Clock",
  "20:00":"Atlas Clock",
  "21:00":"Big Ben",
  "22:00":"Église Sainte-Croix Clock",
  "23:00":"Dolmabahçe Clock Tower",
  "00:00":"City Hall Clock",
  "01:00":"Orsay Station Clock",
  "02:00":"Edwardian Clock & Tower",
  "03:00":"Grand Central Terminal Clock",
  "04:00":"Anker Clock",
  "05:00":"Peace Tower",
  "06:00":"Selfridges Clock",
  "07:00":"Binns Clock",
  "08:00":"Allen-Bradley Clock Tower",
  "09:00":"World Clock",
  "10:00":"Leaning Clock Tower",
  "11:00":"Makkah Royal Clock Tower"
};

// Extra info shown in the preview table only
const CLOCKS_META = [
  { time:"12:00", name:"Wells Cathedral clock",           location:"England",               year:"1392", mnemonic:"DuMB Nun"      },
  { time:"13:00", name:"Zytglogge",                       location:"Bern, Switzerland",     year:"1405", mnemonic:"Tears Lollipop"},
  { time:"14:00", name:"Prague Astronomical Clock",       location:"Czech, Prague",         year:"1410", mnemonic:"Tart sauce"    },
  { time:"15:00", name:"St Mark's Clock",                 location:"Venice, Italy",         year:"1499", mnemonic:"Drop Baby"     },
  { time:"16:00", name:"Ulm Town Hall Astronomical Clock",location:"Germany",               year:"1520", mnemonic:"TeLeNewS"      },
  { time:"17:00", name:"Sighișoara Clock Tower",          location:"Romania",               year:"1648", mnemonic:"DJ roof"       },
  { time:"18:00", name:"Astronomical Clock of Lyon",      location:"France, Lyon",          year:"1661", mnemonic:"Attach Judah"  },
  { time:"19:00", name:"Spasskaya Tower Clock",           location:"Russia",                year:"1852", mnemonic:"Devil Nail"    },
  { time:"20:00", name:"Atlas Clock",                     location:"Tiffany, NYC",          year:"1853", mnemonic:"Diva Lamb"     },
  { time:"21:00", name:"Big Ben",                         location:"London",                year:"1859", mnemonic:"Tough Lip"     },
  { time:"22:00", name:"Église Sainte-Croix Clock",       location:"Nantes, France",        year:"1860", mnemonic:"TV jazz"       },
  { time:"23:00", name:"Dolmabahçe Clock Tower",          location:"Istanbul, Türkiye",     year:"1895", mnemonic:"Diva Pail"     },
  { time:"00:00", name:"City Hall Clock",                 location:"Philadelphia",           year:"1898", mnemonic:"Dive Buffet"   },
  { time:"01:00", name:"Orsay Station Clock",             location:"Paris",                 year:"1900", mnemonic:"Top Sauce"     },
  { time:"02:00", name:"Edwardian Clock & Tower",         location:"US, Dorchester",        year:"1905", mnemonic:"shTePSeLi"     },
  { time:"03:00", name:"Grand Central Terminal Clock",    location:"New York City",         year:"1913", mnemonic:"Top Dome"      },
  { time:"04:00", name:"Anker Clock",                     location:"Vienna, Austria",       year:"1914", mnemonic:"Debater"       },
  { time:"05:00", name:"Peace Tower",                     location:"Ottawa, Canada",        year:"1920", mnemonic:"Top news"      },
  { time:"06:00", name:"Selfridges Clock",                location:"London, Oxford St",     year:"1931", mnemonic:"Dope mad"      },
  { time:"07:00", name:"Binns Clock",                     location:"Edinburgh, Scotland",   year:"1960", mnemonic:"Top Jazz"      },
  { time:"08:00", name:"Allen-Bradley Clock Tower",       location:"Milwaukee, Wisconsin",  year:"1962", mnemonic:"BaBaJaN"       },
  { time:"09:00", name:"World Clock",                     location:"Urania, Berlin",        year:"1969", mnemonic:"Top Shop"      },
  { time:"10:00", name:"Leaning Clock Tower",             location:"Tbilisi",               year:"2011", mnemonic:"Nasty Date"    },
  { time:"11:00", name:"Makkah Royal Clock Tower",        location:"Mecca, Saudi Arabia",   year:"2011", mnemonic:"Nasty Date"    },
];


const CLOCKS_IMAGES = {
  "12:00": "https://davidtbilski.github.io/Clocks24/images/1200.jpg",
  "13:00": "https://davidtbilski.github.io/Clocks24/images/1300.jpg",
  "14:00": "https://davidtbilski.github.io/Clocks24/images/1400.jpg",
  "15:00": "https://davidtbilski.github.io/Clocks24/images/1500.jpg",
  "16:00": "https://davidtbilski.github.io/Clocks24/images/1600.jpg",
  "17:00": "https://davidtbilski.github.io/Clocks24/images/1700.jpg",
  "18:00": "https://davidtbilski.github.io/Clocks24/images/1800.jpg",
  "19:00": "https://davidtbilski.github.io/Clocks24/images/1900.jpg",
  "20:00": "https://davidtbilski.github.io/Clocks24/images/2000.jpg",
  "21:00": "https://davidtbilski.github.io/Clocks24/images/2100.jpg",
  "22:00": "https://davidtbilski.github.io/Clocks24/images/2200.jpg",
  "23:00": "https://davidtbilski.github.io/Clocks24/images/2300.jpg",
  "00:00": "https://davidtbilski.github.io/Clocks24/images/0000.jpg",
  "01:00": "https://davidtbilski.github.io/Clocks24/images/0100.jpg",
  "02:00": "https://davidtbilski.github.io/Clocks24/images/0200.jpg",
  "03:00": "https://davidtbilski.github.io/Clocks24/images/0300.jpg",
  "04:00": "https://davidtbilski.github.io/Clocks24/images/0400.jpg",
  "05:00": "https://davidtbilski.github.io/Clocks24/images/0500.jpg",
  "06:00": "https://davidtbilski.github.io/Clocks24/images/0600.jpg",
  "07:00": "https://davidtbilski.github.io/Clocks24/images/0700.jpg",
  "08:00": "https://davidtbilski.github.io/Clocks24/images/0800.jpg",
  "09:00": "https://davidtbilski.github.io/Clocks24/images/0900.jpg",
  "10:00": "https://davidtbilski.github.io/Clocks24/images/1000.jpg",
  "11:00": "https://davidtbilski.github.io/Clocks24/images/1100.jpg"
};

export { CLOCKS_DATA, CLOCKS_IMAGES }
