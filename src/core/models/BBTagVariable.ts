import sequelize, { ENUM, STRING, TEXT } from 'sequelize';
import { BaseModel } from './Base';

type CreationAttributes = Attributes;
type Instance = Attributes
type Attributes = {
    name: string;
    type: keyof typeof VariableType;
    scope: string;
    content: string;
};

export enum VariableType {
    GUILD_TAG = 1,
    GUILD_CC,
    LOCAL_TAG,
    AUTHOR,
    GLOBAL
}

export class BBTagVariableModel extends BaseModel<Instance, Attributes, CreationAttributes> {
    public readonly model: sequelize.Model<Instance, Attributes, CreationAttributes>;

    public constructor(
        db: sequelize.Sequelize,
        logger: CatLogger
    ) {
        super(db, logger);

        this.model = this.db.define<Instance, Attributes, CreationAttributes>('bbtag_variable', {
            name: {
                type: STRING,
                primaryKey: true,
                allowNull: false
            },
            type: {
                type: ENUM(...Object.keys(VariableType)),
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
}