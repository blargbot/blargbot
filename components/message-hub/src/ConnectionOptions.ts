import amqplib from 'amqplib';


export interface ConnectionOptions extends amqplib.Options.Connect {
    readonly prefetch?: number;
}
