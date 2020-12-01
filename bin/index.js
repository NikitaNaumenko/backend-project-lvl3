#!/usr/bin/env node

import program from 'commander';
import pageLoader from '../index.js';

program
  .option('-o, --output <dir>', 'path to uploaded path', process.cwd())
  .arguments('<url>')
  .action(async (url, cmdObj) => {
    try {
      await pageLoader(url, cmdObj.output);
    } catch (e) {
      console.log(e);
      process.exitCode = 1;
    }
  })
  .parse(process.argv);
