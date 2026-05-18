// src/utils/CharacterStore.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Character } from '../models/Character';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

const STORAGE_KEY = 'cs_characters_v1';
const EXPORT_DIRECTORY_URI_KEY = 'cs_export_directory_uri_v1';

function sanitizeFilePart(value, fallback = 'character') {
  const normalized = String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

function buildExportFileName(character) {
  const charName = sanitizeFilePart(character?.name, 'character');
  const classId = sanitizeFilePart(character?.classId ?? character?.className, 'class');
  const level = Number.parseInt(character?.level, 10) || 1;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${charName}_${classId}_lvl${level}_${timestamp}.json`;
}

async function getSavedExportDirectoryUri() {
  try {
    return await AsyncStorage.getItem(EXPORT_DIRECTORY_URI_KEY);
  } catch (err) {
    return null;
  }
}

async function setSavedExportDirectoryUri(directoryUri) {
  try {
    if (!directoryUri) {
      await AsyncStorage.removeItem(EXPORT_DIRECTORY_URI_KEY);
      return;
    }
    await AsyncStorage.setItem(EXPORT_DIRECTORY_URI_KEY, directoryUri);
  } catch (err) {
    // no-op
  }
}

async function writeExportJsonToAndroidDirectory(directoryUri, fileName, json) {
  const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
    directoryUri,
    fileName,
    'application/json'
  );

  await FileSystem.writeAsStringAsync(fileUri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return fileUri;
}

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
    const characters = raw.map(data => new Character(data));

    const hasInvocationMigration = raw.some((entry, index) => {
      const previous = Array.isArray(entry?.knownInvocations) ? entry.knownInvocations : [];
      const migrated = Array.isArray(characters[index]?.knownInvocations)
        ? characters[index].knownInvocations
        : [];

      if (previous.length !== migrated.length) return true;
      return previous.some((value, valueIndex) => value !== migrated[valueIndex]);
    });

    if (hasInvocationMigration) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
    }

    return characters;
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

    const fileName = buildExportFileName(character);

    if (Platform.OS === 'android') {
      const savedDirectoryUri = await getSavedExportDirectoryUri();
      if (savedDirectoryUri) {
        try {
          await writeExportJsonToAndroidDirectory(savedDirectoryUri, fileName, json);
          return;
        } catch (savedDirError) {
          await setSavedExportDirectoryUri(null);
        }
      }

      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) return;

      await writeExportJsonToAndroidDirectory(permissions.directoryUri, fileName, json);
      await setSavedExportDirectoryUri(permissions.directoryUri);
      return;
    }

    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
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
