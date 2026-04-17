import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Character } from '../models/Character';
import { saveCharacter } from '../utils/CharacterStore';
import { getAllSpells } from '../utils/DataLoader';
import { getClassData } from '../data/classes';
import { colors, spacing, radius, typography, sharedStyles } from '../styles/theme';

export default function SpellPickerScreen({ route, navigation }) {
  const raw = route.params.character;
  const character = raw instanceof Character ? raw : new Character(raw);

  const [localPrepared, setLocalPrepared] = useState(character.preparedSpells || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');
  
  // NEW: State for the detail modal
  const [selectedSpell, setSelectedSpell] = useState(null);

  const allSpells = useMemo(() => getAllSpells(), []);
  const classData = getClassData(character.classId);
  const levelData = classData?.levels?.[character.level] ?? {};
  const spellsKnownLimit = levelData?.spellsKnown ?? classData?.progressionExtras?.spellsKnown?.[character.level] ?? Infinity;
  const cantripsKnownLimit = levelData?.cantripsKnown ?? classData?.progressionExtras?.cantripsKnown?.[character.level] ?? Infinity;

  const selectedCounts = useMemo(() => {
    let spells = 0;
    let cantrips = 0;
    for (const name of localPrepared) {
      const spell = allSpells.find(s => s.name === name);
      if (!spell) continue;
      if (spell.level === 0) {
        cantrips += 1;
      } else {
        spells += 1;
      }
    }
    return { spells, cantrips };
  }, [localPrepared, allSpells]);

  const filteredSpells = useMemo(() => {
    return allSpells.filter(spell => {
      const matchesSearch = spell.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevel = levelFilter === 'All' ? true : spell.level === levelFilter;
      return matchesSearch && matchesLevel;
    });
  }, [allSpells, searchQuery, levelFilter]);

  const toggleSpell = (spellName) => {
    setLocalPrepared(prev => {
      const isSelected = prev.includes(spellName);
      const spell = allSpells.find(s => s.name === spellName);
      const isCantrip = spell?.level === 0;

      if (isSelected) {
        return prev.filter(name => name !== spellName);
      }

      if (isCantrip && selectedCounts.cantrips >= cantripsKnownLimit) {
        return prev;
      }
      if (!isCantrip && selectedCounts.spells >= spellsKnownLimit) {
        return prev;
      }

      return [...prev, spellName];
    });
  };

  const handleSave = async () => {
    character.preparedSpells = localPrepared;
    await saveCharacter(character);
    
    // NEW: Pass 'merge: true' and the activeTab param so it doesn't reset to Overview
    navigation.navigate({
      name: 'Character',
      params: { character: character.toJSON(), activeTab: 'Magic' },
      merge: true,
    });
  };

  const renderSpell = ({ item }) => {
    const isSelected = localPrepared.includes(item.name);
    const isCantrip = item.level === 0;
    const isDisabled = !isSelected && (
      (isCantrip && selectedCounts.cantrips >= cantripsKnownLimit) ||
      (!isCantrip && selectedCounts.spells >= spellsKnownLimit)
    );

    return (
      <TouchableOpacity 
        style={[styles.spellRow, isSelected && styles.spellRowSelected, isDisabled && styles.spellRowDisabled]}
        onPress={() => !isDisabled && toggleSpell(item.name)}
        onLongPress={() => setSelectedSpell(item)} // NEW: Open modal on long press
        delayLongPress={300}
        activeOpacity={0.7}
        disabled={isDisabled}
      >
        <View style={styles.spellInfo}>
          <Text style={[styles.spellName, isSelected && { color: colors.accent }]}>
            {item.name}
          </Text>
          <Text style={styles.spellMeta}>
            {item.level === 0 ? 'Cantrip' : `Level ${item.level}`} • {item.school} • {item.time}
          </Text>
        </View>
        <Ionicons 
          name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
          size={24} 
          color={isSelected ? colors.accent : colors.surfaceAlt} 
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      
      {/* SEARCH & FILTER HEADER */}
      <View style={styles.headerArea}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search spells..."
            placeholderTextColor={colors.textDisabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['All', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
          keyExtractor={(item) => String(item)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, levelFilter === item && styles.filterChipActive]}
              onPress={() => setLevelFilter(item)}
            >
              <Text style={[styles.filterChipText, levelFilter === item && styles.filterChipTextActive]}>
                {item === 'All' ? 'All' : item === 0 ? 'Cantrips' : `Level ${item}`}
              </Text>
            </TouchableOpacity>
          )}
          style={styles.filterList}
        />
        <View style={styles.limitRow}>
          <Text style={styles.limitText}>
            {`Spells: ${selectedCounts.spells}/${spellsKnownLimit === Infinity ? '∞' : spellsKnownLimit}`}
          </Text>
          <Text style={styles.limitText}>
            {`Cantrips: ${selectedCounts.cantrips}/${cantripsKnownLimit === Infinity ? '∞' : cantripsKnownLimit}`}
          </Text>
        </View>
      </View>

      {/* SPELL LIST */}
      <FlatList
        data={filteredSpells}
        keyExtractor={item => item.id}
        renderItem={renderSpell}
        initialNumToRender={20}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* FLOATING SAVE BUTTON */}
      <View style={styles.footer}>
        <Text style={styles.countText}>{localPrepared.length} Selected</Text>
        <TouchableOpacity style={sharedStyles.primaryButton} onPress={handleSave}>
          <Text style={sharedStyles.primaryButtonText}>Save & Return</Text>
        </TouchableOpacity>
      </View>

      {/* NEW: SPELL DETAIL MODAL */}
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
  container: { flex: 1, backgroundColor: colors.background },
  headerArea: { 
    backgroundColor: colors.surface, 
    padding: spacing.md, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.surfaceDeep 
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceDeep,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 40,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 15 },
  filterList: { flexGrow: 0 },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceDeep,
    marginRight: spacing.sm,
  },
  filterChipActive: { backgroundColor: colors.accent },
  filterChipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: colors.background },
  
  spellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceDeep,
  },
  spellRowSelected: { backgroundColor: 'rgba(255, 255, 255, 0.02)' },
  spellInfo: { flex: 1 },
  spellName: { color: colors.textPrimary, fontSize: 16, fontWeight: 'bold' },
  spellMeta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceDeep,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countText: { color: colors.textMuted, fontSize: 14, fontWeight: 'bold' },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  limitText: { color: colors.textMuted, fontSize: 12 },
  spellRowDisabled: {
    opacity: 0.4,
  },

  // Modal Styles
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