class TagResult {
    constructor() {
        this.terminate = false;
        this.content = '';
        this.replace = false;
        this.replaceTarget = '';
    }

    /**
     * Sets the result content
     * @param {*} text The content
     * @returns {TagResult} Returns self for chaining
     */
    setContent(text) {
        this.content = text;
        return this;
    }

    /**
     * Sets whether to terminate
     * @param {boolean} bool Whether to terminate
     * @returns {TagResult} Returns self for chaining
     */
    setTerminate(bool) {
        this.terminate = bool;
        return this;
    }

    /**
     * Sets whether to replace the tag content
     * @param {boolean} bool Whether to replace
     * @returns {TagResult} Returns self for chaining
     */
    setReplace(bool) {
        this.replace = bool;
        return this;
    }

    /**
     * Sets the replace target
     * @param {*} text The content
     * @returns {TagResult} Returns self for chaining
     */
    setReplaceTarget(text) {
        this.replaceTarget = text;
        return this;
    }
}

module.exports = TagResult;