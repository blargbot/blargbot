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
