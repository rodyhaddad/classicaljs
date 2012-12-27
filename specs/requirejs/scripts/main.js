requirejs.config({
	baseUrl: './scripts',
	paths: {
    	Class: "./classicaljs.rjs.plugin"
	}
})


require(["../../classical.js"], function(){
    
    
    Class.addPlugin({
        name: "View.On.Test",
        position: "before",
        priority: "low",
        onInstanceCreation: function(){
            console.log(arguments);
            console.log("!!View.On.Test CALLED!!");
        }
    })
    
    require(["Class!./classTest"], function(classTest){
    
    	console.dir( new classTest().methodWorks() );
    	
    });
});
