import * as command from './commandType';
import * as tag from './subtagType';
import * as variables from './subtagVariableType';

export * from './guildSettings';
export * from './defaultStaff';
export * from './avatarColours';
export { CommandType } from './commandType';
export { ModerationType } from './moderationType';
export { ModlogColour } from './modlogColour';
export { SubtagArgumentKind } from './subtagArgumentKind';
export { SubtagType } from './subtagType';
export { SubtagVariableType } from './subtagVariableType';

export const commandTypes = {
    properties: command.properties,
    ...command.CommandType
};

export const tagTypes = {
    properties: tag.properties,
    ...tag.SubtagType
};

export const tagVariableTypes = {
    properties: variables.properties,
    ...variables.SubtagVariableType
};
