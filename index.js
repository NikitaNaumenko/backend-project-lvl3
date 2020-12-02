import axios from 'axios';
import path from 'path';
import _ from 'lodash';
import $ from 'cheerio';
import { promises as fs } from 'fs';

const generateSlug = (url) => {
  return [...url.host.split('.'), ..._.compact(url.pathname.split('/'))].join('-');
};

const download = (urlString) => axios.get(urlString, { responseType: 'arraybuffer' })
  .then(({ data }) => data.toString())
  .catch(({ message }) => {
    throw new Error(`Error while downloading page "${urlString}"\nReason - "${message}"`);
  });

const buildAssetUrl = (assetPath, origin) => new URL(assetPath, origin);

const prepareAssetsUrls = (html, assetsPath, origin) => {
  const links = $('img', html).toArray().map((elem) => $(elem).attr('src'));
  const assetsUrl = links.reduce((link) => {...acc, [link]: buildAssetUrl(link, origin) }, {});
  return assetsUrl;
};

const replaceUrls = (html, urls) => {
  $('img', html).map((elem))
}

export default (url, outputDir) => {
  console.log(`Passed url: ${url}`);
  console.log(`Passed outputDir: ${outputDir}`);

  const pageUrl = new URL(url);
  const slug = generateSlug(pageUrl);
  const pageFile = `${slug}.html`;
  const pageFilePath = path.resolve(outputDir, pageFile);
  console.log(`Page file ${pageFile} is located: ${pageFilePath}`);

  const assetsDir = `${slug}_files`;
  const assetsDirPath = path.resolve(outputDir, assetsDir);
  console.log(`Assets dir is ${assetsDir} is located: ${assetsDirPath}`);

  return download(url)
    .then((data) => prepareAssets(data, assetsDirPath, pageUrl.origin))
    // .then((data) => fs.writeFile(pageFilePath, data))
    // .then(() => fs.readFile(pageFilePath, 'utf-8'));
};
