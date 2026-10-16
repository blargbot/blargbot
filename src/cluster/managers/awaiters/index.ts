import type { ReactionEvent } from '@blargbot/bbtag';
import type { Logger } from '@blargbot/logger';
import { createPartitionedPushIterable, type PartitionedPushIterable } from '@blargbot/util';

import { ComponentAwaiterFactory } from './ComponentAwaiterFactory.js';
import { MessageAwaiterFactory } from './MessageAwaiterFactory.js';

export { Awaiter } from './Awaiter.js';
export * from './AwaiterFactoryBase.js';

export class AwaiterManager {
    public readonly messages: MessageAwaiterFactory;
    public readonly reactions: PartitionedPushIterable<ReactionEvent, string>;
    public readonly components: ComponentAwaiterFactory;

    public constructor(logger: Logger) {
        this.messages = new MessageAwaiterFactory(logger);
        this.reactions = createPartitionedPushIterable(item => item.message.id);
        this.components = new ComponentAwaiterFactory(logger);
    }
}
