const PublicTag = require('./PublicTag');
const { DataCustomCommand } = require('./Data');

class CustomCommand extends PublicTag {
    constructor(name, guild) {
        super(name);
        this.data = new DataCustomCommand(name, guild);
    }
}