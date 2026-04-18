import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView
} from 'react-native';

function renderTargetSummary(keys, amount, labelMap = {}) {
  if (!Array.isArray(keys) || keys.length === 0) return null;
  const bonus = Number.isFinite(Number(amount)) ? Number(amount) : 1;
  const names = keys.map((key) => labelMap[key] ?? key).join(', ');
  return `+${bonus} ${names}`;
}

const SAVE_LABELS = {
  str: 'STR save',
  dex: 'DEX save',
  con: 'CON save',
  int: 'INT save',
  wis: 'WIS save',
  cha: 'CHA save',
};

const SKILL_LABELS = {
  athletics: 'Athletics',
  acrobatics: 'Acrobatics',
  sleightofhand: 'Sleight of Hand',
  stealth: 'Stealth',
  arcana: 'Arcana',
  history: 'History',
  investigation: 'Investigation',
  nature: 'Nature',
  religion: 'Religion',
  animalhandling: 'Animal Handling',
  insight: 'Insight',
  medicine: 'Medicine',
  perception: 'Perception',
  survival: 'Survival',
  deception: 'Deception',
  intimidation: 'Intimidation',
  performance: 'Performance',
  persuasion: 'Persuasion',
};

export default function ItemCard({ item, onClose, onAdd }) {
  if (!item) return null;

  const saveSummary = renderTargetSummary(item.BonusSaves, item.BonusSaveValue, SAVE_LABELS);
  const skillSummary = renderTargetSummary(item.BonusSkills, item.BonusSkillValue, SKILL_LABELS);

  return (
    <Modal visible={!!item} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView>
            <Text style={styles.name}>{item.Name}</Text>

            <View style={styles.tagRow}>
              <Tag label={item.ObjectType} />
              <Tag label={item.Rarity} />
              {item.Attunement === 'Yes' && <Tag label="Attunement" highlight />}
              {item.Wondrous === 'Yes' && <Tag label="Wondrous" />}
            </View>

            {/* Stat bonuses */}
            <View style={styles.statRow}>
              {item.BonusAC > 0 && <StatPill label="AC" value={`+${item.BonusAC}`} />}
              {item.BonusWeapon > 0 && <StatPill label="Attack" value={`+${item.BonusWeapon}`} />}
              {item.BonusDamage > 0 && <StatPill label="Damage" value={`+${item.BonusDamage}`} />}
              {item.Charges > 0 && <StatPill label="Charges" value={item.Charges} />}
              {item.Weight > 0 && <StatPill label="Weight" value={`${item.Weight} lb`} />}
            </View>

            {saveSummary && <Text style={styles.detailText}>{saveSummary}</Text>}
            {skillSummary && <Text style={styles.detailText}>{skillSummary}</Text>}

            <Text style={styles.description}>{item.Description}</Text>
          </ScrollView>

          <TouchableOpacity style={styles.addButton} onPress={() => onAdd(item)}>
            <Text style={styles.addButtonText}>Add to Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function Tag({ label, highlight }) {
  return (
    <View style={[styles.tag, highlight && styles.tagHighlight]}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

function StatPill({ label, value }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#2e383c', opacity: 0.8, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '80%' },
  name: { color: '#d3c6aa', fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  tag: { backgroundColor: '#0f3460', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6, marginBottom: 6 },
  tagHighlight: { backgroundColor: '#45443c' },
  tagText: { color: '#d3c6aa', fontSize: 11 },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  pill: { backgroundColor: '#384b55', borderRadius: 8, padding: 8, marginRight: 8, marginBottom: 8, alignItems: 'center' },
  pillLabel: { color: '#d3c6aa', fontSize: 10 },
  pillValue: { color: '#d3c6aa', fontSize: 16, fontWeight: 'bold' },
  detailText: { color: '#d3c6aa', fontSize: 12, marginBottom: 8 },
  description: { color: '#ccc', fontSize: 13, lineHeight: 20, marginBottom: 16 },
  addButton: { backgroundColor: '#7fbbb3', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 10 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  closeText: { color: '#aaa', textAlign: 'center', paddingVertical: 8 },
});
