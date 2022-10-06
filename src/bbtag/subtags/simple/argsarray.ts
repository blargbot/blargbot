import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

export class ArgsArraySubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `argsarray`,
            category: SubtagType.SIMPLE,
            definition: [
                {
                    parameters: [],
                    description: `Gets user input as an array.`,
                    exampleCode: `Your input was {argsarray}`,
                    exampleIn: `Hello world!`,
                    exampleOut: `Your input was ["Hello","world!"]`,
                    returns: `string[]`,
                    execute: (ctx) => this.getInput(ctx)
                }
            ]
        });
    }

    public getInput(context: BBTagContext): string[] {
        return context.input;
    }
}
