const PublicTag = require('./PublicTag');
const { DataCustomCommand } = require('./Data');

class CustomCommand extends PublicTag {
    constructor(client, name, guild) {
        super(client, name);
        this.data = new DataCustomCommand(name, guild);
    }
}