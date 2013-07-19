BaseClass.prototype.handleParams = function (args) {
    var params = {
        name: null,
        classConfig: null,
        definition: null
    };

    ot.forEach(args, function (value) {
        switch (typeof value) {
            case "string":
                params.name = value;
                break;
            case "object":
                params.classConfig = value;
                break;
            case "function":
                params.definition = value;
                break;
        }
    });

    if (params.classConfig !== null && params.definition === null) {
        for (var key in params.classConfig) {
            if (params.classConfig.hasOwnProperty(key) && !(key in this.config)) {
                params.definition = params.classConfig;
                params.classConfig = null;
                break;
            }
        }
    }

    if (ot.isObject(params.definition)) {
        params.definition = (function (definition) {
            return function () {
                ot.forEach(definition, function (value, key) {
                    if (ot.isFn(this[key])) {
                        this[key](value);
                    } else if (key.indexOf(".") !== -1) {
                        var fn = ot.navigate.get(this, key);
                        if (ot.isFn(fn)) {
                            fn(value);
                        }
                    } else {
                        this[this.$Class.config.defaultMethod](key, value);
                    }
                }, this);
            };
        }(params.definition));
    }

    return params;
};