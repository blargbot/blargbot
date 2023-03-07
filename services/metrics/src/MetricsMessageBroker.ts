import type { ConsumeMessage, MessageHandle, MessageHub } from '@blargbot/message-hub';
import { blobToJson } from '@blargbot/message-hub';
import type { MetricJson } from '@blargbot/metrics-client';
import { MetricsMessageBroker as ClientMetricsMessageBroker } from '@blargbot/metrics-client';

export class MetricsMessageBroker {
    static readonly #metrics = 'metrics-aggregator';

    readonly #messages: MessageHub;

    public constructor(messages: MessageHub) {
        this.#messages = messages;

        this.#messages.onConnected(c => c.assertExchange(...ClientMetricsMessageBroker.exchangeArgs));
    }

    public async handleMetrics(handler: (metrics: MetricJson[], msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            exchange: ClientMetricsMessageBroker.exchangeArgs[0],
            queue: MetricsMessageBroker.#metrics,
            filter: '#',
            handle: async (data, msg) => {
                await handler(await blobToJson(data), msg);
            }
        });
    }
}
