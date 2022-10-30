import { RegexSubtag } from '../../RegexSubtag';
import templates from '../../text';
import { SubtagType } from '../../utils/index';

const tag = templates.subtags.regexTest;

export class RegexTestSubtag extends RegexSubtag {
    public constructor() {
        super({
            name: 'regexTest',
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
