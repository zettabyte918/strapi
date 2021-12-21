'use strict';

const { promisify } = require('util');
const path = require('path');
const readFile = promisify(require('fs').readFile);
const _ = require('lodash');
const glob = promisify(require('glob').glob);
const chalk = require('chalk');

const findFilesInDirectories = async (
  directories = [],
  matchPatterns = [],
  ignorePatterns = []
) => {
  let files = [];
  for (const directory of directories) {
    for (const pattern of matchPatterns) {
      files = files.concat(await glob(path.join(directory, pattern), { ignore: ignorePatterns }));
    }
  }
  return files;
};

const loadFilesInMemory = async files => {
  return Promise.all(
    files.map(async file => ({
      path: file,
      content: (await readFile(file)).toString(),
    }))
  );
};

const getMatches = async (content, matchedString) => {
  const lines = content.split('\n');
  const highlightedLines = [];

  for (const line of lines) {
    if (line.includes(matchedString)) {
      highlightedLines.push(
        line
          .split(matchedString)
          .join(chalk.bgMagentaBright(matchedString))
          .trim()
      );
    }
  }

  return highlightedLines;
};

class FileContentSearch {
  constructor(directories, matchPatterns, ignorePatterns) {
    this.directories = directories;
    this.matchPatterns = matchPatterns;
    this.ignorePatterns = ignorePatterns;
  }

  async loadFiles() {
    console.log('Searching for matching files');
    this.fileList = await findFilesInDirectories(
      this.directories,
      this.matchPatterns,
      this.ignorePatterns
    );
    console.log(`Found ${this.fileList.length} files`);

    console.log('Loading files content in memory');
    this.files = await loadFilesInMemory(this.fileList);
    console.log(`Loaded ${this.files.length} files in memory`);
  }

  async search(matchFunction) {
    const results = [];
    const localFiles = _.cloneDeep(this.files);

    for (const file of localFiles) {
      const matchedString = await matchFunction(file.content);

      if (matchedString) {
        file.matches = await getMatches(file.content, matchedString);
        results.push(file);
      }
    }
    return results;
  }

  async searchString(string) {
    return this.search(fileContent => {
      if (fileContent.includes(string)) return string;
      return null;
    });
  }
}

module.exports = FileContentSearch;

// (async () => {
//   const fcs = new FileContentSearch(
//     [path.join(__dirname, '../../../')],
//     ['**/*.js'],
//     ['**/node_modules/**', '**/cache/**', '**/build/**']
//   );

//   await fcs.loadFiles();
//   const results = await fcs.searchString('Auth.form.username.label');

//   console.log('Results:', results.length);
//   results.forEach(e => {
//     console.log(e.path);
//     e.matches.forEach(e => console.log(e));
//   });
// })();
