import { getItemByName } from './ItemStore';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function applyMappedBonusObject(target, mappedValues) {
  if (!mappedValues || typeof mappedValues !== 'object' || Array.isArray(mappedValues)) return;

  Object.entries(mappedValues).forEach(([key, value]) => {
    const numericAmount = toNumber(value, 0);
    if (!numericAmount) return;
    target[key] = (target[key] || 0) + numericAmount;
  });
}

function applyMappedBonus(target, keys, amount) {
  if (!Array.isArray(keys) || keys.length === 0) return;
  const numericAmount = toNumber(amount, 1);
  if (!numericAmount) return;

  keys.forEach((key) => {
    target[key] = (target[key] || 0) + numericAmount;
  });
}

export function getEquippedBonuses(inventoryEntries, customItems = []) {
  let bonusAC = 0;
  let bonusWeapon = 0;
  let bonusDamage = 0;
  let bonusSaves = {};
  let bonusSkills = {};
  let attunedCount = 0;

  for (const entry of inventoryEntries) {
    if (!entry.equipped) continue;
    const item = getItemByName(entry.itemName, customItems);
    if (!item) continue;
    bonusAC += toNumber(item.BonusAC);
    bonusWeapon += toNumber(item.BonusWeapon);
    bonusDamage += toNumber(item.BonusDamage);
    applyMappedBonusObject(bonusSaves, item.BonusSaveValues);
    applyMappedBonusObject(bonusSkills, item.BonusSkillValues);
    applyMappedBonus(bonusSaves, item.BonusSaves, item.BonusSaveValue);
    applyMappedBonus(bonusSkills, item.BonusSkills, item.BonusSkillValue);
    if (item.Attunement === 'Yes') attunedCount++;
  }

  return { bonusAC, bonusWeapon, bonusDamage, bonusSaves, bonusSkills, attunedCount };
}

export const MAX_ATTUNEMENT = 3;
