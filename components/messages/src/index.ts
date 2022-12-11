import amqplib from 'amqplib';

import DurableAmqplibConnection from './DurableAmqplibConnection.js';

export async function connectDurable(...args: Parameters<typeof amqplib['connect']>): Promise<amqplib.Connection> {
    const connection = new DurableAmqplibConnection(amqplib.connect.bind(amqplib, ...args));
    await connection.waitOpen();
    return connection;
}
