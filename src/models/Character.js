import { getEquippedBonuses } from '../utils/BonusEngine';
import { getItemByName } from '../utils/ItemStore';
import { getWeaponDamageByName } from '../utils/WeaponStore';
import { getClassData } from '../data/classes';
import { getArmorStatsByName } from '../utils/ArmorStore';
import { getSpellByName } from '../utils/DataLoader';


const HEAVY_WEAPONS = new Set([
  'Greataxe',
  'Greatsword',
  'Halberd',
  'Glaive',
  'Pike',
  'Maul',
  'Lance',
  'Heavy Crossbow',
]);



export class Character {
  constructor(data) {
    // ─── 1. CORE PROPERTIES ──────────────────────────────────────────────────
    this.id          = data.id;
    this.name        = data.name;
    this.level       = parseInt(data.level, 10) || 1;
    this.classId     = data.classId ?? 'pugilist';
    this.subclassId  = data.subclassId ?? null;
    this.race        = data.race ?? null;
    this.raceSource  = data.raceSource ?? null;
    this.background  = data.background ?? null;
    this.classSource = data.classSource ?? null;
    this.knownCantrips = data.knownCantrips ?? [];
    this.feats       = data.feats ?? [];
    this.knownInvocations = data.knownInvocations ?? [];

    if (data.abilities) {
      this.abilities = data.abilities;
    } else {
      this.abilities = {
        str: parseInt(data.str, 10) || 10,
        dex: parseInt(data.dex, 10) || 10,
        con: parseInt(data.con, 10) || 10,
        int: parseInt(data.int, 10) || 10,
        wis: parseInt(data.wis, 10) || 10,
        cha: parseInt(data.cha, 10) || 10,
      };
    }

    this.spellSlotsUsed = data.spellSlotsUsed ?? {}; 
    this.preparedSpells = data.preparedSpells ?? [];

    this.proficiencyBonus = data.proficiencyBonus ?? this._calcProfBonus(this.level);

    this.proficiencies = data.proficiencies ?? {
      saves:     [],
      skills:    [],
      expertise: [],
      weapons:   [],
      armor:     [],
    };

    this.bonuses      = data.bonuses ?? {};
    this.skills       = data.skills ?? {};
    this.spellcastingAbility = data.spellcastingAbility ?? null;

    // HP & Combat
    this.hpMax            = parseInt(data.hpMax, 10) || 10;
    this.hpCurrent        = parseInt(data.hpCurrent, 10) || this.hpMax;
    this.hpTemp           = parseInt(data.hpTemp, 10) || 0;
    this.hitDiceRemaining = parseInt(data.hitDiceRemaining, 10) || this.level;
    this.speed       = data.speed ?? 30;
    this.darkvision  = data.darkvision ?? 0;
    this.inspiration = data.inspiration ?? 0;

    // Inventory & attacks
    this.inventory    = data.inventory ?? [];
    this.attunedItems = data.attunedItems ?? [];
    this.attacks      = data.attacks ?? [];
    this.overrides    = data.overrides ?? {};

    // ─── 2. THE DYNAMIC ENGINE ───────────────────────────────────────────────
    
    // We track active toggles (like Rage) in a dictionary instead of isolated variables
    this.activeToggles = data.activeToggles ?? {};

    // Get the dynamic resources from the rulebook
    const activeResources = this.getAllActiveResources();

    activeResources.forEach(res => {
      // Creates properties like "rageUsed", "action_surgeUsed" automatically
      const usedProp = `${res.id}Used`;
      
      this[usedProp] = data[usedProp] ?? 0;

      // Ensure toggles have a default state of false if never pressed
      if (res.displayType === 'toggle' && this.activeToggles[res.id] === undefined) {
        this.activeToggles[res.id] = false;
      }
    });
  }

  // ─── Engine Helpers & Rest Logic ─────────────────────────────────────────────

  // 1. Gets absolutely everything (used by the takeRest function)
  // 1. Gets absolutely everything (used by the takeRest function and the UI)
  getAllActiveResources() {
    const safeId = (this.classId || '').toLowerCase();
    const classData = getClassData(safeId);
    if (!classData) return [];

    // 1. Copy the static resources from the rulebook (default to empty array if none exist)
    const resources = classData.resources ? [...classData.resources] : [];
    const levelData = classData.levels?.[this.level || 1];

    // --- 2. WARLOCK PACT MAGIC INJECTION ---
    if (classData.spellcasting?.type === 'pact_magic' && levelData) {
      
      // Sliding Pact Slots
      if (levelData.pactSlots) {
        resources.push({
          id: `spell_slot_${levelData.slotLevel}`,
          name: 'Pact Slots',
          maxUses: levelData.pactSlots,
          recharge: { shortRest: 'all', longRest: 'all' } // Warlocks love Short Rests!
        });
      }

      // Mystic Arcanum (Levels 6-9)
      [6, 7, 8, 9].forEach(lvl => {
        if (levelData[`arcanum${lvl}`]) {
          resources.push({
            id: `spell_slot_${lvl}`,
            name: `Mystic Arcanum`,
            maxUses: levelData[`arcanum${lvl}`],
            recharge: { longRest: 'all' }
          });
        }
      });
    }
    // ---------------------------------------

    return resources;
  }

  // 2. Filters for the Overview Screen
  getCombatResources() {
    return this.getAllActiveResources().filter(res => 
      !res.id.includes('spell_slot') && 
      !res.id.includes('sorcery_points') &&
      !res.id.includes('pact_magic')
    );
  }

  // 3. Filters for the new Spells Screen
  getMagicResources() {
    return this.getAllActiveResources().filter(res => 
      res.id.includes('spell_slot') || 
      res.id.includes('sorcery_points') ||
      res.id.includes('pact_magic')
    );
  }

  takeRest(restType) { 
    // 1. Universal rest rules
    if (restType === 'long') {
      this.hpCurrent = this.hpMax;
      this.hpTemp = 0;
      const recoveredDice = Math.max(1, Math.floor(this.level / 2));
      this.hitDiceRemaining = Math.min(this.level, this.hitDiceRemaining + recoveredDice);
    }

    // 2. Loop through dynamic resources to calculate recovery
    const activeResources = this.getAllActiveResources();
    
    activeResources.forEach(res => {
      const usedProp = `${res.id}Used`; 
      const rechargeRule = res.recharge?.[`${restType}Rest`]; 
      
      if (rechargeRule) {
        if (rechargeRule === 'all') {
          this[usedProp] = 0; 
        } else if (typeof rechargeRule === 'number') {
          this[usedProp] = Math.max(0, (this[usedProp] || 0) - rechargeRule);
        }
        
        // Auto-turn off active states (like Rage) on a Long Rest
        if (res.displayType === 'toggle' && restType === 'long') {
           this.activeToggles[res.id] = false;
        }
      }
    });
  }

  // ─── Proficiency bonus ───────────────────────────────────────────────────────
  _calcProfBonus(level) {
    if (level >= 17) return 6;
    if (level >= 13) return 5;
    if (level >= 9)  return 4;
    if (level >= 5)  return 3;
    return 2;
  }

  // ─── Class data ──────────────────────────────────────────────────────────────
  getClassData() {
    return getClassData(this.classId);
  }

getPopulatedSpells() {
    if (!this.preparedSpells || this.preparedSpells.length === 0) return [];
    
    return this.preparedSpells
      .map(spellName => getSpellByName(spellName))
      .filter(spell => spell != null); // Safely ignore any missing spells
  }

  getMaxInvocations() {
  const classData = getClassData(this.classId);
  const levelData = classData?.levels?.[this.level || 1];
  return levelData?.invocations || 0;
}


  getUnarmedAttack() {
    const classData = getClassData(this.classId);
    if (!classData) return null;

    const damageDie = classData.levels?.[this.level]?.fisticuffs
      ?? classData.unarmedDie
      ?? '1d4';

    return {
      name:         classData.unarmedAttackName ?? 'Unarmed Strike',
      tag:          classData.unarmedAttackTag  ?? 'Unarmed',
      damageDie,
      damageBonus:  this.getAbilityMod('str'),
      attackBonus:  this.getMeleeAttackBonus(),
      isProficient: true,
      magicBonus:   0,
      strMod:       this.getAbilityMod('str'),
      profBonus:    this.proficiencyBonus,
    };
  }



  // ─── Ability scores ──────────────────────────────────────────────────────────
  getAbilityScore(ability) {
    const base  = this.abilities?.[ability] ?? 10;
    const bonus = this.bonuses?.abilities?.[ability] ?? 0;
    return base + bonus;
  }

  getAbilityMod(ability) {
    return Math.floor((this.getAbilityScore(ability) - 10) / 2);
  }

  getWeaponModifier(item) {
    const isHexblade = this.subclassId?.toLowerCase() === 'hexblade';
    const strMod = this.getAbilityMod('str');
    const dexMod = this.getAbilityMod('dex');
    const chaMod = this.getAbilityMod('cha');

    if (isHexblade) return chaMod;

    const isFinesse = item.Type?.toLowerCase().includes('finesse') || 
                      item.Properties?.includes('Finesse');
    if (isFinesse) {
      return Math.max(strMod, dexMod);
    }

    return strMod;
  }

  // ─── Saves & skills ──────────────────────────────────────────────────────────
  getSaveBonus(ability) {
    const mod        = this.getAbilityMod(ability);
    const proficient = this.proficiencies?.saves?.includes(ability);
    return mod + (proficient ? this.proficiencyBonus : 0);
  }

  getSkillBonus(skill) {
    const abilityMap = {
      athletics:      'str',
      acrobatics:     'dex',
      sleightofhand:  'dex',
      stealth:        'dex',
      arcana:         'int',
      history:        'int',
      investigation:  'int',
      nature:         'int',
      religion:       'int',
      animalhandling: 'wis',
      insight:        'wis',
      medicine:       'wis',
      perception:     'wis',
      survival:       'wis',
      deception:      'cha',
      intimidation:   'cha',
      performance:    'cha',
      persuasion:     'cha',
    };
    const ability    = abilityMap[skill];
    const mod        = this.getAbilityMod(ability);
    const expertise  = this.proficiencies?.expertise?.includes(skill);
    const proficient = this.proficiencies?.skills?.includes(skill);

    const profBonus  = expertise
      ? this.proficiencyBonus * 2
      : proficient
        ? this.proficiencyBonus
        : 0;
    return mod + profBonus;
  }

  // ─── Derived stats ───────────────────────────────────────────────────────────
  getInitiativeBonus() {
    return this.getAbilityMod('dex');
  }

  getPassivePerception() {
    return 10 + this.getSkillBonus('perception');
  }

  getACBreakdown() {
    if (this.overrides?.ac !== undefined) {
      return {
        formula:     'Manual Override',
        base:        this.overrides.ac,
        dexApplied:  0,
        shieldBonus: 0,
        magicBonus:  0,
        total:       this.overrides.ac,
        isOverride:  true,
      };
    }

    const dexMod  = this.getAbilityMod('dex');
    const conMod  = this.getAbilityMod('con') || 0; 
    const equipped = (this.inventory ?? []).filter(e => e.equipped);
    
    let armorItemName = null;
    let armorStats = null;
    let hasShield = false;

    for (const entry of equipped) {
      const stats = getArmorStatsByName(entry.itemName);
      if (stats) {
        if (stats.type === 'shield') {
          hasShield = true;
        } else {
          armorItemName = entry.itemName;
          armorStats = stats;
        }
      }
    }

    let base = 0, dexApplied = 0, formula = '';
    const safeClassId = (this.classId || '').toLowerCase();

    if (armorStats) {
      const type = armorStats.type;
      base = armorStats.ac;

      if (type === 'heavy') {
        dexApplied = 0;
        formula = `Heavy Armor (${armorItemName})`;
      } else if (type === 'medium') {
        dexApplied = Math.min(dexMod, 2);
        formula = `Medium Armor (${armorItemName})`;
      } else {
        dexApplied = dexMod;
        formula = `Light Armor (${armorItemName})`;
      }
    } else if (safeClassId === 'barbarian') {
      // NOTE: This will eventually be replaced by the Effect Engine, but it's safe to keep for now!
      base = 10 + conMod; 
      dexApplied = dexMod;
      formula = `Unarmored Defense (10 + DEX + CON ${conMod >= 0 ? '+' : ''}${conMod})`;
    } else {
      base = 10; dexApplied = dexMod;
      formula = 'Unarmored (10 + DEX mod)';
    }

    const shieldBonus = hasShield ? 2 : 0;
    const { bonusAC } = getEquippedBonuses(this.inventory);

    return {
      formula,
      base,
      dexApplied,
      shieldBonus,
      magicBonus: bonusAC,
      total:      base + dexApplied + shieldBonus + bonusAC,
      isOverride: false,
    };
  }

  getArmorClass() {
    return this.getACBreakdown().total;
  }  

  // ─── Hit dice ────────────────────────────────────────────────────────────────
  getHitDice() {
    const classData = getClassData(this.classId);
    const faces     = classData?.hitDie ?? 8;
    return `${this.level}d${faces}`;
  }

  getFisticuffsDie() {
    const classData = getClassData(this.classId);
    return classData?.levels?.[this.level]?.fisticuffs ?? '1d4';
  }

  // ─── Attack helpers ──────────────────────────────────────────────────────────
  getMeleeAttackBonus() {
    return this.getAbilityMod('str') + this.proficiencyBonus;
  }

  getEquippedWeaponAttacks() {
    const equipped = (this.inventory ?? []).filter(e => e.equipped);
    // Determine if character has GWM feat
    const hasGWM = (this.feats ?? []).some(f => f.name.toLowerCase().includes('great weapon master'));
    
    // We assume the Effect Engine handles toggle logic, but we can safely pull it from activeToggles here
    const isRaging = this.activeToggles['rage'] ?? false;
    const rageBonus = isRaging && this.classId === 'barbarian' ? 
        (getClassData(this.classId)?.progressionExtras?.rageDamage?.[this.level] ?? 2) : 0;

    return equipped.map(entry => {
      const item = getItemByName(entry.itemName) ?? {};
      const atkMod = this.getWeaponModifier(item);
      const isProficient = entry.proficient ?? true;
      const magicBonus = (entry.BonusWeapon ?? item.BonusWeapon) ?? 0;

      // Extract basic damage info
      const dmgInfo = getWeaponDamageByName(entry.itemName);
      const damageDie = dmgInfo ? dmgInfo.dice : (entry.damageDie ?? '—');
      const damageType = dmgInfo ? dmgInfo.type : '';

      const weaponName = item.Name ?? entry.itemName ?? '';
      const isHeavy = HEAVY_WEAPONS.has(weaponName)
        || HEAVY_WEAPONS.has(item.BaseItem?.split('|')[0] ?? '')
        || Array.from(HEAVY_WEAPONS).some(w => weaponName.toLowerCase().includes(w.toLowerCase()));

      const gwmBonus = (hasGWM && isHeavy) ? 3 : 0;
      const finalDamageBonus = atkMod + magicBonus + rageBonus + gwmBonus;

      return {
        name: entry.itemName,
        attackBonus: atkMod + (isProficient ? this.proficiencyBonus : 0) + magicBonus,
        damageDie,
        damageType,
        atkMod, 
        strMod: atkMod, // Backwards compatibility for UI
        magicBonus,
        isProficient,
        appliedRageBonus: rageBonus,
        featDamageBonus: gwmBonus,
        damageBonus: atkMod, 
        finalDamageBonus,
        isWeapon: true,
      };
    });
  }

  // ─── Serialisation ───────────────────────────────────────────────────────────
  toJSON() {
    const baseObj = {
      id:                  this.id,
      name:                this.name,
      level:               this.level,
      classId:             this.classId,
      classSource:         this.classSource,
      subclassId:          this.subclassId,
      race:                this.race,
      raceSource:          this.raceSource,
      background:          this.background,
      abilities:           this.abilities,
      proficiencyBonus:    this.proficiencyBonus,
      proficiencies:       this.proficiencies,
      skills:              this.skills,
      bonuses:             this.bonuses,
      spellcastingAbility: this.spellcastingAbility,
      spellSlotsUsed:      this.spellSlotsUsed,
      preparedSpells:      this.preparedSpells,
      knownCantrips:       this.knownCantrips,
      knownInvocations:    this.knownInvocations,
      hpMax:               this.hpMax,
      hpCurrent:           this.hpCurrent,
      hpTemp:              this.hpTemp,
      hitDiceRemaining:    this.hitDiceRemaining,
      speed:               this.speed,
      darkvision:          this.darkvision,
      inspiration:         this.inspiration,
      inventory:           this.inventory,
      attunedItems:        this.attunedItems,
      attacks:             this.attacks,
      overrides:           this.overrides,
      feats:               this.feats,
      
      // Save our dynamic toggles
      activeToggles:       this.activeToggles,
    };

    // Dynamically save all of our active resource usage trackers
    this.getAllActiveResources().forEach(res => {
      const usedProp = `${res.id}Used`;
      baseObj[usedProp] = this[usedProp];
    });

    return baseObj;
  }
}