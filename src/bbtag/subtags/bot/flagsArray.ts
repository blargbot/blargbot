import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation/index';
import templates from '../../text';
import { SubtagType } from '../../utils/index';

const tag = templates.subtags.flagsArray;

export class FlagsArraySubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'flagsArray',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleIn: tag.default.exampleIn,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string[]',
                    execute: (ctx) => this.flagKeys(ctx)
                }
            ]
        });
    }

    public flagKeys(context: BBTagContext): string[] {
        return Object.keys(context.flaggedInput);
    }
}
