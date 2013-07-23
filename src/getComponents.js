ot.merge(BaseClass.prototype, {
    getOwnComponentBy: function (field, value) {
        for (var i = 0; i < this.components.length; i++) {
            if (this.components[i][field] === value) {
                return this.components[i];
            }
        }
        return null;
    },
    getComponentBy: function (field, value) {
        return this.getOwnComponentBy(field, value);
    },

    getOwnComponentsBy: function (field, value) {
        var validComponents = [];
        for (var i = 0; i < this.components.length; i++) {
            if (this.components[i][field] === value) {
                validComponents.push(this.components[i]);
            }
        }
        return validComponents;
    },
    getComponentsBy: function (field, value) {
        return this.getOwnComponentsBy(field, value);
    },

    //searches in the Class hierarchy
    getConstructorComponent: function () {
        return this.getComponentBy("name", this.config.constructorName);
    },

    getConstructorName: function () {
        var component = this.getConstructorComponent();

        return component ? component.name : null;
    }
});