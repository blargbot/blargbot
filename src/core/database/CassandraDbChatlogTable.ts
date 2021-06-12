import { Client as Cassandra } from 'cassandra-driver';
import { Duration } from 'moment-timezone';
import { Chatlog, ChatlogsTable, ChatlogType } from './types';
import { metrics } from '../Metrics';
import { AnyMessage } from 'eris';
import { guard, snowflake } from '../../utils';

function stringifyType(type: ChatlogType): string {
    switch (type) {
        case ChatlogType.CREATE: return 'create';
        case ChatlogType.UPDATE: return 'update';
        case ChatlogType.DELETE: return 'delete';
        default: throw new Error(`Unknown chatlog type ${type}`);
    }
}


export class CassandraDbChatlogTable implements ChatlogsTable {
    public constructor(
        protected readonly cassandra: Cassandra,
        protected readonly logger: CatLogger
    ) {

    }
    public async get(messageId: string): Promise<Chatlog | undefined> {
        const map = await this.cassandra.execute(
            'SELECT channelid, id ' +
            'FROM chatlogs_map ' +
            'WHERE msgid = :id ' +
            'LIMIT 1',
            { id: messageId },
            { prepare: true });
        if (map.rows.length === 0)
            return undefined;
        const messages = await this.cassandra.execute(
            'SELECT * FROM chatlogs ' +
            'WHERE channelid = :channelid and id = :id ' +
            'LIMIT 1',
            map.rows[0],
            { prepare: true });
        if (messages.rows.length === 0)
            return undefined;
        const r = messages.rows[0];
        const message = {
            id: r.id,
            content: r.content,
            attachment: r.attachment,
            userid: r.userid,
            msgid: r.msgid,
            channelid: r.channelid,
            guildid: r.guildid,
            msgtime: new Date(r.msgtime),
            type: r.type,
            embeds: r.embeds
        };
        if (typeof message.embeds === 'string') {
            try {
                message.embeds = JSON.parse(message.embeds);
            } catch (err) {
                this.logger.log(r, message);
                this.logger.error(err);
            }
        }
        return message;
    }

    public async add(message: AnyMessage, type: ChatlogType, lifespanS: number | Duration = 604800): Promise<void> {
        metrics.chatlogCounter.labels(stringifyType(type)).inc();
        const lifespan = typeof lifespanS === 'number' ? lifespanS : lifespanS.asSeconds();
        const chatlog: Chatlog = {
            id: snowflake.create().toString(),
            content: message.content,
            attachment: message.attachments[0] ? message.attachments[0].url : undefined,
            userid: message.author.id,
            msgid: message.id,
            channelid: message.channel.id,
            guildid: guard.isGuildMessage(message) ? message.channel.guild.id : 'DM',
            msgtime: Date.now(),
            type: type,
            embeds: JSON.stringify(message.embeds)
        };
        await this.cassandra.execute(
            'INSERT INTO chatlogs (id, content, attachment, userid, msgid, channelid, guildid, msgtime, type, embeds)\n' +
            'VALUES (:id, :content, :attachment, :userid, :msgid, :channelid, :guildid, :msgtime, :type, :embeds)\n' +
            `USING TTL ${lifespan}`,
            chatlog,
            { prepare: true });
        await this.cassandra.execute(
            'INSERT INTO chatlogs_map (id, msgid, channelid)\n' +
            'VALUES (:id, :msgid, :channelid)\n' +
            `USING TTL ${lifespan}`,
            { id: chatlog.id, msgid: chatlog.msgid, channelid: chatlog.channelid },
            { prepare: true });
    }

    public async migrate(): Promise<void> {
        try {
            await this.cassandra.execute(
                'CREATE TABLE IF NOT EXISTS chatlogs (\n' +
                '    id BIGINT,\n' +
                '    channelid BIGINT,\n' +
                '    guildid BIGINT,\n' +
                '    msgid BIGINT,\n' +
                '    userid BIGINT,\n' +
                '    content TEXT,\n' +
                '    msgtime TIMESTAMP,\n' +
                '    embeds TEXT,\n' +
                '    type INT,\n' +
                '    attachment TEXT,\n' +
                '    PRIMARY KEY ((channelid), id)\n' +
                ')\n' +
                'WITH CLUSTERING ORDER BY(id DESC);');

            await this.cassandra.execute(
                'CREATE TABLE IF NOT EXISTS chatlogs_map (\n' +
                '    id BIGINT,\n' +
                '    msgid BIGINT,\n' +
                '    channelid BIGINT,\n' +
                '    PRIMARY KEY((msgid), id)\n' +
                ')\n' +
                'WITH CLUSTERING ORDER BY(id DESC);');
        } catch (err) {
            this.logger.error(err.message, err.stack);
        }
    }
}

