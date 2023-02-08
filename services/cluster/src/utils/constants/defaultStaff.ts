import * as Eris from 'eris';

export const defaultStaff = Eris.Constants.Permissions.kickMembers
    | Eris.Constants.Permissions.banMembers
    | Eris.Constants.Permissions.administrator
    | Eris.Constants.Permissions.manageChannels
    | Eris.Constants.Permissions.manageGuild
    | Eris.Constants.Permissions.manageMessages;
