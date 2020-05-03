$mult = window.$mult || {};
(function Socket(self) {

    const observerFns = {};

    self.createConnection = name => {
        create( "ws://localhost:9000/ws/solitaire", name).then(socketHandler => {
            socketHandler.writeToSocket("howdy", {name: name})
            self.writeToSocket = socketHandler.writeToSocket
        });

    }

    self.addObserverFn = (task, observerFn) => observerFns[task] = observerFn;

    function onMessage(message) {
        const task = message['task'];
        if(task !== 'ping' && task !== 'void') {
            const fn = observerFns[task];
            if(fn) {
                console.log(message);
                fn(message);
            } else {
                console.error(`No observer found for ${task}`);
            }
        }
    }

    function create(url) {
        const iSelf = this;
        let connected = false;
        return new Promise(resolve => {
            const socket = new WebSocket(url);

            socket.onopen = function(e) {
                console.log('Connection created');
                connected = true;
                resolve(iSelf);
            };

            socket.onmessage = function(event) {
                onMessage(JSON.parse(event.data));
            };

            socket.onclose = function(event) {
                if (event.wasClean) {
                    console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
                } else {
                    console.log('[close] Connection died');
                }
                connected = false;
                window.clearInterval(interval);
            };

            socket.onerror = function(error) {
                console.log(`[error] ${error.message}`);
            };

            function writeToSocket(task, obj) {
                socket.send(JSON.stringify({task: task, ts: new Date().getTime(), data: JSON.stringify(obj)}));
            }

            const interval = setInterval(() => {
                if(connected) {
                    writeToSocket('ping', {});
                }
            }, 10000);

            this.writeToSocket = writeToSocket;
        })


        // return this;
    }

})($mult.socket = $mult.socket || {});