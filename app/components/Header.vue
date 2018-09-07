<template>
    <header>
        <div class='flexbox row'>
            <nuxt-link to='/' class='child title primary-text'>blargbot</nuxt-link>
            <div class='child container'>
                <div class='flexbox row'>
                    <div class='child'><nuxt-link to='invite' class='button flat'>Invite</nuxt-link></div>
                    <div class='child'><nuxt-link to='documentation' class='button flat'>Documentation</nuxt-link></div>
                    <div class='child'><a href='https://support.blargbot.xyz' class='button flat'>Support Guild</a></div>
                    <div class='child'><nuxt-link to='donate' class='button flat'>Donate</nuxt-link></div>
                    <div class='child' v-if='$store.state.user'>
                      <nuxt-link to='dashboard' class='button flat'>Dashboard</nuxt-link>
                    </div>
                    <div class='child' v-if='$store.state.user'>
                      <nuxt-link to='logout' class='button flat'>Logout</nuxt-link>
                    </div>
                    <div class='child' v-else><nuxt-link to='login' class='button flat'>Login</nuxt-link></div>
                </div>
            </div>
        </div>
    </header>
</template>

<style lang="scss" scoped>
header {
  height: 40px;
  min-height: 40px;
  max-height: 40px;
  padding: 20px 0;
}
.flexbox {
  justify-content: center;
  align-items: baseline;
  align-content: center;
  margin: 0 40px;

  .flexbox .child {
    margin: 0;
  }

  .child.title {
    flex: 0 1 25%;
    font-size: 1.5em;
  }
  .child.container {
    flex: 1 0 75%;

    .flexbox {
      justify-content: flex-end;
    }
  }
  .child {
    margin: 0 0 0 20px;
  }
}
</style>
