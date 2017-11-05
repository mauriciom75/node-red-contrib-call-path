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

        console.log( " - node_id : " + node.id );
        var returnEventName = "call_path_" + node.id;
        var eventName = "call_path_" + node.varName;

        node.on('input', function(msg) {
            
            //if ( node.eventEmitter.listenerCount(node.varName) > 0 )
            {
                if (!msg.callPath)
                    msg.callPath = {};
                if (!msg.callPath.stack)
                    msg.callPath.stack = [];

                // en el mensaje dejo en un stack la dirección de respuesta.
                msg.callPath.stack.push({name:eventName,ret:returnEventName});

                console.log("genero evento");
                eventEmitter.emit(eventName, msg);
            }
            /*
            else
            {
                node.send([null,msg]);
            }*/
        });

        // evento de respuesta para este nodo
        eventEmitter.removeAllListeners(returnEventName);
        eventEmitter.on(returnEventName, function (msg) {

            console.log("llegó evento de return");

            if ( msg.callPath.error ) {
                console.log ("Genero error.");
                if (msg.callPath.error.message)
                    node.error(msg.callPath.error.message,msg)
                else
                    node.error("Error indeterminado.",msg)
            }
            else {
                node.send([msg]); // envio por la salida 1
            }
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

                var returnEventName = msg.callPath.stack.pop().ret;

                console.log("genero evento return :" + returnEventName );
                eventEmitter.emit(returnEventName, msg);
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
        
        var eventName = "call_path_" + node.varName;

        eventEmitter.removeAllListeners(eventName);
        eventEmitter.on(eventName, function (msg) {

            console.log("llegó evento");
            if ( msg.callPath.error ) delete msg.callPath.error;
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

            if (msg.error) {
                msg.callPath.error = Object.assign({}, msg.error);
                msg.callPath.error_stack = Object.assign({}, msg.callPath.stack ); 
            };
            if (msg._error) msg.callPath._error = msg._error;

            node.send(msg);
            
        });
    }



    function returnNode2(config) {
        RED.nodes.createNode(this,config);

        this.varName = config.paths;

        var node = this;

        var eventName = "call_path_" + node.varName;

        eventEmitter.removeAllListeners(eventName);
        eventEmitter.on(eventName, function (msg) {

            console.log("llegó evento ret");
            node.send([msg]); // envio por la salida 1

        }); 
          
        //});
    }    
    RED.nodes.registerType("call-node",callNode2);
    RED.nodes.registerType("return-path-node",returnPathNode);
    RED.nodes.registerType("declare-path-node",declarePathNode);
    RED.nodes.registerType("catch-node2",catchNodeNode2);
    RED.nodes.registerType("return-node2",returnNode2);
}
