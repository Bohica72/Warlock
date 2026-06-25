// src/data/classes/index.js
import { BARBARIAN } from './barbarian';
import { SORCERER } from './sorcerer';
import { WARLOCK } from './warlock';
import { PSION } from './psion';

const CLASS_REGISTRY = {
  barbarian: BARBARIAN,
  psion: PSION,
  sorcerer: SORCERER,
  warlock: WARLOCK,
};

export function getClassData(classId) {
  if (!classId) return null;
  return CLASS_REGISTRY[classId.toLowerCase()] ?? null;
}

export function getAllClasses() {
  return Object.values(CLASS_REGISTRY);
}

