import { CompiledSubtag } from '../../compilation/CompiledSubtag.js';
import { BBTagRuntimeError } from '../../errors/BBTagRuntimeError.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { CompileRegexFeature } from '../types.js';

const tag = templates.subtags.regexMatch;

type Features = CompileRegexFeature;
export class RegexMatchSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'regexMatch',
            category: SubtagType.ARRAY, //? Why?
            aliases: ['match'],
            definition: [
                {
                    parameters: ['text', '~regex#50000'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string[]',
                    execute: (_, [text, regex]) => this.regexMatch(text.value, regex.raw)
                }
            ]
        });
        this.#features = features;
    }

    public async regexMatch(text: string, regexStr: string): Promise<string[]> {
        const match = /^\/?(?<body>.+?)\/(?<flags>[igmsuy]*)$/.exec(regexStr);
        if (match === null)
            throw new BBTagRuntimeError('Invalid Regex');
        const { body = '', flags = '' } = match.groups ?? {};
        const result = await this.#features.compileRegex(body, flags);
        if (result.success)
            return await result.regex.match(text);
        switch (result.cause) {
            case 'invalid':
                throw new BBTagRuntimeError('Invalid Regex');
            case 'tooLong':
                throw new BBTagRuntimeError('Regex too long');
            case 'unsafe':
                throw new BBTagRuntimeError('Unsafe Regex');
        }
    }
}
