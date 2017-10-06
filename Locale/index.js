const fs = require('fs');
const path = require('path');

let func = function (dirname, require2) {
    const reload = require('require-reload')(require2);
    const e = {

    };

    Object.defineProperty(e, 'get', {
        value: (...names) => {
            let temp = e;
            for (const name of names) {
                temp = temp[name];
                if (!temp)
                    return undefined;
            }
            return temp;
        },
        enumerable: false
    });

    Object.defineProperty(e, 'reload', {
        value: () => {
            return func(dirname, require2);
        },
        enumerable: false
    });

    let dirs = fs.readdirSync(dirname);
    for (const dir of dirs) {
        if (!dir.includes('.')) {
            Object.defineProperty(e, dir, {
                get: () => getFiles(dir),
                enumerable: true
            });
        }
    }

    const subFiles = {};

    function getFiles(directory) {
        if (subFiles[directory]) return subFiles[directory];
        const files = {};
        let names = fs.readdirSync(path.join(dirname, directory));
        for (const name of names) {
            if (name.endsWith('.js') || name.endsWith('.json')) {
                const thing = reload(`./${directory}/${name}`);
                Object.defineProperty(files, name.split('.')[0], {
                    get: () => thing,
                    enumerable: true
                });
            }
        }
        subFiles[directory] = files;
        return files;
    }

    return e;
};


module.exports = func(__dirname, require);