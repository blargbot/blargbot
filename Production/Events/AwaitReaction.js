const { Event } = require('../../Core/Structures');

class AwaitReactionEvent extends Event {
  constructor(client) {
    super(client, 'messageReactionAdd');
  }

  async execute(msg, emoji, userId) {
    if (this.client.awaitedReactions[msg.channel.id] !== undefined
      && this.client.awaitedReactions[msg.channel.id][msg.id] !== undefined) {
      this.client.awaitedReactions[msg.channel.id][msg.id]
        .emit(emoji.id || emoji.name, userId);
      if (userId !== this.client.user.id)
        try {
          await this.client.removeMessageReaction(msg.channel.id, msg.id,
            emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name, userId);
        } catch (err) { }
    }
  }
}

module.exports = AwaitReactionEvent;