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
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
