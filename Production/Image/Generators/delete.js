const Generator = require.main.require('./ImageGenerator');

class DeleteGenerator extends Generator {
    async generate(args) {
        await super.generate(args);

        let base64 = await this.renderPhantom('delete.html', { replace1: args.text }, 16);

        await this.send('delete.png', base64);
    }
}

module.exports = DeleteGenerator;