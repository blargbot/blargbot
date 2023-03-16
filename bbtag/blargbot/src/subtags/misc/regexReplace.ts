import type { BBTagScript } from '../../BBTagScript.js';
import { RegexSubtag } from '../../RegexSubtag.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.regexReplace;

@Subtag.id('regexReplace')
@Subtag.ctorArgs()
export class RegexReplaceSubtag extends RegexSubtag {
    public constructor() {
        super({
            category: SubtagType.MISC,
            description: tag.description,
            definition: [
                {
                    parameters: ['~regex#50000', 'replaceWith'],
                    description: tag.output.description,
                    exampleCode: tag.output.exampleCode,
                    exampleOut: tag.output.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [regex, replaceWith]) => this.setOutputReplacement(ctx, regex.raw, replaceWith.value)
                },
                {
                    parameters: ['text', '~regex#50000', 'replaceWith'],
                    description: tag.text.description,
                    exampleCode: tag.text.exampleCode,
                    exampleOut: tag.text.exampleOut,
                    returns: 'string',
                    execute: (ctx, [text, regex, replaceWith]) => this.regexReplace(ctx, text.value, regex.raw, replaceWith.value)
                }
            ]
        });
    }

    public setOutputReplacement(context: BBTagScript, regexStr: string, replacement: string): void {
        context.runtime.outputOptions.replace = {
            regex: this.createRegex(context.runtime, regexStr),
            with: replacement
        };
    }

    public regexReplace(context: BBTagScript, text: string, regexStr: string, replaceWith: string): string {
        const regex = this.createRegex(context.runtime, regexStr);
        return text.replace(regex, replaceWith);
    }
}
