import nock from 'nock';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import pageLoader from '../index.js';
import fs from 'fs';

/* eslint-disable no-underscore-dangle */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/* eslint-enable no-underscore-dangle */

const resolvePath = (filename) => path.resolve(__dirname, '..', '__fixtures__', filename);
const readFile = (filepath) => fs.readFileSync(filepath, 'utf8');

const htmlResult = readFile(resolvePath('index.html'))

nock('https://hexlet.io')
  .get('/courses')
  .reply(200, htmlResult )

test('index', async () => {
  pageLoader()

})

