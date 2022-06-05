import { RegexSubtag } from '../../RegexSubtag';
import { SubtagType } from '../../utils';

export class RegexMatchSubtag extends RegexSubtag {
    public constructor() {
        super({
            name: 'regexmatch',
            category: SubtagType.ARRAY, //? Why?
            aliases: ['match'],
            definition: [
                {
                    parameters: ['text', '~regex#50000'],
                    description: 'Returns an array of everything in `text` that matches `regex`. Any bbtag in `regex` will not be resolved. Please consider using `{apply}` for a dynamic regex. ' +
                        '`regex` will only succeed to compile if it is deemed a safe regular expression ' +
                        '(safe regexes do not run in exponential time for any input)',
                    exampleCode: '{regexmatch;I have $1 and 25 cents;/\\d+/g}',
                    exampleOut: '["1", "25"]',
                    returns: 'string[]',
                    execute: (_, [text, regex]) => this.regexMatch(text.value, regex.raw)
                }
            ]
        });
    }

    public regexMatch(text: string, regexStr: string): string[] {
        const regex = this.createRegex(regexStr);
        const matches = text.match(regex);
        if (matches === null)
            return [];
        return matches;
    }
}
