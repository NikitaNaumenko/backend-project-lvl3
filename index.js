import axios from 'axios';
import path from 'path';
import _ from 'lodash';
import { promises as fs } from 'fs';

export default (link, outputDir) => {
  const pageUrl = new URL(link);
  const fileName = [...pageUrl.host.split('.'), ..._.compact(pageUrl.pathname.split('/'))].join('-');
  const filepath = path.join(outputDir, `${fileName}.html`);
  const result = axios.get(link).then((response) => response.data)
    .then((data) => fs.writeFile(filepath, data))
    .then(() => fs.readFile(filepath, 'utf-8'));
  return result;
};
