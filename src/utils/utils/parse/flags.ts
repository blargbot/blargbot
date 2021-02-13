import { words as getWords } from './words';

export type FlagDefinition = {
    flag: string
    word?: string,
    desc?: string
};

export type FlagResult = {
    undefined: string[];
    [flag: string]: string[] | undefined;
}

export function flags(definitions: FlagDefinition[], text: string | string[], noTrim = false): FlagResult {
    let words: string[];
    if (Array.isArray(text))
        words = getWords(text.slice(1).join(' '), noTrim);
    else
        words = getWords(text, noTrim);
    const output: FlagResult = { undefined: [] };
    let currentFlag = '';
    for (let i = 0; i < words.length; i++) {
        let pushFlag = true;
        if (words[i].startsWith('--')) {
            if (words[i].length > 2) {
                const flag = definitions.find(f => f.word == words[i].substring(2).toLowerCase());
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