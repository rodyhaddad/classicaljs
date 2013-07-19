function BaseClass(args) {
    args = args.isParams ? args : ot.toArray(arguments);
    if (!(this instanceof BaseClass)) {
        args.isParams = true;
        return new BaseClass(args);
    }

    var $Class = this.$Class = this;
    this.$ClassDefiner = BaseClass;

    ot.forEach(BaseClass.toInherit, function (value, key) {
        this[key] = ot.recursiveInherit(value, null, function (obj) {
            obj.$Class = $Class;
        });
    }, this);

    this.params = this.handleParams(args);
    this.name = this.params.name || "Anonymous";
    this.components = [];

    this.classConstructor = this.createClassConstructor();

    this.ClassPluginsFirst = new PluginList(null, this);
    this.ClassPluginsLast = new PluginList(null, this);
    this.queuedComponentPlugins = new PluginList(false, this);

    addExport(this.classConstructor, this.$ClassDefiner);
    addExport(window, this.$ClassDefiner);
    if (this.params.definition) {
        this.params.definition.call(this.classConstructor);
        this.End();
    }

    return this.classConstructor;
}
ot.merge(BaseClass, {
    valuesToExport: {
        Config: exportClassFn("Config"),
        End: exportClassFn("End")
    },
    config: baseConfig,
    toInherit: {
        config: baseConfig
    }
});

BaseClass.prototype = {
    Config: function (config) {
        ot.deepMerge(this.config, config);
    },
    End: function () {
        removeExport(this.classConstructor, this.$ClassDefiner);
        removeExport(window, this.$ClassDefiner);
        var infoArgs = [
            {
                $Class: this.$Class
            }
        ];

        this.ClassPluginsFirst.execute("onDefinition", infoArgs);
        ot.forEach(this.components, function (component) {
            component.pluginList.execute("onDefinition", [
                ot.inherit(infoArgs[0], {
                    component: component
                })
            ]);
        });
        this.ClassPluginsLast.execute("onDefinition", infoArgs);
    },
    addComponent: function (component) {
        this.components.push(component);
    },
    createClassConstructor: function () {
        /*jshint evil:true */
        var classConstructor = new Function("$Class", "toArray",
            "" +
                "function " + this.name + "(){ " +
                "    if(this instanceof " + this.name + ") {" +
                "        return $Class.onClassConstructorCall(this, toArray(arguments)); " +
                "    } else {" +
                "        return $Class.onClassFunctionCall(toArray(arguments))" +
                "    }" +
                "} " +
                "return " + this.name + ";")(this, ot.toArray);

        classConstructor.$Class = this;
        classConstructor.prototype.$Class = this;
        return classConstructor;
    },
    onClassConstructorCall: function (instance, args) {
        var infoArgs = [
            {
                $Class: this.$Class,
                instance: instance
            }
        ];

        this.ClassPluginsFirst.execute("onInstanceCreation", infoArgs);
        ot.forEach(this.components, function (component) {
            component.pluginList.execute("onInstanceCreation", [
                ot.inherit(infoArgs[0], {
                    component: component
                })
            ]);
        });
        this.ClassPluginsLast.execute("onInstanceCreation", infoArgs);
    },
    onClassFunctionCall: function (args) {

    }
};