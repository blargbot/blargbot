import type { BBTagScript } from '../../BBTagScript.js';
import { RegexSubtag } from '../../RegexSubtag.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.regexTest;

@Subtag.id('regexTest')
@Subtag.ctorArgs()
export class RegexTestSubtag extends RegexSubtag {
    public constructor() {
        super({
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text', '~regex#50000'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [text, regex]) => this.regexTest(ctx, text.value, regex.raw)
                }
            ]
        });
    }

    public regexTest(context: BBTagScript, text: string, regexStr: string): boolean {
        const regex = this.createRegex(context.runtime, regexStr);
        return regex.test(text);
    }
}
