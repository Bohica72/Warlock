export const BARBARIAN = {
  id: 'barbarian',
  name: 'Barbarian',
  source: 'XPHB',
  hitDie: 12,
  saves: ['str', 'con'],
  primaryAbility: 'str',
  spellcasting: { isSpellcaster: false, ability: null },

  // THE RESOURCE SCHEMA
  resources: [
    {
      id: 'rage',
      name: 'Rage',
      displayType: 'toggle', 
      recharge: {
        longRest: 'all',     
        shortRest: 1         
      },
      maxUses: {
        type: 'table',       
        values: {
          1: 2, 2: 2, 3: 3, 4: 3, 5: 3, 6: 4, 7: 4, 8: 4, 9: 4, 10: 4, 11: 4, 12: 5,
          13: 5, 14: 5, 15: 5, 16: 5, 17: 6, 18: 6, 19: 6, 20: 999 
        }
      },
      linkedEffects: ['rage_damage', 'rage_resistances', 'rage_advantage']
    }
  ],

  // Extra tables for math lookups
  progressionExtras: {
    rageDamage: {
      1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 3, 9: 3, 10: 3, 
      11: 3, 12: 3, 13: 3, 14: 3, 15: 3, 16: 4, 17: 4, 18: 4, 19: 4, 20: 4
    }
  },

  // THE FULL PROGRESSION MAP
  levels: {
    1:  { profBonus: 2, features: ['Rage', 'Unarmored Defense', 'Weapon Mastery'] },
    2:  { profBonus: 2, features: ['Danger Sense', 'Reckless Attack'] },
    3:  { profBonus: 2, features: ['Barbarian Subclass', 'Primal Knowledge'] },
    4:  { profBonus: 2, features: ['Ability Score Improvement'] },
    5:  { profBonus: 3, features: ['Extra Attack', 'Fast Movement'] },
    6:  { profBonus: 3, features: ['Subclass Feature'] },
    7:  { profBonus: 3, features: ['Feral Instinct', 'Instinctive Pounce'] },
    8:  { profBonus: 3, features: ['Ability Score Improvement'] },
    9:  { profBonus: 4, features: ['Brutal Strike'] },
    10: { profBonus: 4, features: ['Subclass Feature'] },
    11: { profBonus: 4, features: ['Relentless Rage'] },
    12: { profBonus: 4, features: ['Ability Score Improvement'] },
    13: { profBonus: 5, features: ['Improved Brutal Strike'] },
    14: { profBonus: 5, features: ['Subclass Feature'] },
    15: { profBonus: 5, features: ['Persistent Rage'] },
    16: { profBonus: 5, features: ['Ability Score Improvement'] },
    17: { profBonus: 6, features: ['Improved Brutal Strike'] },
    18: { profBonus: 6, features: ['Indomitable Might'] },
    19: { profBonus: 6, features: ['Epic Boon'] },
    20: { profBonus: 6, features: ['Primal Champion'] },
  },

  // GLOSSARY & EFFECTS
  featureDefinitions: {
    'Rage': {
      actionType: 'Bonus Action',
      description: "While active: Resistance to physical damage; gain Rage Damage bonus to STR attacks; Advantage on STR checks/saves. Lasts 10 minutes.",
      effects: [
        { id: 'rage_resistances', type: 'resistance', damageTypes: ['bludgeoning', 'piercing', 'slashing'] },
        { id: 'rage_damage', type: 'damage_bonus', weaponStat: 'str', valueLookup: 'rageDamage' },
        { id: 'rage_advantage', type: 'advantage', checks: ['str'], saves: ['str'] }
      ]
    },
    'Unarmored Defense': {
      actionType: 'Passive',
      description: "While wearing no armor, AC = 10 + DEX + CON. You can use a shield.",
      effects: [
        { 
          id: 'unarmored_defense_barb',
          type: 'ac_calculation', 
          formula: '10 + dex + con', 
          condition: 'no_heavy_or_medium_armor' 
        }
      ]
    },
    'Weapon Mastery': { actionType: 'Passive', description: "Use mastery properties of specific weapons. Change one choice on a Long Rest." },
    'Danger Sense': { actionType: 'Passive', description: "Advantage on DEX saves against effects you can see." },
    'Reckless Attack': { actionType: 'Special', description: "Gain Advantage on STR attacks this turn, but attacks against you have Advantage until your next turn." },
    'Primal Knowledge': { actionType: 'Passive', description: "Gain an extra Barbarian skill. Use STR for specific skill checks while Raging." },
    'Extra Attack': { actionType: 'Passive', description: "Attack twice, instead of once, when you take the Attack action." },
    'Fast Movement': { actionType: 'Passive', description: "Speed increases by 10 feet while not wearing heavy armor." },
    'Feral Instinct': { actionType: 'Passive', description: "Advantage on Initiative rolls." },
    'Instinctive Pounce': { actionType: 'Passive', description: "Move up to half your speed when you enter your Rage." },
    'Brutal Strike': { actionType: 'Special', description: "Forgo Advantage from Reckless Attack to deal extra 1d10 damage and apply a status effect like Forceful or Hamstring Blow." },
    'Relentless Rage': { actionType: 'Reaction', description: "When dropping to 0 HP while Raging, succeed on a CON save to drop to twice your level in HP instead." },
    'Improved Brutal Strike': { actionType: 'Passive', description: "Brutal Strike damage increases to 2d10. Gain new effect options." },
    'Persistent Rage': { actionType: 'Passive', description: "Regain all expended uses of Rage when you roll Initiative (once per Long Rest). Rage lasts 10 minutes without needing extension." },
    'Indomitable Might': { actionType: 'Passive', description: "If your STR check/save total is less than your STR score, use the score instead." },
    'Primal Champion': {
      actionType: 'Passive',
      description: "Your STR and CON scores increase by 4, to a maximum of 25.",
      effects: [
        { id: 'primal_champ_str', type: 'stat_increase', stat: 'str', amount: 4, capOverride: 25 },
        { id: 'primal_champ_con', type: 'stat_increase', stat: 'con', amount: 4, capOverride: 25 }
      ]
    }
  },

  // SUBCLASSES
  subclasses: [
    {
      id: 'path_of_the_giant',
      name: 'Path of the Giant',
      shortName: 'Giant',
      source: 'BGG',
      features: [
        { level: 3, name: "Giant Power", description: "Learn to speak, read, and write Giant. Learn druidcraft or thaumaturgy." },
        { level: 3, name: "Giant's Havoc", description: "While raging: Add Rage damage to thrown STR attacks. Reach increases by 5ft. Size becomes Large." },
        { level: 6, name: "Elemental Cleaver", description: "While raging: Infuse weapon with acid, cold, fire, thunder, or lightning. Deals extra 1d6 damage, gains thrown property (20/60), and returns to hand." },
        { level: 10, name: "Mighty Impel", description: "Bonus Action: Move a Medium or smaller creature within your reach 30ft (STR save resists)." },
        { level: 14, name: "Demiurgic Colossus", description: "Reach increases by 10ft; size can be Large or Huge. Elemental Cleaver damage increases to 2d6." }
      ]
    },
    {
      id: 'berserker',
      name: 'Path of the Berserker',
      shortName: 'Berserker',
      source: 'XPHB',
      features: [
        { level: 3, name: "Frenzy", description: "Make a melee attack as a Bonus Action while Raging. Gain 1 level of Exhaustion when Rage ends." },
        { level: 6, name: "Mindless Rage", description: "Immune to Charmed or Frightened while Raging." },
        { level: 10, name: "Retaliation", description: "Use Reaction to attack a creature within 5ft that damages you." },
        { level: 14, name: "Intimidating Presence", description: "Bonus Action: Frighten a creature within 30ft (Wisdom save resists)." }
      ]
    }
  ]
};