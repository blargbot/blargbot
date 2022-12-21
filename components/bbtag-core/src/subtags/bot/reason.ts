import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class ReasonSubtag extends Subtag {
    public constructor() {
        super({
            name: 'reason',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['reason?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [reason]) => this.setReason(ctx, reason.value)
                }
            ]
        });
    }

    public setReason(context: BBTagContext, reason: string): void {
        context.scopes.local.reason = reason;

    }
}
