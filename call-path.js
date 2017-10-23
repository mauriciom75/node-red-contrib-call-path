var event = require('events');

module.exports = function(RED) {

    var table = {};
    var eventEmitter = new event.EventEmitter();

    function callNode2(config) {
        RED.nodes.createNode(this,config);

        this.toWires = {};//JSON.parse(config.paths);
        //this.varName = JSON.parse(config.paths);
        this.varName = config.paths;
        //this.eventEmitter = new event.EventEmitter();

        var node = this;
        node.primeraPasada = true;


        node.on('input', function(msg) {
            
            //if ( node.eventEmitter.listenerCount(node.varName) > 0 )
            {
                console.log("genero evento");
                eventEmitter.emit(node.varName, msg);
            }
            /*
            else
            {
                node.send([null,msg]);
            }*/
        });
    }
    function returnPathNode(config) {
        RED.nodes.createNode(this,config);

        this.toWires = {};//JSON.parse(config.paths);
        //this.varName = JSON.parse(config.paths);
        this.varName = config.paths;
        //this.eventEmitter = new event.EventEmitter();

        var node = this;
        node.primeraPasada = true;

        console.log("varName: "+this.varName);
        node.on('input', function(msg) {
            
            //if ( node.eventEmitter.listenerCount(node.varName) > 0 )
            {
                console.log("genero evento ret");
                eventEmitter.emit(node.varName+"_ret", msg);
            }
            /*
            else
            {
                node.send([null,msg]);
            }*/
        });
    }

    function declarePathNode(config) {
        RED.nodes.createNode(this,config);

        //this.salidas = config.salidas;
        this.esPath = Number(config.timeout);
        this.varName = config.paths;

        //this.eventEmitter = new event.EventEmitter();

        var node = this;
        node.primeraPasada = true;
        

        eventEmitter.on(node.varName, function (msg) {

            console.log("llegó evento");
            node.send([msg]); // envio por la salida 1

        }); 
        
    }
    function catchNodeNode2(config) {
        RED.nodes.createNode(this,config);

        this.varName = config.paths;

        var node = this;
        node.primeraPasada = true;
        
        node.on('input', function(msg) {
            
            node.primeraPasada = false;

            //console.log("return original_wires:" + JSON.stringify(msg.insertNode[node.varName].original_wires) );
            // el proximo nodo será el nodo al cual quiero saltar.
            if (msg.error) msg.insertNode[node.varName].error = msg.error;
            if (msg._error) msg.insertNode[node.varName]._error = msg._error;

            node.send(msg);
            
        });
    }



    function returnNode(config) {
        RED.nodes.createNode(this,config);

        this.varName = config.paths;

        var node = this;


        eventEmitter.on(node.varName, function (msg) {

            console.log("llegó evento ret");
            node.send([msg]); // envio por la salida 1

        }); 
          
        //});
    }    
    RED.nodes.registerType("call-node",callNode2);
    RED.nodes.registerType("return-path-node",returnPathNode);
    RED.nodes.registerType("declare-path-node",declarePathNode);
    RED.nodes.registerType("catch-node2",catchNodeNode2);
    RED.nodes.registerType("return-node",returnNode);
}
