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

const download = (urlString) => axios.get(urlString, { responseType: 'arraybuffer' })
  .then(({ data }) => data.toString());

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

export const urlToFilename = (url, defaultExt = '.html') => {
  const filename = _.trim(url.pathname, '/').replace(/\//g, '-');
  const { ext } = path.parse(filename);
  const name = _.first(filename.split('.'));
  const base = generateSlug(new URL(url.origin));
  const format = ext || defaultExt;

  return `${base}-${name}${format}`;
};

const prepareAssetsInfo = (html, baseUrl, assetsPath) => $('link,img,script', html)
  .toArray()
  .map(getTagInfo)
  .filter(({ attrValue }) => attrValue)
  .map((info) => ({ ...info, url: new URL(info.attrValue, baseUrl.origin) }))
  .filter(({ url }) => url.host === baseUrl.host)
  .map((info) => ({ ...info, filepath: path.join(assetsPath, urlToFilename(info.url)) }));

const prepareAssets = (initialHtml, assetsDirPath, origin) => {
  const assetsInfo = prepareAssetsInfo(initialHtml, assetsDirPath, origin);
  const updatedHtml = assetsInfo.reduce((html, {
    tagName, attrName, attrValue, filepath,
  }) => {
    const $$ = $.load(html, { decodeEntities: false });
    $$(`${tagName}[${attrName}='${attrValue}']`).attr(attrName, filepath);
    return $$.html();
  }, initialHtml);
  return { assetsInfo, updatedHtml };
};

const createDir = (dirpath) => fs.mkdir(dirpath);

export default (url, outputDir, renderer = 'silent') => {
  log('Inital data ', { url, outputDir });

  const pageUrl = new URL(url);
  const slug = generateSlug(pageUrl);
  const pageFile = `${slug}.html`;
  const pageFilePath = path.resolve(outputDir, pageFile);

  log(`Page file ${pageFile} is located: ${pageFilePath}`);

  const assetsDir = `${slug}_files`;
  const assetsDirPath = path.resolve(outputDir, assetsDir);

  return download(url)
    .then((data) => {
      log('Create assets directory: ', { assetsDirPath });
      return createDir(assetsDirPath).then(() => data);
    })
    .then((data) => {
      log('Process assets');
      const { assetsInfo, updatedHtml } = prepareAssets(data, pageUrl, assetsDir);
      const tasks = assetsInfo.map(({ filepath, url: assetUrl }) => ({
        title: `Download: ${assetUrl} into ${filepath}`,
        task: () => download(assetUrl.toString())
          .then((content) => fs.writeFile(path.resolve(outputDir, filepath), content, { encoding: 'utf-8' })),
      }));

      const listr = new Listr(tasks, { concurrent: true, renderer });
      return fs.writeFile(pageFilePath, updatedHtml).then(() => listr.run());
    });
};
