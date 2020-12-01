import axios from 'axios';
import path from 'path';
import _ from 'lodash';
import { promises as fs } from 'fs';

const generateSlug = (pageUrl) => {
  const url = new URL(pageUrl);
  return [...url.host.split('.'), ..._.compact(url.pathname.split('/'))].join('-');
};

const download = (url, filepath) => (
  axios.get(url).then((response) => response.data)
    .then((data) => fs.writeFile(filepath, data))
    .then(() => fs.readFile(filepath, 'utf-8'))
);

export default (url, outputDir) => {
  const fileName = generateSlug(url);
  const filepath = path.join(outputDir, `${fileName}.html`);
  return download(url, filepath);
};
