export const invocations = [
  {
    id: "agonizing_blast",
    name: "Agonizing Blast",
    minLevel: 2,
    description: "When you cast eldritch blast, add your Charisma modifier to the damage it deals on a hit.",
    prerequisites: [
      { type: "spell", value: "eldritch_blast" }
    ],
    tags: ["damage", "eldritch_blast"]
  },
  {
    id: "armor_of_shadows",
    name: "Armor of Shadows",
    minLevel: 2,
    description: "You can cast mage armor on yourself at will, without expending a spell slot or material components.",
    prerequisites: [],
    tags: ["defense", "at_will"]
  },
  {
    id: "ascendant_step",
    name: "Ascendant Step",
    minLevel: 9,
    description: "You can cast levitate on yourself at will, without expending a spell slot or material components.",
    prerequisites: [],
    tags: ["mobility", "at_will"]
  },
  {
    id: "beast_speech",
    name: "Beast Speech",
    minLevel: 2,
    description: "You can cast speak with animals at will, without expending a spell slot.",
    prerequisites: [],
    tags: ["utility", "at_will"]
  },
  {
    id: "beguiling_influence",
    name: "Beguiling Influence",
    minLevel: 2,
    description: "You gain proficiency in the Deception and Persuasion skills.",
    prerequisites: [],
    tags: ["social", "skills"]
  },
  {
    id: "bewitching_whispers",
    name: "Bewitching Whispers",
    minLevel: 7,
    description: "You can cast compulsion once using a warlock spell slot. You can't do so again until you finish a long rest.",
    prerequisites: [],
    tags: ["control", "spell"]
  },
  {
    id: "book_of_ancient_secrets",
    name: "Book of Ancient Secrets",
    minLevel: 2,
    description: "You can now inscribe magical rituals in your Book of Shadows.",
    prerequisites: [
      { type: "pactBoon", value: "tome" }
    ],
    tags: ["ritual", "pact_tome"]
  },
  {
    id: "chains_of_carceri",
    name: "Chains of Carceri",
    minLevel: 15,
    description: "You can cast hold monster at will on celestials, fiends, and elementals.",
    prerequisites: [],
    tags: ["control", "high_level"]
  },
  {
    id: "devils_sight",
    name: "Devil's Sight",
    minLevel: 2,
    description: "You can see normally in darkness, both magical and nonmagical, to a distance of 120 feet.",
    prerequisites: [],
    tags: ["vision"]
  },
  {
    id: "dreadful_word",
    name: "Dreadful Word",
    minLevel: 7,
    description: "You can cast confusion once using a warlock spell slot. You can't do so again until you finish a long rest.",
    prerequisites: [],
    tags: ["control", "spell"]
  },
  {
    id: "eldritch_sight",
    name: "Eldritch Sight",
    minLevel: 2,
    description: "You can cast detect magic at will, without expending a spell slot.",
    prerequisites: [],
    tags: ["utility", "at_will"]
  },
  {
    id: "eldritch_spear",
    name: "Eldritch Spear",
    minLevel: 2,
    description: "When you cast eldritch blast, its range is 300 feet.",
    prerequisites: [
      { type: "spell", value: "eldritch_blast" }
    ],
    tags: ["range", "eldritch_blast"]
  },
  {
    id: "eyes_of_the_rune_keeper",
    name: "Eyes of the Rune Keeper",
    minLevel: 2,
    description: "You can read all writing.",
    prerequisites: [],
    tags: ["utility"]
  },
  {
    id: "fiendish_vigor",
    name: "Fiendish Vigor",
    minLevel: 2,
    description: "You can cast false life on yourself at will as a 1st-level spell.",
    prerequisites: [],
    tags: ["defense", "at_will"]
  },
  {
    id: "gaze_of_two_minds",
    name: "Gaze of Two Minds",
    minLevel: 2,
    description: "You can use your action to touch a willing humanoid and perceive through its senses.",
    prerequisites: [],
    tags: ["utility", "perception"]
  },
  {
    id: "lifedrinker",
    name: "Lifedrinker",
    minLevel: 12,
    description: "When you hit with your pact weapon, deal extra necrotic damage equal to your Charisma modifier.",
    prerequisites: [
      { type: "pactBoon", value: "blade" }
    ],
    tags: ["damage", "pact_blade"]
  },
  {
    id: "mask_of_many_faces",
    name: "Mask of Many Faces",
    minLevel: 2,
    description: "You can cast disguise self at will.",
    prerequisites: [],
    tags: ["utility", "at_will", "illusion"]
  },
  {
    id: "master_of_myriad_forms",
    name: "Master of Myriad Forms",
    minLevel: 15,
    description: "You can cast alter self at will.",
    prerequisites: [],
    tags: ["utility", "at_will"]
  },
  {
    id: "mire_the_mind",
    name: "Mire the Mind",
    minLevel: 5,
    description: "You can cast slow once using a warlock spell slot.",
    prerequisites: [],
    tags: ["control", "spell"]
  },
  {
    id: "misty_visions",
    name: "Misty Visions",
    minLevel: 2,
    description: "You can cast silent image at will.",
    prerequisites: [],
    tags: ["illusion", "at_will"]
  },
  {
    id: "one_with_shadows",
    name: "One with Shadows",
    minLevel: 5,
    description: "You can become invisible in dim light or darkness while motionless.",
    prerequisites: [],
    tags: ["stealth"]
  },
  {
    id: "otherworldly_leap",
    name: "Otherworldly Leap",
    minLevel: 9,
    description: "You can cast jump on yourself at will.",
    prerequisites: [],
    tags: ["mobility", "at_will"]
  },
  {
    id: "repelling_blast",
    name: "Repelling Blast",
    minLevel: 2,
    description: "When you hit a creature with eldritch blast, you can push it 10 feet away.",
    prerequisites: [
      { type: "spell", value: "eldritch_blast" }
    ],
    tags: ["control", "eldritch_blast"]
  },
  {
    id: "sculptor_of_flesh",
    name: "Sculptor of Flesh",
    minLevel: 7,
    description: "You can cast polymorph once using a warlock spell slot.",
    prerequisites: [],
    tags: ["utility", "spell"]
  },
  {
    id: "sign_of_ill_omen",
    name: "Sign of Ill Omen",
    minLevel: 5,
    description: "You can cast bestow curse once using a warlock spell slot.",
    prerequisites: [],
    tags: ["curse", "spell"]
  },
  {
    id: "thief_of_five_fates",
    name: "Thief of Five Fates",
    minLevel: 2,
    description: "You can cast bane once using a warlock spell slot.",
    prerequisites: [],
    tags: ["debuff", "spell"]
  },
  {
    id: "thirsting_blade",
    name: "Thirsting Blade",
    minLevel: 5,
    description: "You can attack twice with your pact weapon.",
    prerequisites: [
      { type: "pactBoon", value: "blade" }
    ],
    tags: ["combat", "extra_attack", "pact_blade"]
  },
  {
    id: "visions_of_distant_realms",
    name: "Visions of Distant Realms",
    minLevel: 15,
    description: "You can cast arcane eye at will.",
    prerequisites: [],
    tags: ["utility", "at_will"]
  },
  {
    id: "voice_of_the_chain_master",
    name: "Voice of the Chain Master",
    minLevel: 2,
    description: "You can perceive through your familiar’s senses at any distance.",
    prerequisites: [
      { type: "pactBoon", value: "chain" }
    ],
    tags: ["familiar", "pact_chain"]
  },
  {
    id: "whispers_of_the_grave",
    name: "Whispers of the Grave",
    minLevel: 9,
    description: "You can cast speak with dead at will.",
    prerequisites: [],
    tags: ["utility", "at_will"]
  },
  ];