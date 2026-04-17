// src/utils/featUtils.js
export function formatFeatSummary(feat) {
  const parts = [];
  if (feat.abilityBonus?.type === 'fixed') {
    const bonuses = Object.entries(feat.abilityBonus.bonuses)
      .map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(', ');
    parts.push(bonuses);
  }
  if (feat.abilityBonus?.type === 'choice') {
    parts.push(`+1 to ${feat.abilityBonus.from.map(s => s.toUpperCase()).join(' or ')}`);
  }
  if (feat.armorProficiencies) parts.push('Armor proficiency');
  if (feat.skillProficiencies)  parts.push('Skill proficiencies');
  return parts.length ? parts.join(' · ') : 'Feature';
}

export function meetsPrerequisites(feat, character, targetLevel = null) {
  if (!feat?.prerequisite || feat.prerequisite.length === 0) return true;

  const level = targetLevel ?? character.level;
  const score = (ability) => character.getAbilityScore?.(ability) ?? 0;

  return feat.prerequisite.every(req => {
    if (req.level != null && level < req.level) {
      return false;
    }

    if (req.ability) {
      return req.ability.every(abilityReq => {
        const [ability, minimum] = Object.entries(abilityReq)[0] ?? [];
        return ability && score(ability) >= minimum;
      });
    }

    // Unsupported or unknown prereq types are treated as satisfied by default.
    return true;
  });
}
