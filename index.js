import axios from 'axios';
import path from 'path';
import _ from 'lodash';
import { promises as fs } from 'fs';

const generateSlug = (pageUrl) => {
  const url = new URL(pageUrl);
  return [...url.host.split('.'), ..._.compact(url.pathname.split('/'))].join('-');
};

const download = (urlString) => axios.get(urlString, { responseType: 'arraybuffer' })
  .then(({ data }) => data.toString())
  .catch(({ message }) => {
    throw new Error(`Error while downloading page "${urlString}"\nReason - "${message}"`);
  });

export default (url, outputDir) => {
  console.log(`Passed url: ${url}`);
  console.log(`Passed outputDir: ${outputDir}`);

  const slug = generateSlug(url);
  const pageFile = `${slug}.html`;
  const pageFilePath = path.resolve(outputDir, pageFile);
  console.log(`Page file ${pageFile} is located: ${pageFilePath}`);

  const assetsDir = `${slug}_files`;
  const assetsDirPath = path.resolve(outputDir, assetsDir);
  console.log(`Assets dir is ${assetsDir} is located: ${assetsDirPath}`);

  return download(url)
    .then((data) => fs.writeFile(pageFilePath, data))
    .then(() => fs.readFile(pageFilePath, 'utf-8'));
};
