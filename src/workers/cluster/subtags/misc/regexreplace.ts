import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { createSafeRegExp, SubtagType } from '@cluster/utils';

export class RegexReplaceSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'regexreplace',
            category: SubtagType.MISC,
            desc: 'Any bbtag in `regex` will not be resolved. Please consider using `{apply}` for a dynamic regex. ' +
            '`regex` will only succeed to compile if it is deemed a safe regular expression ' +
            '(safe regexes do not run in exponential time for any input) and is less than 2000 characters long.',
            definition: [
                {
                    parameters: ['~regex', 'replaceWith'],
                    description: 'Replaces the `regex` phrase with `replacewith`. This is executed on the output of the containing tag.',
                    exampleCode: 'I like to eat cheese. {regexreplace;/cheese/;pie}',
                    exampleOut: 'I like to eat pie.',
                    execute: (ctx, args, subtag) => this.regexReplace(ctx, undefined, args[0].raw, args[1].value, subtag)
                },
                {
                    parameters: ['text', '~regex', 'replaceWith'],
                    description: 'Replace the `regex` phrase with `replaceWith`. This is executed on `text`.',
                    exampleCode: 'I like {regexreplace;to consume;/o/gi;a} cheese. {regexreplace;/e/gi;n}',
                    exampleOut: 'I likn ta cansumn chnnsn.',
                    execute: (ctx, args, subtag) => this.regexReplace(ctx, args[0].value, args[1].raw, args[2].value, subtag)
                }
            ]
        });
    }

    public regexReplace(
        context: BBTagContext,
        text: string | undefined,
        regexStr: string,
        replaceWith: string,
        subtag: SubtagCall
    ): string | void {
        try {
            const regexResult = createSafeRegExp(regexStr);
            if (!regexResult.success) {
                let reason: string;
                switch(regexResult.reason) {
                    case 'invalid':
                        reason = 'Invalid Regex';
                        break;
                    case 'tooLong':
                        reason = 'Regex too long';
                        break;
                    case 'unsafe':
                        reason = 'Unsafe Regex';
                }
                return this.customError(reason, context, subtag);
            }
            if (text === undefined)
                context.state.replace = { regex: regexResult.regex, with: replaceWith};
            else
                return text.replace(regexResult.regex, replaceWith);
        } catch (e: unknown) {
            if (e instanceof Error)
                return this.customError(e.message, context, subtag);
        }
    }
}
