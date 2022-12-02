import { BBTagContext } from '../../BBTagContext.js';
import { RegexSubtag } from '../../RegexSubtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.regexReplace;

export class RegexReplaceSubtag extends RegexSubtag {
    public constructor() {
        super({
            name: 'regexReplace',
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
                    execute: (_, [text, regex, replaceWith]) => this.regexReplace(text.value, regex.raw, replaceWith.value)
                }
            ]
        });
    }

    public setOutputReplacement(context: BBTagContext, regexStr: string, replacement: string): void {
        context.data.replace = {
            regex: this.createRegex(regexStr),
            with: replacement
        };
    }

    public regexReplace(text: string, regexStr: string, replaceWith: string): string {
        const regex = this.createRegex(regexStr);
        return text.replace(regex, replaceWith);
    }
}
