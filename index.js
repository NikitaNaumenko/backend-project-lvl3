import axios from 'axios';
import path from 'path';
import _ from 'lodash';
import $ from 'cheerio';
import debug from 'debug';
import 'axios-debug-log';
import Listr from 'listr';
import { promises as fs } from 'fs';

const log = debug('page-loader');

const generateSlug = ({ host, pathname }) => _.trim(`${host}${pathname}`, '/').replace(/[/.]/g, '-');

export const urlToFilename = (url, defaultExt = '.html') => {
  const { ext, dir, base } = path.parse(url.pathname);
  const name = _.first(base.split('.'));
  const urlWithoutFormat = new URL(path.join(dir, name), url.origin);
  const slug = generateSlug(urlWithoutFormat);
  const format = ext || defaultExt;

  return `${slug}${format}`;
};

const load = (urlString) => axios.get(urlString, { responseType: 'arraybuffer' }).then(({ data }) => data);

const downloadAsset = (assetUrl, filepath, outputDir) => (
  load(assetUrl.toString())
    .then((content) => fs.writeFile(path.resolve(outputDir, filepath),content))
);

const assetLinkMap = {
  link: 'href',
  img: 'src',
  script: 'src',
};

const getTagInfo = (tag) => {
  const tagName = tag.name;
  const attrName = assetLinkMap[tagName];
  const attrValue = tag.attribs[attrName];
  return { tagName, attrName, attrValue };
};

const prepareAssetsInfo = (html, baseUrl, assetsPath) => $('link,img,script', html)
  .toArray()
  .map(getTagInfo)
  .filter(({ attrValue }) => attrValue)
  .map((info) => ({ ...info, url: new URL(info.attrValue, baseUrl.origin) }))
  .filter(({ url }) => url.host === baseUrl.host)
  .map((info) => ({ ...info, filepath: path.join(assetsPath, urlToFilename(info.url)) }));

const prepareAssets = (initialHtml, assetsDirPath, origin) => {
  log('Preparing assets...');

  const assetsInfo = prepareAssetsInfo(initialHtml, assetsDirPath, origin);
  log('Assets prepared.');

  log('Preparing new HTML...');
  const updatedHtml = assetsInfo.reduce((html, {
    tagName, attrName, attrValue, filepath,
  }) => {
    const $$ = $.load(html, { decodeEntities: false });
    $$(`${tagName}[${attrName}='${attrValue}']`).attr(attrName, filepath);
    return $$.html();
  }, initialHtml);
  log('new was HTML prepared');

  return Promise.resolve({ assetsInfo, updatedHtml });
};

const createDir = (dirpath) => fs.mkdir(dirpath);
const prepareTasks = ({ assetsInfo, updatedHtml }, outputDir, pageFilePath) => {
  log('Preparing download assets tasks...');

  const assetsTasks = assetsInfo.map(({ filepath, url: assetUrl }) => ({
    title: `Download: ${assetUrl} into ${filepath}`,
    task: () => downloadAsset(assetUrl, filepath, outputDir),
  }));

  const writeUpdatedHtmlTask = {
    title: `Write update html into ${pageFilePath}`,
    task: () => fs.writeFile(pageFilePath, updatedHtml),
  };
  const tasks = [...assetsTasks, writeUpdatedHtmlTask];

  return tasks;
};

const runTasks = (tasks, renderer) => {
  log('Tasks are running...');
  const listr = new Listr(tasks, { concurrent: true, renderer });
  return listr.run();
};

export default (url, outputDir, renderer = 'silent') => {
  log('Inital data ', { url, outputDir });

  const pageUrl = new URL(url);
  const slug = generateSlug(pageUrl);
  const pageFile = `${slug}.html`;
  const pageFilePath = path.resolve(outputDir, pageFile);

  log(`Page file ${pageFile} is located: ${pageFilePath}`);

  const assetsDir = `${slug}_files`;
  const assetsDirPath = path.resolve(outputDir, assetsDir);
  log('Output dir is', assetsDirPath);

  return createDir(assetsDirPath)
    .then(() => load(url))
    .then((data) => prepareAssets(data.toString(), pageUrl, assetsDir))
    .then((preparedInfo) => prepareTasks(preparedInfo, outputDir, pageFilePath))
    .then((tasks) => runTasks(tasks, renderer))
    .then(() => pageFilePath);
};
