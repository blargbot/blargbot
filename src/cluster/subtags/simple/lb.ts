import { DefinedSubtag } from '@blargbot/cluster/bbtag';
import { SubtagType } from '@blargbot/cluster/utils';

export class LbSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'lb',
            category: SubtagType.SIMPLE,
            desc: 'Will be replaced by `{` on execution.',
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
