const Base = require('./Base');

class TagFavouriteModel extends Base {
  constructor(client, db) {
    super(client, db);

    this.model = db.define('tag_favourite', {
      tagName: {
        type: this.Sequelize.STRING,
        primaryKey: true,
        references: {
          model: this.client.models.Tag,
          key: 'tagName'
        }
      },
      userId: {
        type: this.Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        references: {
          model: this.client.models.User,
          key: 'userId'
        }
      }
    });
  }
}

module.exports = TagFavouriteModel;