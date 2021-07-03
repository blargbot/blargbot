import { humanize } from '../../globalCore';
import { FlagDefinition, FlagResult, MutableFlagResult } from '../../types';

export function flags(definitions: Iterable<FlagDefinition>, text: string, strict?: boolean): FlagResult;
export function flags(definitions: Iterable<FlagDefinition>, text: string[], strict?: boolean): FlagResult;
export function flags(definitions: Iterable<FlagDefinition>, text: readonly string[], strict?: boolean): FlagResult;
export function flags(definitions: Iterable<FlagDefinition>, text: string | readonly string[], strict = false): FlagResult {
    const words = typeof text === 'string' ? humanize.smartSplit(text) : [...text];
    const flagmap = new Map<string, string>();
    for (const definition of definitions) {
        flagmap.set(definition.flag, definition.flag);
        flagmap.set(definition.word, definition.flag);
    }

    const output: MutableFlagResult = { undefined: [] };

    let currentFlag = '';
    for (let i = 0; i < words.length; i++) {
        let pushFlag = true;
        if (words[i].startsWith('--')) {
            if (words[i].length > 2) {
                const flag = flagmap.get(words[i].substr(2).toLowerCase());
                if (flag !== undefined) {
                    currentFlag = flag;
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
                    if (!strict || flagmap.has(char.toLowerCase())) {
                        currentFlag = char;
                        output[currentFlag] = [];
                        pushFlag = false;
                    }
                }
            }
        } else if (words[i].startsWith('\\-')) {
            words[i] = words[i].substring(1);
        }
        if (pushFlag) {
            if (currentFlag !== '') {
                output[currentFlag]?.push(words[i]);
            } else {
                output['undefined'].push(words[i]);
            }
        }
    }
    output._ = output['undefined'];
    return output;
}
