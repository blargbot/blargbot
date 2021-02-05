import sequelize from 'sequelize';

export abstract class BaseModel<TInstance, TAttributes, TCreationAttributes> {
    abstract get model(): sequelize.Model<TInstance, TAttributes, TCreationAttributes>

    constructor(
        public readonly db: sequelize.Sequelize,
        public readonly logger: CatLogger
    ) {
        logger.module('Loading database model ' + this.constructor.name);
    }


    async sync(force = false) {
        return await this.model.sync({ force });
    }
};