import * as eris from 'eris';

export const defaultStaff = eris.Constants.Permissions.kickMembers
    | eris.Constants.Permissions.banMembers
    | eris.Constants.Permissions.administrator
    | eris.Constants.Permissions.manageChannels
    | eris.Constants.Permissions.manageGuild
    | eris.Constants.Permissions.manageMessages;
