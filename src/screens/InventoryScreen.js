import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, ScrollView, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchItems, getItemByName } from '../utils/ItemStore';
import { getEquippedBonuses, MAX_ATTUNEMENT } from '../utils/BonusEngine';
import ItemCard from '../components/ItemCard';
import { patchCharacter } from '../utils/CharacterStore';
import { colors, spacing, radius, typography, shadows, sharedStyles } from '../styles/theme';
import { getWeaponDamageByName, STANDARD_WEAPON_OPTIONS, getWeaponTemplate } from '../utils/WeaponStore';

const SAVING_THROWS = [
  { key: 'str', label: 'Strength' },
  { key: 'dex', label: 'Dexterity' },
  { key: 'con', label: 'Constitution' },
  { key: 'int', label: 'Intelligence' },
  { key: 'wis', label: 'Wisdom' },
  { key: 'cha', label: 'Charisma' },
];

const SKILLS = [
  { key: 'athletics', label: 'Athletics' },
  { key: 'acrobatics', label: 'Acrobatics' },
  { key: 'sleightofhand', label: 'Sleight of Hand' },
  { key: 'stealth', label: 'Stealth' },
  { key: 'arcana', label: 'Arcana' },
  { key: 'history', label: 'History' },
  { key: 'investigation', label: 'Investigation' },
  { key: 'nature', label: 'Nature' },
  { key: 'religion', label: 'Religion' },
  { key: 'animalhandling', label: 'Animal Handling' },
  { key: 'insight', label: 'Insight' },
  { key: 'medicine', label: 'Medicine' },
  { key: 'perception', label: 'Perception' },
  { key: 'survival', label: 'Survival' },
  { key: 'deception', label: 'Deception' },
  { key: 'intimidation', label: 'Intimidation' },
  { key: 'performance', label: 'Performance' },
  { key: 'persuasion', label: 'Persuasion' },
];

const ITEM_TYPES = [
  'Wondrous Item',
  'Weapon',
  'Armor',
  'Shield',
  'Ring',
  'Rod',
  'Staff',
  'Wand',
  'Potion',
  'Scroll',
  'Amulet',
];

const BONUS_OPTIONS = [0, 1, 2, 3];

function rarityColor(rarity) {
  if (!rarity) return colors.rarity.common;
  const key = rarity.toLowerCase().replace(/\s/g, '');
  return colors.rarity[key] ?? colors.rarity.common;
}

function parseOptionalNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function getDefaultCustomItemState() {
  return {
    name: '',
    description: '',
    type: '',
    baseWeapon: '',
    acBonus: 0,
    attackBonus: 0,
    damageBonus: 0,
    skillBonusValue: 1,
    saveBonuses: {},
    skillBonuses: [],
    uses: null,
  };
}

export default function InventoryScreen({ route, onCharacterChange }) {
  const { character } = route.params;

  const [inventory, setInventory]         = useState(character.inventory ?? []);
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItem, setSelectedItem]   = useState(null);

  // Custom item creation
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customItem, setCustomItem] = useState(getDefaultCustomItemState());

  const { attunedCount } = getEquippedBonuses(inventory, character.customItems ?? []);

  useEffect(() => {
    setInventory(character.inventory ?? []);
  }, [character]);

  const updateInventory = useCallback(async (newInventory, extraUpdates = {}) => {
    setInventory(newInventory);
    const updatedCharacter = await patchCharacter(character.id, {
      inventory: newInventory,
      ...extraUpdates,
    });
    Object.assign(character, updatedCharacter.toJSON());
    onCharacterChange?.(updatedCharacter);
  }, [character, onCharacterChange]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    setSearchResults(searchItems(text, 30, character.customItems ?? []));
  };

  const handleRemoveItem = (itemName) => {
    Alert.alert('Remove Item', `Remove ${itemName} from inventory?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await updateInventory(inventory.filter(e => e.itemName !== itemName));
        },
      },
    ]);
  };

  const handleAddItem = async (item) => {
    const existing = inventory.find(e => e.itemName === item.Name);
    if (existing) {
      await updateInventory(inventory.map(e =>
        e.itemName === item.Name ? { ...e, quantity: e.quantity + 1 } : e
      ));
    } else {
      await updateInventory([...inventory, {
        itemName: item.Name,
        quantity: 1,
        equipped: false,
        attuned: false,
        charges: item.Charges ?? null,
      }]);
    }
    setSelectedItem(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleToggleEquip = async (itemName) => {
    const entry    = inventory.find(e => e.itemName === itemName);
    const itemData = getItemByName(itemName, character.customItems ?? []);
    if (!entry.equipped && itemData?.Attunement === 'Yes' && attunedCount >= MAX_ATTUNEMENT) {
      Alert.alert('Attunement Full', `You can only be attuned to ${MAX_ATTUNEMENT} items at once.`);
      return;
    }
    await updateInventory(inventory.map(e =>
      e.itemName === itemName
        ? { ...e, equipped: !e.equipped, attuned: !e.equipped && itemData?.Attunement === 'Yes' }
        : e
    ));
  };

  const handleQuantityChange = async (itemName, val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 0) return;
    if (num === 0) {
      Alert.alert('Remove Item', `Remove ${itemName} from inventory?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive',
          onPress: async () => await updateInventory(inventory.filter(e => e.itemName !== itemName)) },
      ]);
    } else {
      await updateInventory(inventory.map(e =>
        e.itemName === itemName ? { ...e, quantity: num } : e
      ));
    }
  };

  const handleChargeChange = async (itemName, val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 0) return;
    await updateInventory(inventory.map(e =>
      e.itemName === itemName ? { ...e, charges: num } : e
    ));
  };

  const handleCreateCustomItem = async () => {
    const trimmedName = customItem.name.trim();
    const trimmedDescription = customItem.description.trim();
    const trimmedType = customItem.type.trim() || 'Wondrous Item';
    const weaponTemplate = trimmedType === 'Weapon' ? getWeaponTemplate(customItem.baseWeapon) : null;

    if (!trimmedName) {
      Alert.alert('Error', 'Item name is required');
      return;
    }

    if (trimmedType === 'Weapon' && !weaponTemplate) {
      Alert.alert('Missing Weapon Base', 'Choose a standard weapon base for custom weapons.');
      return;
    }

    const conflictingItem = getItemByName(trimmedName, character.customItems ?? []);
    if (conflictingItem) {
      Alert.alert('Duplicate Item', 'An item with that name already exists. Please choose a unique name.');
      return;
    }

    const newItem = {
      Name: trimmedName,
      Description: trimmedDescription,
      ObjectType: trimmedType,
      IsMagical: 'Yes',
      Rarity: 'common',
      Attunement: 'No',
      BonusAC: customItem.acBonus || null,
      BonusWeapon: customItem.attackBonus || null,
      BonusDamage: customItem.damageBonus || null,
      BonusSaveValues: customItem.saveBonuses,
      BonusSkills: customItem.skillBonuses,
      BonusSkillValue: customItem.skillBonusValue || 1,
      Charges: customItem.uses || null,
      custom: true,
      ...(weaponTemplate ? {
        ObjectType: 'Weapon',
        BaseItem: weaponTemplate.BaseItem,
        BaseWeaponName: weaponTemplate.label,
        Type: weaponTemplate.Type,
        Properties: weaponTemplate.Properties,
      } : {}),
    };

    const nextCustomItems = [...(character.customItems ?? []), newItem];
    character.customItems = nextCustomItems;

    const existing = inventory.find(e => e.itemName === newItem.Name);
    const nextInventory = existing
      ? inventory.map(e =>
          e.itemName === newItem.Name ? { ...e, quantity: e.quantity + 1 } : e
        )
      : [...inventory, {
          itemName: newItem.Name,
          quantity: 1,
          equipped: false,
          attuned: false,
          charges: newItem.Charges ?? null,
        }];

    await updateInventory(nextInventory, { customItems: nextCustomItems });
    setSearchQuery('');
    setSearchResults([]);
    setSelectedItem(null);
    setCustomItem(getDefaultCustomItemState());
    setCustomModalVisible(false);
  };

  const setSaveBonus = (save, value) => {
    setCustomItem(prev => ({
      ...prev,
      saveBonuses: {
        ...prev.saveBonuses,
        [save]: value,
      },
    }));
  };

  const toggleSkillBonus = (skill) => {
    setCustomItem(prev => ({
      ...prev,
      skillBonuses: prev.skillBonuses.includes(skill)
        ? prev.skillBonuses.filter(s => s !== skill)
        : [...prev.skillBonuses, skill]
    }));
  };

  const renderInventoryItem = ({ item: entry }) => {
    const itemData = getItemByName(entry.itemName, character.customItems ?? []);
    const rColor   = rarityColor(itemData?.Rarity);
    const weaponLookupName = [
      itemData?.BaseItem?.split('|')[0],
      itemData?.BaseWeaponName,
      entry?.BaseWeaponName,
      entry.itemName,
    ].find(value => typeof value === 'string' && value.trim().length > 0);
    const dmgInfo = getWeaponDamageByName(weaponLookupName);
    const damageText = dmgInfo ? `${dmgInfo.dice} ${dmgInfo.type}` : null;
    const metaParts = [
      itemData?.ObjectType,
      damageText,
      entry.attuned ? 'Attuned' : null,
    ].filter(Boolean);

    return (
      <TouchableOpacity
        style={[styles.inventoryRow, { borderLeftColor: rColor }]}
        onLongPress={() => setSelectedItem(itemData)}
        delayLongPress={400}
        activeOpacity={1}
      >
        <View style={styles.inventoryTop}>
          <View style={styles.inventoryTitleRow}>
            <Text style={styles.inventoryName}>{entry.itemName}</Text>
            {itemData?.Rarity && (
              <Text style={[styles.rarityBadge, { color: rColor }]}>
                {itemData.Rarity}
              </Text>
            )}
          </View>
          <View style={styles.inventoryActionRow}>
            {metaParts.length > 0 ? (
              <Text style={styles.itemType} numberOfLines={1}>
                {metaParts.join(' • ')}
              </Text>
            ) : (
              <View style={styles.itemTypeSpacer} />
            )}

            <View style={styles.quantityRow}>
              <TextInput
                style={[styles.controlInput, styles.quantityInput]}
                keyboardType="numeric"
                value={String(entry.quantity)}
                onChangeText={(v) => handleQuantityChange(entry.itemName, v)}
              />
            </View>

            <TouchableOpacity
              style={[styles.iconButton, entry.equipped && styles.equipButtonActive]}
              onPress={() => handleToggleEquip(entry.itemName)}
              accessibilityRole="button"
              accessibilityLabel={entry.equipped ? `Unequip ${entry.itemName}` : `Equip ${entry.itemName}`}
            >
              <Ionicons
                name={entry.equipped ? 'shield-checkmark' : 'shield-outline'}
                size={12}
                color={entry.equipped ? colors.textPrimary : colors.textMuted}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleRemoveItem(entry.itemName)}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${entry.itemName}`}
            >
              <Ionicons name="trash-outline" size={12} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inventoryControls}>

          {entry.charges !== null && (
            <View style={[styles.controlGroup, styles.chargeGroup]}>
              <Text style={styles.controlLabel}>CHARGES</Text>
              <View style={styles.chargeRow}>
                <Ionicons name="flash" size={10} color={colors.gold} />
                <TextInput
                  style={[styles.controlInput, styles.chargeInput, { color: colors.gold }]}
                  keyboardType="numeric"
                  value={String(entry.charges)}
                  onChangeText={(v) => handleChargeChange(entry.itemName, v)}
                />
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={sharedStyles.screen}>

      {/* Attunement bar */}
      <View style={styles.attunementBar}>
        <Ionicons name="sparkles" size={14} color={colors.gold} />
        <Text style={styles.attunementText}>
          Attunement  {attunedCount} / {MAX_ATTUNEMENT}
        </Text>
        <View style={styles.attunementPips}>
          {Array.from({ length: MAX_ATTUNEMENT }).map((_, i) => (
            <View
              key={i}
              style={[styles.attunementPip, i < attunedCount && styles.attunementPipFilled]}
            />
          ))}
        </View>
      </View>

      {/* Search Wrapper (Fix for zIndex/elevation issues) */}
      <View style={{ zIndex: 100 }}>
        
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items to add..."
            placeholderTextColor={colors.textDisabled}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Create Custom Item Button */}
        <TouchableOpacity
          style={styles.createCustomButton}
          onPress={() => setCustomModalVisible(true)}
        >
          <Ionicons name="add-circle" size={16} color={colors.textPrimary} />
          <Text style={styles.createCustomText}>Create Custom Item</Text>
        </TouchableOpacity>

        {/* Search results */}
        {searchResults.length > 0 && (
  <View style={styles.searchResults}>
    <FlatList
      data={searchResults}
      keyExtractor={(item, index) => `${item.Name}-${index}`}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.searchResultRow}
          onPress={() => { setSelectedItem(item); setSearchResults([]); }}
        >
          <View style={styles.searchResultLeft}>
            <Text style={styles.searchResultName}>{item.Name}</Text>
            <Text style={styles.searchResultType}>{item.ObjectType}</Text>
          </View>
          {item.Rarity && (
            <Text style={[styles.searchResultRarity, { color: rarityColor(item.Rarity) }]}>
              {item.Rarity}
            </Text>
          )}
        </TouchableOpacity>
      )}
      keyboardShouldPersistTaps="handled"
    />
  </View>
)}

      </View>

      {/* Inventory list */}
      <FlatList
        data={inventory}
        keyExtractor={(item, index) => `${item.itemName}-${index}`}
        renderItem={renderInventoryItem}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bag-outline" size={40} color={colors.textDisabled} />
            <Text style={styles.emptyText}>No items in inventory</Text>
            <Text style={styles.emptySubtext}>Search above to add items</Text>
          </View>
        }
      />

      <ItemCard
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onAdd={handleAddItem}
      />

      {/* Custom Item Modal */}
      <Modal
        visible={customModalVisible}
        animationType="slide"
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Custom Item</Text>
            <TouchableOpacity onPress={() => setCustomModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.fieldLabel}>Item Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Item Name"
              placeholderTextColor={colors.textMuted}
              value={customItem.name}
              onChangeText={(text) => setCustomItem(prev => ({ ...prev, name: text }))}
            />
            <Text style={styles.fieldLabel}>Item Description</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Item Description"
              placeholderTextColor={colors.textMuted}
              multiline
              value={customItem.description}
              onChangeText={(text) => setCustomItem(prev => ({ ...prev, description: text }))}
            />
            <Text style={styles.fieldLabel}>Item Type</Text>
            <View style={styles.optionRow}>
              {ITEM_TYPES.map((type) => {
                const selectedType = customItem.type || 'Wondrous Item';
                const isActive = selectedType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.optionChip, isActive && styles.optionChipActive]}
                    onPress={() => setCustomItem(prev => ({ ...prev, type }))}
                  >
                    <Text style={[styles.optionChipText, isActive && styles.optionChipTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {(customItem.type || 'Wondrous Item') === 'Weapon' && (
              <>
                <Text style={styles.fieldLabel}>Base Weapon</Text>
                <View style={styles.optionRow}>
                  {(STANDARD_WEAPON_OPTIONS ?? []).map((weapon) => {
                    const isActive = customItem.baseWeapon === weapon.key;
                    return (
                      <TouchableOpacity
                        key={weapon.key}
                        style={[styles.optionChip, isActive && styles.optionChipActive]}
                        onPress={() => setCustomItem(prev => ({ ...prev, baseWeapon: weapon.key }))}
                      >
                        <Text style={[styles.optionChipText, isActive && styles.optionChipTextActive]}>
                          {weapon.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
            <Text style={styles.fieldLabel}>AC Bonus</Text>
            <View style={styles.optionRow}>
              {BONUS_OPTIONS.map((value) => {
                const isActive = customItem.acBonus === value;
                return (
                  <TouchableOpacity
                    key={`ac-${value}`}
                    style={[styles.optionChip, isActive && styles.optionChipActive]}
                    onPress={() => setCustomItem(prev => ({ ...prev, acBonus: value }))}
                  >
                    <Text style={[styles.optionChipText, isActive && styles.optionChipTextActive]}>
                      {value === 0 ? 'None' : `+${value}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.fieldLabel}>Attack Bonus</Text>
            <View style={styles.optionRow}>
              {BONUS_OPTIONS.map((value) => {
                const isActive = customItem.attackBonus === value;
                return (
                  <TouchableOpacity
                    key={`attack-${value}`}
                    style={[styles.optionChip, isActive && styles.optionChipActive]}
                    onPress={() => setCustomItem(prev => ({ ...prev, attackBonus: value }))}
                  >
                    <Text style={[styles.optionChipText, isActive && styles.optionChipTextActive]}>
                      {value === 0 ? 'None' : `+${value}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.fieldLabel}>Damage Bonus</Text>
            <View style={styles.optionRow}>
              {BONUS_OPTIONS.map((value) => {
                const isActive = customItem.damageBonus === value;
                return (
                  <TouchableOpacity
                    key={`damage-${value}`}
                    style={[styles.optionChip, isActive && styles.optionChipActive]}
                    onPress={() => setCustomItem(prev => ({ ...prev, damageBonus: value }))}
                  >
                    <Text style={[styles.optionChipText, isActive && styles.optionChipTextActive]}>
                      {value === 0 ? 'None' : `+${value}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.fieldLabel}>Number of Uses</Text>
            <TextInput
              style={styles.input}
              placeholder="Number of Uses (optional)"
              keyboardType="numeric"
              placeholderTextColor={colors.textMuted}
              value={customItem.uses ? String(customItem.uses) : ''}
              onChangeText={(text) => setCustomItem(prev => ({ ...prev, uses: parseOptionalNumber(text) }))}
            />
            <Text style={styles.sectionTitle}>Bonus to Saving Throws</Text>
            {SAVING_THROWS.map(save => (
              <View key={save.key} style={styles.saveBonusRow}>
                <Text style={styles.checkboxLabel}>{save.label}</Text>
                <View style={styles.saveBonusChipRow}>
                  {BONUS_OPTIONS.map((value) => {
                    const currentValue = customItem.saveBonuses?.[save.key] ?? 0;
                    const isActive = currentValue === value;
                    return (
                      <TouchableOpacity
                        key={`${save.key}-${value}`}
                        style={[
                          styles.saveBonusChip,
                          isActive && styles.saveBonusChipActive,
                        ]}
                        onPress={() => setSaveBonus(save.key, value)}
                      >
                        <Text style={[
                          styles.saveBonusChipText,
                          isActive && styles.saveBonusChipTextActive,
                        ]}>
                          {value === 0 ? '—' : `+${value}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
            <Text style={styles.fieldLabel}>Skill Bonus Value</Text>
            <View style={styles.optionRow}>
              {[1, 2, 3].map((value) => {
                const isActive = customItem.skillBonusValue === value;
                return (
                  <TouchableOpacity
                    key={`skill-${value}`}
                    style={[styles.optionChip, isActive && styles.optionChipActive]}
                    onPress={() => setCustomItem(prev => ({ ...prev, skillBonusValue: value }))}
                  >
                    <Text style={[styles.optionChipText, isActive && styles.optionChipTextActive]}>
                      +{value}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.sectionTitle}>Bonus to Skills</Text>
            {SKILLS.map(skill => (
              <TouchableOpacity
                key={skill.key}
                style={styles.checkboxRow}
                onPress={() => toggleSkillBonus(skill.key)}
              >
                <Ionicons
                  name={customItem.skillBonuses.includes(skill.key) ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={colors.textPrimary}
                />
                <Text style={styles.checkboxLabel}>{skill.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setCustomModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateCustomItem}
            >
              <Text style={styles.createButtonText}>Create Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  // Attunement bar
  attunementBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceDeep2,
  },
  attunementText: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: spacing.xs,
    flex: 1,
  },
  attunementPips: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  attunementPip: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: 'transparent',
  },
  attunementPipFilled: {
    backgroundColor: colors.gold,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    margin: spacing.md,
    marginBottom: 4,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    paddingVertical: spacing.sm,
  },
  searchResults: {
    position: 'absolute',
    top: 132,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    maxHeight: 520,
    zIndex: 10,
    elevation: 10,
    ...shadows.card,
  },

  searchResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceDeep,
  },
  searchResultLeft: { flex: 1 },
  searchResultName: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  searchResultType: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  searchResultRarity: { fontSize: 11, fontWeight: 'bold' },

  // Inventory rows
  inventoryRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
    borderLeftWidth: 3,
    ...shadows.card,
  },
  inventoryTop: { marginBottom: spacing.xs },
  inventoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inventoryName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
  },
  rarityBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginLeft: spacing.xs,
  },
  itemType: {
    color: colors.textMuted,
    fontSize: 10,
    flex: 1,
    marginRight: spacing.xs,
  },
  inventoryControls: {
    marginTop: 2,
    gap: spacing.xs,
  },
  controlGroup: { alignItems: 'center' },
  controlLabel: {
    ...typography.label,
    fontSize: 9,
    marginBottom: 1,
  },
  controlInput: {
    backgroundColor: colors.surfaceDeep2,
    color: colors.textPrimary,
    borderRadius: radius.sm,
    width: 38,
    minHeight: 28,
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
    fontSize: 12,
  },
  inventoryActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTypeSpacer: {
    flex: 1,
  },
  quantityRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInput: {
    width: 26,
    minHeight: 22,
    paddingVertical: 1,
    fontSize: 10,
  },
  chargeRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  chargeGroup: {
    alignSelf: 'flex-end',
  },
  chargeInput: {
    width: 34,
    minHeight: 24,
    paddingVertical: 2,
    fontSize: 11,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceDeep2,
    borderRadius: radius.sm,
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  equipButtonActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: spacing.md,
  },
  emptySubtext: {
    color: colors.textDisabled,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  createCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  createCustomText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: spacing.xs,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceDeep2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  fieldLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    color: colors.textPrimary,
    fontSize: 14,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  optionChip: {
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.surfaceDeep2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionChipActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent2,
  },
  optionChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  optionChipTextActive: {
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  checkboxLabel: {
    marginLeft: spacing.sm,
    color: colors.textPrimary,
    fontSize: 14,
  },
  saveBonusRow: {
    marginBottom: spacing.sm,
  },
  saveBonusChipRow: {
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  saveBonusChip: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.surfaceDeep2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 38,
    alignItems: 'center',
  },
  saveBonusChipActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent2,
  },
  saveBonusChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  saveBonusChipTextActive: {
    color: colors.textPrimary,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceDeep2,
  },
  cancelButton: {
    backgroundColor: colors.surfaceDeep2,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  createButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});