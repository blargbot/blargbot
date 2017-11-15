const fs = require('fs');
const path = require('path');
const reload = require('require-reload')(require);

class Manager {
  constructor(client, name, base, extension) {
    this.client = client;
    if (this.constructor === Manager) {
      throw new Error("Can't instantiate an abstract class!");
    }
    this.name = name;
    this.list = {};
    this.builtList = {};
    this.base = base;
    this.extension = extension || 'js';
  }

  init() {
    if (this.modules)
      this.modules = this.modules.reload();
    else
      this.modules = require(`../../Production/${this.name}`);

    for (const key in this.modules) {
      if (key === 'index') continue;
      let obj = this.modules[key];
      if (typeof obj === 'object') {
        for (const subKey in obj) {
          this.build(key, subKey);
        }
      } else if (typeof obj === 'function') {
        this.build(key);
      }
    }
  }

  unload(...names) {
    let name = names[names.length - 1];
    delete this.builtList[name];
  }

  build(...names) {
    let mod = this.modules.get(...names);
    let name = names[names.length - 1];
    if (typeof mod === 'function') {
      this.builtList[name] = new mod(this.client);
      if (this.builtList[name] instanceof this.base) {
        console.module(`Built ${this.name} module: ${names.join('/')}`);
        return true;
      }
      else {
        delete this.builtList[name];
        return false;
      }
    } else this.builtList[name] = mod;
  }
}

module.exports = Manager;