import type { BBTagInput, FlagDefinition, FlagResult } from '../types.js';

export function parseInput(input: string, flags: readonly FlagDefinition[]): BBTagInput {
    return {
        raw: input,
        array: splitInput(input).map(x => x.value),
        flags: parseFlags(flags, input)
    };
}

export function joinInput(source: string[]): string {
    return source.map(item => {
        const escaped = item.replace(/["\\]/g, '\\$&');
        if (escaped.length === 0)
            return '""';
        return escaped.includes(' ') ? `"${escaped}"` : escaped;
    }).join(' ');
}

interface InputToken { value: string; escapedStart: boolean; }
function splitInput(source: string): InputToken[] {
    const results: InputToken[] = [];
    let current: InputToken | undefined;
    let atWordStart = true;
    let noMoreClosingQuotes = false;

    for (let i = 0; i < source.length; i++) {
        const char = source[i];

        if (char === ' ') {
            if (current !== undefined)
                results.push(current);
            current = undefined;
            atWordStart = true;
            continue;
        }

        if (char === '"' && atWordStart && !noMoreClosingQuotes) {
            const quoted = readQuoted(source, i);
            if (quoted !== undefined) {
                current = { value: quoted.value, escapedStart: false };
                i = quoted.end;
                atWordStart = false;
                continue;
            }
            noMoreClosingQuotes = true;
        }

        atWordStart = false;
        current ??= { value: '', escapedStart: char === '\\' };
        current.value += char === '\\' ? source[++i] ?? '' : char;
    }

    if (current !== undefined)
        results.push(current);
    return results;
}

function readQuoted(source: string, start: number): { value: string; end: number; } | undefined {
    let value = '';
    for (let i = start + 1; i < source.length; i++) {
        const char = source[i];
        if (char === '\\')
            value += source[++i] ?? '';
        else if (char === '"' && (i + 1 === source.length || source[i + 1] === ' '))
            return { value, end: i };
        else
            value += char;
    }
    return undefined;
}

function parseFlags(definitions: Iterable<FlagDefinition>, text: string): FlagResult {
    const flagMap = new Map<string, FlagChar>();
    for (const { word, flag } of definitions)
        flagMap.set(word, flag);

    let current: string[] = [];
    let currentFlag = '_' as FlagChar;
    const groups = new Map<FlagChar, string[]>();
    groups.set(currentFlag, current);

    const switchFlag = (flag: FlagChar): void => {
        currentFlag = flag;
        current = groups.getOrInsertComputed(flag, () => []);
    };

    for (const { value, escapedStart } of splitInput(text)) {
        if (escapedStart || !/^--?[a-z0-9]|^--$/i.test(value)) {
            current.push(value);
        } else if (value === '--') {
            if (currentFlag !== '_')
                switchFlag('_');
            else
                current.push(value);
        } else if (value.startsWith('--')) {
            const flagStr = value.split(' ')[0];
            const flag = flagMap.get(flagStr.slice(2));
            if (flag === undefined)
                current.push(value);
            else if (currentFlag !== flag)
                switchFlag(flag);
            if (flagStr.length < value.length)
                current.push(value.slice(flagStr.length + 1));
        } else {
            const flagStr = value.split(' ')[0];
            for (const char of flagStr.slice(1)) {
                if (isFlagChar(char) && currentFlag !== char)
                    switchFlag(char);
            }
            if (flagStr.length < value.length)
                current.push(value.slice(flagStr.length + 1));
        }
    }

    const result: Mutable<FlagResult> = { _: '' };
    for (const [key, values] of groups)
        result[key] = values.join(' ');

    return result;
}

const lowerLetters = 'abcdefghijklmnopqrstuvwxyz';
const digits = '0123456789_';
const flagChars = new Set([
    ...lowerLetters.split(''),
    ...lowerLetters.toUpperCase().split(''),
    ...digits.split('')
]);
type FlagChar = typeof flagChars extends Set<infer R> ? R : never;

export function isFlagChar(value: string): value is FlagChar {
    return flagChars.has(value);
}
