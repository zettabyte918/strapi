'use strict';

const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const FileContentSearch = require('../utils/file-content-search');
const scanCode = require('./scan');
const manualCleanup = require('./manual-cleanup');

const DIRECTORIES = [path.join(__dirname, '../../../')];
const MATCH_PATTERNS = ['**/*.js'];
const IGNORE_PATTERNS = ['**/node_modules/**', '**/cache/**', '**/build/**'];

const fileContentSearch = new FileContentSearch(DIRECTORIES, MATCH_PATTERNS, IGNORE_PATTERNS);

const cleanupTranslationFile = async translationFilePath => {
  const translationFileAbsolutePath = path.isAbsolute(translationFilePath)
    ? translationFilePath
    : path.join(process.cwd(), translationFilePath);

  const translations = require(translationFileAbsolutePath);
  const keys = await scanCode(translations, fileContentSearch);

  const cleanedFile = await manualCleanup(_.values(keys), translations);
  fs.writeFileSync(translationFileAbsolutePath, cleanedFile, { encoding: 'utf8', flag: 'w' });
};

(async () => {
  await fileContentSearch.loadFiles();
  await cleanupTranslationFile(process.argv[2]);
})();
