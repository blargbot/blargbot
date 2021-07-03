<template>
    <div>
        <div class='full-height'>
        <Banner/>
        <section>
          <h1 class='center'>blargbot</h1>
          <div class='button-grid'>
            <nuxt-link to='invite' class='child-2 button shadow-2 green'>Invite</nuxt-link>
            <nuxt-link to='documentation' class='child-1 button shadow-2'>Documentation</nuxt-link>
            <nuxt-link to='dashboard' class='child-1 button shadow-2'>Dashboard</nuxt-link>
            <nuxt-link to='donate' class='child-2 button shadow-2 gold'>Donate</nuxt-link>
          </div>

          <p class='center larger'>blargbot is a multi-purposed bot for the <a href='https://discordapp.com'>Discord</a> chat platform, designed with customizability in mind.</p>
        </section>
        </div>
        <section>
          <div class='info-flex'>
            <div class='child card shadow-2'>
              <h2>Commands</h2>
              <p>blargbot has a large variety of built-in commands. Wanna find out what time it is somewhere else in the world, or convert between currencies? Need to ban or kick someone? Have a craving for some meme image generation? <del>Just want some porn?</del> blargbot has got your back.</p>
              <p>Every command can be restricted to any role, and most can be disabled altogether.</p>
              <nuxt-link to='commands' class='button flat'>Documentation</nuxt-link>
            </div>
            <div class='child-large card shadow-2'>
              <h2>Moderation</h2>
              <p>If you're looking for a modbot, then look no further! blargbot has a huge suite of moderation commands and features, ranging from mutes and bans to full censors and anti-mention detection. Every action can be logged in a modlog, where mods can specify the reasons for what they did. Transparency!</p>
              <p>We also feature a warning system. Warnings can be assigned manually, through censors, or programatically. If a user's warning count exceeds a specified threshold, they'll automatically be banned! Or worse, <em>expelled.</em></p>
              <p>All moderation features are supported in BBTag, for full customization!</p>
            </div>
            <div class='child card shadow-2'>
              <h2>Logging</h2>
              <p>Don't you hate it when something happens, but there's no proof? Well, blargbot solves this with chatlogging! This is an opt-in feature which logs all the messages blargbot can see, and allows you to quickly and easily retrieve these logs at any given moment. Chatlogging is disabled by default, and only 7 days worth of messages are stored.</p>
              <p>Additionally blargbot offers a whole bunch of other logging options, including username and avatar changes!</p>
            </div>
            <div class='child card shadow-2'>
              <h2>Customization</h2>
              <p>The primary philosophy that blargbot follows is customizability. Nearly everything blargbot has to offer can be tweaked, right down to the prefixes that you can use!</p>
              <p>blargbot offers both guild prefixes and personal prefixes, so you can use whatever you want wherever you are!</p>
              <p>Almost every command can be restricted, toggled, or completely overwritten.</p>
            </div>
            <div class='child-large card shadow-2'>
              <h2>BBTag</h2>
              <p>Arguably blargbot's largest feature, BBTag is a powerful custom scripting language called BBTag that allows you to easily make your own custom functionality.</p>
              <p>You can use BBTag in almost anything; custom commands, public tags, greetings/farewells. The sky's the limit!</p>
              <p>The applications are endless, too. Overwrite default commands, make your own moderation suite, or just make a minigame to have fun with!</p>
              <p>The public tag ecosystem is entirely run by the community; people like you! Thanks for being awesome.</p>
              <nuxt-link to='bbtag' class='button flat'>Documentation</nuxt-link>
              <nuxt-link to='subtags' class='button flat'>SubTags</nuxt-link>
            </div>

          </div>
        </section>
    </div>
</template>

<script>
import Banner from '~/components/Banner.vue';

export default {
    components: { Banner }
};
</script>

<style lang="scss" scoped>
.full-height {
  min-height: 100vh;
}
.button-grid {
  display: grid;
  grid-template-columns: 50% 50%;
  .child-1 {
    grid-column-end: span 1;
  }
  .child-2 {
    grid-column-end: span 2;
  }
}
.info-flex {
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;

  .child {
    flex: 1 1 300px;
  }

  .child-large {
    flex: 1 1 100%;
  }
}
</style>
