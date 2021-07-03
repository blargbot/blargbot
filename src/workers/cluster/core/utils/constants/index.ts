import { Constants } from 'eris';
import * as command from './commandType';
import * as tag from './subtagType';
import * as variables from './subtagVariableType';

export { CommandType } from './commandType';
export * from './guildSettings';
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