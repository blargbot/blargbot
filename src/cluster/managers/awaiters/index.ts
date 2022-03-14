import { Logger } from '@core/Logger';

import { ComponentAwaiterFactory } from './ComponentAwaiterFactory';
import { MessageAwaiterFactory } from './MessageAwaiterFactory';
import { ReactionAwaiterFactory } from './ReactionAwaiterFactory';

export { Awaiter } from './Awaiter';

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
