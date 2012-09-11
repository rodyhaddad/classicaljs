/**
 * Classical.js v1.0 Beta
 *
 * Released under the MIT license
 * https://raw.github.com/rodyhaddad/classicaljs/master/LICENSE
 *
 */

;(function(){
    
    //global Configuration
    var globalConfig = {
    
        //Classes default constructer's name
        constructorName: "_constructor",
        
        //Super's default name
        superName: "Super", 
        
        //whether or not to globalize methods (so you don't have to put dots everywhere: [.]Public)
        //methods are globalized on Class() call, and are returned to their old value on End()
        globalize: true, 
        
        //whether or not to keep a reference to the defined Classes (allows for .Extends("nameOfClass") )
        keepDefinedClasses: true,
        
        //Persistent plugins that get applied to everything (PrivateVar gets applied to all private vars, etc.)
        persistentPlugins: {
            PrivateVar: {},
            ProtectedVar: {},
            PublicVar: {},
            PrivateFn: {},
            ProtectedFn: {},
            PublicFn: {}
        }
    };
    
    //holds a reference to the defined Classes (by name)
    var definedClasses = {};
    
    //the class that is currently being defined
    //it gets set on Class() call, and set back to null on End()
    var currentlyBuildingClass = null;
    
    //The Class Builder constructor
    //takes a name, and default class configurations
    var Class = function(name, classConfig){
        //just so you don't have to do new Class()
        if(!(this instanceof Class)){
            return new Class(name, classConfig);
        }
        
        //if we're currently building a Class, throw an error
        //you can't define a new Class without Ending the last one (using End())
        if(currentlyBuildingClass){
            throw "You are building a new Class without Ending the last one. Please call 'End()' on the last Class before trying to build a new one";
        }
        currentlyBuildingClass = this;
        
        //individual Class configs inherit from the global configs
        //so if something is not defined in a Class's configs, the engine would search in the global configs
        this._config = makeInherit(globalConfig);
        
        //persistent plugins also inherit from the global configs
        //so if you define a persistent plugin on the library level, it will be applied on all Classes
        //unlesss overwritten in a Class level
        this._config.persistentPlugins = {
            PrivateVar: makeInherit(globalConfig.persistentPlugins.PrivateVar),
            ProtectedVar: makeInherit(globalConfig.persistentPlugins.ProtectedVar),
            PublicVar: makeInherit(globalConfig.persistentPlugins.PublicVar),
            PrivateFn: makeInherit(globalConfig.persistentPlugins.PrivateFn),
            ProtectedFn: makeInherit(globalConfig.persistentPlugins.ProtectedFn),
            PublicFn: makeInherit(globalConfig.persistentPlugins.PublicFn)
        }
        
        //adds the classConfigs
        this.Config(classConfig || {})
        
        //contains queued plugins (plugin that will be applied to the next command)
        this._queuedPlugins = {
            definition: {},
            instanceCreation: {}
        };
        
        //the name of the Class, default to an empty string
        this.name = name || "";
        
        //the array of commands
        this.commands = [];
        
        //what this Class extends (a.k.a. inherits)
        this._extends = null;
        
        //specifies if the class has any private/protected/public fn or vars
        //currently not used. Will probably be used for optimizations later
        this._hasPrivate = this._hasProtected = this._hasPublic = false;
        
        //will contain commands (but they will be sorted by type)
        this._privateVars = [];
        this._privateFns = [];
        this._protectedVars = [];
        this._protectedFns = [];
        this._publicVars = [];
        this._publicFns = [];
        
        
        //this will be the public constructor, used to create new instances
        //we define it now and return to allow for: var Person = Class()...
        var self = this;
        function aClassConstructor(){
        
            //we build the class for a new instance, and hold the publicObj (that contains the public things)
            var publicObj = self._Build()._public;
            
            //we create a new instance that inherits from the publicObj
            var instance = makeInherit(publicObj);
            
            //let's set the instance's Class to the current Class
            instance._Class = self;
            
            //if this instance has a contrusctor
            if(instance[self._config.constructorName]){
                //let's call the constructor and get what it returns;
                var constructorResult = instance[self._config.constructorName].apply({}, objToArray(arguments)); //no one cares about the "this", it's bound to something else
                
                //the constructor returns an object? (could be null)
                if(typeof constructorResult === "object"){
                    //ok return what the constructor returns
                    return constructorResult;
                }else{
                    //doesn't return an object? ok, just return the isntance
                    return instance;
                }
            }else{
                //no constructor? ok, just return the instance
                return instance;
            }
        }
        
        //let's set the public constructor's Class to the current Class
        aClassConstructor._Class = this;
        
        //let's keep a reference to the public constructor
        this._classConstructor = aClassConstructor;
        
        //keep reference to defined object (if not disabled)
        if(this._config.keepDefinedClasses){
            definedClasses[this.name] = aClassConstructor;
        }
        
        //we add the Public/Protected/etc. to the constrcutor, to allow for Class().Extends()
        //they will be removed on End()
        addExports(aClassConstructor, this._config.globalize, this);
        
        //finally, we return the public constructor
        return aClassConstructor;
        
    };
    
    //we set it here cz Class is undefined before (and i want globalConfig to be on top)
    Class._config = globalConfig;
    //same thing for definedClasses
    Class.definedClasses = definedClasses;
    
    //this is used so a plugin can set it's priority to "high", instead of having to write "10"
    //it's the allowed priorities as strings, and their values as numbers
    //you can always set a plugin's priority to a number (like 5). But it's nicer to write a string :)
    var pluginPriority = Class.pluginPriority = {high: 10, medium: 20, low: 30};
    
    //the registered plugins (with their name as the key)
    var registeredPlugins = Class.registeredPlugins = {};
    
    //Used to add plugins to Class definitions
    //you just pass an object "describing" the plugin
    //the object should contain:
    /**  
     *  name: the name of the plugin
     *  chainName: another name that will be used while chaining (ex: the "type" plugin's chainName is "Type" (the T is uppercase)
                   the name would be used in _() calls and in persistent plugins definition
                   it's default it the normal name, so you don't have to set it if you don't want to
     *  on: either "definition" or "instanceCreation". Describes if the plugin is called on definition of instanceCreation of a Class
     *  position: either "before" or "after". Describes if the plugin called before or after a command (not used in _() calls)
     *  priority: either "high"=10, "medium"=20, "low"=30, or any other number. Plugins with the smalled priorities gets called first (1 wins over 2)
     *  fn: the function that will be called when the plugin is invoked (info about what it got called on is passed to the function)
     */
    Class.addPlugin = function(pluginInfo){
        
        //if priority is not a number
        if(typeof pluginInfo.priority !== "number"){
            //get it's numerical equivalent from the pluginPriority object
            if(pluginPriority[pluginInfo.priority]){
                pluginInfo.priority = pluginPriority[pluginInfo.priority];
            }else{
                //if that pluginPriority doesn't exist, throw an error
                throw "The plugin '"+pluginInfo.name+"' has the priority '"+pluginInfo.priority+"' which is not defined"
            }
        }
        
        //add this plugin to the list of functions to export
        Class.functionsToExport.push(pluginInfo.name);
        
        //if no chainName is specified, set it to name
        pluginInfo.chainName = pluginInfo.chainName || pluginInfo.name
        
        /**
         * Ok, this is a mess. Let's describe it's behavior out here
         *
         * if the plugin position is before
         *   if it's on definition
         *     then when invoked, add it to the queued definition plugins
         *
         *   if it's on instanceCreation
         *     then when invoked, add it to the queued instanceCreation plugins
         *
         * if the plugin position is after
         *   if it's on definition
         *     then when invoked, add it to the last command's definition plugins
         *
         *   if it's on instanceCreation
         *     then when invoked, add it to the last command's instanceCreation plugins
         *
         *
         * the arguments passed to the plugin's invocation will be passed to the plugin's fn
         *   if the plugin's invocation is only passed one argument, and it's equal to null, then the plugin will be set to be disabled
         *
         */
        //TODO: optimize this. It could be done without all those lines
        if(pluginInfo.position === "before"){
            if(pluginInfo.on === "definition"){

                Class.prototype[pluginInfo.name] = function(deleted){
                    var args = objToArray(arguments)
                    currentlyBuildingClass._queuedPlugins.definition[pluginInfo.name] = deleted === null && args.length === 1 ? null : args
                };
            }else if(pluginInfo.on === "instanceCreation"){

                Class.prototype[pluginInfo.name] = function(deleted){
                    var args = objToArray(arguments)
                    currentlyBuildingClass._queuedPlugins.instanceCreation[pluginInfo.name] = deleted === null && args.length === 1 ? null : args
                };
            }
            
        }else if(pluginInfo.position === "after"){
            if(pluginInfo.on === "definition"){

                Class.prototype[pluginInfo.name] = function(deleted){
                    var args = objToArray(arguments);
                    currentlyBuildingClass.commands[currentlyBuildingClass.commands.length-1].plugins.definition[pluginInfo.name] = deleted === null && args.length === 1 ? null : args
                };
            }else if(pluginInfo.on === "instanceCreation"){

                Class.prototype[pluginInfo.name] = function(deleted){
                    var args = objToArray(arguments)
                    currentlyBuildingClass.commands[currentlyBuildingClass.commands.length-1].plugins.instanceCreation[pluginInfo.name] = deleted === null && args.length === 1 ? null : args
                };
                
            }
        }
        //let's register this plugin
        registeredPlugins[pluginInfo.name] = pluginInfo;
    };
    
    //set the Classes global configs
    //just merge the passed configs to the globalConfig obj
    Class.Config = function(obj){
        //Persistent Plugins are handled in PersistentPlugins()
        if(obj.hasOwnProperty("persistentPlugins")){
            //so we give them to PersistentPlugins(), and delete them from here
            Class.PersistentPlugins(obj.persistentPlugins);
            delete obj.persistentPlugins;
        }
        mergeObjects(globalConfig, obj);
    };
    
    //add Persistent Plugins
    //the object passed could have PrivateVar, ProtectedVar, PublicVar, PrivateFn, ProtectedFn, PublicFn and the plugins will be applied to their respective type
    //you can also pass Var and Fn, that will be applied to all the vars and function (but they don't have priority over the others
    Class.PersistentPlugins = function(pluginsObject){
        mergeObjects(globalConfig.persistentPlugins.PrivateVar, mergeObjects(mergeObjects({}, pluginsObject.Var), pluginsObject.PrivateVar));
        mergeObjects(globalConfig.persistentPlugins.ProtectedVar, mergeObjects(mergeObjects({}, pluginsObject.Var), pluginsObject.ProtectedVar));
        mergeObjects(globalConfig.persistentPlugins.PublicVar, mergeObjects(mergeObjects({}, pluginsObject.Var), pluginsObject.PublicVar));
        
        mergeObjects(globalConfig.persistentPlugins.PrivateFn, mergeObjects(mergeObjects({}, pluginsObject.Fn), pluginsObject.PrivateFn));
        mergeObjects(globalConfig.persistentPlugins.ProtectedFn, mergeObjects(mergeObjects({}, pluginsObject.Fn), pluginsObject.ProtectedFn));
        mergeObjects(globalConfig.persistentPlugins.PublicFn, mergeObjects(mergeObjects({}, pluginsObject.Fn), pluginsObject.PublicFn));
    };
    
    Class.prototype = {
        /*_config: {}, every instance has a _config */
        
        //set this Class's configs
        //just merge the passed configs to the Class's config
        Config: function(obj){
            //Persistent Plugins are handled in this.PersistentPlugins()
            if(obj.hasOwnProperty("persistentPlugins")){
                //so we give them to this.PersistentPlugins(), and delete them from here
                this.PersistentPlugins(obj.persistentPlugins);
                delete obj.persistentPlugins;
            }
            mergeObjects(this._config, obj);
        },
        
        //same as Class.PersistentPlugins, just at the current Class level
        PersistentPlugins: function(pluginsObject){
            mergeObjects(this._config.persistentPlugins.PrivateVar, mergeObjects(mergeObjects({}, pluginsObject.Var), pluginsObject.PrivateVar));
            mergeObjects(this._config.persistentPlugins.ProtectedVar, mergeObjects(mergeObjects({}, pluginsObject.Var), pluginsObject.ProtectedVar));
            mergeObjects(this._config.persistentPlugins.PublicVar, mergeObjects(mergeObjects({}, pluginsObject.Var), pluginsObject.PublicVar));
            
            mergeObjects(this._config.persistentPlugins.PrivateFn, mergeObjects(mergeObjects({}, pluginsObject.Fn), pluginsObject.PrivateFn));
            mergeObjects(this._config.persistentPlugins.ProtectedFn, mergeObjects(mergeObjects({}, pluginsObject.Fn), pluginsObject.ProtectedFn));
            mergeObjects(this._config.persistentPlugins.PublicFn, mergeObjects(mergeObjects({}, pluginsObject.Fn), pluginsObject.PublicFn));
        },
        
        /*_queuedPlugins: {
            definition: {},
            instanceCreation: {}
        }, every instance has a queuedPlugins obj*/
        
        //adds the passed function to PublicFn
        //with the name set to the config's constructorName
        Constructor: function(fn){
            this.PublicFn(this._config.constructorName, fn);
            return this;
        },
        //arguments are handled by handleArgs, used to add Private Vars and Fns
        Private: function(){
            handleArgs(this, objToArray(arguments), "Private");
            return this;
        },
        //arguments are handled by handleArgs, used to add Protected Vars and Fns
        Protected: function(){
            handleArgs(this, objToArray(arguments), "Protected");
            return this;
        },
        //arguments are handled by handleArgs, used to add Public Vars and Fns
        Public: function(){
            handleArgs(this, objToArray(arguments), "Public");
            return this;
        },
        
        /* 
            just gonna commend the first one, they're pretty much all the same 
        */
        
        //used to add a Private Variable
        PrivateVar: function(name, defaultValue){
            //set the default value to null it it's undefined
            defaultValue = typeof defaultValue !== "undefined" ? defaultValue : null;

            //create the command
            var command = {type: "PrivateVar", name: name, value: defaultValue, plugins: {definition:{}, instanceCreation:{}}};
            //add it to the array (used in End())
            this.commands.push(command);
            
            //set that the class has private stuff
            this._hasPrivate = true;
            //add it to the private var array (used in _Build())
            this._privateVars.push(command);
            
            //add the queued plugins
            addQueuedPlugins(this, command);
            
            return this;
        },
        ProtectedVar: function(name, defaultValue){
            defaultValue = typeof defaultValue !== "undefined" ? defaultValue : null;
            var command = {type: "ProtectedVar", name: name, value: defaultValue, plugins: {definition:{}, instanceCreation:{}}};
            this.commands.push(command);
            
            this._hasProtected = true;
            this._protectedVars.push(command);
            
            addQueuedPlugins(this, command);          
            return this;
        },
        PublicVar: function(name, defaultValue){
            defaultValue = typeof defaultValue !== "undefined" ? defaultValue : null;
            var command = {type: "PublicVar", name: name, value: defaultValue, plugins: {definition:{}, instanceCreation:{}}};
            this.commands.push(command);
            
            this._hasPublic = true;
            this._publicVars.push(command);
            
            addQueuedPlugins(this, command);
            
            return this;
        },
        
        //the only different with functions is that they take fn instance of defaultValue
        PrivateFn: function(name, fn){
            var command = {type: "PrivateFn", name: name, value: fn, plugins: {definition:{}, instanceCreation:{}}};
            this.commands.push(command);
            
            this._hasPrivate = true;
            this._privateFns.push(command);
            
            addQueuedPlugins(this, command);
            
            return this;
        },
        ProtectedFn: function(name, fn){
            var command = {type: "ProtectedFn", name: name, value: fn, plugins: {definition:{}, instanceCreation:{}}}
            this.commands.push(command);
            
            this._hasProtected = true;
            this._protectedFns.push(command);
            
            addQueuedPlugins(this, command);
            
            return this;
        },
        PublicFn: function(name, fn){
            var command = {type: "PublicFn", name: name, value: fn, plugins: {definition:{}, instanceCreation:{}}};
            this.commands.push(command);
            
            this._hasPublic = true;
            this._publicFns.push(command);
            
            addQueuedPlugins(this, command);
            
            return this;
        },
        
        //used to set that a Class extends another
        Extends: function(object){
            //if it's a string, get it from the definedClasses
            if(typeof object === "string"){
                object = definedClasses[object];
            }
            
            //get the class definition from the object
            object = object._Class;
            
            //most likely undefined
            if(!object){
                throw "a Class (or Class name) was not to .Extends()";
            }
            
            //create the command
            var command = {type: "Extends", object: object};
            
            //add the command as the first one
            this.commands.unshift(command);
            //set what this class extends
            this._extends = command.object;
            
            return this;
        },
        
        //used to add a collection of plugins to a command
        //position could be "next" or "prev", and it indicates on which command the plugins should be applied
        //  it's optional, and it's default to "prev"
        //pluginsObject is an object, where the key is the plugin name, and the value is an array of arguments to pass to the plugin
        //  if you just want to 1 argument, then it doesn't have to be an array (ex: {type: "String"})
        //  if instead of an array, you pass null, then the plugin is disabled for that command
        _: function(position, pluginsObject){
            var pluginList;
            
            //if the position is an object, then set pluginsObject to that object, and set position to "prev"
            if(typeof position === "object"){
                pluginsObject = position;
                position = "prev";
            }
            
            //if position is next, then add to the queud plugins list, if it's prev, then add to the last command's plugins list
            if(position === "next"){
                pluginList = this._queuedPlugins
            }else if(position === "prev"){
                pluginList = this.commands[this.commands.length-1].plugins;
            }else{ throw " Unknown position '"+position+"' sent to _ of Class" }
            
            
            for(var key in pluginsObject){
                if(pluginsObject[key] !== null){
                    (function(){
                        //get the plugin info from the registered plugins
                        var pluginInfo = registeredPlugins[key];
                        //put args in an array if it's not already an array
                        var args = isArray(pluginsObject[key]) === false ? [pluginsObject[key]] : pluginsObject[key];
                        //the args will be passed to the plugin later on in executePlugins()
                        pluginList[pluginInfo.on][pluginInfo.name] = args
                    }());
                }else{
                    //if what's passed is null, then set this plugin to null (disabled)
                    pluginList[registeredPlugins[key].on][registeredPlugins[key].name] = null;
                }
            }
            return this;
        },
        
        End: function(){
            var i,length = this.commands.length;
            
            for(i=0;i<length;i++){
                //we go over all the command to execute the plugins
                if(this.commands[i].plugins){
                    
                    //we sort the plugins by priority
                    sortPluginsByPriority(this.commands[i].plugins.instanceCreation);
                    sortPluginsByPriority(this.commands[i].plugins.definition);
                    
                    //we execute them passing the command and the class
                    executePlugins(this.commands[i].plugins.definition, [{
                        command: this.commands[i], 
                        Class: this
                    }]);
                
                }
            }
            
            //stop building the class
            currentlyBuildingClass = null;
            //remove what has been exported to the public constructor
            removeExports(this._classConstructor);
            
            //return the public class constructor here
            return this._classConstructor;
        },
        
        
        //this is where the magic happens
        //it builds the class for each instance
        //only for internal use!
        _Build: function(alreadyDefinedVars){
            var parentObj, privateObj, protectedObj, publicObj, i, fn, getterSetters, pluginObj;
            
            //vars that have already been defined by parent Classes
            alreadyDefinedVars = alreadyDefinedVars || [];
            
            
            if(this._extends){
                
                //get the parent Built and inherit from it
                parentObj = this._extends._Build(alreadyDefinedVars);
                //private and protected inherit from protected of parent
                privateObj = makeInherit(parentObj._protected);
                protectedObj = makeInherit(parentObj._protected);
                //public inherit from public of parent
                publicObj = makeInherit(parentObj._public);
                
                //set supers
                privateObj[this._config.superName] = parentObj._protected;
                protectedObj[this._config.superName] = parentObj._protected;
            }else{
                //if it doesn't extend anything, then it's just a normal obj
                privateObj = {};
                protectedObj = {};
                publicObj = {};
            }
            

            //PublicFn
            for(i=0;i<this._publicFns.length;i++){
                //we bind the "this" of the function to be the private object
                fn = bindThis(privateObj, this._publicFns[i].value);
                
                //we execute the plugins of the command
                executePlugins(this._publicFns[i].plugins.instanceCreation, [pluginObj = {
                    fn: fn,
                    command: this._publicFns[i],
                    Class: this,
                    privateObj: privateObj,
                    protectedObj: protectedObj,
                    publicObj: publicObj
                }]);
                //in case any plugin changed it
                fn = pluginObj.fn;
                
                //we add the fn to all the layers
                publicObj[this._publicFns[i].name] = fn;
                protectedObj[this._publicFns[i].name] = fn;
                privateObj[this._publicFns[i].name] = fn;
                
                //if there is a parent, we add this fn to it
                if(parentObj){
                    parentObj.addChildFn(this._publicFns[i].name, fn)
                }
            }
            
            //ProtectedFn
            //same thing as PublicFn, but we just don't add the fn to the publicObj
            for(i=0;i<this._protectedFns.length;i++){
            
                fn = bindThis(privateObj, this._protectedFns[i].value);
                
                executePlugins(this._protectedFns[i].plugins.instanceCreation, [pluginObj = {
                    fn: fn,
                    command: this._protectedFns[i],
                    Class: this,
                    privateObj: privateObj,
                    protectedObj: protectedObj,
                    publicObj: publicObj
                }]);
                fn = pluginObj.fn;
                
                protectedObj[this._protectedFns[i].name] = fn;
                privateObj[this._protectedFns[i].name] = fn;
                
                if(parentObj){
                    parentObj.addChildFn(this._protectedFns[i].name, fn)
                }
            }
            
            //PrivateFn
            //same thing as ProtectedFn, but we don't add the fn to the protectedObj, and we don't tell the parent to add the fn
            for(i=0;i<this._privateFns.length;i++){
            
                fn = bindThis(privateObj, this._privateFns[i].value);
                
                executePlugins(this._privateFns[i].plugins.instanceCreation, [pluginObj = {
                    fn: fn,
                    command: this._privateFns[i],
                    Class: this,
                    privateObj: privateObj,
                    protectedObj: protectedObj,
                    publicObj: publicObj
                }]);
                fn = pluginObj.fn;
                
                privateObj[this._privateFns[i].name] = fn;
            }
            
            
            //PublicVar
            for(i=0;i<this._publicVars.length;i++){
                //we only add the var if hasn't been already added by a parent
                if(!arrayContains(alreadyDefinedVars, this._publicVars[i].name)){
                
                    //create 1 set of getters and setters for this prop
                    getterSetters = makeGetterSetters(this._publicVars[i].name, privateObj);
                    
                    //we execute the plugins of the command
                    executePlugins(this._publicVars[i].plugins.instanceCreation, [pluginObj = {
                        getterSetters: getterSetters,
                        command: this._publicVars[i],
                        Class: this,
                        privateObj: privateObj,
                        protectedObj: protectedObj,
                        publicObj: publicObj
                    }]);
                    
                    //if a plugin wants privateObj to have the getters/setters, we set it
                    if(getterSetters.privateHasGetterSetters){
                        setGetterSetters(this._publicVars[i].name, getterSetters, privateObj);
                    }else{
                    //we set the default value on the privateObj if there are not getters/setters on it
                        privateObj[this._publicVars[i].name] = this._publicVars[i].value;
                    }
                    
                    //set the getters/setters on protectedObj and publicObj
                    setGetterSetters(this._publicVars[i].name, getterSetters, protectedObj);
                    setGetterSetters(this._publicVars[i].name, getterSetters, publicObj);
                    
                    //add it to the defined vars array
                    alreadyDefinedVars.push(this._publicVars[i].name);
                    
                    //if there is a parent, let's add this property to it
                    if(parentObj){
                        parentObj.addChildProperty(this._publicVars[i].name, getterSetters);
                    }
                }else if(parentObj && this._publicVars[i].value !== null){
                    //if the property is already defined by a parent and the property has a defaultValue here, set that defaultValue to the property
                    parentObj._private[this._publicVars[i].name] = this._publicVars[i].value;
                }
            }
            
            //ProtectedVar
            //same thing as PublicVar, but we just don't add the vars to the publicObj
            for(i=0;i<this._protectedVars.length;i++){
                if(!arrayContains(alreadyDefinedVars, this._protectedVars[i].name)){
                    
                    getterSetters = makeGetterSetters(this._protectedVars[i].name, privateObj);
                    
                    executePlugins(this._protectedVars[i].plugins.instanceCreation, [pluginObj = {
                        getterSetters: getterSetters,
                        command: this._protectedVars[i],
                        Class: this,
                        privateObj: privateObj,
                        protectedObj: protectedObj,
                        publicObj: publicObj
                    }]);
                    
                    if(getterSetters.privateHasGetterSetters){
                        setGetterSetters(this._protectedVars[i].name, getterSetters, privateObj);
                    }else{
                        privateObj[this._protectedVars[i].name] = this._protectedVars[i].value;
                    }
                    
                    setGetterSetters(this._protectedVars[i].name, getterSetters, protectedObj);
                    
                    alreadyDefinedVars.push(this._protectedVars[i].name);
                    if(parentObj){
                        parentObj.addChildProperty(this._protectedVars[i].name, getterSetters);
                    }
                }else if(parentObj && this._protectedVars[i].value !== null){
                    parentObj._private[this._protectedVars[i].name] = this._protectedVars[i].value;
                }
            }
            
            //same thing as ProtectedVar, but we don't add the Var to the protectedObj, and we don't tell the parent to add the Var
            for(i=0;i<this._privateVars.length;i++){
                
                getterSetters = makeGetterSetters(this._privateVars[i].name, privateObj);
                
                executePlugins(this._privateVars[i].plugins.instanceCreation, [pluginObj = {
                    getterSetters: getterSetters,
                    command: this._privateVars[i],
                    Class: this,
                    privateObj: privateObj,
                    protectedObj: protectedObj,
                    publicObj: publicObj
                }]);
            
                if(getterSetters.privateHasGetterSetters){
                    setGetterSetters(this._privateVars[i].name, getterSetters, privateObj);
                }else{
                    privateObj[this._privateVars[i].name] = this._privateVars[i].value;
                }
            }
            
            return {
                //we expose the objects
                _private: privateObj,
                _protected: protectedObj,
                _public: publicObj,
                
                //we give a way to add fn from children
                addChildFn: function(name, fn){
                    privateObj[name] = fn
                    //add it to parents too
                    if(parentObj){
                        parentObj.addChildFn(name, fn)
                    }
                },
                //we give a way to add a property from children
                addChildProperty: function(name, getterSetters){
                    setGetterSetters(name, getterSetters, privateObj);
                    //add it to parents too
                    if(parentObj){
                        parentObj.addChildProperty(name, getterSetters);
                    }
                }
            }
            
        }
    };
    
    //returns if an object is an array or not
    var isArray = Class.isArray = function(obj){
        return Object.prototype.toString.call(obj) === "[object Array]";
    }
    
    //transform an array-like object to a real array
    var objToArray = Class.objToArray = function(obj){
        return Array.prototype.slice.call(obj, 0);
    }
    
    /**
     * this function's goal is to handle
     * Private's, Protected's and Public's arguments
     * to know if it's a var or a fn
     *
     * It's passed the class, the arguments passed to Public/Protected/Private
     * as well as the mode (which is either Public, Protected or Private)
     * and this function takes care of "redirecting" the call to PublicFn(), PrivateVar(), etc.
     */
    function handleArgs(aClass, args, mode){
        var i, length = args.length, undef, key;
        
        if(length === 1){//if just one arguments
            if(typeof args[0] === "function"){//if it's a function
                aClass[mode+"Fn"](args[0].name, args[0]); //make it as fn(name=function.name, function)
                return; //stop execution
            }else if(typeof args[0] === "string"){//if it's a string
                aClass[mode+"Var"](args[0], undef); //make it as var(name, default=undefined)
                return; //stop execution
            }
            //it's probably an object, let's keep it going
        }
        if(length === 2 && typeof args[0] === "string"){//if two arguments and the first one is a string
            if(typeof args[1] === "function"){ //if the second arguments is a function
                aClass[mode+"Fn"](args[0], args[1]); //make it as fn(name, function)
                return; //stop execution
            }else{//so it's a property (we don't care if the second arg is an object)
                aClass[mode+"Var"](args[0], args[1]); //make it as var(name, default)
                return; //stop execution
            }
            
        }
        
        for(i=0;i<length;i++){
            //if it's an object (and not null)
            if(typeof args[i] === "object" && args[i] !== null){
                for(key in args[i]){ //iterate throught that object
                    if(typeof args[i][key] === "function"){ //if the value is a function
                        aClass[mode+"Fn"](key, args[i][key]); //make it as fn(name, function)
                        
                    }else{//so it's a property
                        aClass[mode+"Var"](key, args[i][key]); //make it as var(name, default)
                        
                    }
                }

            }else if(typeof args[i] === "function"){ //if it's a function
                aClass[mode+"Fn"](args[i].name, args[i]); //make it as fn(name=function.name, function)
                
            }else if(typeof args[i] === "string"){ //if it's a string
                aClass[mode+"Var"](args[i], undef); //make it as var(name, default=undefined)
                
            }
        }
    }
    
    //when passed an object, returns another who's __proto__ is the passed object;
    var makeInherit = (function(){
        if(Object.create){
            return function(obj){
                return Object.create(obj);
            }
        }else{
            return function(obj){
                function o(){}
                o.prototype = obj;
                return new o();
            }
        }
    }());
    
    //binds a "this" to a passed function, and returns it
    //also handles chainability (not allow a privateFn to return it's this...just check the code)
    var bindThis = Class.bindThis = (function(){
        /*if(Function.prototype.bind){
            return function(thisArg, fn){
                return fn.bind(thisArg);
            }
        }else{*/
            return function(thisArg, fn){
                return function(){
                    var result = fn.apply(thisArg, arguments);
                    return result !== thisArg ? result : this;
                }
            }
        //}
    }());
    
    
    //returns an object with a getter/setter that gets it's info from the source object
    //used in _Build to create a getter/setter for each property
    var makeGetterSetters = function(name, source){
        return {
            get: function(){
                return source[name];
            },
            set: function(value){
                return source[name] = value;
            },
            //can be modified by plugins
            privateHasGetterSetters: false
        };
    }
    
    //add passed getters/setters to a target object
    var setGetterSetters = function(name, getterSetters, target){
        Object.defineProperty(target, name, {
            get: getterSetters.get,
            set: getterSetters.set,
            configurable: true,
            enumerable: true
        })
    }
    
    //functions that will be exported (and globalized)
    var functionsToExport = Class.functionsToExport = ["Private", "Protected", "Public", "Extends", "End", "Constructor", "Config", "_", "PersistentPlugins"];
    //when something is globalized, it's old value is held here, that way it can be recovered when we unglobalize the functions
    var swapedFunctionGlobal = {};

    //exports the functionsToExport to an obj, and globalize if needed
    var addExports = function(obj, globalize, aClass){
        var key, i, length = functionsToExport.length;
        for(i=0; i<length; i++){
            key = functionsToExport[i];
            //we need a iife to hold the key value
            obj[key] = (function(key){
                //a function that calls the method on the class
                return function(){
                    aClass[key].apply(aClass, arguments);
                    return obj;
                }
            }(key))
            
            //if we need to globalize
            if(globalize){
                //we hold the old global value
                swapedFunctionGlobal[key] = window[key];
                //and set the new one
                window[key] = obj[key];
            }
        }
    };
    
    //removes exports off an object
    var removeExports = function(obj){
        var key, i, length = functionsToExport.length;
        for(i=0; i<length; i++){
            key = functionsToExport[i];
            //we delete the exported function
            delete obj[key];
            //and we set the global value back to what it was
            window[key] = swapedFunctionGlobal[key];
        }
        //we don't want to hold reference to somebody else's global stuff
        swapedFunctionGlobal = {};
    };
    
    //return wheter an array contains a value
    var arrayContains = Class.arrayContains = function(array, value){
        return indexOf(array, value) !== -1;
    }
    
    //IE8 doesn't have Array.prototype.indexOf, so we shim it if needed
    var indexOf = Class.indexOf = (function(){
        if(Array.prototype.indexOf){
            return function(array, value){
                return array.indexOf(value);
            }
        }else{
            return function(array, value){
                var i, length = array.length;
                for(i=0;i<length;i++){
                    if(array[i] === value){
                        return i;
                    }
                }
                return -1;
            }
        }
    }());
    
    //merges an object to another
    var mergeObjects = Class.mergeObjects = function(target, source){
        if(target && source){
            for(var key in source){
                target[key] = source[key];
            }
        }
        return target;
    }
    
    //adds queued plugins on a command
    function addQueuedPlugins(aClass, command){
        //queued plugins are saved in the "_()" form, so we add them using "_()"
    
        //persistent plugins are like queued plugins, let's add them
        aClass._(aClass._config.persistentPlugins[command.type])
    
        //add the Class's queued plugins
        aClass._(aClass._queuedPlugins.definition);
        aClass._(aClass._queuedPlugins.instanceCreation);
        
        //re-initiate the queued plugins object
        aClass._queuedPlugins.definition = {};
        aClass._queuedPlugins.instanceCreation = {};
    }
    
    //sort the plugins by priority
    function sortPluginsByPriority(pluginsList){
        //we create an _order array, that will contain the plugins, sorted by priority
        pluginsList._order = [];
        for(var key in pluginsList){
            if(registeredPlugins.hasOwnProperty(key)){
                //we add the plugin name, if they're registered
                pluginsList._order.push(key);
            }
        }
        //sort the plugins by priority
        pluginsList._order.sort(function(a, b){
            return registeredPlugins[a].priotity - registeredPlugins[b].priotity;
        });
    }
    
    //executes a give pluginList, passing args to each fn
    function executePlugins(pluginsList, args){
        for(var key in pluginsList){
            //we only execute registered plugins, that are not disabled (disabled == null)
            if(registeredPlugins.hasOwnProperty(key) && pluginsList[key] !== null){
                //we execute the plugin, paddings args concatinated with the pluginList args
                registeredPlugins[key].fn.apply(registeredPlugins[key], args.concat(pluginsList[key]));
            }
        }
    }
    
    //if define is available
    if(typeof define === "function"){
        //define Class as a module
        define([], function(){
            return Class;
        })
    }
    
    //if window is available, make Class global
    if(typeof window !== "undefined"){
        window.Class = Class;
    }
    
}());