// ── PAO 10×10×10 System ──────────────────────────────────────────────────────
// Encodes 3-digit numbers as Person + Action + Object using single digits.
// Split: hundreds digit = Person, tens digit = Action, units digit = Object.
// All items phonetically align to Major System consonants.
// Example: 598 → Loki (5=L) + Burning (9=B) + Flag (8=F)

const PAO10_PEOPLE_DATA = {
  "0": "Socrates (S)",
  "1": "Thor (T)",
  "2": "Napoleon (N)",
  "3": "Moses (M)",
  "4": "Robin Hood (R)",
  "5": "Loki (L)",
  "6": "Jack Sparrow (J)",
  "7": "King Arthur (K)",
  "8": "Frankenstein (F)",
  "9": "Batman (B)"
}

const PAO10_ACTIONS_DATA = {
  "0": "Sawing (S)",
  "1": "Throwing (T)",
  "2": "Nailing (N)",
  "3": "Melting (M)",
  "4": "Ripping (R)",
  "5": "Launching (L)",
  "6": "Juggling (J)",
  "7": "Kicking (K)",
  "8": "Flying (F)",
  "9": "Burning (B)"
}

const PAO10_OBJECTS_DATA = {
  "0": "Sword (S)",
  "1": "Torch (T)",
  "2": "Net (N)",
  "3": "Map (M)",
  "4": "Ring (R)",
  "5": "Ladder (L)",
  "6": "Shield (SH)",
  "7": "Goblet (G)",
  "8": "Flag (F)",
  "9": "Bomb (B)"
}

const PAO10_PEOPLE_IMAGES = {
  "0": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Socrate_du_Louvre.jpg/330px-Socrate_du_Louvre.jpg",
  "1": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Thor_by_M%C3%A5rten_Eskil_Winge%2C_1872.jpg/330px-Thor_by_M%C3%A5rten_Eskil_Winge%2C_1872.jpg",
  "2": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Jacques-Louis_David_-_The_Emperor_Napoleon_in_His_Study_at_the_Tuileries_-_Google_Art_Project.jpg/330px-Jacques-Louis_David_-_The_Emperor_Napoleon_in_His_Study_at_the_Tuileries_-_Google_Art_Project.jpg",
  "3": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Moses_Michaelangelo.jpg/330px-Moses_Michaelangelo.jpg",
  "4": "",
  "5": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Emil_Doepler_-_Loki%27s_Salmon_Form_%28color%29.jpg/330px-Emil_Doepler_-_Loki%27s_Salmon_Form_%28color%29.jpg",
  "6": "",
  "7": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Arthur-Pyle_The_Enchanter_Merlin.jpg/330px-Arthur-Pyle_The_Enchanter_Merlin.jpg",
  "8": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Frankenstein%27s_monster_%28Boris_Karloff%29.jpg/330px-Frankenstein%27s_monster_%28Boris_Karloff%29.jpg",
  "9": ""
}

const PAO10_ACTIONS_IMAGES = {
  "0": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Keso%C3%A4mies_sahaus.jpg/330px-Keso%C3%A4mies_sahaus.jpg",
  "1": "",
  "2": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Hammering.jpg/330px-Hammering.jpg",
  "3": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Metalwork_casting_2.jpg/330px-Metalwork_casting_2.jpg",
  "4": "",
  "5": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/SpaceX_Falcon_9_launch.jpg/330px-SpaceX_Falcon_9_launch.jpg",
  "6": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Juggling_performance.jpg/330px-Juggling_performance.jpg",
  "7": "",
  "8": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Majestic_Wingsuit_Flight.jpg/330px-Majestic_Wingsuit_Flight.jpg",
  "9": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Controlled_burn_on_the_Cimarron_National_Grassland_%285617500297%29.jpg/330px-Controlled_burn_on_the_Cimarron_National_Grassland_%285617500297%29.jpg"
}

const PAO10_OBJECTS_IMAGES = {
  "0": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Elgin_Marbles_sword.jpg/330px-Elgin_Marbles_sword.jpg",
  "1": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/LitTorch.jpg/330px-LitTorch.jpg",
  "2": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Purse_net.jpg/330px-Purse_net.jpg",
  "3": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Around_the_World_in_Eighty_Days_map.jpg/330px-Around_the_World_in_Eighty_Days_map.jpg",
  "4": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/The_ring_of_the_Nibelungs_%28Das_Rheingold%29.jpg/330px-The_ring_of_the_Nibelungs_%28Das_Rheingold%29.jpg",
  "5": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Ladder.jpg/330px-Ladder.jpg",
  "6": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Greek_shield_-_cropped.jpg/330px-Greek_shield_-_cropped.jpg",
  "7": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Gold_Goblet%2C_500BC%2C_Iran.jpg/330px-Gold_Goblet%2C_500BC%2C_Iran.jpg",
  "8": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Flag_of_the_United_Kingdom.svg/330px-Flag_of_the_United_Kingdom.svg.png",
  "9": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Bomb_icon.svg/330px-Bomb_icon.svg.png"
}

export { PAO10_PEOPLE_DATA, PAO10_ACTIONS_DATA, PAO10_OBJECTS_DATA }
export { PAO10_PEOPLE_IMAGES, PAO10_ACTIONS_IMAGES, PAO10_OBJECTS_IMAGES }
