import sequelize, { ENUM, STRING, TEXT } from 'sequelize';
import { SubtagVariableType } from '../../../../workers/cluster/core/utils/constants/subtagVariableType'; // TODO Core shouldnt reference cluster
import { Logger } from '../../../Logger';

type BBTagVariable = {
    name: string;
    type: SubtagVariableType;
    scope: string;
    content: string;
};

export function createBBTagVariableModel(sequelize: sequelize.Sequelize, logger: Logger): sequelize.Model<BBTagVariable, BBTagVariable> {
    logger.module('Loading postgres model bbtag_variable');
    return sequelize.define<BBTagVariable, BBTagVariable>('bbtag_variable', {
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
