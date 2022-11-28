import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation/index';
import templates from '../../text';
import { SubtagType } from '../../utils/index';

const tag = templates.subtags.argsArray;

export class ArgsArraySubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'argsArray',
            category: SubtagType.SIMPLE,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleIn: tag.default.exampleIn,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string[]',
                    execute: (ctx) => this.getInput(ctx)
                }
            ]
        });
    }

    public getInput(context: BBTagContext): string[] {
        return context.input;
    }
}
