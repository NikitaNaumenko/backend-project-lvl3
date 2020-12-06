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
const fileExists = async (file) => fs.promises.access(file, fs.constants.F_OK)
  .then(() => true)
  .catch(() => false);

const baseUrl = 'https://ru.hexlet.io';
const basePath = '/courses';
const pageUrl = new URL(basePath, baseUrl);
const expectedDirPath = 'ru-hexlet-io-courses_files';
const pageFilename = resolvePath('ru-hexlet-io-courses');
let dirPath;
let pageContent;

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
    url: '/assets/packs/js/runtime.js',
    filepath: path.join(expectedDirPath, 'ru-hexlet-io-assets-packs-js-runtime.js'),
  },
  {
    format: 'html',
    url: '/courses',
    filepath: path.join(expectedDirPath, 'ru-hexlet-io-courses.html'),
  },
];
const formats = assets.map(({ format }) => format);
nock.disableNetConnect();
const scope = nock(baseUrl).persist();

beforeEach(async () => {
  dirPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));

  pageContent = await fs.readFile(resolvePath('index.html'));
  const promisesAssets = assets.map((asset) => fs.readFile(resolvePath('expected', asset.filepath)
    .then((data) => ({ ...asset, data }))));
  assets = await Promise.all(promisesAssets);
  scope.get(basePath).reply(200, pageContent);
  assets.forEach(({ url, data }) => nock.get(url).reply(200, data));
});

describe('positive cases', () => {
  test('load page', async () => {
    const fileAlreadyExist = await fileExists(path.join(dirPath, pageFilename));
    expect(fileAlreadyExist).toBe(false);

    await pageLoader(pageUrl.toString(), dirPath);

    const fileWasCreated = await fileExists(path.join(dirPath, pageFilename));
    expect(fileWasCreated).toBe(true);

    const actualContent = await fs.readFile(dirPath, pageFilename);
    expect(actualContent).toBe(pageContent.trim());
  });

  test.each(formats)('check .%s-resource', async (format) => {
    const { filepath, data } = assets.find((content) => content.format === format);

    const fileWasCreated = await fileExists(path.join(dirPath, filepath));
    expect(fileWasCreated).toBe(true);

    const actualContent = await fs.readFile(dirPath, filepath);
    expect(actualContent).toBe(data);
  });
});
