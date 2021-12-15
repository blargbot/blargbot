import { DefinedSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class RbSubtag extends DefinedSubtag {
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
