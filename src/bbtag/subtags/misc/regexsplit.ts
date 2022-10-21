import { RegexSubtag } from '../../RegexSubtag';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.regexsplit;

export class RegexSplitSubtag extends RegexSubtag {
    public constructor() {
        super({
            name: 'regexsplit',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text', '~regex#50000'],
                    description: 'Splits the given text using the given `regex` as the split rule. Any bbtag in `regex` will not be resolved. Please consider using `{apply}` for a dynamic regex. `regex` will only succeed to compile if it is deemed a safe regular expression (safe regexes do not run in exponential time for any input)',
                    exampleCode: '{regexsplit;Hello      there, I       am hungry;/[\\s,]+/}',
                    exampleOut: '["Hello","there","I","am","hungry"]',
                    returns: 'string[]',
                    execute: (_, [text, regex]) => this.regexSplit(text.value, regex.raw)
                }
            ]
        });
    }

    public regexSplit(text: string, regexStr: string): string[] {
        const regex = this.createRegex(regexStr);
        return text.split(regex);
    }
}
