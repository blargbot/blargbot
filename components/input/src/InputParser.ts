import { isAlphanumeric } from '@blargbot/guards';

import type { FlagDefinition } from './FlagDefinition.js';
import type { FlagResult } from './FlagResult.js';
import type { FlagResultValueSet } from './FlagResultValueSet.js';
import { splitInput } from './splitInput.js';

export interface InputParser {
    (definitions: Iterable<FlagDefinition<unknown>>, text: string, strict?: boolean): { args: string[]; flags: FlagResult; };
}

export function parseInput(definitions: Iterable<FlagDefinition<unknown>>, text: string, strict = false): { args: string[]; flags: FlagResult; } {
    let currentFlag: keyof FlagResult = '_';
    let currentGroup: StringRange[] = [];
    const defArr = [...definitions];
    const resultGroups: FlagResultGroups = { _: [] };
    const flagMap = new Map(defArr.map(d => [d.word, d.flag]));
    const flagKeys = new Set<string>(defArr.map(d => d.flag));
    const args = [];

    for (const { start, end, value } of splitInput(text)) {
        args.push(value);
        const offset = text[start] === '"' && text[end - 1] === '"' ? 1 : 0;
        if (!/^--?[a-z0-9]|^--$/i.test(value)) {
            currentGroup.push({ start, end, value });
        } else if (text[start] !== '"' && text[start] !== value[0]) {
            currentGroup.push({ start, end, value });
        } else if (value === '--') {
            if (currentFlag !== '_') {
                pushFlagGroup(resultGroups, currentFlag, currentGroup);
                currentFlag = '_';
                currentGroup = [];
            } else {
                currentGroup.push({ start, end, value });
            }
        } else if (value.startsWith('--')) {
            const flagStr = value.split(' ')[0];
            const flag = flagMap.get(flagStr.slice(2));
            if (flag === undefined) {
                currentGroup.push({ start, end, value });
            } else if (currentFlag !== flag) {
                pushFlagGroup(resultGroups, currentFlag, currentGroup);
                currentFlag = flag;
                currentGroup = [];
            }
            if (flagStr.length < value.length)
                currentGroup.push({ start: start + flagStr.length + 1, end, value: value.slice(flagStr.length + 1) });
        } else {
            let flagMatched = !strict;
            const flagStr = value.split(' ')[0];
            for (const char of flagStr.slice(1)) {
                flagMatched ||= flagKeys.has(char);
                if (isAlphanumeric(char) && currentFlag !== char && (!strict || flagKeys.has(char))) {
                    flagMatched = true;
                    pushFlagGroup(resultGroups, currentFlag, currentGroup);
                    currentFlag = char;
                    currentGroup = [];
                }
            }
            if (!flagMatched)
                currentGroup.push({ start, end, value });
            else if (flagStr.length < value.length)
                currentGroup.push({ start: start + offset + flagStr.length + 1, end: end - offset, value: value.slice(flagStr.length + 1) });
        }
    }

    pushFlagGroup(resultGroups, currentFlag, currentGroup);

    const result: Mutable<FlagResult> = { _: toFlagResultSet(text, resultGroups._) };
    for (const [key, group] of Object.entries(resultGroups))
        result[key] = toFlagResultSet(text, group ?? []);

    return { args, flags: result };
}

type StringRange = { start: number; end: number; value: string; };
type FlagResultGroups = { -readonly [P in keyof FlagResult]: StringRange[][] }

function pushFlagGroup(groupsMap: FlagResultGroups, flag: keyof FlagResult, group: StringRange[]): void {
    const groups = groupsMap[flag] ??= [];
    if (group.length > 0)
        groups.push(group);
}

function toFlagResultSet(source: string, rangeGroups: StringRange[][]): FlagResultValueSet {
    const flatValues = rangeGroups.flat();
    return {
        length: flatValues.length,
        get(index: number) {
            if (index < 0 || index >= flatValues.length)
                return undefined;

            const result = flatValues[index];
            const start = result.start;
            const end = result.end;
            return {
                value: result.value,
                get raw() { return source.slice(start, end); }
            };
        },
        merge(...args: [] | [start: number, end?: number]) {
            const ranges = args.length === 0 ? rangeGroups : [...jaggedSlice(rangeGroups, ...args)];
            const result = [...mergeRanges(ranges, ' ')];
            return {
                value: result.map(r => r.value).join(' '),
                get raw() { return result.map(r => source.slice(r.start, r.end)).join(' '); }
            };
        },
        slice(start: number, end?: number) {
            return toFlagResultSet(source, [...jaggedSlice(rangeGroups, start, end)]);
        },
        toArray() {
            return flatValues.map(r => ({
                value: r.value,
                get raw() { return source.slice(r.start, r.end); }
            }));
        },
        map(mapFn) {
            return flatValues.map(r => mapFn({
                value: r.value,
                get raw() { return source.slice(r.start, r.end); }
            }));
        }
    };
}

function* jaggedSlice<T>(source: T[][], start: number, end = Infinity): Generator<T[]> {
    let j = 0;
    if (start < 0 || end < 0)
        throw new Error('Index out of range');

    for (const group of source) {
        if (j + group.length < start) {
            j += group.length;
        } else {
            yield group.slice(Math.max(start - j, 0), Math.max(end - j, 0));
            j += group.length;
        }

        if (j >= end)
            return;
    }
}

function* mergeRanges(rangeGroups: StringRange[][], join: string): Generator<StringRange> {
    for (const group of rangeGroups) {
        if (group.length === 0)
            continue;

        let { start, end, value } = group[0];
        for (let i = 1; i < group.length; i++) {
            const range = group[i];
            value += join + range.value;

            if (range.start < start)
                start = range.start;

            if (range.end > end)
                end = range.end;
        }

        yield { start, end, value };
    }
}
