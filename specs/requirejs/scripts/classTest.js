Class(["./classTest2"], function(classTest2){


    return {
        "View.On.Test2": "yay",
        works: true,
        
        methodWorks: function(){
        
            console.log("classTest.methodWorks() called");
        
            console.dir( classTest2);
    
            return this;
        }
    }
    
    
});