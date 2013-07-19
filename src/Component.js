function Component($Class, mainPlugin) {
    EventEmitter.call(this);
    this.mainPlugin = mainPlugin;
    this.$Class = $Class;
    this.pluginList = new PluginList(this, $Class);
}

Component.prototype = ot.inherit(EventEmitter.prototype, {

});