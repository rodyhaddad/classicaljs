BaseClass.addPlugin("Constructor", {
    onApply: function(info, fn){
        info.$Class.Public(info.$Class.config.constructorName, fn);
        return false;
    }
});