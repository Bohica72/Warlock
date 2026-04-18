import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Modal, TextInput,
  StyleSheet, ScrollView, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { patchCharacter, saveCharacter } from '../utils/CharacterStore';
import { getItemByName } from '../utils/ItemStore';
import { Character } from '../models/Character';
import { initWeaponStore, getWeaponDamageByName } from '../utils/WeaponStore';
import { getClassData } from '../data/classes'; 
import { getFeats, getRaces } from '../utils/DataLoader';
import { applyFeatEffects, FEAT_EFFECTS } from '../data/featEffects';
import { formatFeatSummary, meetsPrerequisites } from '../utils/featUtils';
import {
  colors, spacing, radius, typography,
  shadows, sharedStyles
} from '../styles/theme';

const DMG_DEBUG_TAG = '[WARLOCK_DMG_DEBUG]';
const STANDARD_DND_LANGUAGES = [
  'Common',
  'Dwarvish',
  'Elvish',
  'Giant',
  'Gnomish',
  'Goblin',
  'Halfling',
  'Orc',
  'Abyssal',
  'Celestial',
  'Draconic',
  'Deep Speech',
  'Infernal',
  'Primordial',
  'Sylvan',
  'Undercommon',
];

function normalizeStringList(values = []) {
  return [...new Set(
    values
      .filter((value) => typeof value === 'string' && value.trim().length > 0)
      .map((value) => value.trim())
  )].sort((a, b) => a.localeCompare(b));
}

function rollDie(faces) {
  return Math.floor(Math.random() * faces) + 1;
}

function BreakdownRow({ label, value, isTotal }) {
  return (
    <View style={[styles.breakdownRow, isTotal && styles.breakdownRowTotal]}>
      <Text style={[styles.breakdownLabel, isTotal && styles.breakdownLabelTotal]}>{label}</Text>
      <Text style={[styles.breakdownValue, isTotal && styles.breakdownValueTotal]}>{value}</Text>
    </View>
  );
}

export default function OverviewScreen({ route, onRegisterActions }) {
  const raw       = route.params.character;
  const character = raw instanceof Character ? raw : new Character(raw);
  const classData = getClassData(character.classId);

  // 1. CORE STATE
  const [hpCurrent, setHpCurrent]               = useState(character.hpCurrent);
  const [hpTemp, setHpTemp]                     = useState(character.hpTemp ?? 0);
  const [hitDiceRemaining, setHitDiceRemaining] = useState(character.hitDiceRemaining ?? character.level);
  const [inspiration, setInspiration]           = useState(character.inspiration ?? 0);
  const safeLevel = parseInt(character.level, 10) || 1;
  const [characterLevel, setCharacterLevel] = useState(safeLevel);
  
  // NEW: A simple trigger to force React to re-render when dynamic engine properties change
  const [refreshTrigger, setRefreshTrigger]     = useState(0);

  // MODAL STATES
  const [hpModalVisible, setHpModalVisible]     = useState(false);
  const [hpInput, setHpInput]                   = useState('');
  const [restModalVisible, setRestModalVisible] = useState(false);
  const [hitDiceModalVisible, setHitDiceModalVisible] = useState(false);
  const [diceToSpend, setDiceToSpend]           = useState(1);
  const [lastRollResult, setLastRollResult]     = useState(null);
  const [equippedModalVisible, setEquippedModalVisible] = useState(false);
  const [levelUpModalVisible, setLevelUpModalVisible]   = useState(false);
  const [breakdownModalVisible, setBreakdownModalVisible] = useState(false);
  const [overrideModalVisible, setOverrideModalVisible]   = useState(false);
  const [overrideInput, setOverrideInput]                 = useState('');
  const [weaponStoreReady, setWeaponStoreReady]           = useState(false);
  const [featDetail, setFeatDetail] = useState(null);
  const [featDetailVisible, setFeatDetailVisible] = useState(false);
  const [subclassFeatureDetail, setSubclassFeatureDetail] = useState(null);
  const [subclassFeatureDetailVisible, setSubclassFeatureDetailVisible] = useState(false);
  const [manualTiles, setManualTiles] = useState(Array.isArray(character.manualTiles) ? character.manualTiles : []);
  const [manualTileModalVisible, setManualTileModalVisible] = useState(false);
  const [editingManualTileId, setEditingManualTileId] = useState(null);
  const [manualTileName, setManualTileName] = useState('');
  const [manualTileMode, setManualTileMode] = useState('counter');
  const [manualTileStartValue, setManualTileStartValue] = useState('1');
  const [manualTileRecharge, setManualTileRecharge] = useState('long');
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState(
    normalizeStringList(Array.isArray(character.languages) ? character.languages : [])
  );
  const [showUnarmedStrike, setShowUnarmedStrike] = useState(character.showUnarmedStrike ?? true);
  const [featManagerVisible, setFeatManagerVisible] = useState(false);
  const [featPickerVisible, setFeatPickerVisible] = useState(false);
  const [featSearch, setFeatSearch] = useState('');
  const [featEditIndex, setFeatEditIndex] = useState(null);
  const [raceFeatureDetail, setRaceFeatureDetail] = useState(null);
  const [raceFeatureDetailVisible, setRaceFeatureDetailVisible] = useState(false);

  // (Keeping your ASI/Level up states here for brevity...)
  const [asiChoice, setAsiChoice]         = useState(null);   
  const [asiStats, setAsiStats]           = useState([]);      
  const [selectedFeat, setSelectedFeat]   = useState(null);    
  const [featChoices, setFeatChoices]     = useState({});      
  const [featModalVisible, setFeatModalVisible] = useState(false); 
  const [pendingFeat, setPendingFeat]     = useState(null);

  const ALL_FEATS = useMemo(() => getFeats(), []);
  const ALL_RACES = useMemo(() => getRaces(), []);

  const FEATS_BY_NAME = useMemo(() => {
    return Object.fromEntries(ALL_FEATS.map(f => [f.name, f]));
  }, [ALL_FEATS]);


  const breakdownRef        = useRef(null);
  const overrideKeyRef      = useRef(null);
  const selectedEquippedRef = useRef(null);
  const levelDownActionRef  = useRef(() => {});
  const dmgDebugLoggedRef   = useRef(new Set());

  // 2. RIP OUT HARDCODED VARIABLES
  // Notice we deleted isFighter, isBarbarian, ragesUsed, actionSurgeUsed, etc.!

  useEffect(() => {
    initWeaponStore().then(() => setWeaponStoreReady(true));
  }, []);

  useEffect(() => {
    setSelectedLanguages(
      normalizeStringList(Array.isArray(character.languages) ? character.languages : [])
    );
  }, [character.id, JSON.stringify(character.languages ?? [])]);

const rawAttacks = weaponStoreReady ? (character.getEquippedWeaponAttacks?.() ?? []) : [];

  const normalizeSignedNumber = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const normalized = value.replace(/[−–—]/g, '-');
      const match = normalized.match(/[-+]?\d+/);
      return match ? parseInt(match[0], 10) : 0;
    }
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatSignedNumber = (value) => {
    const normalized = normalizeSignedNumber(value);
    return `${normalized >= 0 ? '+' : ''}${normalized}`;
  };

  const normalizeDamageDie = (value) => {
    const normalized = String(value ?? '').trim();
    return normalized.length > 0 ? normalized : '—';
  };

  const firstNonEmptyString = (...values) => {
    for (const value of values) {
      if (typeof value === 'string' && value.trim().length > 0) return value.trim();
    }
    return '';
  };

  const unlockedSubclassFeatures = useMemo(() => {
    const selectedSubclassId = character.subclassId?.toLowerCase();
    const currentLevel = parseInt(character.level, 10) || 1;
    if (!selectedSubclassId) return [];

    const subclass = (classData?.subclasses ?? []).find(
      (entry) => entry?.id?.toLowerCase() === selectedSubclassId
    );
    if (!subclass?.features?.length) return [];

    return subclass.features
      .filter((feature) => (feature?.level ?? 1) <= currentLevel)
      .sort((a, b) => (a.level ?? 1) - (b.level ?? 1));
  }, [classData, character.level, character.subclassId]);

  const selectedRace = useMemo(() => {
    if (!character.race) return null;

    const exactMatch = ALL_RACES.find((entry) => (
      entry?.name === character.race &&
      (!character.raceSource || entry?.source === character.raceSource)
    ));

    return exactMatch ?? ALL_RACES.find((entry) => entry?.name === character.race) ?? null;
  }, [ALL_RACES, character.race, character.raceSource]);

  const speciesFeatures = useMemo(() => {
    const excludedNames = new Set([
      'Age',
      'Alignment',
      'Creature Type',
      'Language',
      'Languages',
      'Size',
      'Speed',
    ]);

    return (selectedRace?.traits ?? []).filter((trait) => {
      const name = trait?.name?.trim();
      return !!name && !excludedNames.has(name);
    });
  }, [selectedRace]);
  
  const equippedAttacks = rawAttacks
    .filter(atk => {
      // NEW THE BOUNCER: Ask the database if this is actually a weapon
      const staticItem = getItemByName(atk.name, character.customItems ?? []);
      const invItem = character.inventory?.find(i => i.itemName === atk.name && i.equipped);
      return staticItem?.ObjectType === 'Weapon' || invItem?.ObjectType === 'Weapon';
    })
    .map(atk => {
      const weaponLookupName = firstNonEmptyString(atk.baseWeaponName, atk.BaseWeaponName, atk.name);
      const dmgInfo = getWeaponDamageByName(weaponLookupName);
      const invItem = character.inventory?.find(i => i.itemName === atk.name && i.equipped);
      const normalizedAttackBonus = normalizeSignedNumber(atk.attackBonus);
      const normalizedDamageBonus = normalizeSignedNumber(atk.damageBonus);
      const normalizedFinalDamageBonus = normalizeSignedNumber(atk.finalDamageBonus);
      const normalizedDamageDie = normalizeDamageDie(dmgInfo?.dice ?? atk.damageDie);
      const normalizedMagicAttackBonus = normalizeSignedNumber(atk.magicAttackBonus ?? atk.magicBonus);
      const normalizedMagicDamageBonus = normalizeSignedNumber(atk.magicDamageBonus ?? atk.magicBonus);
      const normalizedRageBonus = normalizeSignedNumber(atk.appliedRageBonus);
      const normalizedFeatBonus = normalizeSignedNumber(atk.featDamageBonus);

      const rawFinalDamage = String(atk.finalDamageBonus ?? '');
      const rawDamageDie = String(atk.damageDie ?? '');
      const hasArrowGlyph = /[→↦➜➡]/.test(rawFinalDamage);
      const changedByNormalization = rawFinalDamage !== String(normalizedFinalDamageBonus);
      const missingDamageDie = normalizedDamageDie === '—';
      if (hasArrowGlyph || changedByNormalization || missingDamageDie) {
        const logKey = `${atk.name ?? 'unknown'}|${rawFinalDamage}|${normalizedFinalDamageBonus}|${normalizedDamageDie}`;
        if (!dmgDebugLoggedRef.current.has(logKey)) {
          const anomalyPayload = {
            attackName: atk.name,
            baseWeaponName: weaponLookupName,
            rawDamageDie,
            normalizedDamageDie,
            rawFinalDamageBonus: atk.finalDamageBonus,
            normalizedFinalDamageBonus,
            rawAttackBonus: atk.attackBonus,
            rawDamageBonus: atk.damageBonus,
            rawMagicAttackBonus: atk.magicAttackBonus ?? atk.magicBonus,
            rawMagicDamageBonus: atk.magicDamageBonus ?? atk.magicBonus,
            damageLookupFound: !!dmgInfo,
            inventoryEntry: invItem,
          };
          console.warn(`${DMG_DEBUG_TAG} [Overview DMG anomaly]`, anomalyPayload);
          console.log(`${DMG_DEBUG_TAG} [Overview DMG anomaly] ${JSON.stringify(anomalyPayload)}`);
          dmgDebugLoggedRef.current.add(logKey);
        }
      }

      return {
        ...atk,
        attackBonus: normalizedAttackBonus,
        damageBonus: normalizedDamageBonus,
        finalDamageBonus: normalizedFinalDamageBonus,
        magicAttackBonus: normalizedMagicAttackBonus,
        magicDamageBonus: normalizedMagicDamageBonus,
        appliedRageBonus: normalizedRageBonus,
        featDamageBonus: normalizedFeatBonus,
        damageDie: normalizedDamageDie,
        damageType: dmgInfo ? dmgInfo.type : '',
        extraDamageDie: invItem?.extraDamageDie,
        extraDamageType: invItem?.extraDamageType,
      };
    });

  const hitDice     = character.getHitDice();
  const hitDieFaces = parseInt(hitDice.split('d')[1], 10);
  const conMod      = character.getAbilityMod('con');
  const hpPercent   = Math.max(0, hpCurrent / character.hpMax);
  const equippedItems = (character.inventory ?? []).filter(i => {
    if (!i.equipped) return false;
    const staticItem = getItemByName(i.itemName, character.customItems ?? []);
    const isWeapon = staticItem?.ObjectType === 'Weapon' || i.ObjectType === 'Weapon';
    return !isWeapon;
  });
  const shouldShowEquippedItems = false;

  const persist = async (updates) => {
    Object.assign(character, updates);
    await saveCharacter(character);
  };

  const persistManualTiles = (nextTiles) => {
    setManualTiles(nextTiles);
    character.manualTiles = nextTiles;
    persist({ manualTiles: nextTiles });
  };

  const toggleLanguageSelection = (language) => {
    const nextLanguages = selectedLanguages.includes(language)
      ? selectedLanguages.filter((entry) => entry !== language)
      : normalizeStringList([...selectedLanguages, language]);

    setSelectedLanguages(nextLanguages);
    character.languages = nextLanguages;
    persist({ languages: nextLanguages });
  };

  const toggleUnarmedStrikeVisibility = () => {
    const next = !showUnarmedStrike;
    setShowUnarmedStrike(next);
    character.showUnarmedStrike = next;
    persist({ showUnarmedStrike: next });
  };

  const applyManualTileRecharge = (restType, sourceTiles = []) => {
    return sourceTiles.map((tile) => {
      if (!tile?.recharge) return tile;
      const shouldRecharge = tile.recharge === restType || (restType === 'long' && tile.recharge === 'short');
      if (!shouldRecharge) return tile;

      if (tile.mode === 'toggle') {
        return { ...tile, isActive: restType === 'long' ? true : false };
      }

      const start = Math.max(0, parseInt(tile.startingValue, 10) || 0);
      return { ...tile, currentValue: start };
    });
  };

  const resetManualTileForm = () => {
    setEditingManualTileId(null);
    setManualTileName('');
    setManualTileMode('counter');
    setManualTileStartValue('1');
    setManualTileRecharge('long');
  };

  const openManualTileCreator = () => {
    resetManualTileForm();
    setManualTileModalVisible(true);
  };

  const openManualTileEditor = (tile) => {
    setEditingManualTileId(tile.id);
    setManualTileName(tile.name ?? '');
    setManualTileMode(tile.mode === 'toggle' ? 'toggle' : 'counter');
    setManualTileStartValue(String(tile.startingValue ?? tile.currentValue ?? 1));
    setManualTileRecharge(tile.recharge === 'short' ? 'short' : 'long');
    setManualTileModalVisible(true);
  };

  const saveManualTile = () => {
    const trimmedName = manualTileName.trim();
    if (!trimmedName) {
      Alert.alert('Missing Name', 'Please provide a tile name.');
      return;
    }

    if (manualTileMode === 'counter') {
      const parsed = parseInt(manualTileStartValue, 10);
      if (Number.isNaN(parsed) || parsed < 0) {
        Alert.alert('Invalid Value', 'Starting value must be 0 or greater.');
        return;
      }
    }

    const startValue = Math.max(0, parseInt(manualTileStartValue, 10) || 0);

    const nextTiles = editingManualTileId
      ? manualTiles.map((tile) => {
          if (tile.id !== editingManualTileId) return tile;
          if (manualTileMode === 'toggle') {
            return {
              ...tile,
              name: trimmedName,
              mode: 'toggle',
              recharge: manualTileRecharge,
              isActive: !!tile.isActive,
            };
          }
          return {
            ...tile,
            name: trimmedName,
            mode: 'counter',
            recharge: manualTileRecharge,
            startingValue: startValue,
            currentValue: Math.min(startValue, Math.max(0, parseInt(tile.currentValue, 10) || startValue)),
          };
        })
      : [
          ...manualTiles,
          manualTileMode === 'toggle'
            ? {
                id: `manual_${Date.now()}`,
                name: trimmedName,
                mode: 'toggle',
                recharge: manualTileRecharge,
                isActive: false,
              }
            : {
                id: `manual_${Date.now()}`,
                name: trimmedName,
                mode: 'counter',
                recharge: manualTileRecharge,
                startingValue: startValue,
                currentValue: startValue,
              },
        ];

    persistManualTiles(nextTiles);
    setManualTileModalVisible(false);
    resetManualTileForm();
  };

  const handleManualTilePress = (tile) => {
    const nextTiles = manualTiles.map((entry) => {
      if (entry.id !== tile.id) return entry;
      if (entry.mode === 'toggle') {
        return { ...entry, isActive: !entry.isActive };
      }
      const current = Math.max(0, parseInt(entry.currentValue, 10) || 0);
      return { ...entry, currentValue: Math.max(0, current - 1) };
    });

    persistManualTiles(nextTiles);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleManualTileLongPress = (tile) => {
    Alert.alert(
      tile.name,
      'Manage this tile',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => openManualTileEditor(tile) },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const nextTiles = manualTiles.filter((entry) => entry.id !== tile.id);
            persistManualTiles(nextTiles);
          },
        },
      ]
    );
  };

 const hpBarColor = hpPercent > 0.5
    ? colors.success
    : hpPercent > 0.25
      ? colors.warning
      : colors.accent;

  const applyHp = (mode) => {
    const val = parseInt(hpInput, 10);
    if (isNaN(val) || val <= 0) return;
    let newHp   = hpCurrent;
    let newTemp = hpTemp;
    if (mode === 'damage') {
      if (newTemp > 0) {
        const absorbed  = Math.min(newTemp, val);
        newTemp         = newTemp - absorbed;
        const remainder = val - absorbed;
        newHp           = Math.max(0, newHp - remainder);
      } else {
        newHp = Math.max(0, newHp - val);
      }
    }
    if (mode === 'healing') newHp   = Math.min(character.hpMax, hpCurrent + val);
    if (mode === 'temp')    newTemp = val;
    setHpCurrent(newHp);
    setHpTemp(newTemp);
    persist({ hpCurrent: newHp, hpTemp: newTemp });
    setHpModalVisible(false);
    setHpInput('');
  };

  const rollHitDice = () => {
    if (diceToSpend < 1 || diceToSpend > character.hitDiceRemaining) return;
    let total = 0;
    const rolls = [];
    for (let i = 0; i < diceToSpend; i++) {
      const roll = rollDie(hitDieFaces);
      rolls.push(roll);
      total += roll + conMod;
    }
    total = Math.max(0, total);
    
    // 1. Update the engine directly
    character.hpCurrent = Math.min(character.hpMax, character.hpCurrent + total);
    character.hitDiceRemaining -= diceToSpend;
    
    setLastRollResult({ rolls, conMod, total, newHp: character.hpCurrent });
    
    // 2. Save and refresh UI
    persist(character.toJSON());
    setRefreshTrigger(prev => prev + 1);
  };

  // Define this OUTSIDE of rollHitDice so the modal buttons can see it!
  const closeHitDiceModal = () => {
    setHitDiceModalVisible(false);
    setLastRollResult(null);
    setDiceToSpend(1);
  };

 

  // (Keeping applyHp and rollHitDice identical...)



  // 3. SIMPLIFIED REST ENGINE
  const doShortRest = () => {
    character.takeRest('short'); // The engine does the math
    const nextManualTiles = applyManualTileRecharge('short', manualTiles);
    character.manualTiles = nextManualTiles;
    setManualTiles(nextManualTiles);
    persist(character.toJSON());
    setRefreshTrigger(prev => prev + 1); // Refresh the UI
    
    setRestModalVisible(false);
    setTimeout(() => setHitDiceModalVisible(true), 300);
  };

  const doLongRest = () => {
    character.takeRest('long'); // The engine does the math
    const nextManualTiles = applyManualTileRecharge('long', manualTiles);
    character.manualTiles = nextManualTiles;
    setManualTiles(nextManualTiles);
    
    // Update local React state for top-level UI elements
    setHpCurrent(character.hpCurrent);
    setHpTemp(character.hpTemp);
    setHitDiceRemaining(character.hitDiceRemaining);
    
    persist(character.toJSON());
    setRefreshTrigger(prev => prev + 1); // Refresh the UI
    
    setRestModalVisible(false);
    Alert.alert('Long Rest', 'HP and Hit Dice Restored');
  };

  // (Keeping LevelUp logic identical...)

  // 4. HELPER: Calculate Max Uses dynamically from the table
  const getMaxUses = (resource) => {
    // Read directly from the character engine!
    const currentLevel = parseInt(character.level, 10) || 1; 
    
    if (resource.maxUses?.type === 'table') {
      return resource.maxUses.values[currentLevel] ?? 0;
    }
    return typeof resource.maxUses === 'number' ? resource.maxUses : 0; 
  };

    const getItemBonusSummary = (item) => {
    if (!item) return null;
    const parts = [];
    if (item.BonusAC)     parts.push(`+${item.BonusAC} AC`);
    if (item.BonusWeapon) parts.push(`+${item.BonusWeapon} ATK/DMG`);
    if (item.BonusDamage) parts.push(`+${item.BonusDamage} DMG`);
    if (item.BonusSaves?.length)  parts.push(`+${item.BonusSaveValue ?? 1} saves`);
    if (item.BonusSkills?.length) parts.push(`+${item.BonusSkillValue ?? 1} skills`);
    if (item.BonusStr)    parts.push(`+${item.BonusStr} STR`);
    if (item.BonusDex)    parts.push(`+${item.BonusDex} DEX`);
    if (item.BonusCon)    parts.push(`+${item.BonusCon} CON`);
    if (item.BonusInt)    parts.push(`+${item.BonusInt} INT`);
    if (item.BonusWis)    parts.push(`+${item.BonusWis} WIS`);
    if (item.BonusCha)    parts.push(`+${item.BonusCha} CHA`);
    if (item.bonusAC)     parts.push(`+${item.bonusAC} AC`);
    if (item.bonusWeapon) parts.push(`+${item.bonusWeapon} ATK/DMG`);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const getFeatName = (feat) => (typeof feat === 'string' ? feat : feat?.name);

  const isToughFeat = (feat) => getFeatName(feat) === 'Tough';

  const getToughAppliedLevel = (feat) => {
    if (!feat || typeof feat !== 'object') return null;
    const appliedLevel = parseInt(feat.hpBonusAppliedLevel, 10);
    return Number.isFinite(appliedLevel) && appliedLevel > 0 ? appliedLevel : null;
  };

  const getToughTotalBonus = (feat, fallbackLevel = character.level) => {
    const appliedLevel = getToughAppliedLevel(feat) ?? (parseInt(fallbackLevel, 10) || 1);
    return appliedLevel * 2;
  };

  const applyHpDelta = (delta) => {
    if (!delta) return;
    const currentMax = parseInt(character.hpMax, 10) || 0;
    const currentHp = parseInt(character.hpCurrent, 10) || 0;
    const nextHpMax = Math.max(1, currentMax + delta);
    const nextHpCurrent = Math.max(0, Math.min(nextHpMax, currentHp + delta));

    character.hpMax = nextHpMax;
    character.hpCurrent = nextHpCurrent;
    setHpCurrent(nextHpCurrent);

    return { hpMax: nextHpMax, hpCurrent: nextHpCurrent };
  };

  const updateFeats = (nextFeats, extraUpdates = {}) => {
    character.feats = nextFeats;
    Object.assign(character, extraUpdates);
    if (extraUpdates.hpCurrent != null) setHpCurrent(extraUpdates.hpCurrent);
    persist({ feats: nextFeats, ...extraUpdates });
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const currentFeats = Array.isArray(character.feats) ? character.feats : [];
    const toughIndex = currentFeats.findIndex(isToughFeat);
    if (toughIndex < 0) return;

    const toughFeat = currentFeats[toughIndex];
    if (getToughAppliedLevel(toughFeat)) return;

    const currentLevel = parseInt(character.level, 10) || 1;
    const toughBonus = currentLevel * 2;
    const hpUpdates = applyHpDelta(toughBonus);
    const nextFeats = [...currentFeats];
    const baseEntry = typeof toughFeat === 'object'
      ? toughFeat
      : { name: getFeatName(toughFeat), takenAtLevel: 1 };

    nextFeats[toughIndex] = {
      ...baseEntry,
      hpBonusAppliedLevel: currentLevel,
    };

    updateFeats(nextFeats, hpUpdates ?? {});
  }, [character.id, character.level, JSON.stringify(character.feats ?? [])]);

  const removeFeatAt = (index) => {
    const current = [...(character.feats ?? [])];
    const featName = getFeatName(current[index]) ?? 'this feat';
    Alert.alert(
      'Remove Feat',
      `Remove ${featName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const removedFeat = current[index];
            current.splice(index, 1);
            const hpUpdates = isToughFeat(removedFeat)
              ? applyHpDelta(-getToughTotalBonus(removedFeat))
              : null;
            updateFeats(current, hpUpdates ?? {});
          },
        },
      ]
    );
  };

  const openFeatPicker = (index = null) => {
    setFeatEditIndex(index);
    setFeatSearch('');
    setFeatPickerVisible(true);
  };

  const selectFeatFromPicker = (feat) => {
    const featName = feat?.name;
    if (!featName) return;

    const current = [...(character.feats ?? [])];
    const duplicateAt = current.findIndex((entry, idx) => getFeatName(entry) === featName && idx !== featEditIndex);
    if (duplicateAt >= 0) {
      Alert.alert('Already Added', `${featName} is already on this character.`);
      return;
    }

    const existing = featEditIndex != null ? current[featEditIndex] : null;
    let nextEntry = {
      name: feat.name,
      source: feat.source,
      takenAtLevel: typeof existing === 'object' && existing?.takenAtLevel != null
        ? existing.takenAtLevel
        : (parseInt(character.level, 10) || 1),
    };

    let hpUpdates = null;

    if (isToughFeat(existing) && !isToughFeat(feat)) {
      hpUpdates = applyHpDelta(-getToughTotalBonus(existing));
    } else if (!isToughFeat(existing) && isToughFeat(feat)) {
      const currentLevel = parseInt(character.level, 10) || 1;
      hpUpdates = applyHpDelta(currentLevel * 2);
      nextEntry = {
        ...nextEntry,
        hpBonusAppliedLevel: currentLevel,
      };
    } else if (isToughFeat(existing) && isToughFeat(feat)) {
      nextEntry = {
        ...nextEntry,
        hpBonusAppliedLevel: getToughAppliedLevel(existing) ?? (parseInt(character.level, 10) || 1),
      };
    }

    if (featEditIndex != null && featEditIndex >= 0 && featEditIndex < current.length) {
      current[featEditIndex] = nextEntry;
    } else {
      current.push(nextEntry);
    }

    updateFeats(current, hpUpdates ?? {});
    setFeatPickerVisible(false);
    setFeatEditIndex(null);
    setFeatSearch('');
  };

  const filteredFeats = useMemo(() => {
    const query = featSearch.trim().toLowerCase();
    if (!query) return ALL_FEATS;
    return ALL_FEATS.filter((feat) =>
      feat.name?.toLowerCase().includes(query) ||
      feat.source?.toLowerCase().includes(query)
    );
  }, [ALL_FEATS, featSearch]);

  const doLevelUp = async () => {
    const calc = calcLevelUp();
    if (!calc) return;

    const { newLevel, newHpMax, hpIncrease, newProfBonus } = calc;
    const oldInvocations = character.getMaxInvocations();
    const newInvocations = classData?.levels?.[newLevel]?.invocations ?? oldInvocations;
    const gainedInvocations = Math.max(0, newInvocations - oldInvocations);
    const alreadyHasTough = (character.feats ?? []).some(isToughFeat);
    const gainsToughThisLevel = asiChoice === 'feat' && selectedFeat?.name === 'Tough' && !alreadyHasTough;
    const toughHpGain = gainsToughThisLevel ? newLevel * 2 : (alreadyHasTough ? 2 : 0);

    // 1. Calculate new values using the character engine directly
    const safeHpCurrent     = parseInt(character.hpCurrent, 10) || 10;
    const newHpCurrent      = safeHpCurrent + hpIncrease + toughHpGain;
    const safeDiceRemaining = parseInt(character.hitDiceRemaining, 10) || 1;
    const newDiceRemaining  = safeDiceRemaining + 1;

    // Base updates
    let updatedAbilities    = { ...character.abilities };
    let updatedFeats        = [...(character.feats ?? [])];
    let updatedProficiencies = { ...character.proficiencies };

    const snapshotBeforeLevel = JSON.parse(JSON.stringify(character.toJSON()));
    const nextSnapshots = Array.isArray(character.levelSnapshots)
      ? [...character.levelSnapshots, snapshotBeforeLevel]
      : [snapshotBeforeLevel];

    // Apply ASI (Ability Score Improvement)
    if (asiChoice === 'asi' && asiStats.length > 0) {
      if (asiStats.length === 1) {
        updatedAbilities[asiStats[0]] = (updatedAbilities[asiStats[0]] ?? 10) + 2;
      } else {
        for (const stat of asiStats) {
          updatedAbilities[stat] = (updatedAbilities[stat] ?? 10) + 1;
        }
      }
    }

    // Apply Feat
    if (asiChoice === 'feat' && selectedFeat) {
      const applied = applyFeatEffects(
        { ...character, abilities: updatedAbilities, proficiencies: updatedProficiencies },
        selectedFeat.name,
        featChoices
      );
      updatedAbilities     = applied.abilities;
      updatedProficiencies = applied.proficiencies;
      updatedFeats.push({
        name:        selectedFeat.name,
        source:      selectedFeat.source,
        takenAtLevel: newLevel,
        ...(selectedFeat.name === 'Tough' ? { hpBonusAppliedLevel: newLevel } : {}),
      });
    }

    if (alreadyHasTough) {
      updatedFeats = updatedFeats.map((feat) => {
        if (!isToughFeat(feat)) return feat;
        if (typeof feat !== 'object') {
          return { name: feat, takenAtLevel: 1, hpBonusAppliedLevel: newLevel };
        }
        return { ...feat, hpBonusAppliedLevel: newLevel };
      });
    }

    // 2. Update character instance directly
    character.level            = newLevel;
    character.hpMax            = newHpMax + toughHpGain;
    character.hpCurrent        = newHpCurrent;
    character.hitDiceRemaining = newDiceRemaining;
    character.proficiencyBonus = newProfBonus;
    character.abilities        = updatedAbilities;
    character.feats            = updatedFeats;
    character.proficiencies    = updatedProficiencies;
    character.levelSnapshots   = nextSnapshots;

    // 3. Save to database and trigger UI refresh
  setHpCurrent(newHpCurrent);
  setHitDiceRemaining(newDiceRemaining);
  setCharacterLevel(newLevel);
    await persist(character.toJSON());
    setRefreshTrigger(prev => prev + 1);

    const isWarlockInvocationGain = character.classId === 'warlock' && gainedInvocations > 0;

    // Reset choice state and close modal
    setAsiChoice(null);
    setAsiStats([]);
    setSelectedFeat(null);
    setFeatChoices({});
    setLevelUpModalVisible(false);

    if (isWarlockInvocationGain) {
      navigation.navigate('InvocationPicker', {
        character,
        onSave: async (list) => {
          character.knownInvocations = list;
          await patchCharacter(character.id, { knownInvocations: list });
          setRefreshTrigger(prev => prev + 1);
        }
      });
    }
  };

  const doLevelDown = async () => {
    const snapshots = Array.isArray(character.levelSnapshots) ? character.levelSnapshots : [];
    if (snapshots.length === 0) {
      Alert.alert('No Previous Level', 'There is no saved level-up state to revert to.');
      return;
    }

    const previousState = snapshots[snapshots.length - 1];
    const remainingSnapshots = snapshots.slice(0, -1);
    const restoredCharacter = new Character({
      ...previousState,
      levelSnapshots: remainingSnapshots,
    });

    await persist(restoredCharacter.toJSON());

    setHpCurrent(restoredCharacter.hpCurrent);
    setHpTemp(restoredCharacter.hpTemp ?? 0);
    setHitDiceRemaining(restoredCharacter.hitDiceRemaining ?? restoredCharacter.level);
    setInspiration(restoredCharacter.inspiration ?? 0);
    setCharacterLevel(parseInt(restoredCharacter.level, 10) || 1);
    setRefreshTrigger(prev => prev + 1);

    Alert.alert('Level Down', `Reverted to level ${restoredCharacter.level}.`);
  };

  useEffect(() => {
    levelDownActionRef.current = doLevelDown;
  });

  useEffect(() => {
    onRegisterActions?.({
      openRest:    () => setRestModalVisible(true),
      openLevelUp: () => setLevelUpModalVisible(true),
      openAddTile: () => openManualTileCreator(),
      openManageFeats: () => setFeatManagerVisible(true),
      openToggleUnarmedStrike: () => toggleUnarmedStrikeVisibility(),
      openLevelDown: () => {
        Alert.alert(
          'Level Down',
          'Revert to your previous level state?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Revert', style: 'destructive', onPress: () => levelDownActionRef.current?.() },
          ]
        );
      },
    });
  }, [showUnarmedStrike]);

  const calcLevelUp = () => {
    const currentLevel = parseInt(character.level, 10) || 1;
    if (currentLevel >= 20) return null; // Can't level past 20

    const newLevel = currentLevel + 1;
    
    // Dynamically get the Hit Die (e.g., "d12" -> 12)
    const hitDieString = character.getHitDice() || '1d8';
    const hitDieFaces = parseInt(hitDieString.split('d')[1], 10) || 8;
    const conMod = character.getAbilityMod('con');

    // Standard D&D average HP increase: (Half hit die + 1) + CON Modifier
    const avgHpRoll = Math.floor(hitDieFaces / 2) + 1;
    const hpIncrease = Math.max(1, avgHpRoll + conMod); // Minimum 1 HP per level
    const newHpMax = character.hpMax + hpIncrease;

    const newProfBonus = character._calcProfBonus(newLevel);
    const levelData = classData?.levels?.[newLevel] || {};

    return {
      newLevel,
      newHpMax,
      hpIncrease,
      newProfBonus,
      levelData
    };
  };


  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
        
        {/* TOP ROW: HP + HIT DICE */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.hpBarContainer}
            onPress={() => setHpModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.hpBarHeader}>
              <Text style={styles.hpBarLabel}>HIT POINTS</Text>
              <Text style={styles.hpBarValue}>
                {hpCurrent}
                <Text style={styles.hpBarMax}> / {character.hpMax}</Text>
              </Text>
            </View>

            <View style={styles.hpBarTrack}>
              <View
                style={[
                  styles.hpBarFill,
                  {
                    width: `${Math.min(100, Math.max(0, hpPercent * 100))}%`,
                    backgroundColor: hpBarColor,
                  },
                ]}
              />
            </View>

            {hpTemp > 0 ? <Text style={styles.hpTempBadge}>+{hpTemp} Temp HP</Text> : null}
          </TouchableOpacity>

          <View style={styles.topRightCol}>
            <TouchableOpacity
              style={styles.hitDiceCard}
              onPress={() => setHitDiceModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.cardLabel}>HIT DICE</Text>
              <Text style={styles.cardValue}>{hitDiceRemaining}</Text>
              <Text style={styles.cardSub}>d{hitDieFaces} remaining</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. THE NEW DYNAMIC STATS GRID */}
        <View style={styles.grid}>
          {[
            // Standard generic stats (AC, Initiative, Prof, Speed, Perception, Inspiration)
            { label: 'AC', value: character.getArmorClass(), color: colors.accentSoft, onLongPress: () => { breakdownRef.current = character.getACBreakdown(); setBreakdownModalVisible(true); }},
            { label: 'Initiative', value: `+${character.getInitiativeBonus()}`, color: colors.accentSoft },
            { label: 'Prof.', value: `+${character.proficiencyBonus}`, color: colors.accentSoft },
            { label: 'Speed', value: `${character.overrides?.speed ?? character.speed}ft`, color: character.overrides?.speed ? colors.gold : colors.accentSoft, onLongPress: () => { overrideKeyRef.current = 'speed'; setOverrideInput(String(character.overrides?.speed ?? character.speed)); setOverrideModalVisible(true); }},
            { label: 'Pass. Perc', value: character.getPassivePerception(), color: colors.accentSoft },
            { label: 'Inspiration', value: inspiration ? '✦' : '—', color: colors.gold, onPress: () => { const newVal = inspiration ? 0 : 1; setInspiration(newVal); persist({ inspiration: newVal }); }},
            ...manualTiles.map((tile) => ({
              label: tile.name,
              value: tile.mode === 'toggle'
                ? (tile.isActive ? '✦' : '—')
                : String(Math.max(0, parseInt(tile.currentValue, 10) || 0)),
              color: tile.mode === 'toggle'
                ? (tile.isActive ? colors.gold : colors.accentSoft)
                : ((Math.max(0, parseInt(tile.currentValue, 10) || 0) > 0) ? colors.accentSoft : colors.textMuted),
              onPress: () => handleManualTilePress(tile),
              onLongPress: () => handleManualTileLongPress(tile),
            })),
            
            // 6. DYNAMIC RESOURCES INJECTED HERE
            ...character.getCombatResources().map(res => {
              const isToggle = res.displayType === 'toggle';
              const usedProp = `${res.id}Used`;
              const currentUsed = character[usedProp] || 0;
              const max = getMaxUses(res);
              const isActive = character.activeToggles?.[res.id] || false;

              // Format the text shown inside the button
              let displayValue = '';
              if (isToggle) {
                displayValue = isActive ? 'ACTIVE' : (max === 999 ? '∞ uses' : `${Math.max(0, max - currentUsed)}/${max}`);
              } else {
                displayValue = max === 999 ? '∞' : `${currentUsed}/${max}`;
              }

              return {
                label: (isToggle && isActive) ? null : res.name, // Hide label when raging for big text
                value: displayValue,
                color: isActive ? '#ff3333' : colors.accentSoft,
                valueStyle: isActive ? { fontSize: 22, fontWeight: '900', letterSpacing: 1 } : {},
                onPress: () => {
                  if (max === 0) return; // Not high enough level yet

                  if (isToggle) {
                    if (isActive) {
                      // Turn it off
                      character.activeToggles[res.id] = false;
                    } else {
                      // Try to turn it on
                      if (currentUsed >= max && max !== 999) return;
                      character[usedProp] = max === 999 ? 0 : currentUsed + 1;
                      character.activeToggles[res.id] = true;
                    }
                  } else {
                    // Standard Uses (e.g. Action Surge)
                    if (currentUsed >= max && max !== 999) return;
                    character[usedProp] = currentUsed + 1;
                  }

                  // Save the character and force UI refresh
                  persist(character.toJSON());
                  setRefreshTrigger(prev => prev + 1);
                }
              };
            })

          ].map((stat, index) => (
            <TouchableOpacity
              key={stat.label || `stat-${index}`}
              style={styles.gridCell}
              onPress={stat.onPress}
              onLongPress={stat.onLongPress}
              delayLongPress={400}
              activeOpacity={stat.onPress || stat.onLongPress ? 0.7 : 1}
            >
              <Text style={[styles.gridValue, { color: stat.color }, stat.valueStyle]}>
                {stat.value}
              </Text>
              {stat.label ? <Text style={styles.gridLabel}>{stat.label}</Text> : null}
            </TouchableOpacity>
          ))}
        </View>

        {/* ... Rest of your UI below (Attacks, Feats, Modals) remains exactly the same ... */}



        {/* ATTACKS */}
        {showUnarmedStrike && (() => {
          const unarmed = character.getUnarmedAttack();
          if (!unarmed) return null;
          
          // Use the new dynamic engine to check if we are raging!
          const isRaging = character.activeToggles?.['rage'] ?? false;
          const rageDamageBonus = classData?.progressionExtras?.rageDamage?.[character.level] ?? 2;
          const appliedRageBonus = (character.classId === 'barbarian' && isRaging) ? rageDamageBonus : 0;
          
          const finalDamageBonus = (unarmed.damageBonus || 0) + appliedRageBonus;

          return (
            <TouchableOpacity
              style={styles.attackRow}
              onLongPress={() => {
                breakdownRef.current = {
                  type:        'attack',
                  ...unarmed,
                  attackTotal: unarmed.attackBonus,
                  appliedRageBonus, 
                  finalDamageBonus, 
                };
                setBreakdownModalVisible(true);
              }}
              delayLongPress={400}
              activeOpacity={0.7}
            >
              <View style={styles.attackNameCol}>
                <Text style={styles.attackName}>{unarmed.name}</Text>
                <Text style={styles.attackTag}>{unarmed.tag} · hold for breakdown</Text>
              </View>
              <View style={styles.attackStatCol}>
                <Text style={styles.attackStatLabel}>ATK</Text>
                <Text style={styles.attackStat}>
                  {(unarmed.attackBonus ?? 0) >= 0 ? '+' : ''}{unarmed.attackBonus ?? 0}
                </Text>
              </View>
              <View style={styles.attackStatCol}>
                <Text style={styles.attackStatLabel}>DMG</Text>
                <Text style={styles.attackStat}>
                  {/* Restored Unarmed logic */}
                  {unarmed.damageDie}{finalDamageBonus >= 0 ? '+' : ''}{finalDamageBonus}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })()}

        {equippedAttacks.map((atk, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.attackRow, styles.attackRowWeapon]}
            onLongPress={() => {
              breakdownRef.current = {
                type:             'attack',
                name:             atk.name,
                abilityKey:       atk.abilityKey,
                abilityMod:       atk.abilityMod,
                profBonus:        character.proficiencyBonus,
                isProficient:     atk.isProficient,
                magicAttackBonus: atk.magicAttackBonus ?? atk.magicBonus ?? 0,
                magicDamageBonus: atk.magicDamageBonus ?? atk.magicBonus ?? 0,
                attackTotal:      atk.attackBonus,
                damageDie:        atk.damageDie,
                damageBonus:      atk.damageBonus, 
                appliedRageBonus: atk.appliedRageBonus,
                featDamageBonus:  atk.featDamageBonus,
                finalDamageBonus: atk.finalDamageBonus,
              };
              setBreakdownModalVisible(true);
            }}
            delayLongPress={400}
            activeOpacity={0.7}
          >
            <View style={styles.attackNameCol}>
              <Text style={styles.attackName}>{atk.name}</Text>
              <Text style={styles.attackTag}>Weapon · hold for breakdown</Text>
            </View>
            <View style={styles.attackStatCol}>
              <Text style={styles.attackStatLabel}>ATK</Text>
              <Text style={styles.attackStat}>
                {(atk.attackBonus ?? 0) >= 0 ? '+' : ''}{atk.attackBonus ?? 0}
              </Text>
            </View>
            <View style={styles.attackStatCol}>
              <Text style={styles.attackStatLabel}>DMG</Text>
              <Text style={styles.attackStat}>
                {atk.damageDie}{atk.finalDamageBonus >= 0 ? '+' : ''}{atk.finalDamageBonus} {atk.damageType}
                {/* NEW: Dynamically append the extra damage if it exists! */}
                {atk.extraDamageDie ? ` + ${atk.extraDamageDie} ${atk.extraDamageType || ''}`.trimEnd() : ''}
              </Text>
            </View>
          </TouchableOpacity>
        ))}


        {equippedAttacks.length === 0 && (
          <Text style={styles.emptyText}>Equip a weapon in Inventory to add attacks</Text>
        
        )}


       {/* ACTIVE FEATS */}
{(character.feats?.length ?? 0) > 0 && (
  <View style={{ marginTop: spacing.lg }}>
    <Text style={sharedStyles.sectionHeader}>FEATS</Text>
    {character.feats.map((feat, i) => {
      const featName = getFeatName(feat);
      if (!featName) return null;
      const full = FEATS_BY_NAME[featName];
      return (
              
        <TouchableOpacity
          key={`${featName}-${i}`}
          style={styles.featChip}
          delayLongPress={400}
          activeOpacity={0.7}
          onLongPress={() => {
            setFeatDetail(full ?? feat);
            setFeatDetailVisible(true);
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.featChipName}>{featName}</Text>
            {full && (
              <Text style={styles.featChipMeta} numberOfLines={1}>
                {formatFeatSummary(full)}
              </Text>
            )}
          </View>
          <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      );
    })}
  </View>
)}

{speciesFeatures.length > 0 && (
  <View style={{ marginTop: spacing.sm }}>
    <Text style={sharedStyles.sectionHeader}>
      {selectedRace?.name ?? character.race ?? 'Species'} Features
    </Text>
    {speciesFeatures.map((feature, i) => (
      <TouchableOpacity
        key={`${feature.name}-${i}`}
        style={styles.featChip}
        delayLongPress={400}
        activeOpacity={0.7}
        onLongPress={() => {
          setRaceFeatureDetail(feature);
          setRaceFeatureDetailVisible(true);
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.featChipName}>{feature.name}</Text>
          {!!selectedRace?.name && (
            <Text style={styles.featChipMeta} numberOfLines={1}>
              {selectedRace.name}{selectedRace.source ? ` · ${selectedRace.source}` : ''}
            </Text>
          )}
        </View>
        <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    ))}
  </View>
)}


       
        

        {/* EQUIPPED ITEMS */}
        {shouldShowEquippedItems && (
          <>
            <Text style={sharedStyles.sectionHeader}>Equipped Items</Text>

            {equippedItems.length === 0 ? (
              <Text style={styles.emptyText}>No items currently equipped</Text>
            ) : (
              equippedItems.map((item, i) => {
                const fullItem = getItemByName(item.itemName) ?? {};
                const merged   = { ...fullItem, ...item };
                const bonus    = getItemBonusSummary(merged);
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.equippedRow}
                    onLongPress={() => {
                      selectedEquippedRef.current = merged;
                      setEquippedModalVisible(true);
                    }}
                    delayLongPress={400}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.equippedName} numberOfLines={1}>{item.itemName}</Text>
                    {item.attuned && <Text style={styles.attunedBadge}>◈</Text>}
                    {bonus        && <Text style={styles.equippedBonus}>{bonus}</Text>}
                    <Text style={styles.equippedType}>{fullItem.ObjectType ?? '—'}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}

        {/* SUBCLASS FEATURES */}
        {unlockedSubclassFeatures.length > 0 && (
          <>
            <Text style={sharedStyles.sectionHeader}>Subclass Features</Text>
            {unlockedSubclassFeatures.map((feature, i) => (
              <TouchableOpacity
                key={`${feature.name}-${feature.level ?? 1}-${i}`}
                style={styles.featChip}
                delayLongPress={400}
                activeOpacity={0.7}
                onLongPress={() => {
                  setSubclassFeatureDetail(feature);
                  setSubclassFeatureDetailVisible(true);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.featChipName}>{feature.name}</Text>
                </View>
                <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </>
        )}

        <Text style={sharedStyles.sectionHeader}>Languages</Text>
        {selectedLanguages.length > 0 ? (
          selectedLanguages.map((language) => (
            <TouchableOpacity
              key={language}
              style={styles.featChip}
              delayLongPress={400}
              activeOpacity={0.7}
              onLongPress={() => setLanguageModalVisible(true)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.featChipName}>{language}</Text>
              </View>
              <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))
        ) : (
          <TouchableOpacity
            style={styles.featChip}
            delayLongPress={400}
            activeOpacity={0.7}
            onLongPress={() => setLanguageModalVisible(true)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.featChipName}>No languages selected</Text>
              <Text style={styles.featChipMeta}>Hold to manage</Text>
            </View>
            <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* HP MODAL */}
      <Modal visible={hpModalVisible} transparent animationType="slide">
        <View style={sharedStyles.modalOverlay}>
          <View style={sharedStyles.modalBox}>
            <Text style={sharedStyles.modalTitle}>Adjust Hit Points</Text>
            <TextInput
              style={[sharedStyles.input, styles.largeInput]}
              keyboardType="numeric"
              value={hpInput}
              onChangeText={setHpInput}
              placeholder="0"
              placeholderTextColor={colors.textDisabled}
              autoFocus
            />
            <Text style={styles.modalHint}>Tap an action to apply</Text>
            <View style={styles.modeRow}>
              {[
                { mode: 'damage',  label: 'Damage',  icon: 'skull-outline' },
                { mode: 'healing', label: 'Heal',    icon: 'heart-outline' },
                { mode: 'temp',    label: 'Temp HP', icon: 'shield-outline' },
              ].map(({ mode, label, icon }) => (
                <TouchableOpacity
                  key={mode}
                  style={styles.modeButton}
                  onPress={() => applyHp(mode)}
                >
                  <Ionicons
                    name={icon}
                    size={20}
                    color={
                      mode === 'damage'  ? colors.accent :
                      mode === 'healing' ? colors.success :
                      colors.accentSoft
                    }
                    style={{ marginBottom: 4 }}
                  />
                  <Text style={styles.modeButtonText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => { setHpModalVisible(false); setHpInput(''); }}>
              <Text style={sharedStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* REST MODAL */}
      <Modal visible={restModalVisible} transparent animationType="fade">
        <View style={sharedStyles.modalOverlay}>
          <View style={sharedStyles.modalBox}>
            <Text style={sharedStyles.modalTitle}>Take a Rest</Text>
            <TouchableOpacity style={styles.restButton} onPress={doShortRest}>
              <Ionicons name="partly-sunny" size={22} color={colors.accentSoft} style={{ marginRight: spacing.md }} />
              <View>
                <Text style={styles.restButtonTitle}>Short Rest</Text>
                <Text style={styles.restButtonSub}>Spend hit dice to recover HP</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.restButton, { borderColor: colors.accentDim }]} onPress={doLongRest}>
              <Ionicons name="moon" size={22} color={colors.gold} style={{ marginRight: spacing.md }} />
              <View>
                <Text style={styles.restButtonTitle}>Long Rest</Text>
                <Text style={styles.restButtonSub}>Restore all HP, &amp; Hit Dice</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setRestModalVisible(false)}>
              <Text style={sharedStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* HIT DICE MODAL */}
      <Modal visible={hitDiceModalVisible} transparent animationType="slide">
        <View style={sharedStyles.modalOverlay}>
          <View style={sharedStyles.modalBox}>
            <Text style={sharedStyles.modalTitle}>Spend Hit Dice</Text>
            <Text style={styles.modalSub}>
              {character.hitDiceRemaining} / {character.level} d{hitDieFaces} remaining
            </Text>
            <Text style={styles.modalSub}>
              CON {conMod >= 0 ? `+${conMod}` : conMod} added per die
            </Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setDiceToSpend(Math.min(character.hitDiceRemaining, diceToSpend + 1))}
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{diceToSpend}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setDiceToSpend(Math.min(hitDiceRemaining, diceToSpend + 1))}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            {lastRollResult && (
              <View style={styles.rollResult}>
                <Text style={styles.rollDice}>[{lastRollResult.rolls.join(' + ')}]</Text>
                <Text style={styles.rollMeta}>
                  {conMod >= 0 ? `+${conMod}` : conMod} CON × {lastRollResult.rolls.length}
                </Text>
                <Text style={styles.rollTotal}>
                  +{lastRollResult.total} HP → {lastRollResult.newHp} / {character.hpMax}
                </Text>
              </View>
            )}
            {!lastRollResult ? (
              <TouchableOpacity
                style={[sharedStyles.primaryButton, character.hitDiceRemaining === 0 && { backgroundColor: colors.textDisabled }]}
                onPress={rollHitDice}
                disabled={character.hitDiceRemaining === 0}
              >
                <Text style={sharedStyles.primaryButtonText}>Roll {diceToSpend}d{hitDieFaces}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={sharedStyles.primaryButton} onPress={closeHitDiceModal}>
                <Text style={sharedStyles.primaryButtonText}>Done</Text>
              </TouchableOpacity>
            )}
            {!lastRollResult && (
              <TouchableOpacity onPress={closeHitDiceModal}>
                <Text style={sharedStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={featManagerVisible} transparent animationType="slide">
        <View style={sharedStyles.modalOverlay}>
          <View style={sharedStyles.modalBox}>
            <Text style={sharedStyles.modalTitle}>Manage Feats</Text>

            {(character.feats?.length ?? 0) === 0 ? (
              <Text style={styles.modalSub}>No feats added yet.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 260, width: '100%', marginBottom: spacing.sm }}>
                {(character.feats ?? []).map((feat, index) => {
                  const featName = getFeatName(feat) ?? 'Unnamed Feat';
                  const source = typeof feat === 'object' ? feat?.source : null;
                  return (
                    <View key={`${featName}-${index}`} style={styles.manageFeatRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.manageFeatName}>{featName}</Text>
                        {!!source && <Text style={styles.manageFeatMeta}>{source}</Text>}
                      </View>
                      <TouchableOpacity style={styles.manageFeatBtn} onPress={() => openFeatPicker(index)}>
                        <Text style={styles.manageFeatBtnText}>Change</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.manageFeatBtn} onPress={() => removeFeatAt(index)}>
                        <Text style={styles.manageFeatBtnText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            <TouchableOpacity style={sharedStyles.primaryButton} onPress={() => openFeatPicker(null)}>
              <Text style={sharedStyles.primaryButtonText}>Add Feat</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFeatManagerVisible(false)}>
              <Text style={sharedStyles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={featPickerVisible} transparent animationType="slide">
        <View style={sharedStyles.modalOverlay}>
          <View style={sharedStyles.modalBox}>
            <Text style={sharedStyles.modalTitle}>{featEditIndex != null ? 'Replace Feat' : 'Add Feat'}</Text>
            <TextInput
              style={[sharedStyles.input, { marginBottom: spacing.sm }]}
              value={featSearch}
              onChangeText={setFeatSearch}
              placeholder="Search feats"
              placeholderTextColor={colors.textDisabled}
            />

            <ScrollView style={{ maxHeight: 320, width: '100%' }}>
              {filteredFeats.map((feat) => (
                <TouchableOpacity
                  key={`${feat.name}-${feat.source ?? 'SRC'}`}
                  style={styles.featRow}
                  onPress={() => selectFeatFromPicker(feat)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.featName}>{feat.name}</Text>
                    <Text style={styles.featMeta}>{formatFeatSummary(feat)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={() => {
                setFeatPickerVisible(false);
                setFeatEditIndex(null);
                setFeatSearch('');
              }}
            >
              <Text style={sharedStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
<Modal
  visible={featDetailVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setFeatDetailVisible(false)}
>
  <View style={sharedStyles.modalOverlay}>
    <View style={sharedStyles.modalBox}>
      <Text style={sharedStyles.modalTitle}>
        {featDetail?.name ?? 'Feat'}
      </Text>

      {featDetail && (
        <>
          {featDetail.abilityBonus && (
            <Text style={styles.featDetailMeta}>
              {formatFeatSummary(featDetail)}
            </Text>
          )}
           <ScrollView style={{ maxHeight: 260, marginTop: spacing.sm }}>
              <Text style={styles.featDetailText}>
                {Array.isArray(featDetail.entries)
                  ? featDetail.entries
                      .map(e => (typeof e === 'string' ? e : e?.text ?? e?.entries?.join(' ') ?? ''))
                      .join('\n\n')
                  : featDetail.entries ?? 'No description available.'}
              </Text>
           </ScrollView>

        </>
      )}

      <TouchableOpacity
        onPress={() => setFeatDetailVisible(false)}
        style={{ marginTop: spacing.md }}
      >
        <Text style={sharedStyles.cancelText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={sharedStyles.modalOverlay}>
          <View style={sharedStyles.modalBox}>
            <Text style={sharedStyles.modalTitle}>Languages</Text>
            <Text style={styles.modalSub}>Long-press the tile to manage known standard languages.</Text>
            {selectedLanguages.length > 0 ? (
              <Text style={styles.languageSummary}>
                {selectedLanguages.join(', ')}
              </Text>
            ) : (
              <Text style={styles.languageSummary}>No languages selected yet.</Text>
            )}

            <ScrollView style={styles.languageList} contentContainerStyle={styles.languageGrid}>
              {STANDARD_DND_LANGUAGES.map((language) => {
                const isSelected = selectedLanguages.includes(language);
                return (
                  <TouchableOpacity
                    key={language}
                    style={[styles.languageChip, isSelected && styles.languageChipActive]}
                    onPress={() => toggleLanguageSelection(language)}
                  >
                    <Text style={[styles.languageChipText, isSelected && styles.languageChipTextActive]}>
                      {language}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
              <Text style={sharedStyles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

<Modal
  visible={subclassFeatureDetailVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setSubclassFeatureDetailVisible(false)}
>
  <View style={sharedStyles.modalOverlay}>
    <View style={sharedStyles.modalBox}>
      <Text style={sharedStyles.modalTitle}>
        {subclassFeatureDetail?.name ?? 'Subclass Feature'}
      </Text>

      {!!subclassFeatureDetail && (
        <>
          <Text style={styles.featDetailMeta}>
            Level {subclassFeatureDetail.level ?? '—'}
          </Text>
          <ScrollView style={{ maxHeight: 260, marginTop: spacing.sm }}>
            <Text style={styles.featDetailText}>
              {subclassFeatureDetail.description ?? 'No description available.'}
            </Text>
          </ScrollView>
        </>
      )}

      <TouchableOpacity
        onPress={() => setSubclassFeatureDetailVisible(false)}
        style={{ marginTop: spacing.md }}
      >
        <Text style={sharedStyles.cancelText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

<Modal
  visible={raceFeatureDetailVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setRaceFeatureDetailVisible(false)}
>
  <View style={sharedStyles.modalOverlay}>
    <View style={sharedStyles.modalBox}>
      <Text style={sharedStyles.modalTitle}>
        {raceFeatureDetail?.name ?? 'Species Feature'}
      </Text>

      {!!raceFeatureDetail && (
        <>
          <Text style={styles.featDetailMeta}>
            {selectedRace?.name ?? character.race ?? 'Species'}
            {selectedRace?.source ? ` · ${selectedRace.source}` : ''}
          </Text>
          <ScrollView style={{ maxHeight: 260, marginTop: spacing.sm }}>
            <Text style={styles.featDetailText}>
              {raceFeatureDetail.text ?? 'No description available.'}
            </Text>
          </ScrollView>
        </>
      )}

      <TouchableOpacity
        onPress={() => setRaceFeatureDetailVisible(false)}
        style={{ marginTop: spacing.md }}
      >
        <Text style={sharedStyles.cancelText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      <Modal visible={manualTileModalVisible} transparent animationType="slide">
        <View style={sharedStyles.modalOverlay}>
          <View style={sharedStyles.modalBox}>
            <Text style={sharedStyles.modalTitle}>{editingManualTileId ? 'Edit Tile' : 'Add Tile'}</Text>

            <Text style={styles.tileFieldLabel}>Name</Text>
            <TextInput
              style={sharedStyles.input}
              value={manualTileName}
              onChangeText={setManualTileName}
              placeholder="e.g. Misty Step"
              placeholderTextColor={colors.textDisabled}
              maxLength={40}
            />

            <Text style={styles.tileFieldLabel}>Type</Text>
            <View style={styles.tileOptionRow}>
              {[{ key: 'counter', label: 'Starting Value' }, { key: 'toggle', label: 'Toggle' }].map((option) => {
                const isActive = manualTileMode === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.tileOptionButton, isActive && styles.tileOptionButtonActive]}
                    onPress={() => setManualTileMode(option.key)}
                  >
                    <Text style={[styles.tileOptionText, isActive && styles.tileOptionTextActive]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {manualTileMode === 'counter' && (
              <>
                <Text style={styles.tileFieldLabel}>Starting Value</Text>
                <TextInput
                  style={[sharedStyles.input, styles.tileValueInput]}
                  value={manualTileStartValue}
                  onChangeText={setManualTileStartValue}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textDisabled}
                />
              </>
            )}

            <Text style={styles.tileFieldLabel}>Recharge</Text>
            <View style={styles.tileOptionRow}>
              {[{ key: 'short', label: 'Short Rest' }, { key: 'long', label: 'Long Rest' }].map((option) => {
                const isActive = manualTileRecharge === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.tileOptionButton, isActive && styles.tileOptionButtonActive]}
                    onPress={() => setManualTileRecharge(option.key)}
                  >
                    <Text style={[styles.tileOptionText, isActive && styles.tileOptionTextActive]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={sharedStyles.primaryButton} onPress={saveManualTile}>
              <Text style={sharedStyles.primaryButtonText}>{editingManualTileId ? 'Save Tile' : 'Add Tile'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setManualTileModalVisible(false);
                resetManualTileForm();
              }}
            >
              <Text style={sharedStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* EQUIPPED ITEM MODAL */}
      <Modal visible={equippedModalVisible} transparent animationType="fade">
        <View style={sharedStyles.modalOverlay}>
          <View style={sharedStyles.modalBox}>
            <Text style={sharedStyles.modalTitle}>
              {selectedEquippedRef.current?.itemName ?? selectedEquippedRef.current?.Name ?? '—'}
            </Text>
            <Text style={styles.equippedModalType}>
              {selectedEquippedRef.current?.ObjectType ?? '—'}
              {selectedEquippedRef.current?.Rarity ? `  ·  ${selectedEquippedRef.current.Rarity}` : ''}
              {selectedEquippedRef.current?.attuned ? '  ◈ Attuned' : ''}
            </Text>
            {getItemBonusSummary(selectedEquippedRef.current) ? (
              <Text style={styles.equippedModalBonus}>
                {getItemBonusSummary(selectedEquippedRef.current)}
              </Text>
            ) : null}
            {selectedEquippedRef.current?.Description ? (
              <ScrollView style={styles.equippedModalDescScroll}>
                <Text style={styles.equippedModalDesc}>
                  {selectedEquippedRef.current.Description}
                </Text>
              </ScrollView>
            ) : (
              <Text style={styles.equippedModalDesc}>No description available.</Text>
            )}
            <TouchableOpacity
              style={[sharedStyles.primaryButton, { marginTop: spacing.md }]}
              onPress={() => setEquippedModalVisible(false)}
            >
              <Text style={sharedStyles.primaryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* LEVEL UP MODAL */}
<Modal visible={levelUpModalVisible} transparent animationType="slide">
  <View style={sharedStyles.modalOverlay}>
    <View style={sharedStyles.modalBox}>
      <Text style={sharedStyles.modalTitle}>Level Up</Text>
      {(() => {
        const calc = calcLevelUp();
        if (!calc) return (
          <Text style={styles.modalSub}>Already at maximum level!</Text>
        );

        const { newLevel, hpIncrease, newProfBonus, levelData } = calc;
        const isASILevel = levelData?.features?.includes('Ability Score Improvement') ?? false;
        const currentInvocations = character.getMaxInvocations();
        const nextInvocations = levelData?.invocations ?? currentInvocations;
        const gainedInvocations = Math.max(0, nextInvocations - currentInvocations);

        return (
          <>
            {/* Stats preview */}
            <View style={styles.levelUpPreview}>
              <View style={styles.levelUpRow}>
                <Text style={styles.levelUpLabel}>Level</Text>
                <Text style={styles.levelUpValue}>
                  {character.level} → <Text style={{ color: colors.gold }}>{newLevel}</Text>
                </Text>
              </View>
              <View style={styles.levelUpRow}>
                <Text style={styles.levelUpLabel}>Hit Points</Text>
                <Text style={styles.levelUpValue}>
                  +<Text style={{ color: colors.success }}>{hpIncrease}</Text>
                  <Text style={styles.levelUpMeta}>
                    {' '}(avg d{hitDieFaces} {conMod >= 0 ? `+${conMod}` : conMod} CON)
                  </Text>
                </Text>
              </View>
              <View style={styles.levelUpRow}>
                <Text style={styles.levelUpLabel}>Proficiency</Text>
                <Text style={styles.levelUpValue}>
                  +<Text style={{ color: colors.accentSoft }}>{newProfBonus}</Text>
                </Text>
              </View>
              {levelData.fisticuffs != null && (
                <View style={styles.levelUpRow}>
                  <Text style={styles.levelUpLabel}>Fisticuffs</Text>
                  <Text style={styles.levelUpValue}>
                    <Text style={{ color: colors.accent }}>{levelData.fisticuffs}</Text>
                  </Text>
                </View>
              )}
              {levelData.resourceMax != null && (
                <View style={styles.levelUpRow}>
                  <Text style={styles.levelUpLabel}>{classData?.resource?.name ?? 'Resource'}</Text>
                  <Text style={styles.levelUpValue}>
                    <Text style={{ color: colors.gold }}>{levelData.resourceMax}</Text>
                  </Text>
                </View>
              )}
              {character.classId === 'warlock' && gainedInvocations > 0 && (
                <View style={styles.levelUpRow}>
                  <Text style={styles.levelUpLabel}>Eldritch Invocations</Text>
                  <Text style={styles.levelUpValue}>
                    <Text style={{ color: colors.gold }}>+{gainedInvocations}</Text>
                  </Text>
                </View>
              )}
            </View>

            {/* ASI / Feat choice — only shown at appropriate levels */}
            {isASILevel && (
              <View style={styles.asiSection}>
                <Text style={styles.asiTitle}>Ability Score Improvement</Text>

                {/* Toggle buttons */}
                <View style={styles.asiToggle}>
                  <TouchableOpacity
                    style={[styles.asiToggleBtn, asiChoice === 'asi' && styles.asiToggleBtnActive]}
                    onPress={() => { setAsiChoice('asi'); setSelectedFeat(null); setFeatChoices({}); }}
                  >
                    <Text style={[styles.asiToggleText, asiChoice === 'asi' && styles.asiToggleTextActive]}>
                      +2 Ability Score
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.asiToggleBtn, asiChoice === 'feat' && styles.asiToggleBtnActive]}
                    onPress={() => { setAsiChoice('feat'); setAsiStats([]); }}
                  >
                    <Text style={[styles.asiToggleText, asiChoice === 'feat' && styles.asiToggleTextActive]}>
                      Take a Feat
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* ASI stat picker */}
                {asiChoice === 'asi' && (
                  <View>
                    <Text style={styles.asiHint}>
                      {asiStats.length === 0 && 'Tap a stat to add +2, or tap two stats for +1 each'}
                      {asiStats.length === 1 && `+2 ${asiStats[0].toUpperCase()} — or tap another for +1/+1`}
                      {asiStats.length === 2 && `+1 ${asiStats[0].toUpperCase()}, +1 ${asiStats[1].toUpperCase()}`}
                    </Text>
                    <View style={styles.asiStatGrid}>
                      {['str','dex','con','int','wis','cha'].map(stat => {
                        const isChosen = asiStats.includes(stat);
                        return (
                          <TouchableOpacity
  key={stat}
  style={[styles.asiStatBtn, isChosen && styles.asiStatBtnActive]}
  onPress={() => {
    if (isChosen) {
      setAsiStats(prev => prev.filter(s => s !== stat));
    } else if (asiStats.length < 2) {
      setAsiStats(prev => [...prev, stat]);
    }
  }}
>
  <Text style={[styles.asiStatLabel, isChosen && styles.asiStatLabelActive]}>
    {stat.toUpperCase()}
  </Text>
  <Text style={[styles.asiStatScore, isChosen && styles.asiStatLabelActive]}>
    {character.abilities?.[stat] ?? 10}
                              {isChosen && (
                                <Text style={{ color: colors.success }}>
                                  {asiStats.length === 1 ? '+2' : '+1'}
                                </Text>
                              )}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Feat picker */}
                {asiChoice === 'feat' && (
                  <ScrollView style={{ maxHeight: 240 }}>
                    {getFeats()
                      .filter(f => {
                        try {
                          return f.source === 'XPHB' &&
                                 f.category !== 'O' &&
                                 f.category !== 'EB' &&
                                 meetsPrerequisites(f, character, newLevel) &&
                                 !(character.feats ?? []).some(cf => cf.name === f.name);
                        } catch (e) {
                          // If meetsPrerequisites crashes, safely hide this feat
                          return false; 
                        }
                      })
                      .map(feat => {
                        const isSelected = selectedFeat?.name === feat.name;
                        return (
                          <TouchableOpacity
                            key={feat.name}
                            style={[styles.featRow, isSelected && styles.featRowSelected]}
                            onPress={() => {
                              const effect = FEAT_EFFECTS[feat.name];
                              if (effect?.abilityBonus?.type === 'choice') {
                                setPendingFeat(feat);
                                setFeatModalVisible(true);
                              } else {
                                setSelectedFeat(feat);
                                setFeatChoices({});
                              }
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={styles.featName}>{feat.name}</Text>
                              <Text style={styles.featMeta}>{formatFeatSummary(feat)}</Text>
                            </View>
                            {isSelected && (
                              <Ionicons name="checkmark" size={18} color={colors.accent} />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                  </ScrollView>
                )}
              </View>
            )}

            {/* Confirm button — disabled if ASI level but no choice made */}
            <TouchableOpacity
              style={[
                sharedStyles.primaryButton,
                { backgroundColor: colors.gold },
                isASILevel && !asiChoice && { opacity: 0.4 },
                isASILevel && asiChoice === 'asi' && asiStats.length === 0 && { opacity: 0.4 },
                isASILevel && asiChoice === 'feat' && !selectedFeat && { opacity: 0.4 },
              ]}
              onPress={doLevelUp}
              disabled={
                isASILevel && (
                  !asiChoice ||
                  (asiChoice === 'asi' && asiStats.length === 0) ||
                  (asiChoice === 'feat' && !selectedFeat)
                )
              }
            >
              <Text style={[sharedStyles.primaryButtonText, { color: colors.background }]}>
                Confirm Level Up to {newLevel}
              </Text>
            </TouchableOpacity>
          </>
        );
      })()}

      <TouchableOpacity onPress={() => {
        setLevelUpModalVisible(false);
        setAsiChoice(null);
        setAsiStats([]);
        setSelectedFeat(null);
        setFeatChoices({});
      }}>
        <Text style={sharedStyles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

{/* Feat ability choice modal */}
<Modal visible={featModalVisible} transparent animationType="fade">
  <View style={sharedStyles.modalOverlay}>
    <View style={sharedStyles.modalBox}>
      <Text style={sharedStyles.modalTitle}>{pendingFeat?.name}</Text>
      <Text style={styles.modalSub}>Choose one ability score to increase by 1:</Text>
      <View style={styles.asiStatGrid}>
        {FEAT_EFFECTS[pendingFeat?.name]?.abilityBonus?.from?.map(stat => {
          const isChosen = featChoices.abilityStat === stat;
          return (
            <TouchableOpacity
              key={stat}
              style={[styles.asiStatBtn, isChosen && styles.asiStatBtnActive]}
              onPress={() => setFeatChoices({ abilityStat: stat })}
            >
              <Text style={[styles.asiStatLabel, isChosen && styles.asiStatLabelActive]}>
                {stat.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <TouchableOpacity
        style={[sharedStyles.primaryButton, !featChoices.abilityStat && { opacity: 0.4 }]}
        disabled={!featChoices.abilityStat}
        onPress={() => {
          setSelectedFeat(pendingFeat);
          setPendingFeat(null);
          setFeatModalVisible(false);
        }}
      >
        <Text style={sharedStyles.primaryButtonText}>Confirm</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => {
        setPendingFeat(null);
        setFeatChoices({});
        setFeatModalVisible(false);
      }}>
        <Text style={sharedStyles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


      {/* BREAKDOWN MODAL — AC and weapon attacks */}
      <Modal visible={breakdownModalVisible} transparent animationType="fade">
        <View style={sharedStyles.modalOverlay}>
          <View style={sharedStyles.modalBox}>
            {breakdownRef.current?.type === 'attack' ? (
              <>
                <Text style={sharedStyles.modalTitle}>{breakdownRef.current.name}</Text>
                <Text style={styles.breakdownSub}>Attack &amp; Damage Breakdown</Text>
                <View style={styles.breakdownTable}>
                  <BreakdownRow
                    label={`${(breakdownRef.current.abilityKey ?? 'str').toUpperCase()} Modifier`}
                    value={formatSignedNumber(breakdownRef.current.abilityMod ?? 0)}
                  />
                  <BreakdownRow
                    label="Proficiency"
                    value={breakdownRef.current.isProficient
                      ? `+${breakdownRef.current.profBonus}`
                      : '— (not proficient)'}
                  />
                  {(breakdownRef.current.magicAttackBonus ?? 0) > 0 && (
                    <BreakdownRow label="Magic Bonus" value={`+${breakdownRef.current.magicAttackBonus}`} />
                  )}
                  <BreakdownRow
                    label="To Hit Total"
                    value={formatSignedNumber(breakdownRef.current.attackTotal ?? 0)}
                    isTotal
                  />
                  <View style={styles.breakdownDivider} />
                  <BreakdownRow label="Damage Die"   value={normalizeDamageDie(breakdownRef.current.damageDie)} />
                  <BreakdownRow
                    label={`${(breakdownRef.current.abilityKey ?? 'str').toUpperCase()} Modifier`}
                    value={formatSignedNumber(breakdownRef.current.damageBonus ?? 0)}
                  />
                  
                  {(breakdownRef.current.magicDamageBonus ?? 0) > 0 && (
                    <BreakdownRow label="Magic Bonus" value={`+${breakdownRef.current.magicDamageBonus}`} />
                  )}
                  
                  {/* Show Rage Bonus if it's active! */}
                  {breakdownRef.current.appliedRageBonus > 0 && (
                    <BreakdownRow label="Rage Bonus" value={`+${breakdownRef.current.appliedRageBonus}`} />
                  )}
                  {breakdownRef.current.featDamageBonus > 0 &&
                  <BreakdownRow label="Feat Bonus"      value={`+${breakdownRef.current.featDamageBonus}`} />}
                  
                  <BreakdownRow
                    label="Total Damage"
                    value={formatSignedNumber(breakdownRef.current.finalDamageBonus ?? 0)}
                    isTotal
                  />
                </View>
              </>
            ) : (
              <>
               <Text style={sharedStyles.modalTitle}>Armour Class</Text>
                <Text style={styles.breakdownSub}>{breakdownRef.current?.formula}</Text>
                <View style={styles.breakdownTable}>
                  
                  <BreakdownRow label="Base" value={String(breakdownRef.current?.base ?? 0)} />
                  
                  {/* Safely handle positive and negative DEX modifiers */}
                  {(breakdownRef.current?.dexApplied ?? 0) !== 0 && (
                    <BreakdownRow 
                      label="DEX Modifier" 
                      value={(breakdownRef.current.dexApplied > 0 ? '+' : '') + breakdownRef.current.dexApplied} 
                    />
                  )}
                  
                  {(breakdownRef.current?.shieldBonus ?? 0) > 0 && (
                    <BreakdownRow label="Shield" value={`+${breakdownRef.current.shieldBonus}`} />
                  )}
                  
                  {(breakdownRef.current?.magicBonus ?? 0) > 0 && (
                    <BreakdownRow label="Magic Bonus" value={`+${breakdownRef.current.magicBonus}`} />
                  )}
                  
                  <BreakdownRow label="Total AC" value={String(breakdownRef.current?.total ?? 0)} isTotal />
                  
                  {breakdownRef.current?.isOverride && (
                    <Text style={styles.overrideNote}>⚠ Manual override active</Text>
                  )}
                  
                </View>
                <TouchableOpacity
                  style={[sharedStyles.primaryButton, { marginTop: spacing.md }]}
                  onPress={() => {
                    overrideKeyRef.current = 'ac';
                    setOverrideInput(
                      breakdownRef.current?.isOverride
                        ? String(breakdownRef.current.total)
                        : ''
                    );
                    setBreakdownModalVisible(false);
                    setTimeout(() => setOverrideModalVisible(true), 300);
                  }}
                >
                  <Text style={sharedStyles.primaryButtonText}>
                    {breakdownRef.current?.isOverride ? 'Edit Override' : 'Set Override'}
                  </Text>
                </TouchableOpacity>
                {breakdownRef.current?.isOverride && (
                  <TouchableOpacity
                    style={[sharedStyles.primaryButton, { backgroundColor: colors.surfaceDeep, marginTop: spacing.sm }]}
                    onPress={() => {
                      const newOverrides = { ...character.overrides };
                      delete newOverrides.ac;
                      character.overrides = newOverrides;
                      persist({ overrides: newOverrides });
                      setBreakdownModalVisible(false);
                    }}
                  >
                    <Text style={[sharedStyles.primaryButtonText, { color: colors.textMuted }]}>
                      Clear Override
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
            <TouchableOpacity
              style={[sharedStyles.primaryButton, { marginTop: spacing.md }]}
              onPress={() => setBreakdownModalVisible(false)}
            >
              <Text style={sharedStyles.primaryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* OVERRIDE INPUT MODAL */}
      <Modal visible={overrideModalVisible} transparent animationType="slide">
        <View style={sharedStyles.modalOverlay}>
          <View style={sharedStyles.modalBox}>
            <Text style={sharedStyles.modalTitle}>
              Override {overrideKeyRef.current?.toUpperCase()}
            </Text>
            <Text style={styles.breakdownSub}>Enter a value to manually set this stat</Text>
            <TextInput
              style={[sharedStyles.input, styles.largeInput]}
              keyboardType="numeric"
              value={overrideInput}
              onChangeText={setOverrideInput}
              autoFocus
            />
            <TouchableOpacity
              style={sharedStyles.primaryButton}
              onPress={() => {
                const val = parseInt(overrideInput, 10);
                if (isNaN(val)) return;
                character.overrides = { ...character.overrides, [overrideKeyRef.current]: val };
                persist({ overrides: character.overrides });
                setOverrideModalVisible(false);
                setOverrideInput('');
              }}
            >
              <Text style={sharedStyles.primaryButtonText}>Apply Override</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[sharedStyles.primaryButton, { backgroundColor: colors.surfaceDeep, marginTop: spacing.sm }]}
              onPress={() => {
                const newOverrides = { ...character.overrides };
                delete newOverrides[overrideKeyRef.current];
                character.overrides = newOverrides;
                persist({ overrides: newOverrides });
                setOverrideModalVisible(false);
                setOverrideInput('');
              }}
            >
              <Text style={[sharedStyles.primaryButtonText, { color: colors.textMuted }]}>
                Reset to Calculated
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setOverrideModalVisible(false); setOverrideInput(''); }}>
              <Text style={sharedStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );



}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },

topRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
    alignItems: 'stretch', // Ensures both columns stretch to the height of the tallest item
  },

  topRightCol: {
    flex: 1,
    // Removed justifyContent: 'flex-start' so the card can stretch to full height
  },

  hpBarContainer: {
    ...sharedStyles.card,
    flex: 2,
    justifyContent: 'center', // Centers the HP content vertically
    // Removed marginBottom: spacing.md 
  },

  hitDiceCard: {
    ...sharedStyles.card,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', // Centers the text vertically to match the HP bar
    // Notice: No borderTopWidth or borderTopColor here!
  },
  hpBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  hpBarLabel: {
    ...typography.label,
    letterSpacing: 1,
  },
  hpBarValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  hpBarMax: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: 'normal',
  },
  hpBarTrack: {
    height: 8,
    backgroundColor: colors.surfaceDeep,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  hpBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  hpTempBadge: {
    color: colors.accentSoft,
    fontSize: 11,
    marginTop: spacing.xs,
    textAlign: 'right',
  },

  // Cards row
  cardRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  card: {
    ...sharedStyles.card,
    flex: 1,
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: colors.accentSoft,
  },
  cardGold: {
    borderTopColor: colors.gold,
  },
  cardLabel: {
    ...typography.label,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  cardValue: {
    ...typography.value,
  },
  cardSub: {
    ...typography.subtitle,
    marginTop: spacing.xs,
  },

  // Stats grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
 gridCell: {
  width: '24%',
  flexGrow: 0,
  backgroundColor: colors.surface,
  borderRadius: radius.sm,
  padding: spacing.sm,
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 60, // tweak to taste
  marginBottom: spacing.xs,
  //...shadows.card,
},
  gridValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  gridLabel: {
    ...typography.label,
    textAlign: 'center',
  },

  // Attacks
  attackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    // ...shadows.card,
  },
  attackRowWeapon: {
    borderLeftColor: colors.accentSoft,
  },
  attackNameCol: { flex: 2 },
  attackName: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  attackTag: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  attackStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  attackStatLabel: {
    ...typography.label,
    marginBottom: 2,
  },
  attackStat: {
    color: colors.accentSoft,
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyText: {
    color: colors.textMuted,
    fontStyle: 'italic',
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },

  // Equipped items
  equippedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    gap: spacing.sm,
    ...shadows.card,
  },
  equippedName: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 14,
    flex: 1,
  },
  equippedType: {
    color: colors.textMuted,
    fontSize: 11,
  },
  attunedBadge: {
    color: colors.gold,
    fontSize: 13,
  },
  equippedBonus: {
    color: colors.accentSoft,
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Equipped item modal
  equippedModalType: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  equippedModalBonus: {
    color: colors.accentSoft,
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  equippedModalDescScroll: {
    maxHeight: 200,
    marginBottom: spacing.sm,
  },
  equippedModalDesc: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 20,
  },

  // Breakdown modal
  breakdownSub: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  breakdownTable: {
    width: '100%',
    backgroundColor: colors.surfaceDeep,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  breakdownRowTotal: {
    borderBottomWidth: 0,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceAlt,
  },
  breakdownLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  breakdownLabelTotal: {
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  breakdownValue: {
    color: colors.accentSoft,
    fontSize: 13,
    fontWeight: 'bold',
  },
  breakdownValueTotal: {
    color: colors.textPrimary,
    fontSize: 15,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: colors.surfaceAlt,
    marginVertical: spacing.sm,
  },
  overrideHint: {
    color: colors.textDisabled,
    fontSize: 9,
    marginTop: 2,
  },
  overrideNote: {
    color: colors.warning,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // Level up modal
  levelUpPreview: {
    backgroundColor: colors.surfaceDeep,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    width: '100%',
  },
  levelUpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  levelUpLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  levelUpValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  levelUpMeta: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: 'normal',
  },

  // HP modal
  largeInput: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  modalHint: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modeButton: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceDeep,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
  },
  modeButtonText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Rest modal
  restButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceDeep,
  },
  restButtonTitle: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  restButtonSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },

  // Hit dice modal
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    color: colors.textPrimary,
    fontSize: 24,
    lineHeight: 28,
  },
  stepperValue: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: 'bold',
    marginHorizontal: spacing.xl,
  },
  rollResult: {
    backgroundColor: colors.surfaceDeep,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  rollDice: {
    color: colors.accentSoft,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  rollMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  rollTotal: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalSub: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  devLevelDownButton: {
  position: 'absolute',
  bottom: spacing.xl + 80,
  right: spacing.lg,
  backgroundColor: colors.surfaceDeep,
  borderRadius: radius.md,
  padding: spacing.sm,
  borderWidth: 1,
  borderColor: colors.surfaceDeep,
},
asiSection: {
  borderTopWidth: 1,
  borderTopColor: colors.surfaceDeep,
  paddingTop: spacing.md,
  marginTop: spacing.md,
},
asiTitle: {
  fontSize: 13,
  fontWeight: 'bold',
  color: colors.textMuted,
  letterSpacing: 1,
  textTransform: 'uppercase',
  marginBottom: spacing.sm,
},
asiToggle: {
  flexDirection: 'row',
  backgroundColor: colors.surfaceDeep,
  borderRadius: radius.md,
  padding: 3,
  marginBottom: spacing.md,
},
asiToggleBtn: {
  flex: 1,
  paddingVertical: spacing.sm,
  alignItems: 'center',
  borderRadius: radius.sm,
},
asiToggleBtnActive: {
  backgroundColor: colors.accent,
},
asiToggleText: {
  fontSize: 13,
  fontWeight: '600',
  color: colors.textMuted,
},
asiToggleTextActive: {
  color: colors.textPrimary,
},
asiHint: {
  ...typography.subtitle,
  fontSize: 11,
  textAlign: 'center',
  marginBottom: spacing.sm,
},
asiStatGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: spacing.sm,
  justifyContent: 'center',
},
asiStatBtn: {
  width: 52,
  height: 52,
  borderRadius: radius.md,
  backgroundColor: colors.surfaceDeep,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 2,
  borderColor: 'transparent',
},
asiStatBtnActive: {
  borderColor: colors.accent,
  backgroundColor: colors.surface,
},
asiStatLabel: {
  fontSize: 11,
  fontWeight: 'bold',
  color: colors.textMuted,
  letterSpacing: 1,
},
asiStatLabelActive: {
  color: colors.accent,
},
asiStatScore: {
  fontSize: 16,
  fontWeight: 'bold',
  color: colors.textPrimary,
},
featRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  borderRadius: radius.sm,
  marginBottom: 2,
},
featRowSelected: {
  backgroundColor: colors.surfaceDeep,
},
featName: {
  fontSize: 14,
  fontWeight: '600',
  color: colors.textPrimary,
},
featMeta: {
  ...typography.subtitle,
  fontSize: 11,
  marginTop: 1,
},

featChip: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: colors.surface,
  borderRadius: radius.md,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.md,
  marginBottom: spacing.xs,
  // ...shadows.card,
},
featChipName: {
  fontSize: 14,
  fontWeight: '600',
  color: colors.textPrimary,
},
featChipMeta: {
  ...typography.subtitle,
  fontSize: 11,
  marginTop: 2,
},
featDetailMeta: {
  ...typography.subtitle,
  fontSize: 12,
  marginTop: spacing.xs,
},
featDetailText: {
  fontSize: 13,
  color: colors.textPrimary,
  lineHeight: 18,
},
manageFeatRow: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.surface,
  borderRadius: radius.sm,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  marginBottom: spacing.xs,
  gap: spacing.xs,
},
manageFeatName: {
  color: colors.textPrimary,
  fontWeight: '600',
  fontSize: 14,
},
manageFeatMeta: {
  ...typography.subtitle,
  fontSize: 11,
  marginTop: 1,
},
manageFeatBtn: {
  backgroundColor: colors.surfaceDeep,
  borderRadius: radius.sm,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderWidth: 1,
  borderColor: colors.surfaceAlt,
},
manageFeatBtnText: {
  color: colors.textPrimary,
  fontSize: 11,
  fontWeight: '600',
},

languageSummary: {
  color: colors.textMuted,
  fontSize: 12,
  textAlign: 'center',
  marginBottom: spacing.sm,
},
languageList: {
  maxHeight: 280,
  width: '100%',
  marginBottom: spacing.sm,
},
languageGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: spacing.xs,
  justifyContent: 'center',
},
languageChip: {
  backgroundColor: colors.surfaceDeep,
  borderRadius: radius.sm,
  borderWidth: 1,
  borderColor: colors.surfaceAlt,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  minWidth: '30%',
  alignItems: 'center',
},
languageChipActive: {
  borderColor: colors.accent,
  backgroundColor: colors.surface,
},
languageChipText: {
  color: colors.textMuted,
  fontSize: 12,
  fontWeight: '600',
},
languageChipTextActive: {
  color: colors.accentSoft,
},

tileFieldLabel: {
  ...typography.label,
  alignSelf: 'flex-start',
  marginTop: spacing.xs,
  marginBottom: spacing.xs,
},
tileOptionRow: {
  flexDirection: 'row',
  gap: spacing.sm,
  width: '100%',
  marginBottom: spacing.sm,
},
tileOptionButton: {
  flex: 1,
  backgroundColor: colors.surfaceDeep,
  borderRadius: radius.sm,
  borderWidth: 1,
  borderColor: colors.surfaceAlt,
  paddingVertical: spacing.sm,
  alignItems: 'center',
},
tileOptionButtonActive: {
  borderColor: colors.accent,
  backgroundColor: colors.surface,
},
tileOptionText: {
  color: colors.textMuted,
  fontSize: 12,
  fontWeight: '600',
},
tileOptionTextActive: {
  color: colors.accentSoft,
},
tileValueInput: {
  textAlign: 'center',
  marginBottom: spacing.sm,
},


});