import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.argsarray;

export class ArgsArraySubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'argsarray',
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
