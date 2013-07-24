function Plugin(name, info, $ClassDefiner) {
    this.name = name;
    this.info = info;
    this.$ClassDefiner = $ClassDefiner;
}

Plugin.prototype = {
    invoke: function ($Class, args) {
        var invokeValue = this.onInvoke.apply(this, [
            {
                $Class: $Class,
                args: args
            }
        ].concat(args));

        this.apply($Class, args);

        return invokeValue;
    },
    apply: function ($Class, args) {
        var continueApply = this.onApply.apply(this, [
            {
                $Class: $Class,
                args: args
            }
        ].concat(args));

        if (continueApply !== false) {
            if (ot.isObject(this.info.level)) {
                ot.forEach(this.info.level, function (value, level) {
                    Plugin.levels[level](this, $Class, args);
                }, this);
            } else {
                Plugin.levels[this.info.level](this, $Class, args);
            }
        }
        return continueApply;
    },
    getLevelObject: function (info) {
        if (ot.isObject(this.info.level)) {
            if ("component" in info) {
                if (info.component.mainPlugin === this) {
                    return this.info.level.OwnComponent;
                } else {
                    return this.info.level.Component;
                }
            } else {
                return this.info.level.Class;
            }
        } else {
            return this.info;
        }
    },
    allowMultiple: function () {
        return !!this.info.multiple;
    },
    onDefinition: generateEventHandler("onDefinition"),
    onInstanceCreation: generateEventHandler("onInstanceCreation"),
    onInvoke: function () {
        return ot.result(this.info, "onInvoke", arguments);
    },
    onApply: function () {
        return ot.result(this.info, "onApply", arguments);
    },
    getInfo: function (level, property, pluginArgs, $Class) {
        var args = [
            {
                $Class: $Class,
                args: pluginArgs
            }
        ].concat(pluginArgs);

        if (ot.isObject(this.info.level)) {
            if (level in this.info.level) {
                return ot.result(this.info.level[level], property, args);
            }
        } else if (this.info.level === level) {
            return ot.result(this.info, property, args);
        }
        return null;
    }
};

Plugin.priorities = {
    "high": 10,
    "medium": 20,
    "low": 30,
    "OwnComponent": -10000, // TODO implement this
    "default": 30
};

Plugin.levels = {
    Component: function (plugin, $Class, args) {
        var position = plugin.getInfo("Component", "position", args, $Class);
        switch (position) {
            case "before":
                $Class.queuedComponentPlugins.addPlugin(plugin, args);
                break;
            case "after":
                var lastComponent = $Class.components[$Class.components.length - 1];
                if (lastComponent) {
                    lastComponent.pluginList.addPlugin(plugin, args);
                }
                break;
            default:
                throw "A Component level plugin does not have a good " +
                    "`position: 'before'|'after'` property. Plugin: " + plugin.name;
        }
    },
    Class: function (plugin, $Class, args) {
        var execute = plugin.getInfo("Class", "execute", args, $Class);
        switch (execute) {
            case "first":
                $Class.ClassPluginsFirst.addPlugin(plugin, args);
                break;
            case "last":
                $Class.ClassPluginsLast.addPlugin(plugin, args);
                break;
            case "both":
                $Class.ClassPluginsFirst.addPlugin(plugin, args);
                $Class.ClassPluginsLast.addPlugin(plugin, args);
                break;
            default:
                throw "A Class level plugin does not have a good `" +
                    "execute: 'first'|'last'` property. Plugin: " + plugin.name;
        }
    },
    OwnComponent: function (plugin, $Class, args) {
        var componentDetails = plugin.getInfo("OwnComponent", "component", args, $Class),
            component = new Component($Class, plugin, componentDetails);

        component.pluginList.addPlugin(plugin, args);
        $Class.addComponent(component);

        component.pluginList.addPlugins($Class.queuedComponentPlugins);
        $Class.queuedComponentPlugins.reset();
    }
};

function generateEventHandler(name) {
    return function (info) {
        var continueExec, levelObj = this.getLevelObject(info);
        if (name in this.info) {
            continueExec = ot.result(this.info, name, arguments);
        }
        if (continueExec !== false && name in levelObj) {
            continueExec = ot.result(levelObj, name, arguments);
        }

        return continueExec;
    };
}