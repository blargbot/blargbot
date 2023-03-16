import type { BBTagScript } from '../../BBTagScript.js';
import { RegexSubtag } from '../../RegexSubtag.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.regexSplit;

@Subtag.id('regexSplit')
@Subtag.ctorArgs()
export class RegexSplitSubtag extends RegexSubtag {
    public constructor() {
        super({
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text', '~regex#50000'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string[]',
                    execute: (ctx, [text, regex]) => this.regexSplit(ctx, text.value, regex.raw)
                }
            ]
        });
    }

    public regexSplit(context: BBTagScript, text: string, regexStr: string): string[] {
        const regex = this.createRegex(context.runtime, regexStr);
        return text.split(regex);
    }
}
