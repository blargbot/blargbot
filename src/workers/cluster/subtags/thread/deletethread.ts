import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { guard, SubtagType } from '@cluster/utils';
import { DiscordRESTError } from 'eris';

export class DeleteThreadSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'deletethread',
            category: SubtagType.THREAD,
            aliases: ['threadelete', 'threaddelete'],
            definition: [
                {
                    parameters: [],
                    description: 'Deletes the current thread and returns `true` if successful.',
                    exampleCode: '{deletethread}',
                    exampleOut: '(thread was deleted)',
                    returns: 'boolean',
                    execute: (ctx) => this.deleteThread(ctx)
                }
            ]
        });
    }

    public async deleteThread(context: BBTagContext): Promise<boolean> {
        if (!guard.isThreadChannel(context.channel))
            throw new BBTagRuntimeError('Not a thread channel');

        try {
            await context.channel.delete(context.auditReason());
            return true;
        } catch (err: unknown) {
            if (!(err instanceof DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError(`Failed to delete thread: ${err.message}`);
        }
    }
}
