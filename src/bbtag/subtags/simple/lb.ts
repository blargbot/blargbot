import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.lb;

export class LbSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'lb',
            category: SubtagType.SIMPLE,
            description: 'Will be replaced by `{` on execution.',
            definition: [
                {
                    parameters: [],
                    description: 'Returns `{`',
                    exampleCode: 'This is a bracket! {lb}',
                    exampleOut: 'This is a bracket! {',
                    returns: 'string',
                    execute: () => this.getOpenBrace()
                }
            ]
        });
    }

    public getOpenBrace(): '{' {
        return '{';
    }
}
