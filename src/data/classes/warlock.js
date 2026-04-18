export const WARLOCK = {
  id: 'warlock',
  name: 'Warlock',
  source: 'XPHB',
  hitDie: 8,
  saves: ['wis', 'cha'],
  primaryAbility: 'cha',
  spellcasting: { isSpellcaster: true, type: 'pact_magic', ability: 'cha' },
  
  resource: { 
    name: 'Pact Slots', 
    type: 'shortRest', 
    displayType: 'counter' 
  },

  // Remove the old 'resource: {}' block and use the engine-compatible columns below

  levels: {
    1:  { profBonus: 2, cantripsKnown: 2, spellsKnown: 2,  pactSlots: 1, slotLevel: 1, invocations: 0, features: ['Pact Magic', 'Warlock Subclass'] },
    2:  { profBonus: 2, cantripsKnown: 2, spellsKnown: 3,  pactSlots: 2, slotLevel: 1, invocations: 2, features: ['Eldritch Invocations', 'Magical Cunning'] },
    3:  { profBonus: 2, cantripsKnown: 2, spellsKnown: 4,  pactSlots: 2, slotLevel: 2, invocations: 2, features: ['Pact Boon'] },
    4:  { profBonus: 2, cantripsKnown: 3, spellsKnown: 5,  pactSlots: 2, slotLevel: 2, invocations: 3, features: ['Ability Score Improvement'] },
    5:  { profBonus: 3, cantripsKnown: 3, spellsKnown: 6,  pactSlots: 2, slotLevel: 3, invocations: 3, features: [] },
    6:  { profBonus: 3, cantripsKnown: 3, spellsKnown: 7,  pactSlots: 2, slotLevel: 3, invocations: 3, features: ['Subclass Feature'] },
    7:  { profBonus: 3, cantripsKnown: 3, spellsKnown: 8,  pactSlots: 2, slotLevel: 4, invocations: 4, features: [] },
    8:  { profBonus: 3, cantripsKnown: 3, spellsKnown: 9,  pactSlots: 2, slotLevel: 4, invocations: 4, features: ['Ability Score Improvement'] },
    9:  { profBonus: 4, cantripsKnown: 3, spellsKnown: 10, pactSlots: 2, slotLevel: 5, invocations: 5, features: [] },
    10: { profBonus: 4, cantripsKnown: 4, spellsKnown: 10, pactSlots: 2, slotLevel: 5, invocations: 5, features: ['Subclass Feature'] },
    11: { profBonus: 4, cantripsKnown: 4, spellsKnown: 11, pactSlots: 3, slotLevel: 5, invocations: 5, arcanum6: 1, features: ['Mystic Arcanum (6th level)'] },
    12: { profBonus: 4, cantripsKnown: 4, spellsKnown: 11, pactSlots: 3, slotLevel: 5, invocations: 6, arcanum6: 1, features: ['Ability Score Improvement'] },
    13: { profBonus: 5, cantripsKnown: 4, spellsKnown: 12, pactSlots: 3, slotLevel: 5, invocations: 6, arcanum6: 1, arcanum7: 1, features: ['Mystic Arcanum (7th level)'] },
    14: { profBonus: 5, cantripsKnown: 4, spellsKnown: 12, pactSlots: 3, slotLevel: 5, invocations: 6, arcanum6: 1, arcanum7: 1, features: ['Subclass Feature'] },
    15: { profBonus: 5, cantripsKnown: 4, spellsKnown: 13, pactSlots: 3, slotLevel: 5, invocations: 7, arcanum6: 1, arcanum7: 1, arcanum8: 1, features: ['Mystic Arcanum (8th level)'] },
    16: { profBonus: 5, cantripsKnown: 4, spellsKnown: 13, pactSlots: 3, slotLevel: 5, invocations: 7, arcanum6: 1, arcanum7: 1, arcanum8: 1, features: ['Ability Score Improvement'] },
    17: { profBonus: 6, cantripsKnown: 4, spellsKnown: 14, pactSlots: 4, slotLevel: 5, invocations: 7, arcanum6: 1, arcanum7: 1, arcanum8: 1, arcanum9: 1, features: ['Mystic Arcanum (9th level)'] },
    18: { profBonus: 6, cantripsKnown: 4, spellsKnown: 14, pactSlots: 4, slotLevel: 5, invocations: 8, arcanum6: 1, arcanum7: 1, arcanum8: 1, arcanum9: 1, features: [] },
    19: { profBonus: 6, cantripsKnown: 4, spellsKnown: 15, pactSlots: 4, slotLevel: 5, invocations: 8, arcanum6: 1, arcanum7: 1, arcanum8: 1, arcanum9: 1, features: ['Ability Score Improvement'] },
    20: { profBonus: 6, cantripsKnown: 4, spellsKnown: 15, pactSlots: 4, slotLevel: 5, invocations: 8, arcanum6: 1, arcanum7: 1, arcanum8: 1, arcanum9: 1, features: ['Eldritch Master'] },
  },

  featureDefinitions: {
    'Pact Magic': {
      actionType: 'Passive',
      description: "Your arcane research and the magic bestowed on you by your patron have given you facility with spells. You regain all expended Pact Magic slots when you finish a Short or Long Rest."
    },
    'Eldritch Invocations': {
      actionType: 'Passive',
      description: "You have unearthed Eldritch Invocations, fragments of forbidden knowledge that imbue you with permanent magical abilities. You gain more invocations as you level."
    },
    'Magical Cunning': {
      actionType: 'Passive',
      description: "You can perform a short ritual to regain expended Pact Magic spell slots without resting. Once used, you must finish a Long Rest before using this feature again."
    },
    'Pact Boon': {
      actionType: 'Passive',
      description: "At 3rd level, your patron grants you a boon: Pact of the Blade, Chain, or Tome."
    },
    'Ability Score Improvement': {
      actionType: 'Passive',
      description: "Increase one ability score by 2, or two ability scores by 1. Alternatively, take a feat."
    },
    'Mystic Arcanum (6th level)': {
      actionType: 'Passive',
      description: "You can cast one 6th-level spell once per long rest without expending a spell slot."
    },
    'Mystic Arcanum (7th level)': {
      actionType: 'Passive',
      description: "You can cast one 7th-level spell once per long rest without expending a spell slot."
    },
    'Mystic Arcanum (8th level)': {
      actionType: 'Passive',
      description: "You can cast one 8th-level spell once per long rest without expending a spell slot."
    },
    'Mystic Arcanum (9th level)': {
      actionType: 'Passive',
      description: "You can cast one 9th-level spell once per long rest without expending a spell slot."
    },
    'Eldritch Master': {
      actionType: 'Action',
      description: "You can spend 1 minute entreating your patron to regain all expended Pact Magic spell slots. Once used, you must finish a Long Rest before using it again."
    }
  },

  subclasses: [
    {
      id: 'hexblade',
      name: 'The Hexblade',
      shortName: 'Hexblade',
      source: 'XGE',
      features: [
        { 
          level: 1, 
          name: 'Hexblade Expanded Spells', 
          description: "You gain additional spells to your warlock spell list, including shield, wrathful smite, blur, branding smite, blink, elemental weapon, phantasmal killer, staggering smite, banishing smite, and cone of cold."
        },
        { 
          level: 1, 
          name: "Hexblade's Curse", 
          description: "As a bonus action, choose one creature you can see within 30 ft. for 1 minute. You gain bonus damage equal to your proficiency bonus, score critical hits on a roll of 19–20, and regain hit points if the target dies. Usable once per short or long rest." 
        },
        { 
          level: 1, 
          name: 'Hex Warrior', 
          description: "You gain proficiency with medium armor, shields, and martial weapons. You can use Charisma instead of Strength or Dexterity for attack and damage rolls with one weapon you are proficient with (and later your pact weapon)." 
        },
        { 
          level: 6, 
          name: 'Accursed Specter', 
          description: "When you slay a humanoid, you can raise its spirit as a specter under your control until the end of your next long rest. The specter gains temporary hit points equal to half your level and acts on your turn." 
        },
        { 
          level: 10, 
          name: 'Armor of Hexes', 
          description: "If a creature cursed by your Hexblade’s Curse hits you, roll a d6. On a 4+, the attack instead misses." 
        },
        { 
          level: 14, 
          name: 'Master of Hexes', 
          description: "When a target of your Hexblade’s Curse dies, you can move the curse to another creature within 30 ft. without expending another use." 
        }
      ]
    }
  ]
};