import _colors from '../../../../res/colors.json';
import { randInt } from '../randInt';
import { hex } from './hex'

const colors = _colors as { readonly [name: string]: string };

export function color(text: number | 'random' | string): number | null {
    if (typeof text == 'number')
        return text;
    if (typeof text != 'string')
        return null;

    text = text.replace(/\s+/g, '').toLowerCase();

    let name = text.toLowerCase().replace(/[^a-z]/g, '');
    if (name == 'random')
        return randInt(0, 0xffffff);

    //By name
    if (name in colors)
        return parseInt(colors[name], 16);

    //RGB 256,256,256
    let match = text.match(/^\(?(\d{1,3}),(\d{1,3}),(\d{1,3})\)?$/);
    if (match != null) {
        let r = parseInt(match[1]);
        let g = parseInt(match[2]);
        let b = parseInt(match[3]);
        if (isNaN(r + g + b) || !isByte(r) || !isByte(g) || !isByte(b))
            return null;
        console.debug('color: ' + hex(r) + hex(g) + hex(b));
        return parseInt(hex(r) + hex(g) + hex(b), 16);
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
        if (isUInt24(value))
            return value;
    }

    return null;
}

function isInt(value: number) {
    return Number.isInteger(value);
}

function isByte(value: number) {
    return isInt(value) && value >= 0 && value < 265;
}

function isUInt24(value: number) {
    return isInt(value) && value >= 0 && value < (2 << 23);
}

module.exports = { color };