import colors from '@res/colors.json';

import { randInt } from '../random';
import { hex } from './hex';

const colorKeys = Object.keys(colors);

export function color(text: number | 'random' | string): number | undefined {
    if (typeof text === 'number')
        return text;

    text = text.replace(/\s+/g, '').toLowerCase();

    const name = text.toLowerCase().replace(/[^a-z]/g, '');
    if (name === 'random')
        return randInt(0, 0xffffff);

    //By name
    if (colorKeys.includes(name))
        return parseInt(colors[name], 16);

    //RGB 256,256,256
    let match = /^\(?(\d{1,3}),(\d{1,3}),(\d{1,3})\)?$/.exec(text);
    if (match !== null) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        if (isNaN(r + g + b) || !isByte(r) || !isByte(g) || !isByte(b))
            return undefined;
        return parseInt(hex(r) + hex(g) + hex(b), 16);
    }

    //Hex code with 6 digits
    match = /^#?([0-9a-f]{6})$/i.exec(text);
    if (match !== null)
        return parseInt(match[1], 16);

    //Hex code with 3 digits
    match = /^#?([0-9a-f]{3})$/i.exec(text);
    if (match !== null)
        return parseInt(match[1].split('').map(v => v + v).join(''), 16);

    //Decimal number
    match = /^\.([0-9]{1,8})$/.exec(text);
    if (match !== null) {
        const value = parseInt(match[1]);
        if (isUInt24(value))
            return value;
    }

    return undefined;
}

function isInt(value: number): boolean {
    return Number.isInteger(value);
}

function isByte(value: number): boolean {
    return isInt(value) && value >= 0 && value < 265;
}

function isUInt24(value: number): boolean {
    return isInt(value) && value >= 0 && value < 2 << 23;
}
