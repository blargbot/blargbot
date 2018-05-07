const path = require('path'), fs = require('fs'), util = require('util');

const readdir = util.promisify(fs.readdir),
    writeFile = util.promisify(fs.writeFile),
    readFile = util.promisify(fs.readFile);

const oldPath = path.join(__dirname, '..', 'src', 'dcommands.old');
const newPath = path.join(__dirname, '..', 'src', 'dcommands');

global.Promise = require('bluebird');
global.dep = {
    Eris: require('eris'),
    reload: function () { return { patrons: '', donators: '' } }
};
global.config = { wolke: 'asdsad' };
global.bu = { escapeHTML() { } };

async function generate(file) {
    let text = await readFile(path.join(oldPath, file), { encoding: 'utf8' });
    let dependencies = [{ varname: 'BaseCommand', path: '\'../structures/BaseCommand\'' }];
    let r = / ?([a-z]+?) = require\(('.+?')\);?/gi;
    let m;
    do {
        m = r.exec(text);
        if (m) {
            dependencies.push({ varname: m[1], path: m[2] });
        }
    } while (m);

    let newFile = ``;

    if (dependencies.length > 0) {
        newFile += 'const ' + dependencies.map(d => `${d.varname} = require(${d.path})`).join(',\n    ') + ';\n\n';
    }

    let flagged = /^(var|const|let)/mg.test(text.replace('var e = module.exports = {};', ''));
    if (flagged) {
        let extra = text.substring(0, text.indexOf('e.execute') - 1);
        extra = extra.split('\n');
        let append = [];
        let wait = false;
        for (const l of extra) {
            if (l === 'var e = module.exports = {};') continue;
            if (l === 'e.init = () => {') wait = 'init';
            if (l.startsWith('e.flags')) wait = 'flag';
            if (wait === 'init') {
                if (l === '};') wait = false;
                continue;
            } else if (wait === 'flag') {
                if (l.endsWith('];')) wait = false;
                continue;
            }
            if (l.startsWith('e.')) continue;
            if (l.trim() !== '')
                append.push(l);
        }
        newFile += append.join('\n') + '\n\n';
    }

    file = file.split('.')[0];
    let className = file[0].toUpperCase() + file.substring(1) + 'Command';
    const mod = require('../src/dcommands.old/' + file);
    let params = [];
    params.push('name: ' + util.inspect(file));
    params.push('category: ' + mod.init.toString().match(/e\.category = (.+);/i)[1]);
    if (mod.hidden) params.push('hidden: true');
    if (mod.usage) params.push('usage: ' + util.inspect(mod.usage));
    if (mod.info) params.push('info: ' + util.inspect(mod.info));
    if (mod.onlyOn) params.push('onlyOn: ' + util.inspect(mod.onlyOn));
    if (mod.flags) params.push('flags: ' + util.inspect(mod.flags));
    if (mod.alias) {
        console.log(path.join(newPath, file) + '.js', ':', mod.alias);
    }

    let func = mod.execute.toString();
    func = func.substring(func.indexOf('{') + 1, func.lastIndexOf('}') - 1);
    func = func.split('\n');
    if (func[0].trim() === '') func.shift();
    if (func[func.length - 1].trim() === '') func.pop();
    func = func.join('\n');
    func = func.replace(/e\.flags/gi, 'this.flags');
    newFile += `class ${className} extends BaseCommand {
    constructor() {
        super({
${params.map(p => '            ' + p).join(',\n')}
        });
    }

    async execute(msg, words, text) {
${func}
    }
}

module.exports = ${className};
`
    return { text: newFile, flagged };
}


async function processCommands() {
    let files = await readdir(oldPath);
    // console.log(files);
    let manuals = [];
    for (const file of files) {
        if (file.endsWith('.js')) {
            let { text, flagged } = await generate(file);
            if (flagged) manuals.push(file);
            //await writeFile(path.join(newPath, file), text, { encoding: 'utf8' });
            console.log('Rewrote file', file);
        }
    }

    console.log('Done. Here are the commands you need to check manually:\n'
        + manuals.map(m => ' - ' + path.join(newPath, m) + ' | ' + path.join(oldPath, m)).join('\n'));
}

processCommands().catch(console.error);