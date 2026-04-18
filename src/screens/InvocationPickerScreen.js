import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Character } from '../models/Character';
import { invocations } from '../data/invocations';
import { colors, spacing, typography, radius } from '../styles/theme';

export default function InvocationPickerScreen({ route, navigation }) {
  const raw = route.params.character;
  const character = raw instanceof Character ? raw : new Character(raw);
  const { onSave } = route.params;
  const [selected, setSelected] = React.useState(character.knownInvocations || []);
  const [hasSaved, setHasSaved] = React.useState(false);

  const maxInvocations = character.getMaxInvocations();
  const currentLevel = parseInt(character.level, 10) || 1;

  const normalizeKey = (value) =>
    String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/\s+/g, '_');

  // Handle back button save
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      if (!hasSaved) {
        onSave(selected);
      }
    });
    return unsubscribe;
  }, [navigation, onSave, selected, hasSaved]);

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

    if (inv.prerequisites) {
      for (const req of inv.prerequisites) {
        if (req.type === 'spell' && !knownSpellKeys.has(normalizeKey(req.value))) {
          return { met: false, reason: `Requires spell: ${String(req.value).replace(/_/g, ' ')}` };
        }
        if (req.type === 'pactBoon' && !selected.includes(`pact_of_the_${req.value}`)) {
          return { met: false, reason: `Requires Pact of the ${req.value}` };
        }
      }
    }
    return { met: true };
  };

  const toggleInvocation = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(i => i !== id));
    } else if (selected.length < maxInvocations) {
      setSelected([...selected, id]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.countText}>Selected: {selected.length} / {maxInvocations}</Text>
        <TouchableOpacity onPress={() => { setHasSaved(true); onSave(selected); navigation.goBack(); }}>
          <Text style={styles.countText}>Done</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={invocations}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const { met, reason } = checkPrerequisites(item);
          const isSelected = selected.includes(item.id);

          return (
            <TouchableOpacity 
              style={[styles.row, isSelected && styles.selectedRow, !met && styles.disabledRow]}
              onPress={() => met && toggleInvocation(item.id)}
              disabled={!met && !isSelected}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                {!met && <Text style={styles.requirement}>{reason}</Text>}
                <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark" size={18} color={colors.accent} />
              )}
            </TouchableOpacity>
          );
        }}
      />
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
});