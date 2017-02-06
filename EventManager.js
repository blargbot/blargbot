class EventManager {

    constructor() {
        this.events = {};
        this.initEvents();
    }

    initEvents() {
        var fileArray = dep.fs.readdirSync(dep.path.join(__dirname, 'events'));
        for (var i = 0; i < fileArray.length; i++) {
            var eventFile = fileArray[i];
            if (/.+\.js$/.test(eventFile)) {
                var eventName = eventFile.match(/(.+)\.js$/)[1];
                this.loadEvent(eventName);
                logger.init(`${i < 10 ? ' ' : ''}${i}.`, 'Loading event module ', eventName);
            } else {
                logger.init('     Skipping non-event ', eventFile);
            }
        }
    }

    loadEvent(eventName) {
        try {
            const event = require(this.constructPath(eventName));
            this.events[eventName] = event;
        } catch (err) {
            logger.error(err);
            logger.init('Failed to load event ' + eventName);
        }
    }

    reloadEvent(eventName) {
        try {
            if (this.events.hasOwnProperty(eventName)) {
                this.events[eventName] = dep.reload(this.constructPath(eventName));
                return true;
            } else {
                return false;
            }
        } catch (err) {
            logger.error(err);
            return false;
        }
    }

    constructPath(eventName) {
        return './events/' + eventName;
    }
}

module.exports = EventManager;