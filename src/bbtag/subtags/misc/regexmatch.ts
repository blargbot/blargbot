import { RegexSubtag } from '../../RegexSubtag';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.regexmatch;

export class RegexMatchSubtag extends RegexSubtag {
    public constructor() {
        super({
            name: 'regexmatch',
            category: SubtagType.ARRAY, //? Why?
            aliases: ['match'],
            definition: [
                {
                    parameters: ['text', '~regex#50000'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
