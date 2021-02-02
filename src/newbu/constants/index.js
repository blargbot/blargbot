const { Constants: { Permissions: perms } } = require('eris');

module.exports = {
    commandTypes: require('./commandType'),
    tagTypes: require('./tagType'),
    modlogColours: require('./modlogColour'),
    tagVariableTypes: require('./tagVariableType'),

    defaultStaff:
        perms.kickMembers +
        perms.banMembers +
        perms.administrator +
        perms.manageChannels +
        perms.manageGuild +
        perms.manageMessages,

    avatarColours: [
        0x2df952,
        0x2df9eb,
        0x2d6ef9,
        0x852df9,
        0xf92dd3,
        0xf92d3b,
        0xf9b82d,
        0xa0f92d
    ]
};