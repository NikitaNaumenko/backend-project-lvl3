import axios from 'axios';
import path from 'path';
import _ from 'lodash';
import $ from 'cheerio';
import debug from 'debug';
import { promises as fs } from 'fs';

const log = debug('page-loader');

const generateSlug = (url) => [...url.host.split('.'), ..._.compact(url.pathname.split('/'))].join('-');

const download = (urlString) => axios.get(urlString, { responseType: 'arraybuffer' })
  .then(({ data }) => data.toString())
  .catch(({ message }) => {
    throw new Error(`Error while downloading page "${urlString}"\nReason - "${message}"`);
  });

const buildAssetUrl = (assetPath, origin) => new URL(assetPath, origin);

const assetLinkMap = {
  link: 'href',
  img: 'src',
  script: 'src',
};

const prepareAssetsInfo = (html, assetsPath, origin) => {
  const links = $('link,img,script', html).toArray().map((elem) => $(elem).attr('src'));

  return links.map((link) => ({
    url: buildAssetUrl(link, origin),
    filepath: path.join(assetsPath, _.trim(link, '/').replace(/\//g, '-')),
    key: link,
  }));
};

const prepareAssets = (initialHtml, assetsDirPath, origin) => {
  const assetsInfo = prepareAssetsInfo(initialHtml, assetsDirPath, origin);
  const updatedHtml = assetsInfo.reduce((html, elem) => {
    const $$ = $.load(html, { decodeEntities: false });
    $$(`img[src='${elem.key}']`).attr('src', elem.filepath);
    return $$.html();
  }, initialHtml);
  return { assetsInfo, updatedHtml };
};

const createDir = (dirpath) => fs.mkdir(dirpath);

export default (url, outputDir) => {
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
      const { assetsInfo, updatedHtml } = prepareAssets(data, assetsDir, pageUrl.origin);
      assetsInfo.map(({ filepath, url: assetUrl }) => {
        log(`Download: ${assetUrl} into ${filepath}`);

        return download(assetUrl.toString()).then((content) => fs.writeFile(path.resolve(assetsDirPath, filepath), Buffer.from(content, 'base64')));
      });

      return fs.writeFile(pageFilePath, updatedHtml);
    }).then(() => fs.readFile(pageFilePath, 'utf-8'));
};
