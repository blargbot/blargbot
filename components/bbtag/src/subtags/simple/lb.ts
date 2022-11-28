import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.lb;

export class LbSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'lb',
            category: SubtagType.SIMPLE,
            description: tag.description,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
