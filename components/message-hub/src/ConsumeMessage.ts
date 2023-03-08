import type amqplib from 'amqplib';

export class ConsumeMessage implements amqplib.ConsumeMessage {
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
