import pg from 'pg';
import sequelize from 'sequelize';
import { sleep } from '../../utils';
import * as models from './postgresModels';
import { BaseModel } from './postgresModels/Base';
import { PostgresDbOptions } from '../types';
import { Logger } from '../../Logger';

delete (<Record<string, unknown>>pg).native; // TODO Do we need to do this?

type Models = typeof models;
type ModelType<T> = T extends BaseModel<infer T1, infer T2, infer T3> ? sequelize.Model<T1, T2, T3> : unknown


export class PostgresDb {
    public readonly sequelize: sequelize.Sequelize;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #clientModels: { [P in keyof Models]?: ModelType<InstanceType<Models[P]>> };
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #models: { [P in keyof Models]?: InstanceType<Models[P]> };

    public get models(): { [P in keyof Models]?: ModelType<InstanceType<Models[P]>> } { return this.#clientModels; }

    public constructor(
        public readonly logger: Logger,
        options: PostgresDbOptions
    ) {
        this.#clientModels = {};
        this.#models = {};
        this.sequelize = new sequelize.Sequelize(
            options.database,
            options.user,
            options.pass,
            {
                operatorsAliases: false,
                host: options.host,
                dialect: 'postgres',
                logging: this.logger.database,
                ...options.sequelize
            }
        );
    }

    public async authenticate(): Promise<void> {
        try {
            await this.sequelize.authenticate();
            this.logger.init('Connected to postgres. Loading models...');
            await this.loadModels();
        } catch (err) {
            this.logger.error('Failed to connect to postgres, retrying in 5 seconds', err);
            await sleep(5 * 1000);
            return await this.authenticate();
        }
    }

    private async loadModels(): Promise<void> {
        const keys = Object.keys(models);
        this.#models = {};
        this.#clientModels = {};
        for (const key of keys) {
            const Model = models[key];
            if (typeof Model !== 'function')
                continue;

            const model = this.#models[key] = new Model(this.sequelize, this.logger);
            if ('model' in model) {
                await model.model.sync({ force: false, alter: false });
                this.#clientModels[key] = model.model;
            }
        }
        this.logger.init('Database models loaded.');
    }
}