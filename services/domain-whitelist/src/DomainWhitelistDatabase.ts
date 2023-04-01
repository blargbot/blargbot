import type { Model, ModelStatic, Sequelize } from '@blargbot/sequelize';
import { DataTypes, makeColumn } from '@blargbot/sequelize';

import type { IDomainWhitelistDatabase } from './IDomainWhitelistDatabase.js';

interface DomainWhitelistTable {
    readonly domain: string;
}

export default class DomainWhitelistDatabase implements IDomainWhitelistDatabase {
    readonly #model: ModelStatic<Model<DomainWhitelistTable>>;

    public constructor(sequelize: Pick<Sequelize, 'define'>) {
        const x: Partial<DomainWhitelistTable> = {
            domain: undefined
        };
        this.#model = sequelize.define<Model<DomainWhitelistTable>>('domain_whitelist', {
            ...makeColumn('domain', DataTypes.STRING, x, { primaryKey: true, unique: true })
        });
    }

    public async set(domain: string, whitelisted: boolean): Promise<void> {
        if (whitelisted)
            await this.#model.upsert({ domain });
        else
            await this.#model.destroy({ where: { domain } });
    }

    public async check(domain: string): Promise<boolean> {
        return await this.#model.count({ where: { domain } }) > 0;
    }
}
