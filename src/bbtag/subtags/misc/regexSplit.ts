import { RegexSubtag } from '../../RegexSubtag';
import templates from '../../text';
import { SubtagType } from '../../utils/index';

const tag = templates.subtags.regexSplit;

export class RegexSplitSubtag extends RegexSubtag {
    public constructor() {
        super({
            name: 'regexSplit',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text', '~regex#50000'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
