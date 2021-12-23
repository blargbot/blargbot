/** @enum {0|1|2|3|4|5} */
const FlowState = {
    /** @type {0} */NORMAL: 0,
    /** @type {1} */KILL_ALL: 1,
    /** @type {2} */KILL_TAG: 2,
    /** @type {3} */KILL_FUNC: 3,
    /** @type {4} */BREAK_LOOP: 4,
    /** @type {5} */CONTINUE_LOOP: 5
};

module.exports = { FlowState };