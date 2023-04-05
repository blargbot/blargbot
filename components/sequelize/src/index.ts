import type { AttributeOptions, DataType, Model, QueryOptions, Sequelize, SyncOptions } from '@sequelize/core';
import { DataTypes as CoreDataTypes } from '@sequelize/core';

export * from '@sequelize/core';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const DataTypes = {
    ...CoreDataTypes,
    BIGINT: class BIGINT extends CoreDataTypes.BIGINT {
        public override parseDatabaseValue(value: unknown): bigint {
            switch (typeof value) {
                case 'bigint': return value;
                case 'number':
                case 'string': try {
                    return BigInt(value);
                } catch {  /* NO-OP */ }
            }
            throw new Error('Expected a bigint from the database');
        }
    }
};

export function makeColumn<Name extends keyof M, M extends object>(name: Name, type: DataType, base: Partial<M>, rest?: Partial<AttributeOptions<Model<M>>>): { [P in Name]: AttributeOptions<Model<M>> } {
    return {
        [name]: {
            type,
            allowNull: base[name] as unknown === null,
            defaultValue: base[name] as unknown ?? undefined,
            ...rest
        }
    } as { [P in Name]: AttributeOptions<Model<M>> };
}

export function sequelizeToService(sequelize: Sequelize, options: { syncOptions?: SyncOptions; authOptions?: QueryOptions; }): { start(): Promise<void>; stop(): Promise<void>; } {
    return {
        async start() {
            await sequelize.authenticate(options.authOptions);
            console.log('Database connected');
            if (options.syncOptions !== undefined) {
                await sequelize.sync(options.syncOptions);
                console.log('Database models syncronized');
            }
        },
        async stop() {
            await sequelize.close();
            console.log('Database disconnected');
        }
    };
}
