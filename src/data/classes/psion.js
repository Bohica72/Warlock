export const PSION = {
  id: 'psion',
  name: 'Psion',
  source: 'UA2025',
  // Back-compat aliases used by current creation/review screens.
  hd: 6,
  hitDie: 6,
  proficiency: ['int', 'wis'],
  saves: ['int', 'wis'],
  primaryAbility: 'int',
  spellcastingAbility: 'int',
  spellcasting: {
    isSpellcaster: true,
    ability: 'int',
    type: 'prepared',
    // Psionic Spellcasting: no V or M components required,
    // except Material components that are consumed or have a listed cost.
    noVerbMatComponents: true,
  },

  // ─── RESOURCES ───────────────────────────────────────────────────────────────
  // Psionic Energy Dice are tracked as a pool with both a die size and a count.
  // The 'toggle' displayType is appropriate: the resource is a shared pool you
  // spend individual dice from, analogous to Hit Dice or Sorcery Points.
  resources: [
    {
      id: 'psionic_energy_dice',
      name: 'Psionic Energy Dice',
      displayType: 'numeric',
      recharge: {
        longRest: 'all',
        shortRest: 1,         // Regain 1 expended die on a Short Rest
      },
      // Die count scales by level; die size also scales (see progressionExtras).
      maxUses: {
        type: 'table',
        values: {
          1: 4,  2: 4,  3: 4,  4: 4,
          5: 6,  6: 6,  7: 6,  8: 6,
          9: 8,  10: 8, 11: 8, 12: 8,
          13: 10, 14: 10, 15: 10, 16: 10,
          17: 12, 18: 12, 19: 12, 20: 12,
        }
      },
      linkedEffects: [
        'telekinetic_propel',
        'telepathic_connection',
        'psionic_discipline_fuel',
      ]
    }
  ],

  // ─── PROGRESSION EXTRAS ──────────────────────────────────────────────────────
  progressionExtras: {
    // Psionic Energy Die size (the die type rolled when spending a die)
    energyDieSize: {
      1: 6,  2: 6,  3: 6,  4: 6,
      5: 8,  6: 8,  7: 8,  8: 8,
      9: 8,  10: 8, 11: 10, 12: 10,
      13: 10, 14: 10, 15: 10, 16: 10,
      17: 12, 18: 12, 19: 12, 20: 12,
    },
    // Prepared spells count (separate from spell slots table)
    preparedSpells: {
      1: 4,  2: 5,  3: 6,  4: 7,
      5: 9,  6: 10, 7: 11, 8: 12,
      9: 14, 10: 15, 11: 16, 12: 16,
      13: 17, 14: 17, 15: 18, 16: 18,
      17: 19, 18: 20, 19: 21, 20: 22,
    },
    // Spell slots per spell level, keyed by class level then slot level
    spellSlots: {
      1:  [2, 0, 0, 0, 0, 0, 0, 0, 0],
      2:  [3, 0, 0, 0, 0, 0, 0, 0, 0],
      3:  [4, 2, 0, 0, 0, 0, 0, 0, 0],
      4:  [4, 3, 0, 0, 0, 0, 0, 0, 0],
      5:  [4, 3, 2, 0, 0, 0, 0, 0, 0],
      6:  [4, 3, 3, 0, 0, 0, 0, 0, 0],
      7:  [4, 3, 3, 1, 0, 0, 0, 0, 0],
      8:  [4, 3, 3, 2, 0, 0, 0, 0, 0],
      9:  [4, 3, 3, 3, 1, 0, 0, 0, 0],
      10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
      11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
      12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
      13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
      14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
      15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
      16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
      17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
      18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
      19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
      20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
    },
  },

  // ─── LEVEL PROGRESSION ───────────────────────────────────────────────────────
  levels: {
    1:  { profBonus: 2, features: ['Psionic Power', 'Spellcasting', 'Subtle Telekinesis'] },
    2:  { profBonus: 2, features: ['Psionic Discipline'] },
    3:  { profBonus: 2, features: ['Psion Subclass'] },
    4:  { profBonus: 2, features: ['Ability Score Improvement'] },
    5:  { profBonus: 3, features: ['Psionic Discipline', 'Psionic Restoration'] },
    6:  { profBonus: 3, features: ['Subclass Feature'] },
    7:  { profBonus: 3, features: ['Psionic Surge'] },
    8:  { profBonus: 3, features: ['Ability Score Improvement'] },
    9:  { profBonus: 4, features: [] },
    10: { profBonus: 4, features: ['Psionic Discipline', 'Subclass Feature'] },
    11: { profBonus: 4, features: [] },
    12: { profBonus: 4, features: ['Ability Score Improvement'] },
    13: { profBonus: 5, features: ['Psionic Discipline'] },
    14: { profBonus: 5, features: ['Subclass Feature'] },
    15: { profBonus: 5, features: [] },
    16: { profBonus: 5, features: ['Ability Score Improvement'] },
    17: { profBonus: 6, features: ['Psionic Discipline'] },
    18: { profBonus: 6, features: ['Psionic Reserves'] },
    19: { profBonus: 6, features: ['Epic Boon'] },
    20: { profBonus: 6, features: ['Enkindled Life Force'] },
  },

  // ─── FEATURE DEFINITIONS ─────────────────────────────────────────────────────
  featureDefinitions: {

    'Psionic Power': {
      actionType: 'Passive',
      description:
        "You have a pool of Psionic Energy Dice. Your level determines their die size and count (see table). Regain 1 die on a Short Rest; all on a Long Rest. Includes two baseline abilities: Telekinetic Propel and Telepathic Connection.",
      subFeatures: {
        'Telekinetic Propel': {
          actionType: 'Bonus Action',
          description:
            "Choose one Large or smaller creature you can see within 30 ft. It makes a STR save or is moved 5 ft toward or away from you. Alternatively, roll one Psionic Energy Die — on a failed save the die is expended and the creature is moved 5 ft × the number rolled.",
        },
        'Telepathic Connection': {
          actionType: 'Bonus Action',
          description:
            "You have telepathy with a range of 30 ft. Roll one Psionic Energy Die (first use after each Long Rest is free). For 1 hour, telepathy range increases by 10 ft × the number rolled. The die is expended on subsequent uses.",
        },
      },
    },

    'Spellcasting': {
      actionType: 'Passive',
      description:
        "INT-based prepared spellcasting. Psionic Spellcasting: your Psion spells never require Verbal or Material components, except Material components that are consumed or have a listed cost.",
      effects: [
        { id: 'psion_spellcasting', type: 'spellcasting', ability: 'int', preparedType: 'prepared' }
      ]
    },

    'Subtle Telekinesis': {
      actionType: 'Passive',
      description:
        "You know the Mage Hand cantrip. You can cast it without Somatic components, and can make the spectral hand Invisible when you cast it.",
    },

    'Psionic Discipline': {
      actionType: 'Special',
      description:
        "You gain 2 Psionic Disciplines of your choice at level 2. Gain 1 more at levels 5, 10, 13, and 17. You can use only one Discipline per turn (unless a Discipline states otherwise). Replace one known Discipline whenever you gain a Psion level.",
    },

    'Psionic Restoration': {
      actionType: 'Special',
      description:
        "Level 5. Perform a 1-minute meditation to regain expended Psionic Energy Dice. Once used, requires a Long Rest to use again.",
    },

    'Psionic Surge': {
      actionType: 'Special',
      description:
        "Level 7. After rolling one or more Psionic Energy Dice, you can expend one of your Hit Point Dice to treat any roll of 1, 2, or 3 on those Psionic Energy Dice as a 4.",
    },

    'Psionic Reserves': {
      actionType: 'Passive',
      description:
        "Level 18. When you roll Initiative, if you have fewer than 4 Psionic Energy Dice remaining, you regain expended dice until you have 4.",
    },

    'Enkindled Life Force': {
      actionType: 'Special',
      description:
        "Level 20. Once per turn, when you roll one or more Psionic Energy Dice for a Psion feature or Discipline, you can expend 1 or 2 Hit Point Dice. For each HD expended, roll an additional Psionic Energy Die and add the result to the total. These extra Psionic Energy Dice are not expended.",
    },

    // ── PSIONIC DISCIPLINES ────────────────────────────────────────────────────
    'Biofeedback': {
      actionType: 'Special',
      description:
        "When you cast a Psion spell from the Necromancy or Transmutation school, you can expend up to [INT modifier] Psionic Energy Dice, roll them, and gain Temporary HP equal to the total rolled plus your INT modifier (minimum 1).",
    },

    'Bolstering Precognition': {
      actionType: 'Special',
      description:
        "When you cast a Psion spell from the Abjuration or Divination school, you can expend one Psionic Energy Die. Roll it and choose a creature you can see within 60 ft (including yourself). Until the end of your next turn, that creature gains a bonus to its next D20 Test equal to the number rolled. The die is expended only on success.",
    },

    'Destructive Thoughts': {
      actionType: 'Special',
      description:
        "When you cast a Psion spell from the Conjuration or Evocation school that forces a creature to make a saving throw, you can expend up to [INT modifier] Psionic Energy Dice and roll them. That creature takes Psychic damage equal to the total plus your INT modifier (minimum 1), regardless of its saving throw result.",
    },

    'Devilish Tongue': {
      actionType: 'Special',
      description:
        "When you take the Influence action, roll one Psionic Energy Die and add the number rolled to the ability check. The die is expended only if you succeed on the check.",
    },

    'Expanded Awareness': {
      actionType: 'Special',
      description:
        "When you take the Search action, roll one Psionic Energy Die and add the number rolled to the ability check. The die is expended only if you succeed on the check.",
    },

    'Id Insinuation': {
      actionType: 'Special',
      description:
        "When you cast a Psion spell from the Enchantment or Illusion school that forces a saving throw, you can expend one Psionic Energy Die and roll it. One target you can see subtracts half the number rolled (round up) from its saving throw against the spell.",
    },

    'Inerrant Aim': {
      actionType: 'Reaction',
      description:
        "When you make an attack roll against a creature and miss, roll one Psionic Energy Die and add the number rolled to the attack roll. If this causes the attack to hit, the die is expended.",
    },

    'Observant Mind': {
      actionType: 'Special',
      description:
        "When you take the Study action, roll one Psionic Energy Die and add the number rolled to the ability check. The die is expended only if you succeed on the check.",
    },

    'Psionic Backlash': {
      actionType: 'Reaction',
      description:
        "When a creature you can see hits you with an attack roll, expend one Psionic Energy Die and roll it. Reduce the damage you take by 2× the number rolled plus your INT modifier (minimum 2). You can also force the attacker to make a WIS save; on a failure, it takes Psychic damage equal to the amount you reduced.",
    },

    'Psionic Guards': {
      actionType: 'Special',
      description:
        "At the start of your turn, expend one Psionic Energy Die. Until the start of your next turn: Immunity to Charmed and Frightened; Advantage on INT saves. Ends Charmed/Frightened on you when activated. You may still use a different Discipline this turn.",
    },

    'Sharpened Mind': {
      actionType: 'Special',
      description:
        "At the start of your turn, expend one Psionic Energy Die. Roll it and record the number. For 1 minute (or until Incapacitated): Bypassing Psionics — damage from your weapon attacks, Psion spells, and Psion features ignores Resistance to Psychic damage; Attack Mode — once per turn when you deal Psychic damage, replace one damage die result with the recorded number. You may still use a different Discipline this turn.",
    },
  },

  // ─── SUBCLASSES ──────────────────────────────────────────────────────────────
  subclasses: [
    {
      id: 'metamorph',
      name: 'Metamorph',
      shortName: 'Metamorph',
      source: 'UA2025',
      alwaysPrepared: {
        3:  ['Alter Self', 'Cure Wounds', 'Inflict Wounds', 'Lesser Restoration'],
        5:  ['Aura of Vitality', 'Haste'],
        7:  ['Polymorph', 'Stoneskin'],
        9:  ['Contagion', 'Mass Cure Wounds'],
      },
      features: [
        {
          level: 3,
          name: 'Mutable Form',
          description:
            "Bonus Action: Expend one Psionic Energy Die. Roll it; gain Temporary HP equal to the roll plus your INT modifier (minimum 1). For 1 minute: Reach +5 ft; Speed +5 ft; spells with a Touch range and Action casting time can have their range extended to 10 ft.",
        },
        {
          level: 3,
          name: 'Organic Weapons',
          description:
            "Magic action: Reform your free hand into a Bone Blade (1d8 Piercing, Finesse, Simple Melee; Advantage if an ally is within 5 ft of target), Flesh Maul (1d10 Bludgeoning, Simple Melee; target has Disadvantage on next STR or CON save before its next turn), or Viscera Launcher (1d6 Acid, Simple Ranged 30/90 ft; extra 1d6 Acid on first hit per turn). Use INT for attack and damage rolls. Weapon persists until you change it (Magic action), you become Unconscious, or you revert it (no action).",
        },
        {
          level: 6,
          name: 'Extra Attack',
          description:
            "Attack twice instead of once when you take the Attack action. You can replace one of those attacks with a Psion cantrip that has a casting time of an action.",
        },
        {
          level: 6,
          name: 'Flesh Weaver',
          description:
            "When you use Mutable Form, you can expend an additional Psionic Energy Die to also gain: Organic Defense (+2 AC) and Empowered Healing (when you cast a spell that restores HP, expend one Psionic Energy Die to add the roll to the HP restored). Both effects last while Mutable Form is active.",
        },
        {
          level: 10,
          name: 'Improved Mutable Form',
          description:
            "Mutable Form's duration increases to 10 minutes. When you activate it, choose one additional benefit: Stony Epidermis (Advantage on CON saves to maintain Concentration; choose one damage type to gain Resistance to), Superior Stride (Dash as Bonus Action while unarmored; gain Climb and Swim speed equal to your Speed), or Unnatural Flexibility (+1 AC; move through spaces as narrow as 1 inch; spend 5 ft of movement to escape nonmagical restraints or end the Grappled condition).",
        },
        {
          level: 14,
          name: 'Life-Bending Weapons',
          description:
            "When you hit a target with your Organic Weapon, roll one Psionic Energy Die — the target takes extra Necrotic damage equal to the roll (this roll doesn't expend the die). Alternatively, expend one Psionic Energy Die: the target takes extra Necrotic damage equal to the roll, and each creature of your choice within a 30-ft Emanation from you regains HP equal to the roll plus your INT modifier. Once you use the expend option, you can't do so again until the start of your next turn.",
        },
      ]
    },

    {
      id: 'psykinetic',
      name: 'Psykinetic',
      shortName: 'Psykinetic',
      source: 'UA2025',
      alwaysPrepared: {
        3:  ['Cloud of Daggers', 'Levitate', 'Shield', 'Thunderwave'],
        5:  ['Slow', 'Telekinetic Crush'],
        7:  ["Otiluke's Resilient Sphere", 'Stone Shape'],
        9:  ['Telekinesis', 'Wall of Force'],
      },
      features: [
        {
          level: 3,
          name: 'Stronger Telekinesis',
          description:
            "When you cast Mage Hand, its range increases by 30 ft and the hand can carry up to 20 pounds.",
        },
        {
          level: 3,
          name: 'Telekinetic Techniques',
          description:
            "When you use Telekinetic Propel, you can roll 1d4 instead of expending a Psionic Energy Die. On a failed saving throw you can also impose one additional effect: Boost (target Speed +10 ft until start of your next turn), Disorient (target can't make Opportunity Attacks until start of its next turn), or Telekinetic Bolt (target takes Force damage equal to the Psionic Energy Die roll).",
        },
        {
          level: 6,
          name: 'Destructive Trance',
          description:
            "Bonus Action: Expend one Psionic Energy Die. For 10 minutes: gain a Fly Speed of 20 ft and can hover; when you cast a Psion spell that expends a spell slot, roll your Psionic Energy Die and add the number rolled to one damage roll of that spell (this roll doesn't expend the die).",
        },
        {
          level: 6,
          name: 'Rebounding Field',
          description:
            "When you cast Shield in response to being hit and cause the attack to miss, you can expend one Psionic Energy Die to launch the force back. The attacker makes a DEX save. Roll one Psionic Energy Die. Failed save: attacker takes Force damage equal to the roll plus your INT modifier. Successful save: half damage only. Either way, you gain Temporary HP equal to the damage dealt.",
        },
        {
          level: 10,
          name: 'Enhanced Telekinetic Crush',
          description:
            "When you cast Telekinetic Crush, you can expend one Psionic Energy Die to modify it: whether or not the creature saves, its Speed is halved until the start of your next turn. Additionally, roll the expended Psionic Energy Die and add it to one damage roll of the spell.",
        },
        {
          level: 14,
          name: 'Heightened Telekinesis',
          description:
            "Cast Telekinesis without expending a spell slot by expending 4 Psionic Energy Dice instead. When cast this way, you can remove Concentration from the spell — if you do, the duration becomes 1 minute and you can target Gargantuan creatures and objects.",
        },
      ]
    },

    {
      id: 'telepath',
      name: 'Telepath',
      shortName: 'Telepath',
      source: 'UA2025',
      alwaysPrepared: {
        3:  ['Bane', 'Command', 'Detect Thoughts', 'Mind Spike'],
        5:  ['Counterspell', 'Slow'],
        7:  ['Compulsion', 'Confusion'],
        9:  ['Modify Memory', "Yolande's Regal Presence"],
      },
      features: [
        {
          level: 3,
          name: 'Mind Infiltrator',
          description:
            "When you cast Detect Thoughts, expend one Psionic Energy Die to modify it: the spell requires no spell components and no Concentration; if the target fails the WIS save against the Read Thoughts effect, it doesn't know you're probing its mind.",
        },
        {
          level: 3,
          name: 'Telepathic Distraction',
          description:
            "Reaction: When a creature you can see within range of your telepathy hits with an attack roll, roll one Psionic Energy Die and subtract the number rolled from that attack roll, potentially causing it to miss. The die is expended only if the attack misses.",
        },
        {
          level: 6,
          name: 'Bulwark Mind',
          description:
            "Bonus Action: Expend one Psionic Energy Die. For 10 minutes: Resistance to Psychic damage; when you make an INT, WIS, or CHA save, add a Psionic Energy Die roll to it (this roll doesn't expend the die). Can't activate while Incapacitated.",
        },
        {
          level: 6,
          name: 'Potent Thoughts',
          description:
            "Your telepathy range increases to 60 ft. You add your INT modifier to damage dealt by any Psion cantrip.",
          effects: [
            { id: 'potent_thoughts_cantrip', type: 'damage_bonus', source: 'cantrip', stat: 'int' }
          ]
        },
        {
          level: 10,
          name: 'Telepathic Bolstering',
          description:
            "Reaction: When you or a creature you can see within range of your telepathy fails an ability check or misses with an attack roll, expend one Psionic Energy Die. Roll it and add the number to the d20, potentially turning a failure into a success. The die is expended only if the check succeeds or the attack hits.",
        },
        {
          level: 14,
          name: 'Scramble Minds',
          description:
            "Cast Confusion without expending a spell slot by expending 4 Psionic Energy Dice instead. When cast this way: the Sphere's radius becomes 30 ft; you choose one creature in the area to automatically succeed on the save; and whenever an affected creature starts its turn, you choose its behavior from the Confusion table instead of it rolling.",
        },
      ]
    },
  ],
};