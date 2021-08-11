import { SubtagVariableType } from '@cluster/utils/constants/subtagVariableType'; // TODO Core shouldnt reference cluster
import { Logger } from '@core/Logger';
import { BBTagVariable } from '@core/types';
import { ENUM, Model, ModelCtor, Sequelize, STRING, TEXT } from 'sequelize';

export type BBTagVariableModel = ModelCtor<Model<BBTagVariable>>;

export function createBBTagVariableModel(sequelize: Sequelize, logger: Logger): BBTagVariableModel {
    logger.module('Loading postgres model bbtag_variable');
    return sequelize.define<Model<BBTagVariable>>('bbtag_variable', {
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
