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
        if (plugin.name in this.plugins && plugin.allowMultiple()) {
            if (this.plugins[plugin.name].multiple) {
                this.plugins[plugin.name].push(args);
            } else {
                this.plugins[plugin.name] = [this.plugins[plugin.name], args];
                this.plugins[plugin.name].multiple = true;
            }
        } else {
            this.plugins[plugin.name] = args;
        }
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
        var regPlugins = this.$ClassDefiner.registeredPlugins;
        if (!this.order) this.refreshOrder();

        this.emit("beforeExec", on, infoArgs, this);
        for (var i = 0; i < this.order.length; i++) {
            var keepPlugin,
                name = this.order[i],
                args = this.plugins[name];

            keepPlugin = this.executePlugin(regPlugins[name], on, infoArgs, args);
            if (keepPlugin === false) {
                this.order.splice(i, 1);
                delete this.plugins[name];
                i--;
            }
        }
        delete infoArgs[0].args;
        this.emit("afterExec", on, infoArgs, this);
    },
    executePlugin: function (plugin, on, infoArgs, args) {
        var keepPlugin;
        if (args.multiple) {
            for (var i = 0; i < args.length; i++) {
                infoArgs[0].args = args[i];
                keepPlugin = plugin[on].apply(plugin, infoArgs.concat(args[i]));
                if (keepPlugin === false) {
                    args.splice(i, 1);
                    i--;
                }
            }
            return !!args.length;
        } else {
            infoArgs[0].args = args;
            keepPlugin = plugin[on].apply(plugin, infoArgs.concat(args));
            return keepPlugin;
        }
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