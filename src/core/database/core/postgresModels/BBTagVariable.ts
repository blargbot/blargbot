import sequelize, { ENUM, STRING, TEXT } from 'sequelize';
import { SubtagVariableType } from '../../../../workers/cluster/core/utils/constants/subtagVariableType'; // TODO Core shouldnt reference cluster
import { BaseModel } from './Base';

type CreationAttributes = Attributes;
type Instance = Attributes
type Attributes = {
    name: string;
    type: SubtagVariableType;
    scope: string;
    content: string;
};

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
                type: ENUM(...Object.values(SubtagVariableType)),
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