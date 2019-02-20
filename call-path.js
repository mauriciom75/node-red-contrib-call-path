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

                console.log("genero evento");
                msg.callPath.subFlowInvocado = node.varName;

                if (msg.callPath[msg.callPath.subFlowInvocado])
                {
                    console.log("subFlow redefinido");
                    var subFlowAInvocar = msg.callPath[msg.callPath.subFlowInvocado].subFlow;

                    if ( msg.callPath[msg.callPath.subFlowInvocado].eventName )
                        eventName = msg.callPath[msg.callPath.subFlowInvocado].eventName;
                    else
                        eventName = "call_path_" + msg.callPath[msg.callPath.subFlowInvocado].subFlow;

                }
                else
                {
                    var subFlowAInvocar = msg.callPath.subFlowInvocado;
                    
                }
                // en el mensaje dejo en un stack la dirección de respuesta.
                msg.callPath.stack.push({subFlowInvocado:node.varName,
                                        subFlowAInvocar:subFlowAInvocar,
                                        eventName:eventName,
                                        eventRet:returnEventName,
                                        timestamp_ini:+ new Date()});

                if ( eventEmitter.listenerCount(eventName) ) {
                    eventEmitter.emit(eventName, msg);
                } else {
                    node.error("Undefined path "+ eventName , msg);
                }
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

            node.primeraPasada = false;
            
            //if ( node.eventEmitter.listenerCount(node.varName) > 0 )
            {
                msg.callPath.stack[msg.callPath.stack.length-1]["timestamp_fin"] = + new Date();

                if (msg.error) {  // para que se redispare el error en el nodo "call"
                    msg.callPath.error = Object.assign({}, msg.error);

                    if ( ! msg.callPath.error_stack )
                        msg.callPath.error_stack =Object.assign([], []);
                    // registro el error y el contexto (flujo) en donde se produjo
                    msg.callPath.error_stack.push({error:msg.error,ctx:msg.callPath.stack[msg.callPath.stack.length-1] });

                    if (! msg.callPath.error_call_stack)
                        msg.callPath.error_call_stack = Object.assign({}, msg.callPath.stack ); 
                };


                    top = msg.callPath.stack[msg.callPath.stack.length-1];
                    console.log("return-path:" + top.subFlowAInvocar 
                                + " msgid:" + msg._msgid 
                                + " ms:" + (top.timestamp_fin - top.timestamp_ini)
                                + " error:" + (msg.error ? msg.error.message : "" ));


                var returnEventName = msg.callPath.stack.pop().eventRet;

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
    function catchNodeNode2(config) {  // ver si incluir un return
        RED.nodes.createNode(this,config);

        this.varName = config.paths;

        var node = this;
        node.primeraPasada = true;
        
        node.on('input', function(msg) {
            
            node.primeraPasada = false;


            if (msg.error) {
                msg.callPath.error = Object.assign({}, msg.error);

                if ( ! msg.callPath.error_stack )
                    msg.callPath.error_stack =Object.assign([], []);

                msg.callPath.error_stack.push(msg.error);

                msg.callPath.error_call_stack = Object.assign({}, msg.callPath.stack ); 
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


    function declarePaths(config) {
        RED.nodes.createNode(this,config);

        this.salidas = config.salidas;
        this.esPath = Number(config.timeout);

        var node = this;

        var eventName = "call_path_" + node.id;
        eventEmitter.removeAllListeners(eventName);
        eventEmitter.on(eventName, function (msg) {

            console.log("llegó evento a declarePaths");
            if ( msg.callPath.error ) delete msg.callPath.error;
            var subFlowInvocado = msg.callPath.subFlowInvocado;
            var vectorOut = [];
            vectorOut[msg.callPath[subFlowInvocado].nro] = msg; 
            node.send(vectorOut);
        });



        node.primeraPasada = true;
        
        node.on('input', function(msg) {
            
            node.primeraPasada = false;

            // en la segunda salida está el nodo a declarar
            //console.log("declare wires:" + JSON.stringify(aux_wires) );

            //node.context.flow.set("nodeTo",node.wires);
            //table[node.varName] = {};
            //table[node.varName].wires = aux_wires;
            //table[node.varName].esPath = node.esPath;

            if (!msg.callPath) msg.callPath = {};

            for (var i = 1 ; i < node.salidas.length ; i++)
            {
                varName = node.salidas[i];
                //aux_wires = [node.wires[i]];

                msg.callPath[varName] = {};
                msg.callPath[varName].subflow = varName;
                msg.callPath[varName].eventName = eventName;
                msg.callPath[varName].nro = i;
            }

            node.send([msg]); // envio por la salida 1
            
        });


    }




    function rethrowPathNode(config) {

// si está dentro de un contecto callPaths, lo que hace es preparar la estructura interna del error
// para que el nodo call llamador, lance el error.
// si no está en el contexto deja pasar el mensaje.

        RED.nodes.createNode(this,config);

        this.toWires = {};//JSON.parse(config.paths);
        //this.varName = JSON.parse(config.paths);
        this.varName = config.paths;
        //this.eventEmitter = new event.EventEmitter();

        var node = this;
        node.primeraPasada = true;

        console.log("varName: "+this.varName);
        node.on('input', function(msg) {

            node.primeraPasada = false;

            if (msg.callPath.stack.length >= 1)  // quiere decir que el error fué lanzado dentro de un subflujo callPath.
            {                       // Indico al nodo llamador para que lance una excepción en su contexto.
                                    // no envio mensage por la salida, pero sería buena opción para agregar. 

                if (msg.error) {
                    msg.callPath.error = Object.assign({}, msg.error);

                    if ( ! msg.callPath.error_stack )
                        msg.callPath.error_stack =Object.assign([], []);
                    msg.callPath.error_stack.push(msg.error);
                    
                        msg.callPath.error_call_stack = Object.assign({}, msg.callPath.stack ); 
                };
                //if (msg._error) msg.callPath._error = msg._error;
                //{
                //}
                var returnEventName = msg.callPath.stack.pop().eventRet;

                console.log("rethrow: genero evento return :" + returnEventName );
                eventEmitter.emit(returnEventName, msg);
                
            }
        });
    }






    function catchFilterPathNode(config) {

// filtra los errores lanzados por un contexto/flujo en particular.
// luego de un catch, se pone el filtro para hacer un tratamiento en particular para el contexto/rutina.
// sin el contexto no funciona. Util para multiples flows en la misma solapa.
// ver en las inserciones como diferenciar porque la rutina se llama igual. Se puede poner nombreExt:nombreInt
// una practica sería que todos los subflows tuvieran su filtro para que no haya que declarar uno general que atrape todo.
// sería bueno crear un contexto para la rutina principal.

        RED.nodes.createNode(this,config);

        this.toWires = {};//JSON.parse(config.paths);
        //this.varName = JSON.parse(config.paths);
        this.varName = config.paths;
        //this.eventEmitter = new event.EventEmitter();

        var node = this;
        node.primeraPasada = true;

        console.log("varName: "+this.varName);
        node.on('input', function(msg) {

            node.primeraPasada = false;

            if (msg.callPath.stack && msg.callPath.stack.length >= 1)  // quiere decir que el error fué lanzado dentro de un subflujo callPath.
            {                       // Indico al nodo llamador para que lance una excepción en su contexto.
                                    // no envio mensage por la salida, pero sería buena opción para agregar. 
                if (msg.callPath.stack[msg.callPath.stack.length-1].subFlowAInvocar ==  this.varName)
                    node.send(msg);
            }
            else
            {// no estoy en un contexto, si está configurado para atrapar "" (null), quiere dicir (sin contexto).
                if ( this.varName == "" )
                    node.send(msg);
            }
        });
    }









    RED.nodes.registerType("call-node",callNode2);
    RED.nodes.registerType("return-path",returnPathNode);
    RED.nodes.registerType("declare-path-node",declarePathNode);
    RED.nodes.registerType("catch-node2",catchNodeNode2);
    RED.nodes.registerType("return-node2",returnNode2);
    RED.nodes.registerType("declare-paths",declarePaths);
    RED.nodes.registerType("rethrow-path",rethrowPathNode);
    RED.nodes.registerType("catch-filter-path",catchFilterPathNode);
}
