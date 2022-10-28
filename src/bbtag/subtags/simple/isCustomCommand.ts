import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation/index';
import templates from '../../text';
import { SubtagType } from '../../utils/index';

const tag = templates.subtags.isCustomCommand;

export class IsCustomCommandSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'isCustomCommand',
            aliases: ['isCC'],
            category: SubtagType.SIMPLE,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'boolean',
                    execute: (ctx) => this.isCC(ctx)
                }
            ]
        });
    }

    public isCC(context: BBTagContext): boolean {
        return context.isCC;
    }
}
