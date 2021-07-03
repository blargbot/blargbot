import sequelize from 'sequelize';
import { Logger } from '../../../Logger';

export abstract class BaseModel<TInstance, TAttributes, TCreationAttributes> {
    abstract get model(): sequelize.Model<TInstance, TAttributes, TCreationAttributes>

    public constructor(
        public readonly db: sequelize.Sequelize,
        public readonly logger: Logger
    ) {
        logger.module('Loading database model ' + this.constructor.name);
    }


    public async sync(force = false): Promise<sequelize.Model<TInstance, TAttributes, TCreationAttributes>> {
        return await this.model.sync({ force });
    }
}
