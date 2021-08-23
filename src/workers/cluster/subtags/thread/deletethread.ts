import { BaseSubtag } from '@cluster/bbtag';
import { guard, SubtagType } from '@cluster/utils';

export class DeleteThreadSubtag extends BaseSubtag {
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
                    execute: async (context, _, subtag): Promise<string> => {
                        if (!guard.isThreadChannel(context.channel))
                            return this.customError('Not a thread channel', context, subtag);
                        if (!context.permissions.has('MANAGE_THREADS'))
                            return this.customError('I need to be able to manage threads to delete one', context, subtag);
                        try {
                            await context.channel.delete();
                            return 'true';
                        } catch (e: unknown) {
                            context.logger.error(e);
                            if (e instanceof Error) {
                                return this.customError(e.message, context, subtag);
                            }
                            return this.customError('Could not delete thread', context, subtag);
                        }
                    }
                }
            ]
        });
    }
}
