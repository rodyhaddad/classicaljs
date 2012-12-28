;(function(){
    
    Class.version = "1.3";
    
    var globalConfig = Class._config = {
    
        
        constructorName: "init",
        
        
        superName: "super", 
        
        
        
        globalize: true,
        
        keepDefinedClasses: true,
        
        allowJSNativeMode: true,
        
        globalObj: typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : this),
        
        defineRequireJS: true,
        
        persistentPlugins: {
            PrivateVar: {},
            ProtectedVar: {},
            PublicVar: {},
            PrivateFn: {},
            ProtectedFn: {},
            PublicFn: {}
        }
    };
    
    
    var definedClasses = Class.definedClasses = {};
    
    var objectsToInherit = Class.objectsToInherit = { _config : globalConfig };
    
    var currentlyBuildingClass = null;
    
    var queuedDepencencies = [];
    
    function Class(dependencies, name, classConfig, definition){
        
        if(!(this instanceof Class)){
            return new Class(dependencies, name, classConfig, definition);
        }
        
        var params = sortParams([dependencies, name, classConfig, definition]);
        
        if(currentlyBuildingClass){
            //throw "You are building a new Class ('" + params.name + "') without Ending the last one ('" + currentlyBuildingClass.name + "'). Please call 'End()' on the last Class before trying to build a new one";
        }
        currentlyBuildingClass = this;

        for(var key in objectsToInherit){
            this[key] = makeRecursiveInherit(objectsToInherit[key], "_Class", this);
        }
        
        this.Config(params.classConfig || {});
        
        
        this._queuedPlugins = {};
        
        
        this.name = params.name;
        
        
        this.commands = [];
        
        
        this._extends = null;
        
        this._hasPrivate = this._hasProtected = this._hasPublic = false;
        
        
        this._privateVars = [];
        this._privateFns = [];
        this._protectedVars = [];
        this._protectedFns = [];
        this._publicVars = [];
        this._publicFns = [];
        this._voidPlugins = [];
        
        var pluginDataObj;
        this.pluginData = function(){
            return pluginDataObj || (pluginDataObj = this._extends ? makeInherit(this._extends.pluginData()) : {} );
        };
        
        var self = this;
        
        
        var aClassConstructor = new Function("self", "objToArray", "function "+(this.name || "AnonymousClass")+"(){ return self.onCallClassConstructor.call(this, objToArray(arguments)); } return "+(this.name || "AnonymousClass")+";")(self, objToArray);
                    
        /*function aClassConstructor(){
            return self.onCallClassConstructor.call(this, objToArray(arguments));
        }*/
        
        
        aClassConstructor._Class = this;
        
        
        this.classConstructor = aClassConstructor;
        
        
        addExports(aClassConstructor, this._config.globalize, this);
        
        if(params.definitionWrapper !== null){
            if(this._config.defineRequireJS && typeof define === "function"){

                if(params.dependencies !== null && params.dependencies.length){
                    Class.treatRequireJSDependencies(params.dependencies);
                    define(params.dependencies, function(){
                        params.definitionWrapper.call(aClassConstructor, objToArray(arguments));
                        aClassConstructor.End(true);
                        return aClassConstructor;
                    });
                }else{
                    define(function(){
                        params.definitionWrapper.call(aClassConstructor);
                        aClassConstructor.End(true);
                        return aClassConstructor;
                    })
                }
                
            }else{
                params.definitionWrapper.call(aClassConstructor);
                aClassConstructor.End();
            }
        }
        
        return aClassConstructor;
        
    };
    
    
    var pluginPriority = Class.pluginPriority = {high: 10, medium: 20, low: 30};
    
    var registeredPlugins = Class.registeredPlugins = {};
    
    Class.addPlugin = function(pluginInfo){
        
        
        if(typeof pluginInfo.onDefinition === "function" || typeof pluginInfo.onInstanceCreation === "function"){

            
            pluginInfo.chainName = pluginInfo.chainName || pluginInfo.name;
            
            var splitChainName = cleanArray(pluginInfo.chainName.split("."), "");
            var undef;
            navigateObj( functionsToExport, splitChainName, function(i){
                return this.length-i === 1 ? undef : {};
            });
            
            if((pluginInfo.position === "before" || pluginInfo.position === "after")){
                
                if(typeof pluginInfo.priority !== "number"){
                    
                    if(pluginPriority[pluginInfo.priority]){
                        pluginInfo.priority = pluginPriority[pluginInfo.priority];
                    }else{
                        
                        throw "The plugin '"+pluginInfo.name+"' has the priority '"+pluginInfo.priority+"' which is not defined";
                    }
                }
                
                
                navigateObj(Class.prototype, splitChainName, function(i){
                    if(this.length-i !== 1){
                        return {};                        
                    }else{
                        return function(deleted){
                            var pluginList, args = objToArray(arguments);
                            var self = this._Class || this;
                            
                            if(deleted === null && args.length === 1){
                                args = null;
                            }
                            
                            if(pluginInfo.position === "before"){
                                
                                pluginList = self._queuedPlugins;
                            }else if(pluginInfo.position === "after"){
                                
                                pluginList = self.commands[this.commands.length-1].plugins;
                            }
                            
                            pluginList[pluginInfo.name] = args;
                            
                            return self;
                        };
                    }
                });
                
            }else if(pluginInfo.position === "void"){
                
                pluginInfo.priority = -10000;
                
                navigateObj(Class.prototype, splitChainName, function(i){
                    if(this.length-i !== 1){
                        return {};                        
                    }else{
                        
                        return function(){
                            var args = objToArray(arguments);
                            var self = this._Class || this;
                            
                            var command = {type: "VoidPlugin", layer: null, category: null, name: null, value: null, plugins: {}};
                            
                            command.plugins[pluginInfo.name] = args;
                            
                            
                            self.commands.push(command);
                            
                            
                            self._voidPlugins.push(command);
                            
                            
                            addQueuedPlugins(self, command);
                            
                            return self;
                        };
                    }
                })
            }else{
                throw "Invalid Plugin passed to Class.addPlugin(). pluginInfo.position is invalid on the plugin. Should be either 'before', 'after' or 'void'";
            }
            
            if(splitChainName.length > 1){
                objectsToInherit[splitChainName[0]] = Class.prototype[splitChainName[0]];
            }
            
            
            registeredPlugins[pluginInfo.name] = pluginInfo;
        }else{
            throw "Invalid Plugin passed to Class.addPlugin(). No pluginInfo.onDefinition or pluginInfo.onInstanceCreation available on the plugin.";
        }
        
    };
    
    
    
    Class.Config = function(obj){
        
        if(obj.hasOwnProperty("persistentPlugins")){
            
            Class.PersistentPlugins(obj.persistentPlugins);
            delete obj.persistentPlugins;
        }
        mergeObjects(globalConfig, obj);
        
        return this;
    };
    
    
    
    
    Class.PersistentPlugins = function(pluginsObject){
        mergeObjects(globalConfig.persistentPlugins.PrivateVar, mergeObjects(mergeObjects({}, pluginsObject.Var), pluginsObject.PrivateVar));
        mergeObjects(globalConfig.persistentPlugins.ProtectedVar, mergeObjects(mergeObjects({}, pluginsObject.Var), pluginsObject.ProtectedVar));
        mergeObjects(globalConfig.persistentPlugins.PublicVar, mergeObjects(mergeObjects({}, pluginsObject.Var), pluginsObject.PublicVar));
        
        mergeObjects(globalConfig.persistentPlugins.PrivateFn, mergeObjects(mergeObjects({}, pluginsObject.Fn), pluginsObject.PrivateFn));
        mergeObjects(globalConfig.persistentPlugins.ProtectedFn, mergeObjects(mergeObjects({}, pluginsObject.Fn), pluginsObject.ProtectedFn));
        mergeObjects(globalConfig.persistentPlugins.PublicFn, mergeObjects(mergeObjects({}, pluginsObject.Fn), pluginsObject.PublicFn));
        
        return this;
    };
    
    Class.prototype = {
        
        Config: function(obj){
            
            if(obj.hasOwnProperty("persistentPlugins")){
                
                this.PersistentPlugins(obj.persistentPlugins);
                delete obj.persistentPlugins;
            }
            mergeObjects(this._config, obj);
            
            return this;
        },
        
        
        PersistentPlugins: function(pluginsObject){
            mergeObjects(this._config.persistentPlugins.PrivateVar, mergeObjects(mergeObjects({}, pluginsObject.Var), pluginsObject.PrivateVar));
            mergeObjects(this._config.persistentPlugins.ProtectedVar, mergeObjects(mergeObjects({}, pluginsObject.Var), pluginsObject.ProtectedVar));
            mergeObjects(this._config.persistentPlugins.PublicVar, mergeObjects(mergeObjects({}, pluginsObject.Var), pluginsObject.PublicVar));
            
            mergeObjects(this._config.persistentPlugins.PrivateFn, mergeObjects(mergeObjects({}, pluginsObject.Fn), pluginsObject.PrivateFn));
            mergeObjects(this._config.persistentPlugins.ProtectedFn, mergeObjects(mergeObjects({}, pluginsObject.Fn), pluginsObject.ProtectedFn));
            mergeObjects(this._config.persistentPlugins.PublicFn, mergeObjects(mergeObjects({}, pluginsObject.Fn), pluginsObject.PublicFn));
            
            return this;
        },
        
        
        
        
        
        Constructor: function(fn){
            this.PublicFn(this._config.constructorName, fn);
            return this;
        },
        
        Private: function(){
            handleArgs(this, objToArray(arguments), "Private");
            return this;
        },
        
        Protected: function(){
            handleArgs(this, objToArray(arguments), "Protected");
            return this;
        },
        
        Public: function(){
            handleArgs(this, objToArray(arguments), "Public");
            return this;
        },
        
        
        
        
        PrivateVar: function(name, defaultValue){
            
            defaultValue = typeof defaultValue !== "undefined" ? defaultValue : null;

            
            var command = {type: "PrivateVar", layer: "Private", category: "Var", name: name, value: defaultValue, plugins: {}};
            
            this.commands.push(command);
            
            
            this._hasPrivate = true;
            
            this._privateVars.push(command);
            
            
            addQueuedPlugins(this, command);
            
            return this;
        },
        ProtectedVar: function(name, defaultValue){
            defaultValue = typeof defaultValue !== "undefined" ? defaultValue : null;
            var command = {type: "ProtectedVar", layer: "Protected", category: "Var", name: name, value: defaultValue, plugins: {}};
            this.commands.push(command);
            
            this._hasProtected = true;
            this._protectedVars.push(command);
            
            addQueuedPlugins(this, command);          
            return this;
        },
        PublicVar: function(name, defaultValue){
            defaultValue = typeof defaultValue !== "undefined" ? defaultValue : null;
            var command = {type: "PublicVar", layer: "Public", category: "Var", name: name, value: defaultValue, plugins: {}};
            this.commands.push(command);
            
            this._hasPublic = true;
            this._publicVars.push(command);
            
            addQueuedPlugins(this, command);
            
            return this;
        },
        
        
        PrivateFn: function(name, fn){
            var command = {type: "PrivateFn", layer: "Private", category: "Fn", name: name, value: fn, plugins: {}};
            this.commands.push(command);
            
            this._hasPrivate = true;
            this._privateFns.push(command);
            
            addQueuedPlugins(this, command);
            
            return this;
        },
        ProtectedFn: function(name, fn){
            var command = {type: "ProtectedFn", layer: "Protected", category: "Fn", name: name, value: fn, plugins: {}};
            this.commands.push(command);
            
            this._hasProtected = true;
            this._protectedFns.push(command);
            
            addQueuedPlugins(this, command);
            
            return this;
        },
        PublicFn: function(name, fn){
            var command = {type: "PublicFn", layer: "Public", category: "Fn", name: name, value: fn, plugins: {}};
            this.commands.push(command);
            
            this._hasPublic = true;
            this._publicFns.push(command);
            
            addQueuedPlugins(this, command);
            
            return this;
        },
        
        
        Extends: function(object){
            
            if(typeof object === "string"){
                object = definedClasses[object];
            }
            
            object = object._Class;
            
            
            if(!object){
                throw "a Class (or Class name) was not given to .Extends()";
            }
            
            
            var command = {type: "Extends", object: object};
            
            this.commands.unshift(command);
            
            this._extends = command.object;
            
            
            return this;
        },
        
        
        
        
        
        
        
        _: function(position, pluginsObject){
            var pluginList;
            
            
            if(typeof position === "object"){
                pluginsObject = position;
                position = "prev";
            }
            
            
            if(position === "next"){
                pluginList = this._queuedPlugins;
            }else if(position === "prev"){
                pluginList = this.commands[this.commands.length-1].plugins;
            }else{throw " Unknown position '"+position+"' sent to _ of Class"; }
            
            
            for(var key in pluginsObject){
                if(registeredPlugins.hasOwnProperty(key)){
                    if(pluginsObject[key] !== null){
                        var pluginInfo = registeredPlugins[key];
                        
                        var args = isArray(pluginsObject[key]) === false ? [pluginsObject[key]] : pluginsObject[key];
                        
                        if(pluginInfo.position === "void"){
                            args = null;
                        }
                        
                        
                        pluginList[pluginInfo.name] = args;
                    }else{
                        
                        pluginList[registeredPlugins[key].name] = null;
                    }
                }
            }
            return this;
        },
        
        
        getCommandByName: function(aName){
            for(var i=0;i<this.commands.length;i++){
                if(this.commands[i].name === aName ){
                    return this.commands[i];
                }
            }
            return null;
        },
        
        getCommandsByType: function(aType){
            var validCommands = [];
            for(var i=0;i<this.commands.length;i++){
                if(this.commands[i].type === aType ){
                    validCommands.push(this.commands[i]);
                }
            }
            return validCommands;
        },
        
        getCommandsByLayer: function(aLayer){
            var validCommands = [];
            for(var i=0;i<this.commands.length;i++){
                if(this.commands[i].layer === aLayer ){
                    validCommands.push(this.commands[i]);
                }
            }
            return validCommands;
        },
        
        getCommandsByCategory: function(aCategory){
            var validCommands = [];
            for(var i=0;i<this.commands.length;i++){
                if(this.commands[i].category === aCategory ){
                    validCommands.push(this.commands[i]);
                }
            }
            return validCommands;
        },
        
        allowJSNativeMode: function(){
            return this._config.allowJSNativeMode && !this._hasPrivate && !this._hasProtected && (this._extends ? this._extends.allowJSNativeMode() : true);
        },
        
        End: function(dontTryDefine){
            var i, self = this;
            
            if(this._config.keepDefinedClasses){
                definedClasses[this.name] = this.classConstructor;
            }
            
            if(this._extends){
                this.classConstructor.prototype = makeInherit(this._extends.classConstructor.prototype);
            }else{
                this.classConstructor.prototype = makeInherit({});
            }
            
            for(i=0;i<this.commands.length;i++){
                
                if(this.commands[i].plugins){
                    
                    
                    sortPluginsByPriority(this.commands[i].plugins);
                    
                    
                    executePlugins(this.commands[i].plugins, "onDefinition", [{
                        command: this.commands[i], 
                        Class: this,
                        pluginData: this.pluginData
                    }]);
                
                }
            }

            
            if(!this.allowJSNativeMode()){
            
                this.onCallClassConstructor = function(args){
                    var publicObj = self._BuildClassical().publicObj;
                    
                
                    var instance = makeInherit(publicObj);
                    
                    
                    instance._Class = self;
                    
                    
                    if(instance[self._config.constructorName]){
                        
                        var constructorResult = instance[self._config.constructorName].apply({}, args); 
                        
                        
                        if(typeof constructorResult === "object"){
                            
                            return constructorResult;
                        }else{
                            
                            return instance;
                        }
                    }else{
                        
                        return instance;
                    }
                };
            }else{
                
                var fns = this.getCommandsByCategory("Fn");
                var proto = this.classConstructor.prototype;
                for(i=0;i<fns.length;i++){
                    proto[fns[i].name] = fns[i].value;
                }
                
                
                this.onCallClassConstructor = function(args){
                    self._BuildNative(this, self);
                    if(this[self._config.constructorName]){
                    
                        var constructorResult = this[self._config.constructorName].apply(this, args); 
                        
                        
                        if(typeof constructorResult === "object"){
                            
                            return constructorResult;
                        }else{
                            
                            return this;
                        }
                    }else{
                        
                        return this;
                    }
                };
            }
                        
            currentlyBuildingClass = null;
            removeExports(this.classConstructor, this);

            if(typeof define === "function" && this._config.defineRequireJS && dontTryDefine !== true){
                define(function(){
                    return self.classConstructor
                })
            }
            
            return this.classConstructor;
        },
        
        
        _BuildNative: function(instance, classCurrentlyBuilding){
            //classCurrentlyBuilding: classCurrentlyBuilding,
            var pluginObj, parentObj, getterSetters, pluginDataObj, pluginData;
            
            classCurrentlyBuilding = classCurrentlyBuilding || this;
            
            if(this._extends){
                parentObj = this._extends._BuildNative(instance, classCurrentlyBuilding);
            }else{
                parentObj = null;
            }
            
            pluginData = parentObj ? parentObj.pluginData : function(){
                return pluginDataObj || (pluginDataObj = {});
            };
            
            
            instance._ = instance;
            instance.__ = instance;
            
            for(i=0;i<this._voidPlugins.length;i++){
                executePlugins(this._voidPlugins[i].plugins, "onInstanceCreation", [pluginObj = {
                    fn: null,
                    getterSetters: null,
                    command: this._voidPlugins[i],
                    Class: this,
                    classCurrentlyBuilding: classCurrentlyBuilding,
                    privateObj: instance,
                    protectedObj: instance,
                    publicObj: instance,
                    parentObj: parentObj,
                    pluginData: pluginData
                }]);
            }
            
            for(i=0;i<this._publicFns.length;i++){
                executePlugins(this._publicFns[i].plugins, "onInstanceCreation", [pluginObj = {
                    fn: this._publicFns[i].value,
                    command: this._publicFns[i],
                    Class: this,
                    classCurrentlyBuilding: classCurrentlyBuilding,
                    privateObj: instance,
                    protectedObj: instance,
                    publicObj: instance,
                    parentObj: parentObj,
                    pluginData: pluginData
                }]);
                
                if(this._publicFns[i].value !== pluginObj.fn){
                    instance[this._publicFns[i].name] = pluginObj.fn;
                }
            }
            
            for(i=0;i<this._publicVars.length;i++){
                if(!instance.hasOwnProperty(this._publicVars[i].name)){
                    getterSetters = makeGetterSetters(this._publicVars[i].name, instance);
                    
                    executePlugins(this._publicVars[i].plugins, "onInstanceCreation", [pluginObj = {
                        getterSetters: getterSetters,
                        command: this._publicVars[i],
                        Class: this,
                        classCurrentlyBuilding: classCurrentlyBuilding,
                        privateObj: instance,
                        protectedObj: instance,
                        publicObj: instance,
                        parentObj: parentObj,
                        pluginData: pluginData
                    }]);
                    
                    
                    if(getterSetters.sourceHasGetterSetter){
                        setGetterSetters(this._publicVars[i].name, getterSetters, instance);
                    }
                    if(getterSetters.sourceSetToInitialValue){
                        instance[this._publicVars[i].name] = getDefaultValue(this._publicVars[i].value);
                    }
                    
                }else if(parentObj && this._publicVars[i].value !== null){
                    instance[this._publicVars[i].name] = getDefaultValue(this._publicVars[i].value);
                }
            }
            
            return {
                privateObj: instance,
                protectedObj: instance,
                publicObj: instance,
                parentObj: parentObj,
                pluginData: pluginData,
                
                addChildFn: function(){
                    throw "This is a natively built Class. No addChildFn available";
                },
                
                addChildProperty: function(){
                    throw "This is a natively built Class. No addChildProperty available";
                }
            };

        },
        
        
        _BuildClassical: function(classCurrentlyBuilding, alreadyDefinedVars){
            var parentObj, privateObj, protectedObj, publicObj, i, fn, getterSetters, pluginObj, pluginDataObj, pluginData;
            
            classCurrentlyBuilding = classCurrentlyBuilding || this;
            alreadyDefinedVars = alreadyDefinedVars || [];
            
            if(this._extends){
                
                parentObj = this._extends._BuildClassical(classCurrentlyBuilding, alreadyDefinedVars);
                
                privateObj = makeInherit(parentObj.protectedObj);
                protectedObj = makeInherit(parentObj.protectedObj);
                publicObj = makeInherit(parentObj.publicObj);
                
                privateObj[this._config.superName] = parentObj.protectedObj;
                protectedObj[this._config.superName] = parentObj.protectedObj;
            }else{
                
                parentObj = null;
                
                privateObj = makeInherit(classCurrentlyBuilding.classConstructor.prototype);
                protectedObj = makeInherit(classCurrentlyBuilding.classConstructor.prototype);
                publicObj = makeInherit(classCurrentlyBuilding.classConstructor.prototype);
            }
            
            pluginData = parentObj ? parentObj.pluginData : function(){
                return pluginDataObj || (pluginDataObj = {});
            };
            
            privateObj.__ = protectedObj;
            privateObj._ = publicObj;
            
            protectedObj._ = publicObj;
            
            privateObj.self = this.classConstructor;
            protectedObj.self = this.classConstructor;
            
            
            for(i=0;i<this._voidPlugins.length;i++){
                executePlugins(this._voidPlugins[i].plugins, "onInstanceCreation", [pluginObj = {
                    fn: null,
                    getterSetters: null,
                    command: this._voidPlugins[i],
                    Class: this,
                    classCurrentlyBuilding: classCurrentlyBuilding,
                    privateObj: privateObj,
                    protectedObj: protectedObj,
                    publicObj: publicObj,
                    parentObj: parentObj,
                    pluginData: pluginData
                }]);
            }
            
            for(i=0;i<this._publicFns.length;i++){
                
                fn = bindThis(privateObj, this._publicFns[i].value);
                
                
                executePlugins(this._publicFns[i].plugins, "onInstanceCreation", [pluginObj = {
                    fn: fn,
                    command: this._publicFns[i],
                    Class: this,
                    classCurrentlyBuilding: classCurrentlyBuilding,
                    privateObj: privateObj,
                    protectedObj: protectedObj,
                    publicObj: publicObj,
                    parentObj: parentObj,
                    pluginData: pluginData
                }]);
                
                fn = pluginObj.fn;
                
                
                publicObj[this._publicFns[i].name] = fn;
                protectedObj[this._publicFns[i].name] = fn;
                privateObj[this._publicFns[i].name] = fn;
                
                
                if(parentObj){
                    parentObj.addChildFn(this._publicFns[i].name, fn);
                }
            }
            
            
            
            for(i=0;i<this._protectedFns.length;i++){
            
                fn = bindThis(privateObj, this._protectedFns[i].value);
                
                executePlugins(this._protectedFns[i].plugins, "onInstanceCreation", [pluginObj = {
                    fn: fn,
                    command: this._protectedFns[i],
                    Class: this,
                    classCurrentlyBuilding: classCurrentlyBuilding,
                    privateObj: privateObj,
                    protectedObj: protectedObj,
                    publicObj: publicObj,
                    parentObj: parentObj,
                    pluginData: pluginData
                }]);
                fn = pluginObj.fn;
                
                protectedObj[this._protectedFns[i].name] = fn;
                privateObj[this._protectedFns[i].name] = fn;
                
                if(parentObj){
                    parentObj.addChildFn(this._protectedFns[i].name, fn);
                }
            }
            
            
            
            for(i=0;i<this._privateFns.length;i++){
            
                fn = bindThis(privateObj, this._privateFns[i].value);
                
                executePlugins(this._privateFns[i].plugins, "onInstanceCreation", [pluginObj = {
                    fn: fn,
                    command: this._privateFns[i],
                    Class: this,
                    classCurrentlyBuilding: classCurrentlyBuilding,
                    privateObj: privateObj,
                    protectedObj: protectedObj,
                    publicObj: publicObj,
                    parentObj: parentObj,
                    pluginData: pluginData
                }]);
                fn = pluginObj.fn;
                
                privateObj[this._privateFns[i].name] = fn;
            }
            
            
            
            for(i=0;i<this._publicVars.length;i++){
                
                if(!arrayContains(alreadyDefinedVars, this._publicVars[i].name)){
                
                    
                    getterSetters = makeGetterSetters(this._publicVars[i].name, privateObj);
                    
                    
                    executePlugins(this._publicVars[i].plugins, "onInstanceCreation", [pluginObj = {
                        getterSetters: getterSetters,
                        command: this._publicVars[i],
                        Class: this,
                        classCurrentlyBuilding: classCurrentlyBuilding,
                        privateObj: privateObj,
                        protectedObj: protectedObj,
                        publicObj: publicObj,
                        parentObj: parentObj,
                        pluginData: pluginData
                    }]);
                    
                    
                    if(getterSetters.sourceHasGetterSetter){
                        setGetterSetters(this._publicVars[i].name, getterSetters, privateObj);
                    }
                    if(getterSetters.sourceSetToInitialValue){
                        privateObj[this._publicVars[i].name] = getDefaultValue(this._publicVars[i].value);
                    }
                    
                    
                    setGetterSetters(this._publicVars[i].name, getterSetters, protectedObj);
                    setGetterSetters(this._publicVars[i].name, getterSetters, publicObj);
                    
                    
                    alreadyDefinedVars.push(this._publicVars[i].name);
                    
                    
                    if(parentObj){
                        parentObj.addChildProperty(this._publicVars[i].name, getterSetters);
                    }
                }else if(parentObj && this._publicVars[i].value !== null){
                    
                    parentObj.privateObj[this._publicVars[i].name] = getDefaultValue(this._publicVars[i].value);
                }
            }
            
            
            
            for(i=0;i<this._protectedVars.length;i++){
                if(!arrayContains(alreadyDefinedVars, this._protectedVars[i].name)){
                    
                    getterSetters = makeGetterSetters(this._protectedVars[i].name, privateObj);
                    
                    executePlugins(this._protectedVars[i].plugins, "onInstanceCreation", [pluginObj = {
                        getterSetters: getterSetters,
                        command: this._protectedVars[i],
                        Class: this,
                        classCurrentlyBuilding: classCurrentlyBuilding,
                        privateObj: privateObj,
                        protectedObj: protectedObj,
                        publicObj: publicObj,
                        parentObj: parentObj,
                        pluginData: pluginData
                    }]);
                    
                    if(getterSetters.sourceHasGetterSetter){
                        setGetterSetters(this._protectedVars[i].name, getterSetters, privateObj);
                    }
                    if(getterSetters.sourceSetToInitialValue){
                        privateObj[this._protectedVars[i].name] = getDefaultValue(this._protectedVars[i].value);
                    }
                    
                    setGetterSetters(this._protectedVars[i].name, getterSetters, protectedObj);
                    
                    alreadyDefinedVars.push(this._protectedVars[i].name);
                    if(parentObj){
                        parentObj.addChildProperty(this._protectedVars[i].name, getterSetters);
                    }
                }else if(parentObj && this._protectedVars[i].value !== null){
                    parentObj.privateObj[this._protectedVars[i].name] = getDefaultValue(this._protectedVars[i].value);
                }
            }
            
            
            for(i=0;i<this._privateVars.length;i++){
                
                getterSetters = makeGetterSetters(this._privateVars[i].name, privateObj);
                
                executePlugins(this._privateVars[i].plugins, "onInstanceCreation", [pluginObj = {
                    getterSetters: getterSetters,
                    command: this._privateVars[i],
                    Class: this,
                    classCurrentlyBuilding: classCurrentlyBuilding,
                    privateObj: privateObj,
                    protectedObj: protectedObj,
                    publicObj: publicObj,
                    parentObj: parentObj,
                    pluginData: pluginData
                }]);
            
                if(getterSetters.sourceHasGetterSetter){
                    setGetterSetters(this._privateVars[i].name, getterSetters, privateObj);
                }
                if(getterSetters.sourceSetToInitialValue){
                    privateObj[this._privateVars[i].name] = getDefaultValue(this._privateVars[i].value);
                }
            }
            
            
            return {
                
                privateObj: privateObj,
                protectedObj: protectedObj,
                publicObj: publicObj,
                parentObj: parentObj,
                pluginData: pluginData,
                
                addChildFn: function(name, fn){
                    privateObj[name] = fn;
                    
                    if(parentObj){
                        parentObj.addChildFn(name, fn);
                    }
                },
                
                addChildProperty: function(name, getterSetters){
                    setGetterSetters(name, getterSetters, privateObj);
                    
                    if(parentObj){
                        parentObj.addChildProperty(name, getterSetters);
                    }
                }
            };
            
        }
        
    };
    
    
    var isArray = Class.isArray = function(obj){
        return Object.prototype.toString.call(obj) === "[object Array]";
    };
    
    var isObject = Class.isObject = function(obj){
        return typeof obj === "object" && obj !== null;
    }
    
    var objToArray = Class.objToArray = function(obj){
        return Array.prototype.slice.call(obj, 0);
    };
    
    function sortParams(params){
        var obj = {
            name: "",
            classConfig: null,
            definition: null,
            definitionWrapper: null,
            dependencies: null
        };
        
        var len = params.length > 4 ? 4 : params.length;
        
        for(var i=0; i<len; i++){
            switch(typeof params[i]){
                case "string":
                    obj.name = params[i];
                    break;
                case "object":
                    if(isArray(params[i])){
                        obj.dependencies = params[i];
                    }else if(params[i] !== null){
                        if(obj.classConfig === null){
                            obj.classConfig = params[i];
                        }else{
                            obj.definition = params[i];
                        }
                    }
                    break;
                case "function":
                    obj.definition = params[i];
                    break;
            }
        }
        
        if(obj.classConfig !== null && obj.definition === null){
            for(var key in obj.classConfig){
                if(obj.classConfig.hasOwnProperty(key) && !globalConfig.hasOwnProperty(key)){
                    obj.definition = obj.classConfig;
                    
                    obj.classConfig = null;
                    break;
                }
            }
        }
        
        if(obj.definition !== null){
            obj.definitionWrapper = (function(definition){
                return function(args){
                    if(typeof definition === "function"){
                        definition = definition.apply(this, args);
                    }
                    if(definition){
                        for(var key in definition){
                            if(definition.hasOwnProperty(key)){
                                if(this[key]){
                                    this[key](definition[key]);
                                }else if(key.indexOf(".") !== -1){
                                    var fn = navigateObj(this, cleanArray(key.split("."), ""), false);
                                    if(fn){
                                        fn(definition[key]);
                                    }
                                }else{
                                    this.Public(key, definition[key]);
                                }
                            }
                        }
                    }
                };
            }(obj.definition));
        }
        
        obj.dependencies = queuedDepencencies.concat(obj.dependencies || []);
        queuedDepencencies = [];
        
        return obj;
        
    } 
    
    function handleArgs(aClass, args, mode){
        var i, length = args.length, undef, key;
        
        if(length === 1){
            if(typeof args[0] === "function"){
                aClass[mode+"Fn"](args[0].name, args[0]); 
                return; 
            }else if(typeof args[0] === "string"){
                aClass[mode+"Var"](args[0], undef); 
                return; 
            }
            
        }
        if(length === 2 && typeof args[0] === "string"){
            if(typeof args[1] === "function"){ 
                aClass[mode+"Fn"](args[0], args[1]); 
                return; 
            }else{
                aClass[mode+"Var"](args[0], args[1]); 
                return; 
            }
            
        }
        
        for(i=0;i<length;i++){
            
            if(isObject(args[i])){
                for(key in args[i]){ 
                    if(typeof args[i][key] === "function"){ 
                        aClass[mode+"Fn"](key, args[i][key]); 
                        
                    }else if(aClass[key]){
                        aClass[key](args[i][key]);
                    }else if(key.indexOf(".") !== -1){
                        var fn = navigateObj(this, cleanArray(key.split("."), ""), false);
                        if(fn){
                            fn(args[i][key]);
                        }
                    }else{
                        aClass[mode+"Var"](key, args[i][key]);
                        
                    }
                }

            }else if(typeof args[i] === "function"){ 
                aClass[mode+"Fn"](args[i].name, args[i]); 
                
            }else if(typeof args[i] === "string"){ 
                aClass[mode+"Var"](args[i], undef); 
                
            }
        }
    }
    
    
    var makeInherit = Class.makeInherit = (function(){
        if(Object.create){
            return function(obj){
                return Object.create(obj);
            };
        }else{
            return function(obj){
                function o(){}
                o.prototype = obj;
                return new o();
            };
        }
    }());
    
    makeRecursiveInherit = Class.makeRecursiveInherit = function(obj, persistentProp, value){
        var inheritObj = makeInherit(obj);
        if(typeof persistentProp !== "undefined"){
            inheritObj[persistentProp] = value;
        }
        for(var key in obj){
            if(obj.hasOwnProperty(key)){
                if(isObject(obj[key]) && globalConfig.globalObj !== obj[key]){
                    inheritObj[key] = makeRecursiveInherit(obj[key], persistentProp, value);
                }
            }
        }
        return inheritObj;
    };
    
    
    
    var bindThis = Class.bindThis = (function(){
        
            return function(thisArg, fn){
                return function(){
                    var result = fn.apply(thisArg, arguments);
                    return result !== thisArg ? result : this;
                };
            };
        
    }());
    
    
    
    
    var makeGetterSetters = function(name, source){
        var obj, value = source[name];
        return obj = {
            get: function(){
                return obj.sourceHasGetterSetter ? value : source[name];
            },
            set: function(newValue){
                return obj.sourceHasGetterSetter ? value = newValue : source[name] = newValue;
            },
            
            sourceHasGetterSetter: false,
            sourceSetToInitialValue: true
        };
    };
    
    
    var setGetterSetters = function(name, getterSetters, target){
        Object.defineProperty(target, name, {
            get: getterSetters.get,
            set: getterSetters.set,
            configurable: true,
            enumerable: true
        });
    };
    
    var arrayContains = Class.arrayContains = function(array, value){
        return indexOf(array, value) !== -1;
    };
    
    
    var indexOf = Class.indexOf = (function(){
        if(Array.prototype.indexOf){
            return function(array, value){
                return array.indexOf(value);
            };
        }else{
            return function(array, value){
                var i, length = array.length;
                for(i=0;i<length;i++){
                    if(array[i] === value){
                        return i;
                    }
                }
                return -1;
            };
        }
    }());
    
    var cleanArray = Class.cleanArray = function(array, from){
        for(var i=array.length-1; i>=0; i--){
            if(array[i] === from){
                array.splice(i, 1);
            }
        }
        return array;
    }
    
    var getDefaultValue = Class.getDefaultValue = function(value){
        if(isArray(value)){
            return value.slice();
        }else if(isObject(value)){
            return mergeObjects({}, value);
        }else{
            return value;
        }
    }
    
    var mergeObjects = Class.mergeObjects = function(target, source){
        if(target && source){
            for(var key in source){
                if(source.hasOwnProperty(key)){
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    
    
    var functionsToExport = Class.functionsToExport = (function(){
        var methodsToExport = ["Private", "Protected", "Public", "Extends", "End", "Constructor", "Config", "_", "PersistentPlugins"];
        var objToExport = {}, undef;
        
        for(var i=0;i<methodsToExport.length; i++){
            objToExport[methodsToExport[i]] = undef;
        }
        
        methodsToExport = null;
        return objToExport;
    }());
    
    var swapedFunctionGlobal = {};

    
    var exportMethod = function(toReturn, thisArg, method){
        return function(){
            method.apply(thisArg, objToArray(arguments));
            return toReturn;
        };
    };
    var addExports = function(obj, globalize, aClass){
        var undef;
        for(var key in functionsToExport){
            if(functionsToExport.hasOwnProperty(key)){
                if(functionsToExport[key] !== undef){
                    if(isObject(functionsToExport[key])){
                        obj[key] = mergeObjects({}, functionsToExport[key]);
                        findUndefAndExport(obj[key], aClass[key], obj, aClass);
                    }else{
                        obj[key] = functionsToExport[key];
                    }
                }else{
                    obj[key] = exportMethod(obj, aClass, aClass[key]);
                }
                
                
                if(globalize){
                    swapedFunctionGlobal[key] = aClass._config.globalObj[key];
                    aClass._config.globalObj[key] = obj[key];
                }
                
            }
        }
    };
    var findUndefAndExport = function(obj, source, toReturn, thisArg){
        var undef;
        for(var key in obj){
            if(obj.hasOwnProperty(key)){
               if(obj[key] === undef){
                   obj[key] = exportMethod(toReturn, thisArg, source[key])
               }else if( isObject(obj[key]) ){
                   findUndefAndExport(obj[key], source[key], toReturn, thisArg);
               }
            }
        }
    }
    
    var removeExports = function(obj, aClass){
    
        for(var key in functionsToExport){
            if(functionsToExport.hasOwnProperty(key)){
                delete obj[key];
                
                if(typeof swapedFunctionGlobal[key] === "undefined"){
                    delete aClass._config.globalObj[key];
                }else{
                    aClass._config.globalObj[key] = swapedFunctionGlobal[key];
                }
                
            }
        }
        
        swapedFunctionGlobal = {};
    };
    
    function addQueuedPlugins(aClass, command){
        
        

        if(command.type !== "VoidPlugin"){
            
            aClass._(aClass._config.persistentPlugins[command.type]);
        }
        
        aClass._(aClass._queuedPlugins);
        
        
        aClass._queuedPlugins = {};
        
    }
    
    
    function sortPluginsByPriority(pluginsList){
        
        pluginsList._order = [];
        for(var key in pluginsList){
            if(registeredPlugins.hasOwnProperty(key)){
                
                pluginsList._order.push(key);
            }
        }
        
        pluginsList._order.sort(function(a, b){
            return registeredPlugins[a].priotity - registeredPlugins[b].priotity;
        });
    }
    
    
    function executePlugins(pluginsList, on, args){
        
        var key, i;
        for(i=0;i<pluginsList._order.length;i++){
            key = pluginsList._order[i];
            if(registeredPlugins.hasOwnProperty(key) && pluginsList[key] !== null && typeof registeredPlugins[key][on] === "function"){
                registeredPlugins[key][on].apply(registeredPlugins[key], args.concat(pluginsList[key]));
            }
        }
    }
    
    function navigateObj(obj, road, fnValue){
        for(var i=0; i<road.length; i++){
            if( !obj.hasOwnProperty(road[i]) ){
                if(fnValue !== false){
                    obj[road[i]] = fnValue ? fnValue.call(road, i, road[i], road.length) : {};
                }else{
                    return;
                }
            }
            obj = obj[road[i]];
        }
        
        return obj;
    }
    
    
    Class.treatRequireJSDependencies = function(dependencies){
        for(var i=0; i<dependencies.length; i++){
            dependencies[i] = "ClassRequireJSPlugin!"+dependencies[i];
        }
    }
    
    if(typeof define === "function"){
        define("Class", [], function(){
            return Class;
        });
        
        define("ClassRequireJSPlugin", {
            load: function (name, require, load, config) {
                
                require([name], function (value) {
                    load(value);
                });
            }
        });
        
    }
    
    globalConfig.globalObj.Class = Class;
    
    globalConfig.globalObj.Import = function(ressource){
        queuedDepencencies.push(ressource);
    }

    if(typeof module !== "undefined"){
        module.exports = Class;
    }
    
}());