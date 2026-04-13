import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Character } from '../models/Character';
import { saveCharacter } from '../utils/CharacterStore';
import { colors, spacing, radius, typography, shadows, sharedStyles } from '../styles/theme';

export default function MagicScreen({ route, navigation }) {
  // 1. Initialize character and state
  const raw = route.params.character;
  const character = raw instanceof Character ? raw : new Character(raw);
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedSpell, setSelectedSpell] = useState(null);

  // 2. Fetch the real data from the engine!
  const magicResources = character.getMagicResources();
  const knownSpells = character.getPopulatedSpells();

  const persist = async () => {
    await saveCharacter(character);
  };

  const getMaxUses = (resource) => {
    const currentLevel = parseInt(character.level, 10) || 1; 
    if (resource.maxUses?.type === 'table') {
      return resource.maxUses.values[currentLevel] ?? 0;
    }
    return typeof resource.maxUses === 'number' ? resource.maxUses : 0; 
  };

  // 3. Slot Interaction Logic
  const toggleSlot = (resourceId, index, currentUsed, max) => {
    // If clicking a box that is 'used', un-use it. Otherwise, use it.
    const newUsed = index < currentUsed ? currentUsed - 1 : currentUsed + 1;
    character[`${resourceId}Used`] = Math.max(0, Math.min(max, newUsed));
    persist();
    setRefreshTrigger(prev => prev + 1);
  };

  const castSpell = (resourceId, currentUsed, max) => {
    if (currentUsed >= max) return;
    character[`${resourceId}Used`] = currentUsed + 1;
    persist();
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      
      {/* HEADER ROW */}
      <View style={styles.topHeader}>
        <Text style={typography.heading}>Spellbook</Text>
        
        {/* We will wire this button to the new screen next! */}
        <TouchableOpacity 
          style={styles.manageAllBtn}
          onPress={() => navigation.navigate('SpellPicker', { character })}
        >
          <Ionicons name="book-outline" size={16} color={colors.background} style={{ marginRight: 6 }} />
          <Text style={styles.manageAllText}>Manage Spells</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
        
        {/* LOOP THROUGH LEVELS 0 - 9 */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(targetLevel => {
          
          // Find the specific slot resource for this level (e.g., 'spell_slot_1')
          const slotResource = magicResources.find(r => r.id === `spell_slot_${targetLevel}`);
          
          const max = slotResource ? getMaxUses(slotResource) : 0;
          const currentUsed = slotResource ? (character[`${slotResource.id}Used`] || 0) : 0;
          
          // Upcasting Filter: Cantrips only in Cantrips. Leveled spells appear in base + higher.
          const spellsForLevel = knownSpells.filter(s => {
            if (targetLevel === 0) return s.level === 0; 
            return s.level > 0 && s.level <= targetLevel; 
          });

          // HIDE THIS LEVEL IF: It's level 1+ and they don't have slots unlocked yet
          if (targetLevel > 0 && max === 0) return null;
          // HIDE CANTRIPS IF: They don't know any cantrips
          if (targetLevel === 0 && spellsForLevel.length === 0) return null;

          return (
            <View key={`level-${targetLevel}`} style={styles.levelBlock}>
              
              {/* LEVEL HEADER & CHECKBOXES */}
              <View style={styles.levelHeaderRow}>
                <Text style={styles.levelTitle}>
                  {targetLevel === 0 ? 'Cantrips' : `Level ${targetLevel}`}
                </Text>

                {/* Draw Checkboxes if slots exist */}
                {slotResource && max > 0 && (
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
                )}
              </View>

              {/* SPELLS LIST */}
              {spellsForLevel.length === 0 ? (
                <Text style={styles.emptyLevelText}>No spells prepared.</Text>
              ) : (
                <View style={styles.spellList}>
                  {spellsForLevel.map((spell, i) => {
                    const isUpcast = spell.level < targetLevel;
                    const canCast = slotResource && currentUsed < max;

                    return (
                      <TouchableOpacity
                        key={`${spell.id}-${targetLevel}`}
                        style={[styles.spellRow, i === spellsForLevel.length - 1 && { borderBottomWidth: 0 }]}
                        onLongPress={() => setSelectedSpell(spell)}
                        delayLongPress={300}
                        activeOpacity={0.7}
                      >
                        <View style={styles.spellInfo}>
                          <Text style={[styles.spellName, isUpcast && { color: colors.textMuted }]}>
                            {spell.name}
                          </Text>
                          <Text style={styles.spellMeta}>
                            {isUpcast && <Text style={styles.upcastBadge}>Base: Lvl {spell.level} • </Text>}
                            {spell.time} • {spell.duration}
                          </Text>
                        </View>
                        
                        <View style={styles.actionRow}>
                          {/* CAST BUTTON */}
                          {targetLevel > 0 && (
                            <TouchableOpacity 
                              style={[styles.castBtn, !canCast && styles.castBtnDisabled]} 
                              onPress={() => castSpell(slotResource.id, currentUsed, max)}
                              disabled={!canCast}
                            >
                              <Text style={[styles.castBtnText, !canCast && styles.castBtnTextDisabled]}>
                                CAST
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
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
  manageAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  manageAllText: { color: colors.background, fontWeight: 'bold', fontSize: 12 },
  
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
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  checkboxContainer: { flexDirection: 'row', gap: 6 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.surfaceAlt,
    backgroundColor: colors.surfaceDeep,
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
  
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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
});