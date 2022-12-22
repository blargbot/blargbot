import { RegexSubtag } from '../../RegexSubtag.js';

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
