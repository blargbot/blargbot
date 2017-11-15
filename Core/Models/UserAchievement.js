const Base = require('./Base');
const User = require('./User');

class UserAchievementModel extends Base {
  constructor(client, db) {
    super(client, db);

    this.model = db.define('user_achievement', {
      userId: {
        type: this.Sequelize.BIGINT,
        references: {
          model: this.client.models.User,
          key: 'userId'
        },
        allowNull: false
      },
      achievements: {
        type: this.Sequelize.JSON,
        allowNull: false,
        default: {}
      }
    });
  }
}

module.exports = UserAchievementModel;