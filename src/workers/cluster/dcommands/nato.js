const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

let natoMap = {
    a: 'Alpha',
    b: 'Bravo',
    c: 'Charlie',
    d: 'Delta',
    e: 'Echo',
    f: 'Foxtrot',
    g: 'Golf',
    h: 'Hotel',
    i: 'India',
    j: 'Juliett',
    k: 'Kilo',
    l: 'Lima',
    m: 'Mike',
    n: 'November',
    o: 'Oscar',
    p: 'Papa',
    q: 'Quebec',
    r: 'Romeo',
    s: 'Sierra',
    t: 'Tango',
    u: 'Uniform',
    v: 'Victor',
    w: 'Whiskey',
    x: 'Xray',
    y: 'Yankee',
    z: 'Zulu'
};

class NatoCommand extends BaseCommand {
    constructor() {
        super({
            name: 'nato',
            category: newbutils.commandTypes.GENERAL,
            usage: 'nato <text>',
            info: 'Translates the given text into the NATO phonetic alphabet.'
        });
    }

    async execute(msg, words) {
        if (words[1]) {
            let input = words.slice(1).join(' ');
            let output = [];
            let temp = '';
            for (let char of input) {
                if (natoMap[char.toLowerCase()]) {
                    if (temp != '') {
                        output.push(temp);
                        temp = '';
                    }
                    output.push(natoMap[char.toLowerCase()]);
                } else {
                    temp += char;
                }
            }
            if (temp != '') output.push(temp);
            bu.send(msg, output.join(' '));
        } else {
            bu.send(msg, 'You must give me some input!');
        }
    }
}

module.exports = NatoCommand;
