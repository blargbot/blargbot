<template>
    <header>
        <div class='flexbox row'>
            <nuxt-link to='/' class='child title primary-text'>blargbot</nuxt-link>
            <div class='child container'>
                <div class='flexbox row'>
                    <div class='child'><nuxt-link to='login'>Login</nuxt-link></div>
                    <div class='child'>Two</div>
                    <div class='child'>Three</div>
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
