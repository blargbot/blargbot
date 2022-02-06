import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { guard, SubtagType } from '@cluster/utils';

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

        if (context.authorizer?.permissions.has('manageThreads') !== true)
            throw new BBTagRuntimeError('I need to be able to manage threads to delete one');

        try {
            await context.channel.delete();
            return true;
        } catch (e: unknown) {
            context.logger.error(e);
            if (e instanceof Error) {
                throw new BBTagRuntimeError(e.message);
            }
            throw new BBTagRuntimeError('Could not delete thread');
        }
    }
}
