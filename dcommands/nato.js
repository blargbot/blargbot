var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.GENERAL;
};

e.isCommand = true;

e.requireCtx = require;
e.hidden = false;
e.usage = 'nato <text>';
e.info = 'Translates the given text into the NATO phonetic alphabet.';
e.longinfo = '<p>Translates the given text into the NATO phonetic alphabet.</p>';

let natoMap = {
    a: 'alpha',
    b: 'bravo',
    c: 'charlie',
    d: 'delta',
    e: 'echo',
    f: 'foxtrot',
    g: 'golf',
    h: 'hotel',
    i: 'india',
    j: 'juliett',
    k: 'kilo',
    l: 'lima',
    m: 'mike',
    n: 'november',
    o: 'oscar',
    p: 'papa',
    q: 'quebec',
    r: 'romeo',
    s: 'sierra',
    t: 'tango',
    u: 'uniform',
    v: 'victor',
    w: 'whiskey',
    x: 'xray',
    y: 'yankee',
    z: 'zulu'
}

e.execute = async function(msg, words) {
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
};