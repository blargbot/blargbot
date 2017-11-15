const Manager = require('./Manager');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);

class LocaleManager extends Manager {
  constructor(client) {
    super(client, 'Locale', undefined);
    this.localeList = {};
  }

  init() {
    if (this.modules)
      this.modules = this.modules.reload();
    else
      this.modules = require(`../../Production/${this.name}`);
    this.localeList = {};
    for (const key in this.modules) {
      if (key === 'index' || key === 'en-US') continue;
      let obj = this.modules[key];
      if (obj.percentComplete >= 60)
        this.build(key);
    }
    if (process.env.SHARD_ID == 0) {
      fs.writeFile(path.join(__dirname, '..', '..', 'Locale', 'total.json'), JSON.stringify(this.modules), () => {
        // no-op
      });
    }
  }

  async save(locale = 'en') {
    let p = path.join(__dirname, '..', '..', 'Locale', locale);
    console.log(p);
    let l = this.localeList[locale];
    for (const key in l) {
      await writeFile(path.join(p, key + '.json'), JSON.stringify(l[key], null, 4));
    }
  }

  build(...names) {
    let mod = this.modules.get(...names);
    let name = names[names.length - 1];
    this.localeList[name] = mod;
  }

  getTemplate(locale = 'en', key = '') {
    let segments = key.split('.');
    if (!this.localeList[locale.toLowerCase()]) locale = 'en';
    let temp = this.localeList[locale.toLowerCase()];
    for (const segment of segments) {
      if (temp.hasOwnProperty(segment))
        temp = temp[segment];
      else return null;
    }
    if (temp === '') {
      if (locale === 'en') {
        temp = `The locale key '${key}' is blank. Please contact stupid cat#8160 to populate it.`;
      } else temp = this.getTemplate('en', key);
    }
    return temp;
  }
}

module.exports = LocaleManager;