function PluginList(component, $Class) {
    EventEmitter.call(this);
    this.component = component;
    this.plugins = {};
    this.$Class = $Class;
    this.$ClassDefiner = $Class.$ClassDefiner;
    this.order = null;
}

PluginList.prototype = ot.inherit(EventEmitter.prototype, {
    reset: function () {
        this.plugins = {};
        this.order = null;
    },
    addPlugin: function (plugin, args) {
        this.plugins[plugin.name] = args;
    },
    addPlugins: function (pluginsObject) {
        if (pluginsObject instanceof  PluginList) {
            this.addPlugins(pluginsObject.plugins);
        } else {
            var registeredPlugins = this.$ClassDefiner.registeredPlugins;
            ot.forEach(pluginsObject, function (args, name) {
                this.addPlugin(registeredPlugins[name], args);
            }, this);
        }
    },
    execute: function (on, infoArgs) {
        var registeredPlugins = this.$ClassDefiner.registeredPlugins;

        if (!this.order) this.refreshOrder();

        this.emit("beforeExec", on, infoArgs, this);
        for (var i = 0; i < this.order.length; i++) {
            var name = this.order[i],
                args = this.plugins[name], keepPlugin;
            infoArgs[0].args = args;

            keepPlugin = registeredPlugins[name][on].apply(registeredPlugins[name], infoArgs.concat(args));
            if (keepPlugin === false) {
                this.order.splice(i, 1);
                delete this.plugins[name];
                i--;
            }
        }
        delete infoArgs[0].args;
        this.emit("afterExec", this);
    },
    refreshOrder: function () {
        var order = [],
            plugins = this.plugins,
            registeredPlugins = this.$ClassDefiner.registeredPlugins;

        for (var key in plugins) {
            if (key in registeredPlugins) {
                order.push(key);
            }
        }

        order.sort(function (a, b) {
            return registeredPlugins[a].priority - registeredPlugins[b].priority;
        });

        return this.order = order;
    }
});