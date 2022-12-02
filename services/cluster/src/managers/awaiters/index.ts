import { Logger } from '@blargbot/logger';

import { ComponentAwaiterFactory } from './ComponentAwaiterFactory.js';
import { MessageAwaiterFactory } from './MessageAwaiterFactory.js';
import { ReactionAwaiterFactory } from './ReactionAwaiterFactory.js';

export { Awaiter } from './Awaiter.js';

export class AwaiterManager {
    public readonly messages: MessageAwaiterFactory;
    public readonly reactions: ReactionAwaiterFactory;
    public readonly components: ComponentAwaiterFactory;

    public constructor(logger: Logger) {
        this.messages = new MessageAwaiterFactory(logger);
        this.reactions = new ReactionAwaiterFactory(logger);
        this.components = new ComponentAwaiterFactory(logger);
    }
}
