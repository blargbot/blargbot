import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

export class FallBackSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'fallback',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['message'],
                    description: 'Should any tag fail to parse, it will be replaced with `message` instead of an error.',
                    exampleCode: '{fallback;This tag failed} {abc}',
                    exampleOut: 'This tag failed',
                    returns: 'nothing',
                    execute: (ctx, [message]) => this.setFallback(ctx, message.value)
                },
                {
                    parameters: [],
                    description: 'Clears the current fallback text.',
                    exampleCode: '{fallback;This tag failed} {abc} {fallback} {xyz}',
                    exampleOut: 'This tag failed  `Unknown subtag xyz`',
                    returns: 'nothing',
                    execute: (ctx) => this.setFallback(ctx, undefined)
                }
            ]
        });
    }

    public setFallback(context: BBTagContext, value: string | undefined): void {
        context.scopes.local.fallback = value;
    }
}
