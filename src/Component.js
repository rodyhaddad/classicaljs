function Component($Class, mainPlugin, details) {
    EventEmitter.call(this);
    this.mainPlugin = mainPlugin;
    this.$Class = $Class;
    this.pluginList = new PluginList(this, $Class);
    this.details = details || {};
}

Component.prototype = ot.inherit(EventEmitter.prototype, {
    set: function(name, value) {
        var oldValue = this.details[name];
        this.details[name] = value;

        this.emit("change:" + name, value, oldValue, this);
        this.emit("change", value, oldValue, this);
    }
});