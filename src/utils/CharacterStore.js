// src/utils/CharacterStore.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Character } from '../models/Character';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

const STORAGE_KEY = 'cs_characters_v1';

let writeQueue = Promise.resolve();

function enqueueWrite(operation) {
  const next = writeQueue.then(operation, operation);
  writeQueue = next.catch(() => {});
  return next;
}

export async function loadCharacters() {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    const raw = JSON.parse(json);
    return raw.map(data => new Character(data));
  } catch (err) {
    return [];
  }
}



export async function saveCharacters(characters) {
  return enqueueWrite(async () => {
    try {
      const json = JSON.stringify(characters);
      await AsyncStorage.setItem(STORAGE_KEY, json);
    } catch (err) {
      console.warn('Failed to save characters', err);
    }
  });
}

export async function addCharacter(character) {
  return enqueueWrite(async () => {
    const characters = await loadCharacters();
    const updated = [...characters, character];
    const json = JSON.stringify(updated);
    await AsyncStorage.setItem(STORAGE_KEY, json);
    return updated;
  });
}

export async function updateCharacter(updatedCharacter) {
  return enqueueWrite(async () => {
    const characters = await loadCharacters();
    const updated = characters.map(c => (c.id === updatedCharacter.id ? updatedCharacter : c));
    const json = JSON.stringify(updated);
    await AsyncStorage.setItem(STORAGE_KEY, json);
    return updated;
  });
}

export async function deleteCharacter(id) {
  return enqueueWrite(async () => {
    const characters = await loadCharacters();
    const updated = characters.filter(c => c.id !== id);
    const json = JSON.stringify(updated);
    await AsyncStorage.setItem(STORAGE_KEY, json);
    return updated;
  });
}

export async function saveCharacter(character) {
  return enqueueWrite(async () => {
    const characters = await loadCharacters();
    const exists = characters.find(c => c.id === character.id);
    const updated = exists
      ? characters.map(c => c.id === character.id ? character : c)
      : [...characters, character];
    const json = JSON.stringify(updated);
    await AsyncStorage.setItem(STORAGE_KEY, json);
  });
}

export async function patchCharacter(id, updates = {}) {
  return enqueueWrite(async () => {
    const characters = await loadCharacters();
    const index = characters.findIndex(c => c.id === id);
    const base = index >= 0 ? characters[index] : { id };
    const merged = new Character({
      ...base,
      ...updates,
    });

    const nextCharacters = index >= 0
      ? characters.map((c, i) => (i === index ? merged : c))
      : [...characters, merged];

    const json = JSON.stringify(nextCharacters);
    await AsyncStorage.setItem(STORAGE_KEY, json);
    return merged;
  });
}

export async function exportCharacter(character) {
  try {
    const json = JSON.stringify(character, null, 2);
    const fileUri = FileSystem.documentDirectory + 'character_backup.json';
    await FileSystem.writeAsStringAsync(fileUri, json);
    await Sharing.shareAsync(fileUri);
  } catch (err) {
    console.warn('Failed to export character', err);
  }
}

export async function importCharacter() {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
    });
    if (result.type === 'success') {
      const content = await FileSystem.readAsStringAsync(result.uri);
      const data = JSON.parse(content);
      data.id = 'char_' + Date.now(); // Avoid ID conflicts
      return new Character(data);
    }
  } catch (err) {
    console.warn('Failed to import character', err);
  }
  return null;
}
