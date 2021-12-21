'use strict';

const chalk = require('chalk');

const scanCodeForKeyUsage = async (translations, key, fileContentSearch) => {
  const files = await fileContentSearch.searchString(key.name);
  return { files };
};

const scanCodeForValueUsage = async (translations, key, fileContentSearch) => {
  const files = await fileContentSearch.searchString(translations[key.name]);

  const keysWithSameValue = [];
  for (const translationKey in translations) {
    if (translationKey !== key.name && translations[translationKey] === key.value) {
      keysWithSameValue.push(translationKey);
    }
  }
  return { files, keysWithSameValue };
};

const getSubkeys = key => {
  const subStrings = key.split('.');
  const similarKeys = [];

  for (let i = 0; i < subStrings.length; i++) {
    for (let j = subStrings.length; j > i; j--) {
      const tmp = [...subStrings];
      similarKeys.push(tmp.slice(i, j).join('.'));
    }
  }

  return similarKeys
    .sort((a, b) => {
      return b.split('.').length - a.split('.').length;
    })
    .filter(k => k !== key);
};

const scanCodeForSubkeyUsage = async (translations, key, fileContentSearch) => {
  const subkeyNames = getSubkeys(key.name);
  const subkeys = [];
  for (const subkey of subkeyNames) {
    subkeys.push({
      name: subkey,
      files: await fileContentSearch.searchString(subkey),
      existsInTranslationFile: translations[subkey],
    });
  }
  return { subkeys };
};

const scanCode = async (translations, fileContentSearch) => {
  const total = Object.keys(translations).length;
  const updatedKeys = {};
  const foundText = chalk.green('Found');
  const notFoundText = chalk.red('Not found');
  let current = 0;

  for (const key in translations) {
    current++;

    const baseKeyData = { name: key, value: translations[key] };
    updatedKeys[key] = {
      ...baseKeyData,
      keyUsage: await scanCodeForKeyUsage(translations, baseKeyData, fileContentSearch),
      valueUsage: await scanCodeForValueUsage(translations, baseKeyData, fileContentSearch),
      subkeyUsage: await scanCodeForSubkeyUsage(translations, baseKeyData, fileContentSearch),
    };
    console.log(
      `[${current}/${total}] ${chalk.blue(key)} ${
        updatedKeys[key].keyUsage.files.length > 0 ? foundText : notFoundText
      }`
    );
  }

  return updatedKeys;
};

module.exports = scanCode;
