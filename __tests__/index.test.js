import nock from 'nock';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { promises as fs, constants as fsConstants } from 'fs';
import os from 'os';
import pageLoader from '../index.js';

/* eslint-disable no-underscore-dangle */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/* eslint-enable no-underscore-dangle */

const resolvePath = (...paths) => path.join(__dirname, '..', '__fixtures__', ...paths);
const fileExists = async (file) => fs.access(file, fsConstants.F_OK)
  .then(() => true)
  .catch(() => false);

const baseUrl = 'https://ru.hexlet.io';
const basePath = '/courses';
const pageUrl = new URL(basePath, baseUrl);
const expectedDirPath = 'ru-hexlet-io-courses_files';
let dirPath;
let expectedPageContnent = '';

let assets = [
  {
    format: 'css',
    url: '/assets/application.css',
    filepath: path.join(expectedDirPath, 'ru-hexlet-io-assets-application.css'),
  },
  {
    format: 'png',
    url: '/assets/professions/nodejs.png',
    filepath: path.join(expectedDirPath, 'ru-hexlet-io-assets-professions-nodejs.png'),
  },
  {
    format: 'js',
    url: '/packs/js/runtime.js',
    filepath: path.join(expectedDirPath, 'ru-hexlet-io-packs-js-runtime.js'),
  },
  {
    format: 'html',
    url: '/courses',
    filepath: path.join(expectedDirPath, 'ru-hexlet-io-courses.html'),
  },
];

const formats = assets.map(({ format }) => format);
const scope = nock(baseUrl).persist();

nock.disableNetConnect();

beforeAll(async () => {
  dirPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));

  const pageContent = await fs.readFile(resolvePath('index.html'));

  expectedPageContnent = await fs.readFile(resolvePath('expected', 'ru-hexlet-io-courses.html'), 'utf-8');
  const promisesAssets = assets.map((asset) => fs.readFile(resolvePath('expected', asset.filepath), 'utf-8')
    .then((data) => ({ ...asset, data })));
  assets = await Promise.all(promisesAssets);

  scope.get(basePath).reply(200, pageContent);
  assets.forEach(({ url, data }) => scope.get(url).reply(200, data));
});

describe('negative cases', () => {
  test('noaddr', async () => {
    const fileAlreadyExist = await fileExists(path.join(dirPath, 'ru-hexlet-io-courses.html'));
    expect(fileAlreadyExist).toBe(false);

    const expectedError = `getaddrinfo ENOTFOUND ${baseUrl}`;
    scope.get('/').replyWithError(expectedError);
    await expect(pageLoader(baseUrl, dirPath)).rejects.toThrow(expectedError);

    const fileCreated = await fileExists(path.join(dirPath, 'ru-hexlet-io-courses.html'));
    expect(fileCreated).toBe(false);
  });

  test.each([404, 500])('with status %s', async (httpCode) => {
    scope.get(`/${httpCode}`).reply(httpCode, '');
    await expect(pageLoader(new URL(`/${httpCode}`, baseUrl).toString(), dirPath))
      .rejects.toThrow(`Request failed with status code ${httpCode}`);
  });

  test('permission denied', async () => {
    const rootDirectory = '/etc';
    await expect(pageLoader(pageUrl.toString(), rootDirectory))
      .rejects.toThrow(`EACCES: permission denied, mkdir '${rootDirectory}/${expectedDirPath}'`);
  });
  test('no directory', async () => {
    const filepath = resolvePath('index.html');
    await expect(pageLoader(pageUrl.toString(), filepath))
      .rejects.toThrow(`ENOTDIR: not a directory, mkdir '${filepath}/${expectedDirPath}'`);
  });

  test('directory does not exist', async () => {
    const notExistsPath = resolvePath('notExistsPath');
    await expect(pageLoader(pageUrl.toString(), notExistsPath))
      .rejects.toThrow(`ENOENT: no such file or directory, mkdir '${notExistsPath}/${expectedDirPath}'`);
  });
});

describe('positive cases', () => {
  test('load page', async () => {
    const fileAlreadyExist = await fileExists(path.join(dirPath, 'ru-hexlet-io-courses.html'));
    expect(fileAlreadyExist).toBe(false);

    await pageLoader(pageUrl.toString(), dirPath);

    const fileWasCreated = await fileExists(path.join(dirPath, 'ru-hexlet-io-courses.html'));
    expect(fileWasCreated).toBe(true);

    const actualContent = await fs.readFile(path.join(dirPath, 'ru-hexlet-io-courses.html'), 'utf-8');
    expect(actualContent).toBe(expectedPageContnent);
  });

  test.each(formats)('check .%s-resource', async (format) => {
    const { filepath, data } = assets.find((content) => content.format === format);

    const fileWasCreated = await fileExists(path.join(dirPath, filepath));
    expect(fileWasCreated).toBe(true);

    const actualContent = await fs.readFile(path.join(dirPath, filepath), 'utf-8');
    expect(actualContent).toBe(data);
  });
});
