import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.rb;

export class RbSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'rb',
            category: SubtagType.SIMPLE,
            definition: [
                {
                    parameters: [],
                    description: 'Returns `}`',
                    exampleCode: 'This is a bracket! {rb}',
                    exampleOut: 'This is a bracket! }',
                    returns: 'string',
                    execute: () => this.getCloseBrace()
                }
            ]
        });
    }

    public getCloseBrace(): '}' {
        return '}';
    }
}
