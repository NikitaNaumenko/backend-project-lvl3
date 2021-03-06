#!/usr/bin/env node

import program from 'commander';
import pageLoader from '../index.js';

program
  .option('-o, --output <dir>', 'path to uploaded path', process.cwd())
  .arguments('<url>')
  .action((url, cmdObj) => pageLoader(url, cmdObj.output)
    .then((filepath) => console.log(`Page was loaded into: ${filepath}`))
    .catch((err) => {
      console.error(err.toString());
      process.exit(1);
    }))
  .parse(process.argv);
