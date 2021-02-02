function color(text) {
    if (typeof text == 'number')
        return text;
    if (typeof text != 'string')
        return null;

    text = text.replace(/\s+/g, '').toLowerCase();

    let name = text.toLowerCase().replace(/[^a-z]/g, '');
    if (name == 'random')
        return bu.getRandomInt(0, 0xffffff);

    //By name
    let named = colors[name];
    if (named != null)
        return parseInt(named, 16);

    //RGB 256,256,256
    let match = text.match(/^\(?(\d{1,3}),(\d{1,3}),(\d{1,3})\)?$/);
    if (match != null) {
        let r = parseInt(match[1]),
            g = parseInt(match[2]),
            b = parseInt(match[3]),
            valid = (v => bu.between(v, 0, 255, true)),
            toHex = (v => v.toString(16).padStart(2, '0'));
        if (isNaN(r + g + b) || !valid(r) || !valid(g) || !valid(b))
            return null;
        console.debug('color: ' + toHex(r) + toHex(g) + toHex(b));
        return parseInt(toHex(r) + toHex(g) + toHex(b), 16);
    }

    //Hex code with 6 digits
    match = text.match(/^#?([0-9a-f]{6})$/i);
    if (match != null)
        return parseInt(match[1], 16);

    //Hex code with 3 digits
    match = text.match(/^#?([0-9a-f]{3})$/i);
    if (match != null)
        return parseInt(match[1].split('').map(v => v + v).join(''), 16);

    //Decimal number
    match = text.match(/^\.([0-9]{1,8})$/);
    if (match != null) {
        let value = parseInt(match[1]);
        if (bu.between(value, 0, 16777215, true))
            return value;
    }

    return null;
}

module.exports = { color }