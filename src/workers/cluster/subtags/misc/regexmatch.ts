import { BaseSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { bbtagUtil, createSafeRegExp, SubtagType } from '@cluster/utils';

export class RegexMatchSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'regexmatch',
            category: SubtagType.ARRAY, //? Why?
            definition: [
                {
                    parameters: ['text', '~regex'],
                    description: 'Returns an array of everything in `text` that matches `regex`. Any bbtag in `regex` will not be resolved. Please consider using `{apply}` for a dynamic regex. ' +
                        '`regex` will only succeed to compile if it is deemed a safe regular expression ' +
                        '(safe regexes do not run in exponential time for any input) and is less than 2000 characters long.',
                    exampleCode: '{regexmatch;I have $1 and 25 cents;/\\d+/g}',
                    exampleOut: '["1", "25"]',
                    execute: (_context, [{ value: text }, { raw: regexStr }]): string | void => {
                        try {
                            const regex = createSafeRegExp(regexStr);
                            if (!regex.success) {
                                let reason: string;
                                switch (regex.reason) {
                                    case 'invalid':
                                        reason = 'Invalid Regex';
                                        break;
                                    case 'tooLong':
                                        reason = 'Regex too long';
                                        break;
                                    case 'unsafe':
                                        reason = 'Unsafe Regex';
                                }
                                throw new BBTagRuntimeError(reason);
                            }
                            const matches = regex.regex.exec(text);
                            if (matches === null)
                                return '[]';
                            return JSON.stringify(bbtagUtil.tagArray.deserialize(JSON.stringify(regex.regex.exec(text))));
                        } catch (e: unknown) {
                            if (e instanceof Error)
                                throw new BBTagRuntimeError(e.message);
                        }
                    }
                }
            ]
        });
    }
}
