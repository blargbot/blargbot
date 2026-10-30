import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/CompiledSubtag.js';
import { BBTagRuntimeError } from '../../errors/BBTagRuntimeError.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { CompileRegexFeature } from '../types.js';

const tag = templates.subtags.regexReplace;

type Features = CompileRegexFeature;
export class RegexReplaceSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
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
        this.#features = features;
    }

    public async setOutputReplacement(context: BBTagContext, regexStr: string, replacement: string): Promise<void> {
        const match = /^\/?(?<body>.+?)\/(?<flags>[igmsuy]*)$/.exec(regexStr);
        if (match === null)
            throw new BBTagRuntimeError('Invalid Regex');
        const { body = '', flags = '' } = match.groups ?? {};
        const result = await this.#features.compileRegex(body, flags);
        if (result.success)
            context.root.output.replace = value => result.regex.replace(value, replacement);
        else {
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

    public async regexReplace(text: string, regexStr: string, replaceWith: string): Promise<string> {
        const match = /^\/?(?<body>.+?)\/(?<flags>[igmsuy]*)$/.exec(regexStr);
        if (match === null)
            throw new BBTagRuntimeError('Invalid Regex');
        const { body = '', flags = '' } = match.groups ?? {};
        const result = await this.#features.compileRegex(body, flags);
        if (result.success)
            return await result.regex.replace(text, replaceWith);
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
