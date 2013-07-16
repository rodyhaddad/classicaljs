;(function() {

    Class.version = "1.3";

    var globalConfig = Class._config = {

        globalize: true,

        keepDefinedClasses: true,

        globalObj: typeof window !== "undefined" ? window :
            (typeof global !== "undefined" ? global :
                this),

        exportClass: true,

        defaultMethod: "Public",

        persistentPlugins: {},

        persistentPluginsAlias: {}
    };

    var definedClasses = Class.definedClasses = {};

    var objectsToInherit = Class.objectsToInherit = {
        _config: globalConfig
    };

    var queuedDepencencies = [];

    Class._ClassQueuedPlugins = [];

    function Class(dependencies, name, classConfig, definition) {

        if(!(this instanceof Class)) {
            return new Class(dependencies, name, classConfig, definition);
        }


        Class.forEach(Class._ClassQueuedPlugins, function(plugin) {
            if(Class.registeredPlugins.hasOwnProperty(plugin.name)) {
                Class.registeredPlugins[plugin.name].applier.call(this, plugin.args);
            }
        }, this);
        Class._ClassQueuedPlugins = [];

        var params = this.sortParams([dependencies, name, classConfig, definition]);

        this._ClassDefiner = Class;
        this._Class = this;

        Class.forEach(objectsToInherit, function(obj, key) {
            this[key] = makeRecursiveInherit(obj, {
                _Class: this
            });
        }, this);

        this.Config(params.classConfig || {});

        this._ClassPluginsExecFirst = new PluginsList(this, "isClassPluginsExecFirst");
        this._ClassPluginsExecLast = new PluginsList(this, "isClassPluginsExecLast");
        this._componentQueuedPlugins = new PluginsList(this, "isComponentQueuedPlugins");

        this.name = params.name || "AnonymousClass";

        this.components = [];

        var self = this;

        var aClassConstructor = this.createClassConstructor();

        aClassConstructor._Class = this;
        aClassConstructor.prototype._Class = this;

        this.classConstructor = aClassConstructor;

        if(params.definitionWrapper !== null) {
            if(this._config.exportClass && isFn(getDefine())) {
                if(params.dependencies !== null && params.dependencies.length) {
                    Class.treatDependencies(params.dependencies);

                    getDefine()(params.dependencies, function() {
                        addExports(aClassConstructor, self._config.globalize, self);
                        params.definitionWrapper.call(aClassConstructor, toArray(arguments));

                        aClassConstructor.End(true);
                        return aClassConstructor;
                    });
                } else {
                    getDefine()(function() {
                        addExports(aClassConstructor, self._config.globalize, self);
                        params.definitionWrapper.call(aClassConstructor);
                        aClassConstructor.End(true);
                        return aClassConstructor;
                    });
                }
            } else {
                addExports(aClassConstructor, self._config.globalize, self);
                params.definitionWrapper.call(aClassConstructor);
                aClassConstructor.End();
            }
        } else {
            addExports(aClassConstructor, self._config.globalize, self);
        }

        return aClassConstructor;

    }

    var pluginPriority = Class.pluginPriority = {
        "high": 10,
        "medium": 20,
        "low": 30,
        "OwnComponent": -10000,
        "default": 30
    };

    var registeredPlugins = Class.registeredPlugins = {};

    Class.addPlugin = function(pluginInfo) {
        var ClassDefiner = this;

        if(pluginInfo.extendsPlugin && registeredPlugins[pluginInfo.extendsPlugin]) {
            pluginInfo = makeInherit(registeredPlugins[pluginInfo.extendsPlugin], pluginInfo);
        }

        pluginInfo.level = pluginInfo.level || "Component";

        var splitName = cleanArray(pluginInfo.name.split("."));

        if(pluginInfo.exportPlugin !== false) {
            navigateObj.setOwn(valuesToExport, splitName, exportMethod.flag);
        }

        if(pluginInfo.addToInstances !== false && splitName.length > 1) {
            objectsToInherit[splitName[0]] = Class.prototype[splitName[0]];
        }

        pluginInfo.priority = pluginPriority[pluginInfo.priority] || pluginPriority[pluginInfo.level] ||
            pluginPriority["default"];

        if(isObject(pluginInfo.level)) {
            for(var key in pluginInfo.level) {
                if(pluginInfo.level.hasOwnProperty(key)) {
                    pluginInfo.level[key].name = pluginInfo.name;

                    if(pluginInfo.level[key].onDefinition && !pluginInfo.onDefinition) {
                        pluginInfo.onDefinition = function() {
                            Class.addPlugin.callAppropriateLevels(pluginInfo.level, "onDefinition",
                                toArray(arguments));
                        };
                    }

                    if(pluginInfo.level[key].onInstanceCreation && !pluginInfo.onInstanceCreation) {
                        pluginInfo.onInstanceCreation = function() {
                            Class.addPlugin.callAppropriateLevels(pluginInfo.level, "onInstanceCreation",
                                toArray(arguments));
                        };
                    }

                }
            }
        }

        if(pluginInfo.addToInstances !== false) {
            navigateObj.setOwn(Class.prototype, splitName, function() {
                var onCallReturnValue, applierReturnValue;
                if(isFn(pluginInfo.onCall)) {
                    pluginsInfoObj = makeInherit(this._Class.infoObjProto, { Class: this._Class, args: args });
                    onCallReturnValue = pluginInfo.onCall.apply(pluginInfo, [pluginsInfoObj].concat(args));
                }
                applierReturnValue = pluginInfo.applier.call(this._Class, toArray(arguments));

                if(typeof onCallReturnValue !== "undefined") {
                    return onCallReturnValue;
                } else {
                    return applierReturnValue;
                }
            });
        }

        registeredPlugins[pluginInfo.name] = pluginInfo;

        if(pluginInfo.persistentPluginsAlias) {
            globalConfig.persistentPluginsAlias[pluginInfo.name] = pluginInfo.persistentPluginsAlias;
        }

        if(pluginInfo.globalize === true) {
            navigateObj.setOwn(ClassDefiner._config.globalObj, splitName, function() {
                var onCallReturnValue,
                    args = toArray(arguments);
                ClassDefiner._ClassQueuedPlugins.push({name: pluginInfo.name, args: args});

                if(isFn(pluginInfo.onCall)) {
                    pluginsInfoObj = makeInherit(ClassDefiner.prototype.infoObjProto, {args: args });
                    onCallReturnValue = pluginInfo.onCall.apply(pluginInfo, [pluginsInfoObj].concat(args));
                }

                return onCallReturnValue;
            });
        }

        pluginInfo.applier = function(args, extraArgs) {
            var level, continueApply, pluginsInfoObj;

            if(isFn(pluginInfo.onApply)) {
                pluginsInfoObj = makeInherit(this.infoObjProto, { Class: this, args: args });
                continueApply = pluginInfo.onApply.apply(pluginInfo, [pluginsInfoObj].concat(args));
            }
            if(continueApply !== false) {
                if(isFn(pluginInfo.level)) {
                    level = pluginInfo.level(args, this);
                    if(isObject(level)) {
                        for(var key in level) {
                            if(level.hasOwnProperty(key)) {
                                level[key].name = pluginInfo.name;
                            }
                        }
                    }
                } else {
                    level = pluginInfo.level;
                }

                if(isObject(level)) {
                    var lastReturn;
                    for(var key in level) {
                        if(level.hasOwnProperty(key)) {
                            lastReturn = Class.addPlugin.levels[key].call(this, level[key], args, extraArgs) ||
                                lastReturn;
                        }
                    }
                    return lastReturn;
                } else {
                    return Class.addPlugin.levels[level].call(this, pluginInfo, args, extraArgs);
                }
            }
            return this;
        };

        return this;
    };

    Class.addPlugin.levels = {
        Component: function(pluginInfo, args, extraArgs) {
            var pluginsList, position;

            if(isFn(pluginInfo.position)) {
                position = pluginInfo.position(args, this, extraArgs);
            } else {
                position = pluginInfo.position;
            }

            if(args[0] === null && args.length === 1) {
                args = null;
            }

            if(extraArgs && extraArgs.pluginsList) {
                pluginsList = extraArgs.pluginsList;
            } else if(position === "before") {
                pluginsList = this._componentQueuedPlugins;
            } else if(position === "after") {
                pluginsList = this.components[this.components.length - 1].plugins;
            } else {
                throw "Invalid Plugin passed to Class.addPlugin({name: " + pluginInfo.name + ", ...}). " +
                    "No pluginInfo.position available on a Component level plugin (must be 'before' or 'after').";
            }

            pluginsList.addPlugin(pluginInfo.name, args);

            return this;
        },
        OwnComponent: function(pluginInfo, args) {
            var component;

            switch(typeof pluginInfo.component) {
                case "function":
                    component = pluginInfo.component(args, this);
                    break;

                case "undefined":
                    component = {
                        type: pluginInfo.name
                    };
                    break;

                default:
                    component = mergeObjects({}, pluginInfo.component);
                    break;
            }

            if(!component.type) {
                component.type = pluginInfo.name
            }

            if(!component.plugins) {
                component.plugins = new PluginsList(this, "isComponent", component);
            }

            if(args[0] === null && args.length === 1) {
                args = null;
            }

            component.plugins.addPlugin(pluginInfo.name, args);

            this.components.push(component);

            addQueuedPlugins(this, component);

            return this;
        },
        Class: function(pluginInfo, args) {
            var pluginsList, execute;

            if(isFn(pluginInfo.execute)) {
                execute = pluginInfo.execute(args, this);
            } else {
                execute = pluginInfo.execute;
            }

            if(args[0] === null && args.length === 1) {
                args = null;
            }

            if(execute === "first") {
                pluginsList = this._ClassPluginsExecFirst;
            } else if(execute === "last") {
                pluginsList = this._ClassPluginsExecLast;
            } else {
                throw "Invalid Plugin passed to Class.addPlugin({name: " + pluginInfo.name + ", ...}). " +
                    "No pluginInfo.execute available on a Class level plugin (must be 'first' or 'last').";
            }

            pluginsList.addPlugin(pluginInfo.name, args);

            return this;
        }
    };

    Class.addPlugin.callAppropriateLevels = function(levelObj, on, args) {
        var info = args[0],
            level = info.level;

        for(var key in levelObj) {
            if(levelObj.hasOwnProperty(key)) {
                switch(key) {
                    case "Class":
                        if(level === "Class" && isFn(levelObj[key][on])) {
                            levelObj[key][on].apply(this, args);
                        }
                        break;

                    case "OwnComponent":

                        if(level === "Component" && isFn(levelObj[key][on]) && info.component.type === levelObj[key].name) {
                            levelObj[key][on].apply(this, args);
                        }
                        break;

                    case "Component":
                        if(level === "Component" && isFn(levelObj[key][on])) {
                            levelObj[key][on].apply(this, args);
                        }
                        break;
                }
            }
        }
    };



    Class.Config = function(obj) {
        mergeObjectsRecursivly(globalConfig, obj);
        return this;
    };

    Class.addConfig = function(obj) {
        mergeObjectsSoftly(globalConfig, obj);
        return this;
    };

    Class.PersistentPlugins = function(pluginsObject) {
        mergeObjectsRecursivly(globalConfig.persistentPlugins, pluginsObject);
        return this;
    };

    Class.prototype = {

        Config: function(obj) {
            mergeObjectsRecursivly(this._config, obj);
            return this;
        },

        addConfig: function(obj) {
            mergeObjectsSoftly(globalConfig, obj);
            return this;
        },

        PersistentPlugins: function(pluginsObject) {
            mergeObjectsRecursivly(this._config.persistentPlugins, pluginsObject);
            return this;
        },

        createClassConstructor: function() {
            var classConstructor = new Function("self", "toArray",
                "function " + this.name + "(){ " +
                    "if(this instanceof " + this.name + ") {" +
                    "return self.onClassConstructorCall(this, toArray(arguments)); " +
                    "} else {" +
                    "return self.onClassFunctionCall(toArray(arguments))" +
                    "}" +
                    "} " +
                    "return " + this.name + ";")(this, toArray);

            classConstructor.prototype = makeInherit(Object.prototype);

            return classConstructor;
        },

        pluginDataObj: null,
        pluginData: function() {
            return this.pluginDataObj || (this.pluginDataObj = {});
        },

        _: function(position, pluginsObject) {
            var pluginsList;

            if(typeof position === "object") {
                pluginsObject = position;
                position = "prev";
            }

            if(position === "prev") {
                pluginsList = this.components[this.components.length - 1].plugins;
            } else if(position === "next") {
                pluginsList = this._componentQueuedPlugins;
            } else {
                throw " Unknown position '" + position + "' sent to ._() of Class";
            }

            this.applyPluginsToList(pluginsList, pluginsObject);

            return this;
        },

        applyPluginsToList: function(pluginsList, pluginsObject) {
            if(pluginsList && pluginsObject) {
                for(var key in pluginsObject) {
                    if(pluginsObject.hasOwnProperty(key)) {
                        var args = isArray(pluginsObject[key]) === false ?
                            [pluginsObject[key]] :
                            pluginsObject[key];

                        if(registeredPlugins.hasOwnProperty(key)) {
                            var pluginInfo = registeredPlugins[key];

                            pluginInfo.applier.call(this, args, {
                                pluginsList: pluginsList
                            });
                        } else {
                            pluginsList[key] = args;
                        }
                    }
                }
            }
        },

        getOwnComponentBy: function(field, value) {
            for(var i = 0; i < this.components.length; i++) {
                if(this.components[i][field] === value) {
                    return this.components[i];
                }
            }
            return null;
        },

        getComponentBy: function(field, value) {
            return this.getOwnComponentBy(field, value);
        },

        getOwnComponentsBy: function(field, value) {
            var validComponents = [];
            for(var i = 0; i < this.components.length; i++) {
                if(this.components[i][field] === value) {
                    validComponents.push(this.components[i]);
                }
            }
            return validComponents;
        },

        getComponentsBy: function(field, value) {
            return this.getOwnComponentsBy(field, value);
        },

        //returns the component of this class's constructor or null if doesn't exist
        getConstructorComponent: function() {
            return this.getOwnComponentBy("name", this._config.constructorName) || null;
        },

        //returns null if no constructor for this class exists
        getConstructorName: function() {
            var component = this.getConstructorComponent();

            return component ? component.name : null;
        },

        End: function(dontTryDefine) {
            var i, self = this;

            if(this._config.keepDefinedClasses) {
                definedClasses[this.name] = this.classConstructor;
            }

            var pluginsInfoObj = makeInherit(this.infoObjProto, { Class: this });
            var classPluginsInfoObj = makeInherit(pluginsInfoObj, { level: "Class" });


            this._ClassPluginsExecFirst.execute("onDefinition", [classPluginsInfoObj])
            for(i = 0; i < this.components.length; i++) {
                if(this.components[i].plugins) {
                    this.components[i].plugins.execute("onDefinition", [
                        makeInherit(pluginsInfoObj, {
                            component: this.components[i],
                            level: "Component"
                        })
                    ]);

                }
            }
            this._ClassPluginsExecLast.execute("onDefinition", [classPluginsInfoObj])

            removeExports(this.classConstructor, this);

            if(dontTryDefine !== true && this._config.exportClass && isFn(getDefine())) {
                getDefine()(function() {
                    return self.classConstructor;
                });
            }

            return this.classConstructor;
        },

        onClassConstructorCall: function(instance, args) {
            throw this.name + " was called as a constructor. " +
                "No plugin took over that behavior. " +
                "Maybe your forgot to include one?";
        },

        onClassFunctionCall: function(args) {
            throw this.name + " was called as a function. " +
                "No plugin took over that behavior. " +
                "Maybe your forgot a `new`?";
        },

        sortParams: function(params) {
            var obj = {
                name: "",
                classConfig: null,
                definition: null,
                definitionWrapper: null,
                dependencies: null
            };

            var len = params.length > 4 ? 4 : params.length;

            for(var i = 0; i < len; i++) {
                switch(typeof params[i]) {
                    case "string":
                        obj.name = params[i];
                        break;
                    case "object":
                        if(isArray(params[i])) {
                            obj.dependencies = params[i];
                        } else if(params[i] !== null) {
                            if(obj.classConfig === null) {
                                obj.classConfig = params[i];
                            } else {
                                obj.definition = params[i];
                            }
                        }
                        break;
                    case "function":
                        obj.definition = params[i];
                        break;
                }
            }

            if(obj.classConfig !== null && obj.definition === null) {
                for(var key in obj.classConfig) {
                    if(obj.classConfig.hasOwnProperty(key) && !globalConfig.hasOwnProperty(key)) {
                        obj.definition = obj.classConfig;

                        obj.classConfig = null;
                        break;
                    }
                }
            }

            if(obj.definition !== null) {
                obj.definitionWrapper = (function(definition, aClass) {
                    return function(args) {
                        if(isFn(definition)) {
                            definition = definition.apply(this, args);
                        }
                        if(isObject(definition)) {
                            for(var key in definition) {
                                if(definition.hasOwnProperty(key)) {
                                    if(isFn(this[key])) {
                                        this[key](definition[key]);
                                    } else if(key.indexOf(".") !== -1) {
                                        var fn = navigateObj.get(this, key, "");
                                        if(isFn(fn)) {
                                            fn(definition[key]);
                                        }
                                    } else {
                                        this[aClass._config.defaultMethod](key, definition[key]);
                                    }
                                }
                            }
                        }
                    };
                }(obj.definition, this));
            }

            obj.dependencies = queuedDepencencies.concat(obj.dependencies || []);
            queuedDepencencies = [];

            return obj;

        },

        infoObjProto: {

            changeComponent: function(field, newValue, component) {
                component = component || this.component;
                var oldValue = component[field],
                    eventName = "changeComponentField:" + field;

                component[field] = newValue;

                if(component._events && component._events[eventName]) {
                    Class.execFnList(component._events[eventName], this, [newValue, oldValue]);
                }

            },

            onChangeComponent: function(field, cb) {
                var eventName = "changeComponentField:" + field;
                if(!this.component._events) {
                    this.component._events = {};
                }

                if(!this.component._events[eventName]) {
                    this.component._events[eventName] = [];
                }

                this.component._events[eventName].push(cb);
            }

        }

    };

    var isArray = Class.isArray = function(obj) {
        return Object.prototype.toString.call(obj) === "[object Array]";
    };

    var isObject = Class.isObject = function(obj) {
        return typeof obj === "object" && obj !== null;
    };

    var isFn = Class.isFn = function(fn) {
        return typeof fn === "function";
    };

    var isEmptyObject = Class.isEmptyObject = function(anObject) {
        for(var key in anObject) {
            if(anObject.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    };

    var toArray = Class.toArray = function(obj) {
        return Array.prototype.slice.call(obj, 0);
    };

    var makeInherit = Class.makeInherit = (function() {
        var inherit;
        if(Object.create) {
            inherit = function(obj) {
                return Object.create(obj);
            };
        } else {
            inherit = function(obj) {
                function o() {}
                o.prototype = obj;
                return new o();
            };
        }

        return function(obj, mergeObj) {
            var inheritObj = inherit(obj);

            return mergeObj ? mergeObjects(inheritObj, mergeObj) : inheritObj;
        };
    }());

    var makeRecursiveInherit = Class.makeRecursiveInherit = function(obj, mergeObj) {
        var inheritObj;
        if(isFn(obj)) {
            inheritObj = function() {
                return obj.apply(this, toArray(arguments));
            }
        }else{
            inheritObj = makeInherit(obj);
        }

        for(var key in obj) {
            if(obj.hasOwnProperty(key)) {
                if( ( isFn(obj[key]) || isObject(obj[key]) ) && globalConfig.globalObj !== obj[key]) {
                    inheritObj[key] = makeRecursiveInherit(obj[key], mergeObj);
                }
            }
        }
        return mergeObj ? mergeObjects(inheritObj, mergeObj) : inheritObj;
    };

    var cleanArray = Class.cleanArray = function(array, from) {
        from = from || "";
        for(var i = array.length - 1; i >= 0; i--) {
            if(array[i] === from) {
                array.splice(i, 1);
            }
        }
        return array;
    };

    var mergeObjects = Class.mergeObjects = function(target, source) {
        if(target && source) {
            for(var key in source) {
                if(source.hasOwnProperty(key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };

    var mergeObjectsRecursivly = Class.mergeObjectsRecursivly = function(target, source) {
        if(target && source) {
            for(var key in source) {
                if(source.hasOwnProperty(key)) {
                    if(isObject(source[key]) && isObject(target[key])) {
                        mergeObjectsRecursivly(target[key], source[key]);
                    } else {
                        target[key] = source[key];
                    }
                }
            }
        }
        return target;
    };

    var mergeObjectsSoftly = Class.mergeObjectsSoftly = function(target, source) {
        if(target && source) {
            for(var key in source) {
                if(source.hasOwnProperty(key)) {
                    if(isObject(source[key]) && isObject(target[key])) {
                        mergeObjectsSoftly(target[key] && source[key]);
                    } else if(typeof target[key] === "undefined") {
                        target[key] = source[key];
                    }
                }
            }
        }
    };

    var execFnList = Class.execFnList = function(fnList, thisArg, args, stopOnFalse) {
        if(fnList.length) {
            for(var i = 0; i < fnList.length; i++) {
                if(fnList[i].apply(thisArg, args) === false && stopOnFalse){
                    break;
                }
            }
        }
    };

    var forEach = Class.forEach = function forEach(obj, iterator, context) {
        var key;
        if(obj) {
            if(isFn(obj)) {
                for(key in obj) {
                    if(key != "prototype" && key != "length" && key != "name" && obj.hasOwnProperty(key)) {
                        iterator.call(context, obj[key], key);
                    }
                }
            } else if (obj.forEach && obj.forEach !== forEach) {
                obj.forEach(iterator, context);
            } else if (isArray(obj) || obj.hasOwnProperty("length")) {
                for(key = 0; key < obj.length; key++)
                    iterator.call(context, obj[key], key);
            } else {
                for(key in obj) {
                    if(obj.hasOwnProperty(key)) {
                        iterator.call(context, obj[key], key);
                    }
                }
            }
        }
        return obj;
    };

    var returnFalse = Class.returnFalse = function() {
        return false;
    }

    var noop = Class.noop = function() {};

    var exportMethod = Class.exportMethod = function(toReturn, thisArg, method) {
        return function() {
            method.apply(thisArg, toArray(arguments));
            return toReturn;
        };
    };

    exportMethod.flag = new Date().getTime() - Math.random();

    var valuesToExport = Class.valuesToExport = {
        "End": exportMethod.flag,
        "Config": exportMethod.flag,
        "PersistentPlugins": exportMethod.flag
    };

    var swappedGlobalValues = Class.swappedGlobalValues = {};
    var addExports = Class.addExports = function(obj, globalize, aClass) {
        findExportAndExport(valuesToExport, obj, aClass, obj, aClass);

        if(globalize) {
            for(var key in valuesToExport) {
                if(valuesToExport.hasOwnProperty(key)) {
                    swappedGlobalValues[key] = aClass._config.globalObj[key];
                    aClass._config.globalObj[key] = obj[key];
                }
            }
        }
    };

    var findExportAndExport = Class.findExportAndExport = function(valuesToExport, obj, source, toReturn, thisArg) {

        for(var key in valuesToExport) {
            if(valuesToExport.hasOwnProperty(key)) {
                if(valuesToExport[key] === exportMethod.flag) {
                    obj[key] = exportMethod(toReturn, thisArg, source[key]);
                } else if(isObject(valuesToExport[key])/* || typeof valuesToExport[key] === "function"*/) {
                    if(valuesToExport[key].valueOf() === exportMethod.flag) {
                        obj[key] = exportMethod(toReturn, thisArg, source[key]);
                    } else {
                        obj[key] = mergeObjects({}, valuesToExport[key]);
                    }
                    findExportAndExport(valuesToExport[key], obj[key], source[key], toReturn, thisArg);
                } else {
                    obj[key] = valuesToExport[key];
                }
            }
        }

    }

    var removeExports = Class.removeExports = function(obj, aClass) {
        for(var key in valuesToExport) {
            if(valuesToExport.hasOwnProperty(key)) {

                if(obj[key] === aClass._config.globalObj[key]) {
                    if(typeof swappedGlobalValues[key] === "undefined") {
                        delete aClass._config.globalObj[key];
                    } else {
                        aClass._config.globalObj[key] = swappedGlobalValues[key];
                    }
                }

                delete obj[key];
            }
        }

        swappedGlobalValues = {};
    };

    var addQueuedPlugins = Class.addQueuedPlugins = function(aClass, component) {
        var pluginsObj,
            aClassConfig = aClass._config,
            persistenPlugins = {};

        if(aClassConfig.persistentPluginsAlias[component.type]) {
            var alias = aClassConfig.persistentPluginsAlias[component.type];
            mergeObjects(persistenPlugins, aClassConfig.persistentPlugins[alias]);
        }

        if(aClassConfig.persistentPlugins[component.type]) {
            mergeObjects(persistenPlugins, aClassConfig.persistentPlugins[component.type]);
        }

        aClass._componentQueuedPlugins.addPlugins(persistenPlugins, true);
        pluginsObj = aClass._componentQueuedPlugins.getPlugins();

        aClass.applyPluginsToList(component.plugins, pluginsObj);

        aClass._componentQueuedPlugins.reset();

    };

    function PluginsList(aClass, description, component) {
        this._ClassDefiner = aClass._ClassDefiner;

        this._plugins = null;
        this._order = null;
        this._events = null;

        this.Class = aClass;
        this.component = component || null;
        this[description] = true;
    }

    Class.PluginsList = PluginsList;

    PluginsList.prototype = {
        reset: function() {
            this._plugins = null;
            this._order = null;
        },
        getPlugins: function() {
            return this._plugins;
        },
        addPlugin: function(pluginName, pluginArgs, softly) {
            var plugins = this._plugins;

            if(plugins === null) {
                plugins = this._plugins = {};
            }

            var hasPlugin = plugins.hasOwnProperty(pluginName),
                allowMultipleApply = false,
                rg = this._ClassDefiner.registeredPlugins;


            if(rg.hasOwnProperty(pluginName) && rg[pluginName].multipleApply === true) {
                allowMultipleApply = true;
            }

            if(allowMultipleApply && pluginArgs.hasOwnProperty("multipleApply")) {
                if(pluginArgs.multipleApply) {
                    if(hasPlugin) {
                        plugins[pluginName] = plugins[pluginName].concat(pluginArgs);
                    } else {
                        plugins[pluginName] = pluginArgs;
                    }
                } else if(hasPlugin) {
                    plugins[pluginName].push(pluginArgs);
                } else {
                    plugins[pluginName] = [pluginArgs];
                    plugins[pluginName].multipleApply = true;
                }
            } else if (!softly || (softly && !hasPlugin)) {
                plugins[pluginName] = pluginArgs;
            }

        },
        addPlugins: function(pluginsObj, softly) {
            if(pluginsObj instanceof PluginsList) {
                this.addPlugins(pluginsObj._plugins, softly);
                return;
            }
            for(var key in pluginsObj) {
                if(pluginsObj.hasOwnProperty(key)) {
                    this.addPlugin(key, pluginsObj[key], softly);
                }
            }
        },
        refreshOrder: function() {
            var order = [],
                plugins = this._plugins,
                rg = this._ClassDefiner.registeredPlugins;

            for(var key in plugins) {
                if(rg.hasOwnProperty(key)) {
                    order.push(key);
                }
            }

            order.sort(function(a, b) {
                return rg[a].priority - rg[b].priority;
            });

            return this._order = order;
        },
        execute: function(on, args) {
            var plugins = this._plugins,
                rg = this._ClassDefiner.registeredPlugins,
                order = this._order;

            if(order === null) {
                order = this.refreshOrder();
            }

            if(this._events && this._events.beforeExec) {
                execFnList(this._events.beforeExec, this);
            }

            if(order.length) {
                for(var i = 0; i < order.length; i++) {
                    var pluginName = order[i];
                    if(rg.hasOwnProperty(pluginName) && isFn(rg[pluginName][on])) {
                        if(plugins[pluginName].multipleApply === true) {

                            for(var j = 0 ; j < plugins[pluginName].length; j++) {
                                if(plugins[pluginName][j] !== null) {
                                    if(rg[pluginName][on].apply(rg[pluginName], args.concat(plugins[pluginName][j])) === false) {
                                        plugins[pluginName].splice(j, 1);
                                        j--;
                                        if(!plugins[pluginName].length) {
                                            order.splice(i, 1);
                                            i--;
                                        }
                                    }
                                }
                            }

                        } else if(plugins[pluginName] !== null) {

                            if(rg[pluginName][on].apply(rg[pluginName], args.concat(plugins[pluginName])) === false) {
                                delete plugins[pluginName];
                                order.splice(i, 1);
                                i--;
                            }
                        }
                    }
                }
            }

            if(this._events && this._events.afterExec) {
                execFnList(this._events.afterExec, this);
            }

        },
        onBeforeExec: function(fn) {
            return this.on("beforeExec", fn);
        },
        onAfterExec: function(fn) {
            return this.on("afterExec", fn);
        },
        on: function(eventName, fn) {
            var events = this._events;
            if(events === null) {
                events = this._events = {};
            }

            if(!events[eventName]) {
                events[eventName] = [];
            }

            events[eventName].push(fn);
        }
    };

    var navigateObj = Class.navigateObj = function(obj, road, fn) {
        if(typeof road === "string") {
            road = cleanArray(road.split("."));
        }
        for(var i = 0; i < road.length; i++) {
            if(fn.call(obj, road[i], obj[road[i]], i, road) === false) {
                return null;
            }
            obj = obj[road[i]];
        }

        return obj;
    };

    navigateObj.set = function(obj, road, endValue, setOwn) {
        navigateObj(obj, road, function(key, value, i, road) {
            if(i === road.length - 1) {
                if(isObject(value)) {
                    if(isObject(endValue) || isFn(endValue)) {
                        this[key] = endValue;
                        mergeObjects(this[key], value);
                    } else {
                        this[key].valueOf = function() {
                            return endValue;
                        };
                    }
                } else {
                    this[key] = endValue;
                }
            } else {
                var typeofValue = (value !== null ? typeof value : "null");

                switch(typeofValue) {
                    case "undefined":
                        this[key] = {};
                        break;

                    case "number":
                    case "string":
                    case "boolean":
                    case "null":
                        this[key] = {
                            valueOf: function() {
                                return value;
                            }
                        };
                        break;

                    case "object":
                        if(setOwn && !this.hasOwnProperty(key)) {
                            this[key] = makeInherit(this[key]);
                        }
                        break;
                    default:
                        break;
                }
            }
        });
        return endValue;
    };

    navigateObj.setOwn = function(obj, road, endValue) {
        navigateObj.set(obj, road, endValue, true);
    }

    navigateObj.get = function(obj, road) {
        var endValue;

        navigateObj(obj, road, function(key, value) {
            endValue = value;
            if(!isObject(value) && isFn(value)) {
                return false;
            }
        });

        return endValue;
    };

    Class.treatDependencies = function(dependencies) {
        for(var i = 0; i < dependencies.length; i++) {
            if(typeof dependencies[i] === "string") {
                dependencies[i] = "ClassRequireJSPlugin!" + dependencies[i];
            }
        }
    };

    var classicalJsDefine;
    var getDefine = Class.getDefine = function() {
        return classicalJsDefine || globalConfig.globalObj.define;
    };

    if( isFn(getDefine()) ) {
        getDefine()("Class", [], function() {
            return Class;
        });

        getDefine()("ClassRequireJSPlugin", {
            load: function(name, require, load, config) {

                require([name], function(value) {
                    load(value);
                });
            }
        });

    }

    globalConfig.globalObj.Class = Class;


    if(typeof module !== "undefined" && module.exports) {
        module.exports = Class;

        ;(function() {

            var lastDefineValue = null;
            classicalJsDefine = function(dependencies, callback) {
                if(!callback && !isArray(dependencies)) {
                    callback = dependencies;
                    dependencies = [];
                }
                lastDefineValue = callback.apply(globalConfig.globalObj, dependencies);
            };

            var pathReg = /at .+ \((\/.+):[0-9]+:[0-9]+\)?$/;

            function getStackPath(aStackLine) {
                var match = pathReg.exec(aStackLine);
                return match ? match[1] : null;
            }

            function getCallerFile(stack) {
                stack = stack.split("\n");
                //0 is "Error" (ignored)
                for(var i = 1; i < stack.length; i++) {
                    var stackPath = getStackPath(stack[i]);
                    if(stackPath !== __filename) {
                        return stackPath;
                    }
                }
                return null;
            }

            function classicalJsRequire(callerFile, ressource) {

                //core module
                if(ressource.charAt(0) !== "." || ressource.charAt(0) !== "/") {
                    try {
                        if(require.resolve(ressource) === ressource) {
                            return require(ressource);
                        }
                    } catch (e) {}
                }

                callerFile = cleanArray(callerFile.split("/"));
                callerFile.pop();

                ressource = cleanArray(ressource.split("/"));

                var loadedRessource = require("/" + callerFile.concat(ressource).join("/"));
                if(isEmptyObject(loadedRessource)) {
                    loadedRessource.__Class = lastDefineValue;
                    loadedRessource = lastDefineValue;

                } else if(loadedRessource.__Class) {
                    loadedRessource = loadedRessource.__Class;
                }
                lastDefineValue = null;
                return loadedRessource;
            }


            Class.addPlugin({
                name: "Import",
                globalize: true,
                exportPlugin: false,
                addToInstances: false,
                multipleApply: true,

                onApply: Class.returnFalse,
                onCall: function(info, ressource) {
                    var loadedRessource,
                        callerFile = getCallerFile(new Error().stack),
                        heldQueuedDepencencies = queuedDepencencies;

                    queuedDepencencies = [];
                    if(callerFile) {
                        if(isArray(ressource)) {
                            loadedRessource = [];
                            for(var i = 0; i < ressource.length; i++) {
                                loadedRessource.push(classicalJsRequire(callerFile, ressource[i]));
                            }
                            heldQueuedDepencencies = queuedDepencencies.concat(loadedRessource);
                        } else {
                            loadedRessource = classicalJsRequire(callerFile, ressource);
                            heldQueuedDepencencies.push(loadedRessource);
                        }
                    } else {
                        throw "Was not able to resolve the callerFile of Import. Was trying to Import: " +
                            ressource;
                    }
                    queuedDepencencies = heldQueuedDepencencies;
                    return loadedRessource;
                }
            });

        }());
    } else {
        Class.addPlugin({
            name: "Import",
            globalize: true,
            exportPlugin: false,
            addToInstances: false,
            multipleApply: true,

            onApply: Class.returnFalse,
            onCall: function(info, ressource) {
                if(isArray(ressource)) {
                    queuedDepencencies = queuedDepencencies.concat(ressource);
                } else {
                    queuedDepencencies.push(ressource);
                }

                return false;
            }
        });
    }

    Class.addPlugin({
        name: "Import.clear",
        globalize: true,
        exportPlugin: false,
        addToInstances: false,

        onApply: Class.returnFalse,
        onCall: function() {
            queuedDepencencies = [];
        }

    });

}());