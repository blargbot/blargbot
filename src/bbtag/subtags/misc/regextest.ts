import { RegexSubtag } from '../../RegexSubtag';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.regextest;

export class RegexTestSubtag extends RegexSubtag {
    public constructor() {
        super({
            name: 'regextest',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text', '~regex#50000'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'boolean',
                    execute: (_, [text, regex]) => this.regexTest(text.value, regex.raw)
                }
            ]
        });
    }

    public regexTest(text: string, regexStr: string): boolean {
        const regex = this.createRegex(regexStr);
        return regex.test(text);
    }
}
