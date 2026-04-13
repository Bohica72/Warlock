export const SORCERER = {
  id: 'sorcerer',
  name: 'Sorcerer',
  source: 'XPHB', // Or PHB
  hitDie: 6,
  saves: ['con', 'cha'],
  primaryAbility: 'cha',
  
  // 1. THE SPELLCASTING METADATA
  // The engine will use this later to calculate spell attack modifiers and save DCs
  spellcasting: { 
    isSpellcaster: true, 
    ability: 'cha',
    preparation: 'known' // 'known' for Sorcerer/Bard, 'prepared' for Cleric/Wizard
  },

  // 2. THE RESOURCE ARRAY
  // Notice how we treat spell slots exactly like Barbarian Rage!
  resources: [
    {
      id: 'sorcery_points',
      name: 'Sorcery Points',
      displayType: 'pool',
      recharge: { longRest: 'all' },
      maxUses: {
        type: 'table',
        // Sorcerers get points equal to their level starting at level 2
        values: {
          1: 0, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10,
          11: 11, 12: 12, 13: 13, 14: 14, 15: 15, 16: 16, 17: 17, 18: 18, 19: 19, 20: 20
        }
      }
    },
    {
      id: 'spell_slot_1',
      name: '1st Level Slots',
      displayType: 'pool',
      recharge: { longRest: 'all' },
      maxUses: {
        type: 'table',
        values: { 1: 2, 2: 3, 3: 4, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4, 10: 4, 11: 4, 12: 4, 13: 4, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4, 20: 4 }
      }
    },
    {
      id: 'spell_slot_2',
      name: '2nd Level Slots',
      displayType: 'pool',
      recharge: { longRest: 'all' },
      maxUses: {
        type: 'table',
        // 0 uses until level 3
        values: { 1: 0, 2: 0, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 3, 11: 3, 12: 3, 13: 3, 14: 3, 15: 3, 16: 3, 17: 3, 18: 3, 19: 3, 20: 3 }
      }
    },
    // ... You would continue this for spell_slot_3 through spell_slot_9!
  ],

  // 3. PROGRESSION EXTRAS (Spellcasting limits)
  // This tells the UI how many spells and cantrips the character is allowed to know at each level
  progressionExtras: {
    cantripsKnown: { 1: 4, 2: 4, 3: 4, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5, 9: 5, 10: 6, 11: 6, 12: 6, 13: 6, 14: 6, 15: 6, 16: 6, 17: 6, 18: 6, 19: 6, 20: 6 },
    spellsKnown:   { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11, 11: 12, 12: 12, 13: 13, 14: 13, 15: 14, 16: 14, 17: 15, 18: 15, 19: 15, 20: 15 }
  },

  // 4. PROGRESSION TABLE
  levels: {
    1: { profBonus: 2, features: ['Spellcasting', 'Sorcerous Origin'] },
    2: { profBonus: 2, features: ['Font of Magic'] },
    3: { profBonus: 2, features: ['Metamagic'] },
    4: { profBonus: 2, features: ['Ability Score Improvement'] },
    // ...
  },

  featureDefinitions: {
    'Font of Magic': { actionType: 'Special', description: 'Convert Sorcery Points into Spell Slots and vice versa.' },
    // ...
  },
  
  subclasses: []
};