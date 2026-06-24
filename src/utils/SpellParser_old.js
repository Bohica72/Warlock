// src/utils/SpellParser.js

/**
 * Strips 5eTools tags like {@spell fireball} or {@condition blinded} 
 * and just returns the readable text ("fireball", "blinded").
 */



const cleanTags = (text) => {
  if (typeof text !== 'string') return '';
  return text.replace(/{@\w+ (.*?)(?:\|.*?)?}/g, '$1'); 
};

/**
 * Recursively flattens the complex 5eTools "entries" array into a single readable string.
 */
const flattenEntries = (entries) => {
  if (!entries || !Array.isArray(entries)) return "No description available.";

  return entries.map(entry => {
    // Base case: it's just a paragraph of text
    if (typeof entry === 'string') {
      return cleanTags(entry);
    }
    
    // Case: It's a sub-header with its own entries (like "Targeted Effects" in Antimagic Field)
    if (entry.type === 'entries') {
      const header = entry.name ? `${entry.name.toUpperCase()}\n` : '';
      const subtext = flattenEntries(entry.entries);
      return `${header}${subtext}`;
    }

    // Case: It's a bulleted list
    if (entry.type === 'list') {
      return entry.items.map(item => {
        if (typeof item === 'string') return `• ${cleanTags(item)}`;
        if (item.name) return `• ${item.name}: ${cleanTags(item.entry)}`;
        return '';
      }).join('\n');
    }

    return '';
  }).join('\n\n').trim();
};

/**
 * Parses a single raw 5eTools spell object into our app's lightweight format.
 */
export const parseRawSpell = (rawSpell) => {
  // 1. Flatten Time (e.g., "1 action", "1 bonus action")
  let timeStr = 'Special';
  if (rawSpell.time && rawSpell.time[0]) {
    timeStr = `${rawSpell.time[0].number} ${rawSpell.time[0].unit}`;
  }

  // 2. Flatten Duration & Concentration
  let durStr = 'Instantaneous';
  const durObj = rawSpell.duration?.[0];
  if (durObj) {
    if (durObj.type === 'timed') {
      durStr = `${durObj.duration.amount} ${durObj.duration.type}${durObj.duration.amount > 1 ? 's' : ''}`;
    } else if (durObj.type === 'instant') {
      durStr = 'Instantaneous';
    } else if (durObj.type === 'permanent') {
      durStr = 'Until dispelled';
    }
    
    if (durObj.concentration) {
      durStr += ' (C)';
    }
  }

  // 3. Return the clean, flat object
  return {
    id: rawSpell.name.toLowerCase().replace(/\s+/g, '_'),
    name: rawSpell.name,
    level: rawSpell.level || 0, // 0 is Cantrip
    time: timeStr,
    duration: durStr,
    desc: flattenEntries(rawSpell.entries),
  };
};