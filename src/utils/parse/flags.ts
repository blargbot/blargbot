import { smartSplit } from '../humanize/smartSplit';

export type FlagDefinition = {
    flag: string
    word?: string,
    desc?: string
};

export type FlagResult = {
    undefined: string[];
    [flag: string]: string[] | undefined;
}

export function flags(definitions: Iterable<FlagDefinition>, text: string): FlagResult;
export function flags(definitions: Iterable<FlagDefinition>, text: string[]): FlagResult;
export function flags(definitions: Iterable<FlagDefinition>, text: readonly string[]): FlagResult;
export function flags(definitions: Iterable<FlagDefinition>, text: string | readonly string[]): FlagResult {
    const def: readonly FlagDefinition[] = Array.isArray(definitions) ? definitions : [...definitions];
    const words = typeof text === 'string' ? smartSplit(text) : [...text];
    const output: FlagResult = { undefined: [] };
    let currentFlag = '';
    for (let i = 0; i < words.length; i++) {
        let pushFlag = true;
        if (words[i].startsWith('--')) {
            if (words[i].length > 2) {
                const flag = def.find(f => f.word == words[i].substring(2).toLowerCase());
                if (flag) {
                    currentFlag = flag.flag;
                    output[currentFlag] = [];
                    pushFlag = false;
                }
            } else {
                currentFlag = '';
                pushFlag = false;
            }
        } else if (words[i].startsWith('-')) {
            if (words[i].length > 1) {
                const tempFlag = words[i].substring(1);

                for (const char of tempFlag) {
                    currentFlag = char;
                    output[currentFlag] = [];
                }
                pushFlag = false;
            }
        } else if (words[i].startsWith('\\-')) {
            words[i] = words[i].substring(1);
        }
        if (pushFlag) {
            if (currentFlag != '') {
                output[currentFlag]?.push(words[i]);
            } else {
                output['undefined'].push(words[i]);
            }
        }
    }
    return output;
}