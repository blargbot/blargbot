function make() {
    return (Date.now() - 1420070400000) * 4194304;
}

function unmake(snowflake) {
    return (snowflake / 4194304) + 1420070400000;
}

module.exports = {
    make, unmake
};