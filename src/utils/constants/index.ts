import { Constants } from 'eris';
import * as command from './commandType';
import * as tag from './subtagType';
import * as variables from './subtagVariableType';

export { CommandProperties, Type as CommandType } from './commandType';
export { SubtagProperties, Type as SubtagType } from './subtagType';
export { SubtagVariableProperties, Type as SubtagVariableType } from './subtagVariableType';
export { SubtagArgumentKind } from './subtagArgumentKind';
export { modlogColour } from './modlogColour';
export { ModerationType } from './moderationType';
export * from './guildSettings';

export const commandTypes = {
    properties: command.properties,
    ...command.Type
};

export const tagTypes = {
    properties: tag.properties,
    ...tag.Type
};

export const tagVariableTypes = {
    properties: variables.properties,
    ...variables.Type
};

export const defaultStaff =
    Constants.Permissions.kickMembers +
    Constants.Permissions.banMembers +
    Constants.Permissions.administrator +
    Constants.Permissions.manageChannels +
    Constants.Permissions.manageGuild +
    Constants.Permissions.manageMessages;

export const avatarColours = [
    0x2df952,
    0x2df9eb,
    0x2d6ef9,
    0x852df9,
    0xf92dd3,
    0xf92d3b,
    0xf9b82d,
    0xa0f92d
];