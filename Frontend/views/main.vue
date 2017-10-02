<template>
    <wrapper>
        <div slot="content">
            <p>
                blargbot is a multipurpose Discord bot dedicated to providing quality commands and services, including chatlogs and an in-depth custom command system.
            </p>
            <div class='card-row'>
                <card title='Commands'>
                    <div slot='content'>
                        blargbot is equipped with numerous commands, all of which are documented and categorized for your convenience.
                    </div>
                </card>
                <card title='BBTag'>
                    <div slot='content'>
                        blargbot uses a sophisticated tag system called BBTag, which you can use to create advanced custom commands.
                    </div>
                </card>
                <card title='Customization'>
                    <div slot='content'>
                        We understand that not every guild is the same, so blargbot has extensive customization. You can control exactly which roles can use which commands, specify custom prefixes, and even change the display language!
                    </div>
                </card>
                <card title='Moderation'>
                    <div slot='content'>
                        Need something to moderate your chat? blargbot is equiped with many moderation utilities, from basic operations like banning and muting, to more advanced stuff like chatlogging or automatic censoring.
                    </div>
                </card>
                <card title='Open-Source'>
                    <div slot='content'>
                        Sharing is caring! blargbot is completely open-source under the GNU AGPLv3 License. Feel free to take a look and learn how everything works. If you use any of my code in your own project, you are required to credit me. See the license for more details. </div>
                </card>
                <card title='Open To Suggestions'>
                    <div slot='content'>
                        Have a suggestion for the bot? I would be glad to hear it! Found a bug? I'd like to hear that too! You can suggest anything to me using the
                        <code>suggest</code> command, by joining my guild, or by submitting a ticket. </div>
                </card>
            </div>
        </div>
    </wrapper>
</template>

<script>
import wrapper from '../components/wrapper.vue';
import card from '../components/card.vue';
import locale from '../mixins/locale';

export default {
    data: () => ({
    }),
    mixins: [locale],
    components: {
        wrapper, card
    }
};
</script>

<style scoped>

</style>