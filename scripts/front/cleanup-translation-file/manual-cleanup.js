'use strict';

// eslint-disable-next-line node/no-extraneous-require
const inquirer = require('inquirer');
const chalk = require('chalk');

const clear = () => {
  console.log('\n'.repeat(100));
  console.clear();
};

const printFileMatches = (title, files) => {
  let limit = 5;

  if (files.length > 0) console.log(chalk.black(chalk.bgWhite(title)));
  for (let i = 0; i < files.length && limit > 0; i++) {
    const file = files[i];
    console.log('  File:', chalk.green(file.path));
    for (let j = 0; j < file.matches.length && limit > 0; j++) {
      const match = file.matches[j];
      console.log('    - ', match);
      limit--;
    }
  }
};

const printFound = files =>
  files.length ? chalk.green(`Found in ${files.length} files`) : chalk.red('Not found');

const displayKeyInfo = async (key, showMatches = false) => {
  const notFoundKeys = key.subkeyUsage.subkeys.filter(sk => sk.files.length > 0);

  console.log('\n');
  console.log(chalk.blue(key.name), chalk.yellow(key.value));
  console.log('Key  ', printFound(key.keyUsage.files));

  console.log('Value', printFound(key.valueUsage.files));
  console.log(
    '\nKeys with same value:',
    `[${key.valueUsage.keysWithSameValue.map(k => chalk.blue(k)).join(', ')}]`
  );

  if (key.subkeyUsage.subkeys.length && !showMatches) {
    console.log('\nSubkeys found:');
    notFoundKeys.forEach(sk => {
      console.log(
        chalk.blue(sk.name),
        sk.files.length.toString(),
        sk.existsInTranslationFile && chalk.yellow(sk.existsInTranslationFile)
      );
    });
  }

  if (showMatches) {
    if (key.subkeyUsage.subkeys.length > 0) {
      console.log(chalk.bgBlue(chalk.black('\nSubkeys Matches\n')));
    }

    for (key of notFoundKeys) {
      printFileMatches(key.name, key.files);
    }
  }
  console.log();
};

const prompt = async () =>
  inquirer.prompt({
    type: 'list',
    name: 'action',
    message: 'What to do?',
    choices: [
      {
        name: 'Skip',
        value: 'skip',
        key: 's',
      },
      {
        name: 'Delete',
        value: 'delete',
        key: 'd',
      },
      new inquirer.Separator(),
      {
        name: 'Show matches',
        value: 'showMatches',
        key: 'm',
      },
      {
        name: 'Back',
        value: 'back',
        key: 'b',
      },
    ],
  });

const printStatus = (keys, notFoundKeys, currentKeyIndex, toDelete) => {
  console.log(
    `${currentKeyIndex}/${notFoundKeys.length}`,
    `Marked for deletion: ${toDelete.length}`,
    `Total: ${keys.length}`
  );
};

const promptForDeletion = async (keys = []) => {
  const localKeys = keys.filter(k => k.keyUsage.files.length < 1);
  let toDelete = [];
  let showMatches = false;

  let i = 0;
  while (i < localKeys.length) {
    const key = localKeys[i];
    console.log('sm', showMatches);
    clear();
    printStatus(keys, localKeys, i, toDelete);
    await displayKeyInfo(key, showMatches);
    const { action } = await prompt();

    if (action === 'delete') {
      toDelete.push(key.name);
    } else {
      toDelete = toDelete.filter(k => k !== key.name);
    }

    showMatches = false;
    if (action === 'showMatches') {
      showMatches = true;
    } else if (action === 'back') {
      i = Math.max(i - 1, 0);
    } else {
      i++;
    }
  }

  return toDelete;
};

const deleteKeys = async (translations, toDelete) => {
  const localTranslations = { ...translations };
  toDelete.forEach(td => delete localTranslations[td]);

  return localTranslations;
};

const manualCleanup = async (keys = [], translations) => {
  const toDelete = await promptForDeletion(keys);
  const cleanedTranslations = await deleteKeys(translations, toDelete);

  return JSON.stringify(cleanedTranslations, undefined, 2) + '\n';
};

module.exports = manualCleanup;
