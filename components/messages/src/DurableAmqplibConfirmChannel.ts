import type amqplib from 'amqplib';

import DurableAmqplibChannel from './DurableAmqplibChannel.js';

export { DurableAmqplibConfirmChannel };
export default class DurableAmqplibConfirmChannel<Channel extends amqplib.ConfirmChannel> extends DurableAmqplibChannel<Channel> implements amqplib.ConfirmChannel {
    public async waitForConfirms(): Promise<void> {
        await this.invoke(c => c.waitForConfirms());
    }
}
