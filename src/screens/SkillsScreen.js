import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Modal, TextInput
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { patchCharacter } from '../utils/CharacterStore';
import { getEquippedBonuses } from '../utils/BonusEngine';
import { colors, spacing, radius, typography, shadows, sharedStyles } from '../styles/theme';

const ABILITIES = [
  { key: 'str', label: 'Strength' },
  { key: 'dex', label: 'Dexterity' },
  { key: 'con', label: 'Constitution' },
  { key: 'int', label: 'Intelligence' },
  { key: 'wis', label: 'Wisdom' },
  { key: 'cha', label: 'Charisma' },
];

const SKILLS = [
  { key: 'acrobatics',     label: 'Acrobatics',       ability: 'dex' },
  { key: 'animalhandling', label: 'Animal Handling',  ability: 'wis' },
  { key: 'arcana',         label: 'Arcana',           ability: 'int' },
  { key: 'athletics',      label: 'Athletics',        ability: 'str' },
  { key: 'deception',      label: 'Deception',        ability: 'cha' },
  { key: 'history',        label: 'History',          ability: 'int' },
  { key: 'insight',        label: 'Insight',          ability: 'wis' },
  { key: 'intimidation',   label: 'Intimidation',     ability: 'cha' },
  { key: 'investigation',  label: 'Investigation',    ability: 'int' },
  { key: 'medicine',       label: 'Medicine',         ability: 'wis' },
  { key: 'nature',         label: 'Nature',           ability: 'int' },
  { key: 'perception',     label: 'Perception',       ability: 'wis' },
  { key: 'performance',    label: 'Performance',      ability: 'cha' },
  { key: 'persuasion',     label: 'Persuasion',       ability: 'cha' },
  { key: 'religion',       label: 'Religion',         ability: 'int' },
  { key: 'sleightofhand',  label: 'Sleight of Hand',  ability: 'dex' },
  { key: 'stealth',        label: 'Stealth',          ability: 'dex' },
  { key: 'survival',       label: 'Survival',         ability: 'wis' },
];

function formatBonus(n) {
  return n >= 0 ? `+${n}` : `${n}`;
}

// Returns 'none' | 'proficient' | 'expertise'
function getSkillProfState(character, skillKey) {
  if (character.proficiencies?.expertise?.includes(skillKey)) return 'expertise';
  if (character.proficiencies?.skills?.includes(skillKey))    return 'proficient';
  return 'none';
}

// Cycle: none → proficient → expertise → none
function nextProfState(current) {
  if (current === 'none')       return 'proficient';
  if (current === 'proficient') return 'expertise';
  return 'none';
}

// Dot character per state
function profDot(state) {
  if (state === 'expertise')  return '◆';
  if (state === 'proficient') return '●';
  return '○';
}

export default function SkillsScreen({ route }) {
  const { character } = route.params;

  // Local state so UI re-renders on changes
  const [abilities, setAbilities]     = useState({ ...character.abilities });
  const [skillProfs, setSkillProfs]   = useState({
    skills:    [...(character.proficiencies?.skills    ?? [])],
    expertise: [...(character.proficiencies?.expertise ?? [])],
  });
  const [saveProfs, setSaveProfs] = useState([...(character.proficiencies?.saves ?? [])]);
  const [modalVisible, setModalVisible] = useState(false);
  const editingSkillRef                 = useRef(null);
  const [abilityInput, setAbilityInput] = useState('');

  useFocusEffect(
    useCallback(() => {
      setAbilities({ ...character.abilities });
      setSkillProfs({
        skills: [...(character.proficiencies?.skills ?? [])],
        expertise: [...(character.proficiencies?.expertise ?? [])],
      });
      setSaveProfs([...(character.proficiencies?.saves ?? [])]);
    }, [character])
  );

  const equippedBonuses = getEquippedBonuses(character.inventory ?? [], character.customItems ?? []);

  // Derive skill bonus using local state
  const getSkillBonus = (skillKey, abilityKey) => {
    const base  = abilities[abilityKey] ?? 10;
    const mod   = Math.floor((base - 10) / 2);
    const state = skillProfs.expertise.includes(skillKey)
      ? 'expertise'
      : skillProfs.skills.includes(skillKey)
        ? 'proficient'
        : 'none';
    const profBonus = state === 'expertise'
      ? character.proficiencyBonus * 2
      : state === 'proficient'
        ? character.proficiencyBonus
        : 0;
    const itemBonus = equippedBonuses.bonusSkills?.[skillKey] ?? 0;
    return mod + profBonus + itemBonus;
  };

  const getAbilityScore = (abilityKey) => abilities[abilityKey] ?? 10;
  const getAbilityMod   = (abilityKey) => Math.floor((getAbilityScore(abilityKey) - 10) / 2);

  const getSaveBonus = (abilityKey) => {
    const mod        = getAbilityMod(abilityKey);
    const proficient = saveProfs.includes(abilityKey);
    const itemBonus  = equippedBonuses.bonusSaves?.[abilityKey] ?? 0;
    return mod + (proficient ? character.proficiencyBonus : 0) + itemBonus;
  };

  // Persist changes to character and storage
  const persist = async (newAbilities, newSkillProfs) => {
    const nextProficiencies = {
      ...(character.proficiencies ?? {}),
      skills: newSkillProfs.skills,
      expertise: newSkillProfs.expertise,
    };
    character.abilities                    = newAbilities;
    character.proficiencies                = nextProficiencies;
    await patchCharacter(character.id, {
      abilities: newAbilities,
      proficiencies: nextProficiencies,
    });
  };

  // Long-press a skill — open edit modal
  const handleLongPress = (skill) => {
    editingSkillRef.current = skill;
    setAbilityInput(String(abilities[skill.ability] ?? 10));
    setModalVisible(true);
  };

  // Apply ability score change from modal
  const applyAbilityScore = () => {
    const val = parseInt(abilityInput, 10);
    if (isNaN(val) || val < 1 || val > 30) return;
    const newAbilities = { ...abilities, [editingSkillRef.current.ability]: val };
    setAbilities(newAbilities);
    persist(newAbilities, skillProfs);
    setModalVisible(false);
  };

  // Toggle proficiency state for the skill being edited
  // Set proficiency state directly (used by three-button modal UI)
  const setProficiency = (skill, state) => {
    if (!skill) return;
    const newSkillProfs = {
      skills:    skillProfs.skills.filter(s => s !== skill.key),
      expertise: skillProfs.expertise.filter(s => s !== skill.key),
    };
    if (state === 'proficient') newSkillProfs.skills.push(skill.key);
    if (state === 'expertise')  newSkillProfs.expertise.push(skill.key);
    setSkillProfs(newSkillProfs);
    persist(abilities, newSkillProfs);
  };

  // Cycle proficiency state (none → proficient → expertise → none)
  const toggleProficiency = () => {
    const skill = editingSkillRef.current;
    if (!skill) return;
    const current = skillProfs.expertise.includes(skill.key)
      ? 'expertise'
      : skillProfs.skills.includes(skill.key)
        ? 'proficient'
        : 'none';
    const next = nextProfState(current);
    const newSkillProfs = {
      skills:    skillProfs.skills.filter(s => s !== skill.key),
      expertise: skillProfs.expertise.filter(s => s !== skill.key),
    };
    if (next === 'proficient') newSkillProfs.skills.push(skill.key);
    if (next === 'expertise')  newSkillProfs.expertise.push(skill.key);
    setSkillProfs(newSkillProfs);
    persist(abilities, newSkillProfs);
  };

  const toggleSaveProficiency = async (abilityKey) => {
    const nextSaves = saveProfs.includes(abilityKey)
      ? saveProfs.filter((key) => key !== abilityKey)
      : [...saveProfs, abilityKey];

    setSaveProfs(nextSaves);
    const nextProficiencies = {
      ...(character.proficiencies ?? {}),
      saves: nextSaves,
    };
    character.proficiencies = nextProficiencies;
    await patchCharacter(character.id, { proficiencies: nextProficiencies });
  };


  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: spacing.xl }}
    >

      {/* ABILITY SCORES */}
      {/* ABILITY SCORES */}
<Text style={sharedStyles.sectionHeader}>
  Ability Scores <Text style={styles.hintText}>(hold to edit)</Text>
</Text>
<View style={styles.abilityGrid}>
  {ABILITIES.map(({ key, label }) => {
    const score   = getAbilityScore(key);
    const mod     = getAbilityMod(key);
    const acColor = colors.ability[key];
    return (
      <TouchableOpacity
        key={key}
        style={[styles.abilityCard, { borderTopColor: acColor }]}
        onLongPress={() => {
          editingSkillRef.current = { label, ability: key, key: null };
          setAbilityInput(String(score));
          setModalVisible(true);
        }}
        delayLongPress={400}
        activeOpacity={0.8}
      >
        <Text style={[styles.abilityLabel, { color: acColor }]}>
          {label.slice(0, 3).toUpperCase()}
        </Text>
        <Text style={styles.abilityScore}>{score}</Text>
        <View style={[styles.abilityModBadge, { backgroundColor: acColor }]}>
          <Text style={styles.abilityMod}>{formatBonus(mod)}</Text>
        </View>
      </TouchableOpacity>
    );
  })}
</View>


      {/* SAVING THROWS */}
      <Text style={sharedStyles.sectionHeader}>
        Saving Throws <Text style={styles.hintText}>(tap to toggle proficiency)</Text>
      </Text>
      <View style={styles.saveRow}>
        {ABILITIES.map(({ key }) => {
          const bonus      = getSaveBonus(key);
          const proficient = saveProfs.includes(key);
          const acColor    = colors.ability[key];
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.saveCell,
                proficient && { borderColor: acColor, backgroundColor: `${acColor}22` },
              ]}
              onPress={() => toggleSaveProficiency(key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.saveDot, { color: proficient ? acColor : colors.textDisabled }]}>
                {proficient ? '●' : '○'}
              </Text>
              <Text style={styles.saveLabel}>{key.toUpperCase()}</Text>
              <Text style={[styles.saveBonus, { color: proficient ? acColor : colors.textPrimary }]}>
                {formatBonus(bonus)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* SKILLS */}
      <Text style={sharedStyles.sectionHeader}>
        Skills <Text style={styles.hintText}>(hold to edit)</Text>
      </Text>
      {SKILLS.map((skill) => {
        const { key, label, ability } = skill;
        const bonus    = getSkillBonus(key, ability);
        const profState = skillProfs.expertise.includes(key)
          ? 'expertise'
          : skillProfs.skills.includes(key)
            ? 'proficient'
            : 'none';
        const acColor  = colors.ability[ability];
        const dotColor = profState === 'none' ? colors.textDisabled : acColor;

        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.skillRow,
              profState === 'proficient' && styles.skillRowProficient,
              profState === 'expertise'  && styles.skillRowExpertise,
            ]}
            onLongPress={() => handleLongPress(skill)}
            delayLongPress={400}
            activeOpacity={0.7}
          >
            <Text style={[styles.skillDot, { color: dotColor }]}>
              {profDot(profState)}
            </Text>
            <Text style={styles.skillLabel}>{label}</Text>
            <View style={[styles.abilityTag, { backgroundColor: acColor + '33' }]}>
              <Text style={[styles.abilityTagText, { color: acColor }]}>
                {ability.toUpperCase()}
              </Text>
            </View>
            {profState === 'expertise' && (
              <Text style={styles.expertiseBadge}>2×</Text>
            )}
            <Text style={[
              styles.skillBonus,
              { color: profState === 'none' ? colors.textPrimary : acColor }
            ]}>
              {formatBonus(bonus)}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* EDIT SKILL MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={sharedStyles.modalOverlay}>
          <View style={sharedStyles.modalBox}>

            <Text style={sharedStyles.modalTitle}>
              {editingSkillRef.current?.label}
            </Text>
            <Text style={styles.modalSubtitle}>
              {ABILITIES.find(a => a.key === editingSkillRef.current?.ability)?.label} score
            </Text>

            {/* Ability score input */}
            <TextInput
              style={[sharedStyles.input, styles.largeInput]}
              keyboardType="numeric"
              value={abilityInput}
              onChangeText={setAbilityInput}
              placeholder="10"
              placeholderTextColor={colors.textDisabled}
              autoFocus
            />

            <TouchableOpacity
              style={sharedStyles.primaryButton}
              onPress={applyAbilityScore}
            >
              <Text style={sharedStyles.primaryButtonText}>
                Update {ABILITIES.find(a => a.key === editingSkillRef.current?.ability)?.label.slice(0, 3).toUpperCase()}
              </Text>
            </TouchableOpacity>

            {/* Proficiency selector */}
{/* Only show proficiency toggle when editing via a skill row */}
{editingSkillRef.current?.key !== null && (
  <View style={styles.profToggleRow}>
    {['none', 'proficient', 'expertise'].map((state) => {
      const current = skillProfs.expertise.includes(editingSkillRef.current?.key)
        ? 'expertise'
        : skillProfs.skills.includes(editingSkillRef.current?.key)
          ? 'proficient'
          : 'none';
      const isActive = current === state;
      return (
        <TouchableOpacity
          key={state}
          style={[styles.profToggleBtn, isActive && styles.profToggleBtnActive]}
          onPress={() => setProficiency(editingSkillRef.current, state)}
        >
          <Text style={[styles.profToggleDot, isActive && { color: colors.accent }]}>
            {profDot(state)}
          </Text>
          <Text style={[styles.profToggleText, isActive && styles.profToggleTextActive]}>
            {state.charAt(0).toUpperCase() + state.slice(1)}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
)}


            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={sharedStyles.cancelText}>Done</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },

  // Ability grid
  abilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  abilityCard: {
    width: '31%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderTopWidth: 3,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  abilityLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  abilityScore: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  abilityModBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: spacing.xs,
  },
  abilityMod: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.background,
  },

  // Saves
  saveRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  saveCell: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceDeep,
    ...shadows.card,
  },
  saveDot: {
    fontSize: 10,
    marginBottom: 2,
  },
  saveLabel: {
    ...typography.label,
    marginBottom: 2,
  },
  saveBonus: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  itemBonusNote: {
    color: colors.accent2,
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },

  // Skills
  hintText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: 'normal',
    fontStyle: 'italic',
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: 4,
    borderLeftWidth: 2,
    borderLeftColor: 'transparent',
  },
  skillRowProficient: {
    borderLeftColor: colors.accent,
  },
  skillRowExpertise: {
    borderLeftColor: colors.gold,
  },
  skillDot: {
    fontSize: 12,
    marginRight: spacing.sm,
    width: 14,
  },
  skillLabel: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 13,
  },
  abilityTag: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginRight: spacing.sm,
  },
  abilityTagText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  expertiseBadge: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: spacing.xs,
  },
  skillItemBonus: {
    color: colors.accent2,
    fontSize: 10,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  skillBonus: {
    fontSize: 15,
    fontWeight: 'bold',
    minWidth: 36,
    textAlign: 'right',
  },

  // Edit modal
  largeInput: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  modalSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  profToggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  profToggleBtn: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  profToggleBtnActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
  },
  profToggleDot: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  profToggleText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  profToggleTextActive: {
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  profHint: {
    color: colors.textDisabled,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
