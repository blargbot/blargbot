import type amqplib from 'amqplib';

export class ConsumeMessage implements amqplib.ConsumeMessage {
    public static readonly requestHeader = 'x-request-id' as const;
    readonly #channel: amqplib.Channel;
    readonly #message: amqplib.ConsumeMessage;
    #ackSent: boolean;

    public get fields(): amqplib.ConsumeMessageFields {
        return this.#message.fields;
    }
    public get content(): Buffer {
        return this.#message.content;
    }
    public get properties(): amqplib.MessageProperties {
        return this.#message.properties;
    }

    public get replyTo(): string | undefined {
        const value = this.#message.properties.replyTo as unknown;
        return typeof value === 'string' ? value : undefined;
    }

    public get requestId(): string | undefined {
        const value = this.#message.properties.headers[ConsumeMessage.requestHeader] as unknown;
        return typeof value === 'string' ? value : undefined;
    }

    public constructor(channel: amqplib.Channel, message: amqplib.ConsumeMessage, canNack: boolean) {
        this.#channel = channel;
        this.#message = message;
        this.#ackSent = !canNack;
    }

    public ack(): void {
        if (this.#ackSent)
            return;
        this.#ackSent = true;
        try {
            this.#channel.ack(this.#message);
        } catch { /* NO-OP */ }
    }

    public nack(options: { allUpTo?: boolean; requeue?: boolean; } = {}): void {
        if (this.#ackSent)
            return;
        this.#ackSent = true;
        try {
            this.#channel.nack(this.#message, options.allUpTo, options.requeue);
        } catch { /* NO-OP */ }
    }
}
