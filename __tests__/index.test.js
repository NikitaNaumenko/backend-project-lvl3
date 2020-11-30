import nock from 'nock';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import pageLoader from '../index.js';
import { promises as fs } from 'fs';
import os from 'os';

/* eslint-disable no-underscore-dangle */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/* eslint-enable no-underscore-dangle */

const resolvePath = (filename) => path.resolve(__dirname, '..', '__fixtures__', filename);
const readFile = async (filepath) => await fs.readFile(filepath, 'utf8');
const htmlResult = await readFile(resolvePath('index.html'))

let dirPath;
beforeEach(async () => {
  dirPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
})


test('index', async () => {
  nock('https://hexlet.io')
    .get('/courses')
    .reply(200, htmlResult )

  const result = await pageLoader('https://hexlet.io', dirPath)
  expect(result).toEqual(htmlResult)
})
