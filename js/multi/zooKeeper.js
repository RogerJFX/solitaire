$mult = window.$mult || {};
(function ZooKeeper(self) {

    let playersInRoomData;
    let roomData;
    let uuid;

    let lastStateMsg;

    let gameObservers = [];
    let nextGameObservers = [];
    let playersDataObservers = [];

    $mult.socket.addObserverFn('count', message => {
        const obj = JSON.parse(message.data)
        $mult.ui.notifyPlayersOnline(obj['players'], obj['rooms']);
    });

    $mult.socket.addObserverFn('kicked', message => {
        playersInRoomData = null;
        roomData = null;
        playersDataObservers.forEach(fn => fn(null));
        $mult.socket.writeToSocket('roomList', {});
    });

    $mult.socket.addObserverFn('roomList', message => {
        if(!playersInRoomData && !roomData) {
            const obj = JSON.parse(message.data);
            $mult.ui.showRooms(obj['rooms']);
        }
    });

    $mult.socket.addObserverFn('roomKilled', message => {
        playersInRoomData = null;
        roomData = null;
        playersDataObservers.forEach(fn => fn(null));
        // A new list will be broadcast
    });

    $mult.socket.addObserverFn('howdy', (message) => {
        uuid = JSON.parse(message.data)['uuid'];
        $mult.socket.writeToSocket('roomList', {});
    });

    $mult.socket.addObserverFn('roomEnter', (message) => {
        roomData = JSON.parse(message.data)['player']; // Usage of same Entity as for player
        if(playersInRoomData) {
            $mult.ui.showPlayersInRoom(roomData, playersInRoomData, playersInRoomData[0][0] === uuid);
            playersDataObservers.forEach(fn => fn(playersInRoomData, playersInRoomData[0][0] === uuid, uuid));
        }
    });

    $mult.socket.addObserverFn('playersInRoom', (message) => {
        playersInRoomData = JSON.parse(message.data)['players'];
        if(roomData) {
            $mult.ui.showPlayersInRoom(roomData, playersInRoomData, playersInRoomData[0][0] === uuid);
            playersDataObservers.forEach(fn => fn(playersInRoomData, playersInRoomData[0][0] === uuid, uuid));
        }
    });
    $mult.socket.addObserverFn('game', (message) => {
        const data = message.data.split('::');
        const obj = {
            fromId: data[0],
            task: data[1],
            value: data[2]
        }
        gameObservers.forEach(fn => fn(obj));
    });

    $mult.socket.addObserverFn('nextGame', (message) => {
        const data = message.data.substring(0, message.data.length - 1).split(',')
        const dataArray = [];
        data.forEach(strN => dataArray.push(Number(strN)));
        nextGameObservers.forEach(fn => fn(dataArray));
        playersDataObservers.forEach(fn => fn(playersInRoomData.filter(d => d[0] !== uuid), playersInRoomData[0][0] === uuid, uuid));
    });

    $mult.socket.addObserverFn('chat', (message) => {
        $mult.ui.addChatMsg(JSON.parse(message.data));
    });

    self.addGameObserver = observerFn => gameObservers.push(observerFn)

    self.addNextGameObserver = observerFn => nextGameObservers.push(observerFn)

    self.addPlayersDataObserver = observerFn => playersDataObservers.push(observerFn)

    self.sendChatMsg = (msg) => {
        $mult.socket.writeToSocket('chat', {str: msg});
    }

    self.createRoom = (name) => {
        $mult.socket.writeToSocket('roomCreate', {str: name});
    };

    self.enterRoom = (uuid) => {
        $mult.socket.writeToSocket('roomEnter', {uuid: uuid});
    };

    self.leaveRoom = _ => {
        $mult.socket.writeToSocket('roomLeave', {});
    };

    self.kickPlayerFromRoom = (uuid) => {
        $mult.socket.writeToSocket('roomKick', {uuid: uuid});
    };

    self.sendGameState = (msg) => {
        if(msg.indexOf('point') === -1 || msg !== lastStateMsg) {
            $mult.socket.writeToSocket('game', {str: msg});
        }
        lastStateMsg = msg;
    }

})($mult.zooKeeper = $mult.zooKeeper || {});