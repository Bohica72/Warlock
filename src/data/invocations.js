export const invocations = [
  {
    id: "agonizing_blast",
    name: "Agonizing Blast",
    minLevel: 2,
    description: "Choose one of your known Warlock cantrips that deals damage. You can add your Charisma modifier to that spell's damage rolls. You can gain this invocation more than once. Each time you do so, choose a different eligible cantrip.",
    prerequisites: [
      { type: "spell", value: "warlock_damage_cantrip" }
    ],
    tags: ["damage"]
  },
  {
    id: "armor_of_shadows",
    name: "Armor of Shadows",
    minLevel: 1,
    description: "You can cast Mage Armor on yourself without expending a spell slot.",
    prerequisites: [],
    tags: ["utility"]
  },
  {
    id: "ascendant_step",
    name: "Ascendant Step",
    minLevel: 5,
    description: "You can cast Levitate on yourself without expending a spell slot.",
    prerequisites: [],
    tags: ["utility"]
  },
  {
    id: "devils_sight",
    name: "Devil's Sight",
    minLevel: 2,
    description: "You can see normally in Dim Light and Darkness—both magical and nonmagical—within 120 feet of yourself.",
    prerequisites: [],
    tags: ["utility"]
  },
  {
    id: "devouring_blade",
    name: "Devouring Blade",
    minLevel: 12,
    description: "The Extra Attack of your Thirsting Blade invocation confers two extra attacks rather than one.",
    prerequisites: [
      { type: "invocation", value: "thirsting_blade" }
    ],
    tags: ["damage", "pact_blade"]
  },
  {
    id: "eldritch_mind",
    name: "Eldritch Mind",
    minLevel: 1,
    description: "You have Advantage on Constitution saving throws that you make to maintain Concentration.",
    prerequisites: [],
    tags: ["utility"]
  },
  {
    id: "eldritch_smite",
    name: "Eldritch Smite",
    minLevel: 5,
    description: "Once per turn when you hit a creature with your pact weapon, you can expend a Pact Magic spell slot to deal an extra 1d8 Force damage to the target, plus another 1d8 per level of the spell slot, and you can give the target the Prone condition if it is Huge or smaller.",
    prerequisites: [
      { type: "invocation", value: "pact_of_the_blade" }
    ],
    tags: ["damage"]
  },
  {
    id: "eldritch_spear",
    name: "Eldritch Spear",
    minLevel: 2,
    description: "Choose one of your known Warlock cantrips that deals damage and has a range of 10+ feet. When you cast that spell, its range increases by a number of feet equal to 30 times your Warlock level. You can gain this invocation more than once. Each time you do so, choose a different eligible cantrip.",
    prerequisites: [
      { type: "spell", value: "warlock_damage_cantrip" }
    ],
    tags: ["utility"]
  },
  {
    id: "fiendish_vigor",
    name: "Fiendish Vigor",
    minLevel: 2,
    description: "You can cast False Life on yourself without expending a spell slot. When you cast the spell with this feature, you don't roll the die for the Temporary Hit Points; you automatically get the highest number on the die.",
    prerequisites: [],
    tags: ["utility"]
  },
  {
    id: "gaze_of_two_minds",
    name: "Gaze of Two Minds",
    minLevel: 5,
    description: "You can use a Bonus Action to touch a willing creature and perceive through its senses until the end of your next turn. As long as the creature is on the same plane of existence as you, you can take a Bonus Action on subsequent turns to maintain this connection, extending the duration until the end of your next turn. The connection ends if you don't maintain it in this way. While perceiving through the other creature's senses, you benefit from any special senses possessed by that creature, and you can cast spells as if you were in your space or the other creature's space if the two of you are within 60 feet of each other.",
    prerequisites: [],
    tags: ["utility"]
  },
  {
    id: "gift_of_the_depths",
    name: "Gift of the Depths",
    minLevel: 5,
    description: "You can breathe underwater, and you gain a Swim Speed equal to your Speed. You can also cast Water Breathing once without expending a spell slot. You regain the ability to cast it in this way again when you finish a Long Rest.",
    prerequisites: [],
    tags: ["utility"]
  },
  {
    id: "gift_of_the_protectors",
    name: "Gift of the Protectors",
    minLevel: 9,
    description: "A new page appears in your Book of Shadows when you conjure it. With your permission, a creature can take an action to write its name on that page, which can contain a number of names equal to your Charisma modifier (minimum of one name). When any creature whose name is on the page is reduced to 0 Hit Points but not killed outright, the creature magically drops to 1 Hit Points instead. Once this magic is triggered, no creature can benefit from it until you finish a Long Rest. As a Magic action, you can erase a name on the page by touching it.",
    prerequisites: [
      { type: "invocation", value: "pact_of_the_tome" }
    ],
    tags: ["utility"]
  },
  {
    id: "investment_of_the_chain_master",
    name: "Investment of the Chain Master",
    minLevel: 5,
    description: "When you cast Find Familiar, you infuse the summoned familiar with a measure of your eldritch power, granting the creature the following benefits. The familiar gains either a Fly Speed or a Swim Speed (your choice) of 40 feet. As a Bonus Action, you can command the familiar to take the Attack action. Whenever the familiar deals Bludgeoning, Piercing, or Slashing damage, you can make it deal Necrotic or Radiant damage instead. If the familiar forces a creature to make a saving throw, it uses your spell save DC. When the familiar takes damage, you can take a Reaction to grant it Resistance against that damage.",
    prerequisites: [
      { type: "invocation", value: "pact_of_the_chain" }
    ],
    tags: ["pact_chain"]
  },
  {
    id: "lessons_of_the_first_ones",
    name: "Lessons of the First Ones",
    minLevel: 2,
    description: "You have received knowledge from an elder entity of the multiverse, allowing you to gain one Origin feat of your choice. You can gain this invocation more than once. Each time you do so, choose a different Origin feat.",
    prerequisites: [],
    tags: ["utility"]
  },
  {
    id: "lifedrinker",
    name: "Lifedrinker",
    minLevel: 9,
    description: "Once per turn when you hit a creature with your pact weapon, you can deal an extra 1d6 Necrotic, Psychic, or Radiant damage (your choice) to the creature, and you can expend one of your Hit Point Dice to roll it and regain a number of Hit Points equal to the roll plus your Constitution modifier (minimum of 1 Hit Points).",
    prerequisites: [
      { type: "invocation", value: "pact_of_the_blade" }
    ],
    tags: ["utility"]
  },
  {
    id: "mask_of_many_faces",
    name: "Mask of Many Faces",
    minLevel: 2,
    description: "You can cast Disguise Self without expending a spell slot.",
    prerequisites: [],
    tags: ["utility"]
  },
  {
    id: "master_of_myriad_forms",
    name: "Master of Myriad Forms",
    minLevel: 5,
    description: "You can cast Alter Self without expending a spell slot.",
    prerequisites: [],
    tags: ["utility"]
  },
  {
    id: "misty_visions",
    name: "Misty Visions",
    minLevel: 2,
    description: "You can cast Silent Image without expending a spell slot.",
    prerequisites: [],
    tags: ["utility"]
  },
  {
    id: "one_with_shadows",
    name: "One with Shadows",
    minLevel: 5,
    description: "While you're in an area of Dim Light or Darkness, you can cast Invisibility on yourself without expending a spell slot.",
    prerequisites: [],
    tags: ["utility"]
  },
  {
    id: "otherworldly_leap",
    name: "Otherworldly Leap",
    minLevel: 2,
    description: "You can cast Jump on yourself without expending a spell slot.",
    prerequisites: [],
    tags: ["utility"]
  },
  {
    id: "pact_of_the_blade",
    name: "Pact of the Blade",
    minLevel: 1,
    description: "As a Bonus Action, you can conjure a pact weapon in your hand—a Simple or Martial Melee weapon of your choice with which you bond—or create a bond with a magic weapon you touch; you can't bond with a magic weapon if someone else is attuned to it or another Warlock is bonded with it. Until the bond ends, you have proficiency with the weapon, and you can use it as a Spellcasting Focus. Whenever you attack with the bonded weapon, you can use your Charisma modifier for the attack and damage rolls instead of using Strength or Dexterity; and you can cause the weapon to deal Necrotic, Psychic, or Radiant damage or its normal damage type. Your bond with the weapon ends if you use this feature's Bonus Action again, if the weapon is more than 5 feet away from you for 1 minute or more, or if you die. A conjured weapon disappears when the bond ends.",
    prerequisites: [],
    tags: ["pact_blade"]
  },
  {
    id: "pact_of_the_chain",
    name: "Pact of the Chain",
    minLevel: 1,
    description: "You learn the Find Familiar spell and can cast it as a Magic action without expending a spell slot. When you cast the spell, you choose one of the normal forms for your familiar or one of the following special forms: Imp, Pseudodragon, Quasit, Skeleton, Slaad Tadpole, Sphinx of Wonder, Sprite, or Venomous Snake (see appendix B for the familiar's stat block). Additionally, when you take the Attack action, you can forgo one of your own attacks to allow your familiar to make one attack of its own with its Reaction.",
    prerequisites: [],
    tags: ["pact_chain"]
  },
  {
    id: "pact_of_the_tome",
    name: "Pact of the Tome",
    minLevel: 1,
    description: "Stitching together strands of shadow, you conjure forth a book in your hand at the end of a Short Rest or Long Rest. This Book of Shadows (you determine its appearance) contains eldritch magic that only you can access, granting you the benefits below. The book disappears if you conjure another book with this feature or if you die. When the book appears, choose three cantrips, and choose two level 1 spells that have the Ritual tag. The spells can be from any class's spell list, and they must be spells you don't already have prepared. While the book is on your person, you have the chosen spells prepared, and they function as Warlock spells for you. You can use the book as a Spellcasting Focus.",
    prerequisites: [],
    tags: ["pact_tome"]
  },
  {
    id: "repelling_blast",
    name: "Repelling Blast",
    minLevel: 2,
    description: "Choose one of your known Warlock cantrips that requires an attack roll. When you hit a Large or smaller creature with that cantrip, you can push the creature up to 10 feet straight away from you. You can gain this invocation more than once. Each time you do so, choose a different eligible cantrip.",
    prerequisites: [
      { type: "spell", value: "warlock_damage_cantrip" }
    ],
    tags: ["damage"]
  },
  {
    id: "thirsting_blade",
    name: "Thirsting Blade",
    minLevel: 5,
    description: "You gain the Extra Attack feature for your pact weapon only. With that feature, you can attack twice with the weapon instead of once when you take the Attack action on your turn.",
    prerequisites: [
      { type: "invocation", value: "pact_of_the_blade" }
    ],
    tags: ["pact_blade"]
  },
  {
    id: "visions_of_distant_realms",
    name: "Visions of Distant Realms",
    minLevel: 9,
    description: "You can cast Arcane Eye without expending a spell slot.",
    prerequisites: [],
    tags: ["utility"]
  },
  {
    id: "whispers_of_the_grave",
    name: "Whispers of the Grave",
    minLevel: 7,
    description: "You can cast Speak with Dead without expending a spell slot.",
    prerequisites: [],
    tags: ["utility"]
  },
  {
    id: "witch_sight",
    name: "Witch Sight",
    minLevel: 15,
    description: "You have Truesight with a range of 30 feet.",
    prerequisites: [],
    tags: ["utility"]
  }
];
