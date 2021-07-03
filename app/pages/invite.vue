<template>
    <div>
        <Banner/>
        <section>
            <p class='center'>Inviting blargbot is the first step to accessing all of the awesomeness it provides. To make things easier for you, we have several options.</p>

            <div class='invite-grid'>
                <a :href='invite' class='button'>Full Invite</a>
                <p class='center'>This will add blargbot with full admin permissions, ensuring you can use all of its moderation capabilities.</p>

                <a :href='minvite' class='button'>Minimal Invite</a>
                <p class='center'>Don't need all of those features? No worries. This invite only requests the permissions that blargbot needs for basic functionality.</p>

                <a :href='base' class='button'>Base Invite</a>
                <p class='center'>Want to configure the permissions yourself? Use this one! It won't request any permissions. Make sure you remember to set it up yourself!</p>
            </div>
        </section>
    </div>
</template>

<script>
import Banner from '~/components/Banner.vue';

export default {
    data: () => ({
        base:
      'https://discordapp.com/oauth2/authorize?client_id=170237838334492682&scope=bot'
    }),
    computed: {
        pbase() {
            return this.base + '&permissions=';
        },
        minvite() {
            return this.pbase + 19520;
        },
        invite() {
            return this.pbase + 8;
        }
    },
    components: { Banner }
};
</script>

<style lang="scss" scoped>
.invite-grid {
  display: grid;
  grid-template-columns: 40% 60%;
  align-content: center;
  align-items: center;

  p {
    margin: 10px;
  }
}
</style>
