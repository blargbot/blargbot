import type { Model, ModelStatic, Sequelize } from '@blargbot/sequelize';
import { DataTypes, makeColumn, Op } from '@blargbot/sequelize';

export interface QueryDetails {
    readonly channelId: bigint;
    readonly messageId: bigint;
    readonly type: string;
    readonly userId: bigint;
    readonly query: string;
    readonly choices: readonly string[];
    readonly requestId: string;
    readonly page: number;
    readonly replyTo: string;
    readonly timeout: Date;
    readonly locale: string;
}

export default class DiscordChoiceQueryDatabase {
    readonly #queries: ModelStatic<Model<QueryDetails>>;

    public constructor(sequelize: Pick<Sequelize, 'define' | 'transaction'>) {
        const x: Partial<QueryDetails> = {};
        this.#queries = sequelize.define<Model<QueryDetails>>('discord_choice_query', {
            ...makeColumn('channelId', DataTypes.BIGINT, x, { primaryKey: true }),
            ...makeColumn('messageId', DataTypes.BIGINT, x, { primaryKey: true }),
            ...makeColumn('type', DataTypes.STRING, x),
            ...makeColumn('userId', DataTypes.BIGINT, x),
            ...makeColumn('query', DataTypes.STRING, x),
            ...makeColumn('choices', DataTypes.ARRAY(DataTypes.STRING), x),
            ...makeColumn('requestId', DataTypes.STRING, x),
            ...makeColumn('page', DataTypes.INTEGER, x),
            ...makeColumn('replyTo', DataTypes.STRING, x),
            ...makeColumn('locale', DataTypes.STRING, x),
            ...makeColumn('timeout', DataTypes.DATE, x)
        });
    }

    public async delete(channelId: bigint, messageId: bigint): Promise<void> {
        await this.#queries.destroy({ where: { channelId, messageId } });
    }

    public async get(channelId: bigint, messageId: bigint): Promise<QueryDetails | undefined> {
        const model = await this.#queries.findOne({ where: { channelId, messageId } });
        return model?.get();
    }

    public async update(channelId: bigint, messageId: bigint, update: Partial<Omit<QueryDetails, 'channelId' | 'messageId'>>): Promise<void> {
        await this.#queries.update({ ...update }, { where: { channelId, messageId } });
    }

    public async set(details: QueryDetails): Promise<void> {
        await this.#queries.create(details);
    }

    public async getTimedOut(): Promise<QueryDetails[]> {
        const models = await this.#queries.findAll({ where: { timeout: { [Op.lte]: new Date() } } });
        return models.map(m => m.get());
    }
}
