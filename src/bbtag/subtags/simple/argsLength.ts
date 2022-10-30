import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation/index';
import templates from '../../text';
import { SubtagType } from '../../utils/index';

const tag = templates.subtags.argsLength;

export class ArgsLengthSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'argsLength',
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
