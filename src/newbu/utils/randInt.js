/**
 * @param {number} min
 * @param {number} max
 */
module.exports = function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};