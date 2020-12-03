import nock from 'nock';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import os from 'os';
import pageLoader from '../index.js';

/* eslint-disable no-underscore-dangle */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/* eslint-enable no-underscore-dangle */

const resolvePath = (...paths) => path.join(__dirname, '..', '__fixtures__', ...paths);

nock.disableNetConnect();
const scope = nock('https://hexlet.io').persist();

let dirPath;
beforeEach(async () => {
  dirPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

describe('positive', () => {
  test('download page', async () => {
    const htmlResponse = await fs.readFile(resolvePath('index.html'), 'utf-8');
    // console.log(resolvePath('hexlet-io-courses.html'))
    // console.log(resolvePath('hexlet-io-courses_files'))
    // console.log(resolvePath('hexlet-io-courses_files', 'nodejs.png'))
    scope
      .get('/courses')
      .reply(200, htmlResponse);

    scope
      .get('/assets/professions/nodejs.png')
      .replyWithFile(200, resolvePath('expected', 'hexlet-io-courses_files', 'assets-professions-nodejs.png'));

    const expected = await fs.readFile(resolvePath('expected', 'hexlet-io-courses.html'), 'utf-8');

    const result = await pageLoader('https://hexlet.io/courses', dirPath);
    expect(result).toEqual(expected);
  });
});
