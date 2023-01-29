import { RegexSubtag } from '../../RegexSubtag.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.regexMatch;

@Subtag.names('regexMatch', 'match')
@Subtag.ctorArgs()
export class RegexMatchSubtag extends RegexSubtag {
    public constructor() {
        super({
            category: SubtagType.ARRAY, //? Why?
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
