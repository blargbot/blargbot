const Base = require('./Base');

class TagModel extends Base {
    constructor(client, db) {
        super(client, db);

        this.model = db.define('tag', {
            tagName: {
                type: this.Sequelize.STRING,
                primaryKey: true
            },
            authorId: {
                type: this.Sequelize.BIGINT,
                allowNull: false,
                references: {
                    model: this.client.models.User,
                    key: 'userId'
                }
            },
            content: {
                type: this.Sequelize.STRING(50000),
                allowNull: false,
                defaultValue: ''
            },
            usage: {
                type: this.Sequelize.STRING(100),
                allowNull: true
            },
            desc: {
                type: this.Sequelize.STRING(900),
                allowNull: true
            },
            lastUsed: {
                type: this.Sequelize.DATE
            },
            uses: {
                type: this.Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            favourites: {
                type: this.Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },

            variables: {
                type: this.Sequelize.JSON,
                allowNull: false,
                defaultValue: {}
            }
        });
    }
}

module.exports = TagModel;