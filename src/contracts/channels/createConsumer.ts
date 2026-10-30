import type { Channel, ConsumeMessage, Options } from 'amqplib';

export async function createConsumer(
    channel: Channel,
    queueName: string,
    handler: (message: ConsumeMessage) => Awaitable<void>,
    options?: Options.Consume
): Promise<AsyncDisposable> {
    const { consumerTag } = await channel.consume(queueName, msg => {
        if (msg === null)
            return;

        try {
            const result = handler(msg);
            if (result instanceof Promise)
                return void result.catch(error => channel.emit('error', error));
        } catch (error) {
            channel.emit('error', error);
        }
    }, options);
    const onClosed = (): void => {
        disposed = true;
    };
    channel.addListener('close', onClosed);

    let disposed = false;
    return {
        async [Symbol.asyncDispose]() {
            if (disposed)
                return;

            disposed = true;
            channel.removeListener('closed', onClosed);
            await channel.cancel(consumerTag);
        }
    };
}
