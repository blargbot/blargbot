<template>
    <div class='parallax-container'>
        <div class='parallax'>
            <div class='image'></div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.parallax-container {
  height: 300px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
  .parallax {
    position: relative;
    .image {
      position: absolute;
      height: 426px;
      width: 1600px;
      left: -9999px;
      right: -9999px;
      margin: auto;
      background-image: url("~/assets/img/banner.png");
      background-attachment: fixed;
      background-position: top center;
      background-repeat: no-repeat;
    }
  }
}
</style>
