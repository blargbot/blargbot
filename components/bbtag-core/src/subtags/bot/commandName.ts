import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class CommandNameSubtag extends Subtag {
    public constructor() {
        super({
            name: 'commandName',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleIn: tag.default.exampleIn,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx) => this.getTagName(ctx)
                }
            ]
        });
    }

    public getTagName(context: BBTagContext): string {
        return context.rootTagName;
    }
}
