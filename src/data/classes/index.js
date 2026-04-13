// src/data/classes/index.js
import { BARBARIAN } from './barbarian';
import { FIGHTER } from './fighter';
import { WIZARD } from './wizard';
import { SORCERER } from './sorcerer';
import { WARLOCK } from './warlock';

const CLASS_REGISTRY = {
  barbarian: BARBARIAN,
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

