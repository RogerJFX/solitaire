$sol = window.$sol || {};
(function Multi(self) {

    self.init = () => {
        $mult.zooKeeper.addPlayersDataObserver((playersData, master, myUuid) => {
            const parentNode = document.getElementById('multiHeader');
            parentNode.innerHTML = '';
            if(playersData === null) {
                document.getElementById('multiStage').style.display = 'block';
                document.getElementById('darkLayer').style.display = 'block';
                document.getElementById('chatDiv').style.zIndex = '10002';
                // document.getElementById('gameStage').style.display = 'none';
            } else {
                playersData.filter(playerData => playerData[0] !== myUuid).forEach(playerData => {
                    const n = document.createElement('DIV');
                    parentNode.appendChild(n);
                    const nameD = document.createElement('DIV');
                    const pointsD = document.createElement('DIV');
                    const stateD = document.createElement('DIV');
                    nameD.innerHTML = playerData[1];
                    pointsD.innerHTML = '0$';
                    stateD.innerHTML = 'playing';
                    pointsD.setAttribute('class', 'num');
                    pointsD.setAttribute('id', `points_${playerData[0]}`);
                    stateD.setAttribute('id', `state_${playerData[0]}`);
                    n.appendChild(nameD);
                    n.appendChild(pointsD);
                    n.appendChild(stateD);
                    if(master) {
                        const kickButton = document.createElement('BUTTON');
                        kickButton.innerHTML = 'x';
                        kickButton.setAttribute('class', 'button kickPlayerButton');
                        kickButton.onclick = () => {
                            $mult.zooKeeper.kickPlayerFromRoom(playerData[0]);
                        }
                        n.appendChild(kickButton);
                    }
                });
            }
            const leaveRoomButton = document.createElement('BUTTON');
            leaveRoomButton.setAttribute('class', 'button leaveRoomButton');
            leaveRoomButton.innerHTML = 'Leave room';
            leaveRoomButton.onclick = $mult.zooKeeper.leaveRoom;
            parentNode.appendChild(leaveRoomButton);
        });

        $mult.zooKeeper.addGameObserver((data) => {
            switch(data.task) {
                case 'next':
                    const node = document.getElementById(`state_${data.fromId}`);
                    if(node) {
                        node.innerHTML = 'waiting';
                    }
                    break;
                case 'points':
                    document.getElementById(`points_${data.fromId}`).innerHTML = `${data.value}$`;
                    break;
                default:
                    console.error(`wrong task ${data.task}`);
            }

        });
    }

})($sol.mult = $sol.mult || {});