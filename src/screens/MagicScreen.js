import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Character } from '../models/Character';
import { patchCharacter } from '../utils/CharacterStore';
import { invocations } from '../data/invocations';
import { setNavCallback, clearNavCallback } from '../utils/NavigationCallbacks';
import { colors, spacing, radius, typography, shadows, sharedStyles } from '../styles/theme';

const LESSONS_INVOCATION_ID = 'lessons_of_the_first_ones';

const getFeatName = (feat) => (typeof feat === 'string' ? feat : feat?.name);

function mergeLessonsInvocationFeats(existingFeats, lessonFeatNames, level) {
  const baseFeats = (existingFeats ?? []).filter((feat) => !(feat?.grantedByInvocation === LESSONS_INVOCATION_ID));
  const lessonFeats = (lessonFeatNames ?? []).map((name) => ({
    name,
    source: 'Invocation: Lessons of the First Ones',
    takenAtLevel: level,
    grantedByInvocation: LESSONS_INVOCATION_ID,
  }));
  return [...baseFeats, ...lessonFeats];
}

export default function MagicScreen({ route, navigation }) {
  // 1. Initialize character and state
  const raw = route.params.character;
  const character = raw instanceof Character ? raw : new Character(raw);
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [selectedInvocation, setSelectedInvocation] = useState(null);
  const [knownInvocations, setKnownInvocations] = useState(character.knownInvocations || []);

  const formatSigned = (value) => {
    if (value == null) return '—';
    return value >= 0 ? `+${value}` : `${value}`;
  };

  const normalizeKey = (value) =>
    String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/\s+/g, '_');

  const resolveSpellcastingAbilityFromCharacter = () => {
    const explicit = normalizeKey(character.spellcastingAbility);
    if (explicit === 'int' || explicit === 'wis' || explicit === 'cha') return explicit;

    const classId = normalizeKey(character.classId);
    const subclassId = normalizeKey(character.subclassId);

    if (classId === 'artificer' || classId === 'wizard') return 'int';
    if (classId === 'cleric' || classId === 'druid' || classId === 'ranger') return 'wis';
    if (classId === 'bard' || classId === 'paladin' || classId === 'sorcerer' || classId === 'warlock') return 'cha';

    const isFourElementsMonk = classId === 'monk'
      && (subclassId === 'way_of_the_four_elements' || subclassId.includes('four_elements'));
    if (isFourElementsMonk) return 'wis';

    const isEldritchKnight = classId === 'fighter'
      && (subclassId === 'eldritch_knight' || (subclassId.includes('eldritch') && subclassId.includes('knight')));
    if (isEldritchKnight) return 'cha';

    const isArcaneTrickster = classId === 'rogue'
      && (subclassId === 'arcane_trickster' || (subclassId.includes('arcane') && subclassId.includes('trickster')));
    if (isArcaneTrickster) return 'cha';

    return null;
  };

  const spellcastingAbility = resolveSpellcastingAbilityFromCharacter();
  const spellcastingMod = spellcastingAbility ? character.getAbilityMod(spellcastingAbility) : null;
  const spellAttackBonus = spellcastingMod == null
    ? null
    : character.proficiencyBonus + spellcastingMod;
  const spellSaveDc = spellcastingMod == null
    ? null
    : 8 + character.proficiencyBonus + spellcastingMod;

  const invocationIdLookup = useMemo(() => {
    const entries = [];
    invocations.forEach((inv) => {
      entries.push([normalizeKey(inv.id), inv.id]);
      entries.push([normalizeKey(inv.name), inv.id]);
    });
    return new Map(entries);
  }, []);

  const resolveInvocationId = (value) => {
    if (typeof value !== 'string') return null;
    const direct = invocations.find((inv) => inv.id === value);
    if (direct) return direct.id;
    return invocationIdLookup.get(normalizeKey(value)) ?? null;
  };

  const normalizedKnownInvocations = useMemo(() => {
    const rawList = Array.isArray(knownInvocations) ? knownInvocations : [];
    const resolved = rawList.map(resolveInvocationId).filter(Boolean);
    const uniqueNonRepeatable = [];
    const lessons = [];

    resolved.forEach((id) => {
      if (id === LESSONS_INVOCATION_ID) {
        lessons.push(id);
        return;
      }
      if (!uniqueNonRepeatable.includes(id)) uniqueNonRepeatable.push(id);
    });

    return [...uniqueNonRepeatable, ...lessons];
  }, [knownInvocations, invocationIdLookup]);

  // 2. Fetch the real data from the engine!
  const magicResources = character.getMagicResources();
  const knownSpells = character.getPopulatedSpells();

  const slotResources = magicResources
    .filter(r => r.id.startsWith('spell_slot_'))
    .sort((a, b) => {
      const aLevel = parseInt(a.id.split('_')[2], 10) || 0;
      const bLevel = parseInt(b.id.split('_')[2], 10) || 0;
      return aLevel - bLevel;
    });

  const cantrips = knownSpells.filter(spell => spell.level === 0);

  const persist = async (updates = {}) => {
    Object.assign(character, updates);
    const mergedCharacter = await patchCharacter(character.id, updates);
    Object.assign(character, mergedCharacter.toJSON());
  };

  const getMaxUses = (resource) => {
    const currentLevel = parseInt(character.level, 10) || 1; 
    if (resource.maxUses?.type === 'table') {
      return resource.maxUses.values[currentLevel] ?? 0;
    }
    return typeof resource.maxUses === 'number' ? resource.maxUses : 0; 
  };

  // 3. Slot Interaction Logic
  const toggleSlot = async (resourceId, index, currentUsed, max) => {
    // If clicking a box that is 'used', un-use it. Otherwise, use it.
    const newUsed = index < currentUsed ? currentUsed - 1 : currentUsed + 1;
    const used = Math.max(0, Math.min(max, newUsed));
    await persist({ [`${resourceId}Used`]: used });
    setRefreshTrigger(prev => prev + 1);
  };

  const castSpell = async (resourceId, currentUsed, max) => {
    if (currentUsed >= max) return;
    await persist({ [`${resourceId}Used`]: currentUsed + 1 });
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      
      {/* HEADER ROW */}
      <View style={styles.topHeader}>
        <Text style={typography.heading}>Spellbook</Text>
        
        <View style={styles.iconRow}>
          <TouchableOpacity onPress={() => navigation.navigate('SpellPicker', { character })}>
            <Ionicons name="book-outline" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
          {character.classId === 'warlock' && (
            <TouchableOpacity onPress={() => {
              setNavCallback('invocationSave', async (list, lessonFeatNames = []) => {
                const nextFeats = mergeLessonsInvocationFeats(
                  character.feats ?? [],
                  lessonFeatNames,
                  parseInt(character.level, 10) || 1
                );

                setKnownInvocations(list);
                character.knownInvocations = list;
                character.feats = nextFeats;
                await patchCharacter(character.id, { knownInvocations: list, feats: nextFeats });
              });
              navigation.navigate('InvocationPicker', { character });
            }}>
              <Ionicons name="sparkles-outline" size={16} color={colors.textPrimary} style={{ marginLeft: spacing.md }} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.topMetaBar}>
        <Text style={styles.topMetaText}>Spell Attack: {formatSigned(spellAttackBonus)}</Text>
        <Text style={styles.topMetaText}>Spell Save DC: {spellSaveDc ?? '—'}</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
        
        {cantrips.length > 0 && (
          <View key="level-0" style={styles.levelBlock}>
            <View style={styles.levelHeaderRow}>
              <Text style={styles.levelTitle}>Cantrips</Text>
            </View>
            <View style={styles.spellList}>
              {cantrips.map((spell, i) => (
                <TouchableOpacity
                  key={spell.id}
                  style={[styles.spellRow, i === cantrips.length - 1 && { borderBottomWidth: 0 }]}
                  onLongPress={() => setSelectedSpell(spell)}
                  delayLongPress={300}
                  activeOpacity={0.7}
                >
                  <View style={styles.spellInfo}>
                    <Text style={styles.spellName}>{spell.name}</Text>
                    <Text style={styles.spellMeta}>{spell.time} • {spell.duration}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {slotResources.map(slotResource => {
          const slotLevel = parseInt(slotResource.id.split('_')[2], 10) || 0;
          const max = getMaxUses(slotResource);
          const currentUsed = character[`${slotResource.id}Used`] || 0;
          if (max === 0) return null;

          const isMysticArcanum = slotResource.name.toLowerCase().includes('mystic arcanum');
          const isPactSlots = slotResource.name.toLowerCase().includes('pact slot');
          const spellsForSlot = knownSpells.filter(spell => {
            const spellLevel = parseInt(spell.level, 10) || 0;
            if (isMysticArcanum) return spellLevel === slotLevel;
            return spellLevel > 0 && spellLevel <= slotLevel;
          });

          return (
            <View key={slotResource.id} style={styles.levelBlock}>
              <View style={styles.levelHeaderRow}>
                <Text style={styles.levelTitle}>{slotResource.name}</Text>
                <View style={styles.checkboxContainer}>
                  {Array.from({ length: max }).map((_, index) => {
                    const isUsed = index < currentUsed;
                    return (
                      <TouchableOpacity
                        key={index}
                        activeOpacity={0.6}
                        onPress={() => toggleSlot(slotResource.id, index, currentUsed, max)}
                        style={[styles.checkbox, isUsed && styles.checkboxUsed]}
                      />
                    );
                  })}
                </View>
              </View>

              {spellsForSlot.length === 0 ? (
                <Text style={styles.emptyLevelText}>No spells prepared.</Text>
              ) : (
                <View style={styles.spellList}>
                  {spellsForSlot.map((spell, i) => {
                    const spellLevel = parseInt(spell.level, 10) || 0;
                    const isUpcast = !isMysticArcanum && spellLevel < slotLevel;
                    const canCast = currentUsed < max;

                    return (
                      <TouchableOpacity
                        key={`${spell.id}-${slotResource.id}`}
                        style={[styles.spellRow, i === spellsForSlot.length - 1 && { borderBottomWidth: 0 }]}
                        onLongPress={() => setSelectedSpell(spell)}
                        delayLongPress={300}
                        activeOpacity={0.7}
                      >
                        <View style={styles.spellInfo}>
                          <Text style={styles.spellName}>
                            {spell.name}
                          </Text>
                          <Text style={styles.spellMeta}>
                            {isUpcast && (
                              <Text style={styles.upcastBadge}>
                                {isPactSlots
                                  ? `Cast at Lvl ${slotLevel} (Base Lvl ${spellLevel}) • `
                                  : `Base Lvl ${spellLevel} • `}
                              </Text>
                            )}
                            {spell.time} • {spell.duration}
                          </Text>
                        </View>

                        <View style={styles.actionRow}>
                          <TouchableOpacity 
                            style={[styles.castBtn, !canCast && styles.castBtnDisabled]} 
                            onPress={() => castSpell(slotResource.id, currentUsed, max)}
                            disabled={!canCast}
                          >
                            <Text style={[styles.castBtnText, !canCast && styles.castBtnTextDisabled]}>
                              CAST
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* Selected Invocations Display */}
        {character.classId === 'warlock' && normalizedKnownInvocations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Eldritch Invocations</Text>
            {normalizedKnownInvocations.map((invId, idx) => {
              const inv = invocations.find(i => i.id === invId);
              if (!inv) return null;
              return (
                <TouchableOpacity 
                  key={`${invId}-${idx}`} 
                  style={styles.invCard}
                  onLongPress={() => setSelectedInvocation(inv)}
                  delayLongPress={300}
                  activeOpacity={0.7}
                >
                  <Text style={styles.invName}>{inv.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

      </ScrollView>



      {/* SPELL DETAIL MODAL */}
      <Modal visible={!!selectedSpell} transparent animationType="fade">
        <View style={sharedStyles.modalOverlay}>
          <View style={sharedStyles.modalBox}>
            <Text style={sharedStyles.modalTitle}>{selectedSpell?.name}</Text>
            
            <View style={styles.modalMetaGrid}>
              <View style={styles.modalMetaCol}>
                <Text style={styles.modalMetaLabel}>CASTING TIME</Text>
                <Text style={styles.modalMetaValue}>{selectedSpell?.time}</Text>
              </View>
              <View style={styles.modalMetaCol}>
                <Text style={styles.modalMetaLabel}>DURATION</Text>
                <Text style={styles.modalMetaValue}>{selectedSpell?.duration}</Text>
              </View>
            </View>

            <ScrollView style={{ maxHeight: 200, marginVertical: spacing.md }}>
              <Text style={styles.spellDescText}>{selectedSpell?.desc}</Text>
            </ScrollView>

            <TouchableOpacity
              style={sharedStyles.primaryButton}
              onPress={() => setSelectedSpell(null)}
            >
              <Text style={sharedStyles.primaryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>

      </Modal>



      {/* INVOCATION DETAIL MODAL */}
      <Modal visible={!!selectedInvocation} transparent animationType="fade">
        <View style={sharedStyles.modalOverlay}>
          <View style={sharedStyles.modalBox}>
            <Text style={sharedStyles.modalTitle}>{selectedInvocation?.name}</Text>
            
            <View style={styles.modalMetaGrid}>
              <View style={styles.modalMetaCol}>
                <Text style={styles.modalMetaLabel}>MIN LEVEL</Text>
                <Text style={styles.modalMetaValue}>{selectedInvocation?.minLevel}</Text>
              </View>
              <View style={styles.modalMetaCol}>
                <Text style={styles.modalMetaLabel}>PREREQUISITES</Text>
                <Text style={styles.modalMetaValue}>
                  {selectedInvocation?.prerequisites?.length > 0 
                    ? selectedInvocation.prerequisites.map(p => 
                        p.type === 'spell' ? p.value.replace('_', ' ') : p.value
                      ).join(', ')
                    : 'None'
                  }
                </Text>
              </View>
            </View>

            <ScrollView style={{ maxHeight: 200, marginVertical: spacing.md }}>
              <Text style={styles.spellDescText}>{selectedInvocation?.description}</Text>
            </ScrollView>

            <TouchableOpacity
              style={sharedStyles.primaryButton}
              onPress={() => setSelectedInvocation(null)}
            >
              <Text style={sharedStyles.primaryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}



const styles = StyleSheet.create({
  container: { padding: spacing.md },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceDeep,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topMetaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  topMetaText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  
  levelBlock: { marginBottom: spacing.lg },
  levelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  levelTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  checkboxContainer: { flexDirection: 'row' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.surfaceAlt,
    backgroundColor: colors.surfaceDeep,
    marginRight: 6,
  },
  checkboxUsed: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentSoft,
  },
  
  spellList: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    ...shadows.card,
  },
  spellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceDeep,
  },
  spellInfo: { flex: 1, paddingRight: spacing.sm },
  spellName: { color: colors.textPrimary, fontSize: 15, fontWeight: 'bold' },
  spellMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  upcastBadge: { color: colors.gold, fontWeight: 'bold' },
  
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  castBtn: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  castBtnDisabled: { backgroundColor: colors.surfaceDeep },
  castBtnText: { color: colors.background, fontWeight: 'bold', fontSize: 12 },
  castBtnTextDisabled: { color: colors.textDisabled },
  
  emptyLevelText: { color: colors.textMuted, fontStyle: 'italic', fontSize: 13, paddingHorizontal: 4 },

  modalMetaGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceDeep,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  modalMetaCol: { flex: 1 },
  modalMetaLabel: { color: colors.textMuted, fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  modalMetaValue: { color: colors.textPrimary, fontSize: 13, marginTop: 2 },
  spellDescText: { color: colors.textPrimary, fontSize: 14, lineHeight: 20 },

  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.sm },
  invCard: { backgroundColor: colors.surface, padding: spacing.md, marginVertical: spacing.xs, borderRadius: radius.md, borderWidth: 1, borderColor: colors.surfaceDeep },
  invName: { color: colors.textPrimary, fontSize: 14, fontWeight: 'bold' },
});