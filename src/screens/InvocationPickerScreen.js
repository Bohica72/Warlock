import React, { useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Character } from '../models/Character';
import { invocations } from '../data/invocations';
import { getFeats } from '../utils/DataLoader';
import { callNavCallback, clearNavCallback } from '../utils/NavigationCallbacks';
import { colors, spacing, typography, radius } from '../styles/theme';

const LESSONS_INVOCATION_ID = 'lessons_of_the_first_ones';
const LESSONS_ALLOWED_FEATS = [
  'Alert',
  'Crafter',
  'Healer',
  'Lucky',
  'Magic Initiate',
  'Musician',
  'Savage Attacker',
  'Skilled',
  'Tavern Brawler',
  'Tough',
];

const getFeatName = (feat) => (typeof feat === 'string' ? feat : feat?.name);

export default function InvocationPickerScreen({ route, navigation }) {
  const raw = route.params.character;
  const character = raw instanceof Character ? raw : new Character(raw);
  const [hasSaved, setHasSaved] = React.useState(false);
  const [lessonsModalVisible, setLessonsModalVisible] = React.useState(false);

  const maxInvocations = character.getMaxInvocations();
  const currentLevel = parseInt(character.level, 10) || 1;

  const normalizeKey = (value) =>
    String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/\s+/g, '_');

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

  const lessonFeatOptions = useMemo(() => {
    const allowed = new Set(LESSONS_ALLOWED_FEATS);
    return (getFeats() ?? []).filter((feat) => allowed.has(feat?.name));
  }, []);

  const [lessonsSelectedFeats, setLessonsSelectedFeats] = React.useState(() => {
    return (character.feats ?? [])
      .filter((feat) => feat?.grantedByInvocation === LESSONS_INVOCATION_ID)
      .map((feat) => getFeatName(feat))
      .filter(Boolean);
  });

  const [selected, setSelected] = React.useState(() => {
    const rawSelected = Array.isArray(character.knownInvocations) ? character.knownInvocations : [];
    const normalized = rawSelected.map(resolveInvocationId).filter(Boolean);
    const nonLessons = normalized.filter((id) => id !== LESSONS_INVOCATION_ID);
    return [...nonLessons, ...Array(lessonsSelectedFeats.length).fill(LESSONS_INVOCATION_ID)];
  });

  const selectedLessonFeatNames = useMemo(() => {
    const base = new Set((lessonsSelectedFeats ?? []).filter(Boolean));
    (character.feats ?? []).forEach((feat) => {
      const name = getFeatName(feat);
      if (name) base.add(name);
    });
    return base;
  }, [character.feats, lessonsSelectedFeats]);

  const saveAndClose = () => {
    setHasSaved(true);
    callNavCallback('invocationSave', selected, lessonsSelectedFeats);
    clearNavCallback('invocationSave');
    route.params?.onSave?.(selected, lessonsSelectedFeats);
    navigation.goBack();
  };

  // Handle back button save
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      if (!hasSaved) {
        callNavCallback('invocationSave', selected, lessonsSelectedFeats);
        clearNavCallback('invocationSave');
        route.params?.onSave?.(selected, lessonsSelectedFeats);
      }
    });
    return unsubscribe;
  }, [navigation, selected, lessonsSelectedFeats, hasSaved, route.params]);

  const checkPrerequisites = (inv) => {
    // 1. Level Check
    const minLevel = parseInt(inv.minLevel, 10) || 0;
    if (currentLevel < minLevel) return { met: false, reason: `Requires Level ${minLevel}` };

    // 2. Prerequisite Check
    const knownSpellNames = [
      ...(character.preparedSpells || []),
      ...(character.knownSpells || []),
      ...(character.knownCantrips || []),
      ...(character.getPopulatedSpells?.() || []).map((spell) => spell?.name),
    ].filter(Boolean);

    const knownSpellKeys = new Set(knownSpellNames.map(normalizeKey));
    const hasAnyKnownCantrip = (character.knownCantrips?.length ?? 0) > 0;

    if (inv.prerequisites) {
      for (const req of inv.prerequisites) {
        if (req.type === 'spell') {
          if (req.value === 'warlock_damage_cantrip' && !hasAnyKnownCantrip) {
            return { met: false, reason: 'Requires a damaging Warlock cantrip' };
          }
          if (req.value !== 'warlock_damage_cantrip' && !knownSpellKeys.has(normalizeKey(req.value))) {
            return { met: false, reason: `Requires spell: ${String(req.value).replace(/_/g, ' ')}` };
          }
        }
        if (req.type === 'pactBoon' && !selected.includes(`pact_of_the_${req.value}`)) {
          return { met: false, reason: `Requires Pact of the ${req.value}` };
        }
        if (req.type === 'invocation' && !selected.includes(req.value)) {
          const readable = String(req.value).replace(/_/g, ' ');
          return { met: false, reason: `Requires: ${readable}` };
        }
      }
    }
    return { met: true };
  };

  const toggleInvocation = (id) => {
    if (id === LESSONS_INVOCATION_ID) {
      if (selected.length >= maxInvocations) return;
      setLessonsModalVisible(true);
      return;
    }

    if (selected.includes(id)) {
      setSelected(selected.filter(i => i !== id));
    } else if (selected.length < maxInvocations) {
      setSelected([...selected, id]);
    }
  };

  const removeLessonFeatAt = (index) => {
    if (index < 0 || index >= lessonsSelectedFeats.length) return;
    setLessonsSelectedFeats((prev) => prev.filter((_, i) => i !== index));
    setSelected((prev) => {
      const next = [...prev];
      const removeIndex = next.indexOf(LESSONS_INVOCATION_ID);
      if (removeIndex >= 0) next.splice(removeIndex, 1);
      return next;
    });
  };

  const addLessonFeat = (featName) => {
    if (!featName || selected.length >= maxInvocations) return;
    if (selectedLessonFeatNames.has(featName)) {
      setLessonsModalVisible(false);
      return;
    }

    setLessonsSelectedFeats((prev) => [...prev, featName]);
    setSelected((prev) => [...prev, LESSONS_INVOCATION_ID]);
    setLessonsModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.countText}>Selected: {selected.length} / {maxInvocations}</Text>
        <TouchableOpacity onPress={saveAndClose}>
          <Text style={styles.countText}>Done</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={invocations}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const { met, reason } = checkPrerequisites(item);
          const isRepeatableLessons = item.id === LESSONS_INVOCATION_ID;
          const selectedCount = isRepeatableLessons
            ? selected.filter((id) => id === LESSONS_INVOCATION_ID).length
            : selected.includes(item.id) ? 1 : 0;
          const isSelected = selectedCount > 0;

          return (
            <TouchableOpacity 
              style={[styles.row, isSelected && styles.selectedRow, !met && styles.disabledRow]}
              onPress={() => met && toggleInvocation(item.id)}
              disabled={!met && !isSelected}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                {isRepeatableLessons && selectedCount > 0 && (
                  <Text style={styles.requirement}>Selected {selectedCount} time{selectedCount > 1 ? 's' : ''}</Text>
                )}
                {!met && <Text style={styles.requirement}>{reason}</Text>}
                <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
                {isRepeatableLessons && lessonsSelectedFeats.length > 0 && (
                  <View style={styles.lessonFeatList}>
                    {lessonsSelectedFeats.map((featName, idx) => (
                      <View key={`${featName}-${idx}`} style={styles.lessonFeatChip}>
                        <Text style={styles.lessonFeatText}>{featName}</Text>
                        <TouchableOpacity onPress={() => removeLessonFeatAt(idx)}>
                          <Ionicons name="close" size={12} color={colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              {isSelected && (
                <Ionicons name="checkmark" size={18} color={colors.accent} />
              )}
            </TouchableOpacity>
          );
        }}
      />

      <Modal visible={lessonsModalVisible} transparent animationType="fade" onRequestClose={() => setLessonsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Lessons of the First Ones</Text>
            <Text style={styles.modalSubtitle}>Choose one feat:</Text>
            <ScrollView style={styles.modalList}>
              {lessonFeatOptions.map((feat) => {
                const featName = feat?.name;
                if (!featName) return null;
                const alreadyTaken = selectedLessonFeatNames.has(featName);
                return (
                  <TouchableOpacity
                    key={featName}
                    style={[styles.modalFeatRow, alreadyTaken && styles.modalFeatRowDisabled]}
                    onPress={() => addLessonFeat(featName)}
                    disabled={alreadyTaken}
                  >
                    <Text style={styles.modalFeatName}>{featName}</Text>
                    {alreadyTaken && <Text style={styles.modalFeatMeta}>Taken</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setLessonsModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceDeep,
  },
  countText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  saveBtn: {
    ...typography.body,
    color: colors.background,
    fontWeight: 'bold',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  row: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceDeep,
  },
  selectedRow: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceDeep,
  },
  disabledRow: {
    opacity: 0.5,
  },
  name: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  requirement: {
    ...typography.subtitle,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  desc: {
    ...typography.body,
    color: colors.textMuted,
  },
  lessonFeatList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  lessonFeatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceDeep,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  lessonFeatText: {
    fontSize: 11,
    color: colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  modalSubtitle: {
    ...typography.subtitle,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  modalList: {
    maxHeight: 320,
  },
  modalFeatRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceDeep,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalFeatRowDisabled: {
    opacity: 0.4,
  },
  modalFeatName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  modalFeatMeta: {
    ...typography.subtitle,
    color: colors.textMuted,
  },
  modalCancelBtn: {
    marginTop: spacing.md,
    alignSelf: 'flex-end',
  },
  modalCancelText: {
    ...typography.body,
    color: colors.textMuted,
  },
});