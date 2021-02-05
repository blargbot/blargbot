import sequelize, { ENUM, STRING, TEXT } from 'sequelize';
import { BaseModel } from './Base';

type CreationAttributes = any;
type Instance = any;
type Attributes = any;

export class BBTagVariableModel extends BaseModel<Instance, Attributes, CreationAttributes> {
    readonly #model: sequelize.Model<Instance, Attributes, CreationAttributes>;
    get model() { return this.#model; }

    constructor(
        db: sequelize.Sequelize,
        logger: CatLogger
    ) {
        super(db, logger);

        this.#model = this.db.define<Instance, Attributes, CreationAttributes>('bbtag_variable', {
            name: {
                type: STRING,
                primaryKey: true,
                allowNull: false
            },
            type: {
                type: ENUM(
                    'GUILD_TAG', 'GUILD_CC', 'LOCAL_TAG', 'LOCAL_CC', 'AUTHOR', 'GLOBAL'
                ),
                primaryKey: true,
                allowNull: false
            },
            scope: {
                type: STRING,
                primaryKey: true,
                allowNull: false
            },
            content: {
                type: TEXT,
                allowNull: false
            }
        });
    }
};