function Plugin(name, info, $ClassDefiner) {
    this.name = name;
    this.info = ot.softMerge(info, Plugin.defaults);
    this.$ClassDefiner = $ClassDefiner;
    var thisPlugin = this;

    this.invoke = ot.navigate.set($ClassDefiner.prototype, name, function () {
        var args = ot.toArray(arguments);

        thisPlugin.onInvoke.apply(thisPlugin, [
            {
                $Class: this.$Class
            }
        ].concat(args));

        Plugin.levels[info.level](thisPlugin, this.$Class, args);
    });

    ot.navigate.set($ClassDefiner.valuesToExport, name, exportClassFn(name));
}

Plugin.priorities = {
    "high": 10,
    "medium": 20,
    "low": 30,
    "OwnComponent": -10000, // TODO implement this
    "default": 30
};

Plugin.defaults = {
    level: "Component",
    priority: Plugin.priorities["default"]
};

Plugin.levels = {
    Component: function (plugin, $Class, args) {
        if (this.info.position === "before") {
            $Class.queuedComponentPlugins.addPlugin(plugin, args);
        } else if (this.info.position === "after") {
            var lastComponent = $Class.components[$Class.components.length - 1];
            if (lastComponent) {
                lastComponent.pluginList.addPlugin(plugin, args);
            }
        } else {
            throw "A Component level plugin does not have a good " +
                "`position: 'before'|'after'` property. Plugin: " + this.name;
        }
    },
    OwnComponent: function (plugin, $Class, args) {
        var component = new Component($Class, plugin);
        component.pluginList.addPlugin(plugin, args);
        $Class.addComponent(component);
        component.pluginList.addPlugins($Class.queuedComponentPlugins);
        $Class.queuedComponentPlugins.reset();
    },
    Class: function (plugin, $Class, args) {
        if (this.info.execute === "first") {
            $Class.ClassPluginsFirst.addPlugin(plugin, args);
        } else if (this.info.execute === "last") {
            $Class._ClassPluginsExecLast.addPlugin(plugin, args);
        } else {
            throw "A Class level plugin does not have a good `" +
                "execute: 'first'|'last'` property. Plugin: " + this.name;
        }
    }
};

Plugin.prototype = {
    onDefinition: function () {
        if (this.info.onDefinition) {
            this.info.onDefinition.apply(this.info, arguments);
        }
    },
    onInstanceCreation: function () {
        if (this.info.onInstanceCreation) {
            this.info.onInstanceCreation.apply(this.info, arguments);
        }
    },
    onInvoke: function () {
        if (this.info.onInvoke) {
            this.info.onInvoke.apply(this.info, arguments);
        }
    }
};