define({
    load: function (name, require, load, config) {
        
        require([name], function (value) {
            load(value);
        });
    }
});