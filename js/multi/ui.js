$mult = window.$mult || {};
/**
 * Don't mind the mess here. :P
 */
(function Ui(self) {

    self.prompt = (headline, prefix) => {
        const candidate = window.prompt(headline);
        if(candidate.length < 3) {
            return self.prompt(headline, prefix);
        }
        return candidate;
        // return `${prefix}_${Math.floor(Math.random() * 1000)}`;
    }

    self.notifyPlayersOnline = (playerCount, roomCount) => {
        document.getElementById('playersOnline').innerHTML = playerCount;
        document.getElementById('roomsRunning').innerHTML = roomCount;
    };

    self.showRooms = roomsArray => {
        document.getElementById('roomPlayerList').style.display = 'none';
        document.getElementById('createRoom').style.display = 'block';
        const node = document.getElementById('roomsList');
        node.style.display = 'table';
        node.innerHTML = '';
        const row = document.createElement('DIV');
        row.setAttribute('style', 'font-weight:bold');
        createAndAppendCell('Room', row);
        createAndAppendCell('Max. players', row);
        createAndAppendCell('Curr. players', row);
        createAndAppendCell('', row);
        node.appendChild(row);
        let c = 0;
        roomsArray.forEach(room => {
            const row = document.createElement('DIV');
            createAndAppendCell(room[1], row);
            createAndAppendCell(room[2], row);
            createAndAppendCell(room[3], row);
            node.appendChild(row);
            if(room[4]) {
                const emptyCell = createAndAppendCell('', row);
                const button = document.createElement('BUTTON');
                button.onclick = () => enterRoom(room[0]);
                button.innerHTML = 'Enter';
                button.addClass('button').addClass('relButton');
                emptyCell.appendChild(button);
            }
            if(++c % 2 === 0) {
                row.addClass('even');
            }
        });
    }

    self.showPlayersInRoom = (roomData, playersData, master) => {
        document.getElementById('createRoom').style.display = 'none';
        document.getElementById('roomsList').style.display = 'none';
        const node = document.getElementById('roomPlayerList');
        node.style.display = 'table';
        node.innerHTML = '';
        const header = document.createElement('DIV');
        header.innerHTML = 'You are in Room: ' + roomData[1]; // Name
        header.style.fontWeight = 'bold';
        node.appendChild(header);

        const buttons = document.createElement('DIV');
        const leaveButton = document.createElement('BUTTON');
        leaveButton.innerHTML = 'Leave room';
        leaveButton.onclick = leaveRoom;
        leaveButton.addClass('button').addClass('relButton');
        const startButton = document.createElement('BUTTON');
        startButton.innerHTML = 'I am Ready';
        startButton.onclick = startGame;
        startButton.addClass('button').addClass('relButton');
        startButton.style.marginLeft = '12px'
        buttons.appendChild(leaveButton);
        buttons.appendChild(startButton);
        node.appendChild(buttons);

        let c = 0;
        playersData.forEach(player => {
            const row = document.createElement('DIV');
            // row.setAttribute('style', 'display:table-row');
            createAndAppendCell(player[1], row, player[0], player[2]);
            node.appendChild(row);
            if(master) {
                const emptyCell = createAndAppendCell('', row);
                if(c > 0) {
                    const button = document.createElement('BUTTON');
                    button.onclick = () => kickPlayerFromRoom(player[0]);
                    button.innerHTML = 'Kick';
                    button.addClass('button').addClass('relButton');
                    emptyCell.appendChild(button);
                }
            }
            if(++c % 2 === 0) {
                row.addClass('even');
            }
        });
        document.getElementById('chatInput').onkeyup = (evt) => {
            if(evt.code === 'Enter') {
                sendChatMsg();
            }
        }
        document.getElementById('chatSend').onclick = sendChatMsg;
    };



    self.createRoom = _ => {
        $mult.zooKeeper.createRoom(self.prompt('Room name', 'Room'));
    };

    self.addChatMsg = (entity) => {
        const objDiv = document.getElementById("chatOutput");
        objDiv.appendChild((function() {
            const row = document.createElement('DIV');
            row.innerHTML = entity['name'] + ': ' + entity['msg'];
            return row;
        })());
        objDiv.scrollTop = objDiv.scrollHeight;
    }

    self.init = () => {
        $mult.zooKeeper.addGameObserver((data) => {
            if(data.task === 'next') {
                const node = document.getElementById(`player_${data.fromId}`);
                if(node) {
                    const span = document.createElement('SPAN');
                    span.innerHTML = '  ready';
                    node.appendChild(span);
                }
            }
        });
        $mult.zooKeeper.addPlayersDataObserver((data) => {
            const chatDiv = document.getElementById('chatDiv');
            const chatOutput = document.getElementById('chatOutput');
            if(data === null) {
                // chatDiv.style.display = 'none';
                chatOutput.innerHTML = '';
            } else {
                chatDiv.style.display = 'block';
            }
        })
    };

    function sendChatMsg() {
        const msg = document.getElementById('chatInput').value;
        if(msg.length > 0) {
            $mult.zooKeeper.sendChatMsg(msg);
            document.getElementById('chatInput').value = '';
        }

    }

    function leaveRoom() {
        $mult.zooKeeper.leaveRoom();
    }

    function startGame() {
        $mult.zooKeeper.sendGameState('next');
    }

    function enterRoom(uuid) {
        $mult.zooKeeper.enterRoom(uuid);
    }

    function kickPlayerFromRoom(uuid){
        $mult.zooKeeper.kickPlayerFromRoom(uuid);
    }

    function createAndAppendCell(value, row, uuid, waiting) {
        const cell = document.createElement('DIV');

        if(uuid) {
            cell.setAttribute('id', `player_${uuid}`);
        }
        cell.innerHTML = value;
        row.appendChild(cell);
        if(uuid && waiting) {
            const span = document.createElement('SPAN');
            span.innerHTML = '  ready';
            cell.appendChild(span);
        }
        return cell;
    }



})($mult.ui = $mult.ui || {});