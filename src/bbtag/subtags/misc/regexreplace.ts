import { BBTagContext } from '../../BBTagContext';
import { RegexSubtag } from '../../RegexSubtag';
import { SubtagType } from '../../utils';

export class RegexReplaceSubtag extends RegexSubtag {
    public constructor() {
        super({
            name: `regexreplace`,
            category: SubtagType.MISC,
            description: `Any bbtag in \`regex\` will not be resolved. Please consider using \`{apply}\` for a dynamic regex. \`regex\` will only succeed to compile if it is deemed a safe regular expression (safe regexes do not run in exponential time for any input)`,
            definition: [
                {
                    parameters: [`~regex#50000`, `replaceWith`],
                    description: `Replaces the \`regex\` phrase with \`replacewith\`. This is executed on the output of the containing tag.`,
                    exampleCode: `I like to eat cheese. {regexreplace;/cheese/;pie}`,
                    exampleOut: `I like to eat pie.`,
                    returns: `nothing`,
                    execute: (ctx, [regex, replaceWith]) => this.setOutputReplacement(ctx, regex.raw, replaceWith.value)
                },
                {
                    parameters: [`text`, `~regex#50000`, `replaceWith`],
                    description: `Replace the \`regex\` phrase with \`replaceWith\`. This is executed on \`text\`.`,
                    exampleCode: `I like {regexreplace;to consume;/o/gi;a} cheese. {regexreplace;/e/gi;n}`,
                    exampleOut: `I likn ta cansumn chnnsn.`,
                    returns: `string`,
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
