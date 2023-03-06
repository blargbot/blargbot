import { randomInt } from 'node:crypto';

import { parseHex } from './parseHex.js';

export function createColorParser(colors: Record<string, number>): (text: number | 'random' | string) => number | undefined {
    return function parseColor(text: number | 'random' | string): number | undefined {
        if (typeof text === 'number')
            return text;

        text = text.replace(/\s+/g, '').toLowerCase();

        const name = text.toLowerCase().replace(/[^a-z]/g, '');
        if (name === 'random')
            return randomInt(0, 0xffffff);

        //By name
        if (name in colors)
            return colors[name];

        //RGB 256,256,256
        let match = /^\(?(\d{1,3}),(\d{1,3}),(\d{1,3})\)?$/.exec(text);
        if (match !== null) {
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            if (isNaN(r + g + b) || !isByte(r) || !isByte(g) || !isByte(b))
                return undefined;
            return parseInt(parseHex(r) + parseHex(g) + parseHex(b), 16);
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
    };
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
