import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.argsLength;

@Subtag.names('argsLength')
@Subtag.ctorArgs()
export class ArgsLengthSubtag extends CompiledSubtag {
    public constructor() {
        super({
            category: SubtagType.SIMPLE,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleIn: tag.default.exampleIn,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (ctx) => this.getArgsLength(ctx)
                }
            ]
        });
    }

    public getArgsLength(context: BBTagContext): number {
        return context.input.length;
    }
}
