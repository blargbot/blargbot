import pg from 'pg';
import sequelize, { Options as SequelizeOptions } from 'sequelize';
import * as models from './models';
import { BaseModel } from './models/Base';

delete (<any>pg).native; // TODO Do we need to do this?

type Models = typeof models;
type ModelType<T> = T extends BaseModel<infer T1, infer T2, infer T3> ? sequelize.Model<T1, T2, T3> : unknown

export interface PostgresDbOptions {
    database: string;
    user: string;
    pass: string;
    host: string;
    sequelize: SequelizeOptions;
}

export class PostgresDb {
    public readonly sequelize: sequelize.Sequelize;
    #clientModels: { [P in keyof Models]?: ModelType<InstanceType<Models[P]>> };
    #models: { [P in keyof Models]?: InstanceType<Models[P]> };

    constructor(
        public readonly logger: CatLogger,
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

    async authenticate(): Promise<void> {
        try {
            await this.sequelize.authenticate();
            this.logger.init('Connected to postgres. Loading models...');
            await this.loadModels();
        } catch (err) {
            this.logger.error('Failed to connect to postgres, retrying in 5 seconds', err);
            await this.sleep(5 * 1000);
            return await this.authenticate();
        }
    }

    sleep(time: number) {
        return new Promise((res, rej) => {
            setTimeout(res, time);
        });
    }

    async loadModels() {
        const keys = Object.keys(models) as Array<keyof typeof models>;
        this.#models = {};
        this.#clientModels = {};
        for (const key of keys) {
            let Model = models[key];
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