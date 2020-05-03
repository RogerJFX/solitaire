$mult = window.$mult || {};
(function ZooKeeper(self) {

    let playersInRoomData;
    let roomData;
    let uuid;

    $mult.socket.addObserverFn('count', message => {
        const obj = JSON.parse(message.data)
        $mult.ui.notifyPlayersOnline(obj['players'], obj['rooms']);
    });

    $mult.socket.addObserverFn('kicked', message => {
        playersInRoomData = null;
        roomData = null;
        $mult.socket.writeToSocket('roomList', {});
    });

    $mult.socket.addObserverFn('roomList', message => {
        if(!playersInRoomData && !roomData) {
            const obj = JSON.parse(message.data);
            console.log(obj);
            $mult.ui.showRooms(obj['rooms']);
        }
    });

    $mult.socket.addObserverFn('roomKilled', message => {
        playersInRoomData = null;
        roomData = null;
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
        }
    });

    $mult.socket.addObserverFn('playersInRoom', (message) => {
        playersInRoomData = JSON.parse(message.data)['players'];
        if(roomData) {
            $mult.ui.showPlayersInRoom(roomData, playersInRoomData, playersInRoomData[0][0] === uuid);
        }
    });


    self.createRoom = (name) => {
        $mult.socket.writeToSocket('roomCreate', {name: name});
    };

    self.enterRoom = (uuid) => {
        $mult.socket.writeToSocket('roomEnter', {uuid: uuid});
    };

    self.leaveRoom = _ => {
        $mult.socket.writeToSocket('roomLeave', {});
    };

    self.startGame = _ => {
        $mult.socket.writeToSocket('startGame', {});
    }

    self.kickPlayerFromRoom = (uuid) => {
        $mult.socket.writeToSocket('roomKick', {uuid: uuid});
    };

})($mult.zooKeeper = $mult.zooKeeper || {});