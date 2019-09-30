$sol = window.$sol || {};
(function Ui(self) {
    Element.prototype.addClass = Element.prototype.addClass || function (clazz) {
        const existing = this.getAttribute('class');
        this.setAttribute('class', existing ? existing + ' ' + clazz : clazz);
        return this;
    };

    Element.prototype.removeClass = Element.prototype.removeClass || function (clazz) {
        this.setAttribute('class',
            this.getAttribute('class').split(' ').filter(item => item !== clazz).join(' ')
        );
        return this;
    };

    Element.prototype.hasClass = Element.prototype.hasClass || function (clazz) {
        return this.getAttribute('class').split(' ').find(item => item === clazz) === clazz;
    };

    Element.prototype.setCard = function (card) {
        this.getCard = () => {
            return card;
        };
        return this;
    };

    const targets = [];
    let stage;
    let slots;
    let closedHeapCoords, openHeapCoords;
    let openHeapZindex = 10;

    function calculateBgPos(color, type) {
        const h = $sol.constants.CARD_GRAPHIC_OFFSET - color * $sol.constants.CARD_HEIGHT;
        const w = $sol.constants.CARD_GRAPHIC_OFFSET - type * $sol.constants.CARD_WIDTH;
        return w + 'px ' + h + 'px';
    }

    function intersectRect(r1, r2) {
        return !(r2.left > r1.right ||
            r2.right < r1.left ||
            r2.top > r1.bottom ||
            r2.bottom < r1.top);
    }

    function intersect(node, otherNode) {
        return node !== otherNode && intersectRect({
            left: node.offsetLeft,
            top: node.offsetTop,
            right: node.offsetLeft + node.offsetWidth,
            bottom: node.offsetTop + node.offsetHeight
        }, {
            left: otherNode.offsetLeft,
            top: otherNode.offsetTop,
            right: otherNode.offsetLeft + otherNode.offsetWidth,
            bottom: otherNode.offsetTop + otherNode.offsetHeight
        })
    }

    self.doPushToTarget = (card, i) => {
        $sol.game.pushToTarget(card, i);
        card.withParent(null);
        card.getNode().style.left = targets[i].offsetLeft + 'px';
        card.getNode().style.top = targets[i].offsetTop + 'px';
        $sol.game.checkAndTurn();
        $sol.game.actionDone();
    };

    function findTargetTarget(node) {
        const card = node.getCard();
        for(let i = 0; i < targets.length; i++) {
            if(intersect(node, targets[i]) && $sol.game.canPushToTarget(card, i)) {
                return () => {
                    self.doPushToTarget(card, i);
                };
            }
        }
        return false;
    }

    function autoFindTargetTarget(node) {
        $sol.game.autoFindTarget(node.getCard(), self.doPushToTarget);
    }

    function findTarget(node) {
        return $sol.game.findTopLaneCards().filter(c => {
            return intersect(node, c.getNode()) && c.canAppend(node.getCard());
        });
    }

    function appendNode(parentCard, node) {
        const card = node.getCard();
        card.withParent(parentCard);
        card.zIndex = parentCard.zIndex + 1;
        node.style.zIndex = card.zIndex + '';
        card.x = parentCard.x;
        card.y = parentCard.y + 1;
        node.style.left = card.x * $sol.constants.LANE_WIDTH + 'px';
        node.style.top = ($sol.constants.LANES_TOP + card.y * $sol.constants.CARD_TOP_OFFSET) + 'px';
    }

    function resetCard(node) {
        const card = node.getCard();
        switch(card.state) {
            case $sol.constants.CARD_STATE_ON_TARGET:
                for(let i = 0; i < targets.length; i++) {
                    if($sol.game.isCardOnTopOfTarget(card, i)) {
                        node.style.left = targets[i].offsetLeft + 'px';
                        node.style.top = targets[i].offsetTop + 'px';
                        node.style.zIndex = card.zIndex + '';
                    }
                }
                break;
            case $sol.constants.CARD_STATE_ON_HEAP:
                self.flipHeapCard(node, true);
                break;
            case $sol.constants.CARD_STATE_ON_FIELD:
                const parentCard = card.getParentCard();
                if(parentCard) {
                    card.zIndex = parentCard.zIndex + 1;
                    node.style.zIndex = card.zIndex + '';
                }
                node.style.left = card.x * $sol.constants.LANE_WIDTH + 'px';
                node.style.top = ($sol.constants.LANES_TOP + card.y * $sol.constants.CARD_TOP_OFFSET) + 'px';
                break;
        }
    }

    function addDoubleClick(node, fn) {
        node.onclick = () => {
            let clickableAgain = true;
            setTimeout(() => {
                clickableAgain = false;
                if(node.getCard().state !== $sol.constants.CARD_STATE_ON_TARGET) {
                    addDoubleClick(node, fn);
                }
            }, $sol.constants.DOUBLE_CLICK_TIMEOUT);
            node.onclick = () => {
                if(clickableAgain) {
                    fn(node);
                }
            }
        }
    }

    self.listenToHeapClick = (node) => {
        self.flipCard(node);
    };

    self.addDraggable = (node) => { // No, not a HTML draggable.
        function collectAll(node) { // returns an Array of movables.
            const all = [node.getCard()];
            let candidate = node.getCard();
            while((candidate = candidate.getNextAppendingCard()) !== null) {
                all.push(candidate);
            }
            return all;
        }
        function initAll(cards) {
            let zCounter = 7777;
            return cards.map(card => {
                const node = card.getNode();
                node.style.zIndex = (++zCounter) + '';
                return {node: node, initialNodeX: node.offsetLeft, initialNodeY: node.offsetTop, oldZIndex: node.style.zIndex}
            });
        }
        function moveAll(nodesProps, diffX, diffY) {
            nodesProps.forEach(nodeProps => {
                nodeProps.node.style.left = nodeProps.initialNodeX + diffX + 'px';
                nodeProps.node.style.top = nodeProps.initialNodeY + diffY + 'px';
            });
        }
        function appendAll(nodesProps) {
            nodesProps.forEach(np => {
                const card = np.node.getCard();
                const appendix = card.getNextAppendingCard();
                if(appendix !== null) {
                    appendNode(card, appendix.getNode());
                }
            })
        }
        node.onmousedown = (evt) => {
            const all = initAll(collectAll(node));
            const startX = evt.clientX;
            const startY = evt.clientY;
            const oldZIndex = node.style.zIndex;
            document.onmousemove = (evtM) => {
                const diffX = evtM.clientX - startX;
                const diffY = evtM.clientY - startY;
                moveAll(all, diffX, diffY);
            };
            document.onmouseup = () => {
                document.onmousemove = () => {};
                document.onmouseup = () => {};
                node.style.zIndex = oldZIndex;
                if(all.length === 1) {
                    const fn = findTargetTarget(node);
                    if(fn) {
                        fn();
                        $sol.game.checkAndTurn();
                        $sol.game.actionDone();
                        return;
                    }
                }
                const slots = findTarget(node);
                if(slots.length !== 0) {
                    if(all.length === 1 && node.getCard().state === $sol.constants.CARD_STATE_ON_TARGET) {
                        $sol.game.removeCardFromTarget(node.getCard());
                    }
                    appendNode(slots[0], node);
                    appendAll(all.slice());
                    $sol.game.checkAndTurn();
                    $sol.game.actionDone();
                } else {
                    resetCard(node);
                    appendAll(all.slice());
                }
                return true;
            };
            return true;
        }
    };

    self.createNode = (props) => {

        const node = document.createElement('DIV');
        node.addClass('tile').addClass('card');
        if(props.ghost) {
            node.addClass('ghostCard');
        } else if(!props.open) {
            node.addClass('cardBack');
        } else {
            self.addDraggable(node);
        }
        node.style.backgroundPosition = calculateBgPos(props.color, props.type);
        if(props.x !== null) {
            node.style.left = props.x * $sol.constants.LANE_WIDTH + 'px';
            node.style.top = ($sol.constants.LANES_TOP + props.y * $sol.constants.CARD_TOP_OFFSET) + 'px';
        } else { // Heap
            node.addClass('cardBack');
            node.style.left = closedHeapCoords.x + 'px';
            node.style.top = closedHeapCoords.y + 'px';
            node.onclick = () => $sol.game.flipNextHeapCard();
        }
        stage.appendChild(node);
        return node;
    };

    self.serialize = (node) => {
        return {
            clazz: node.getAttribute('class'),
            style: {
                backgroundPosition: node.style.backgroundPosition,
                left: node.style.left,
                top: node.style.top,
                zIndex: node.style.zIndex
            },
            onclick: node.onclick,
            onmousedown: node.onmousedown
        }
    };

    self.deserialize = (node, ser) => {
        node.setAttribute('class', ser.clazz);
        node.style.backgroundPosition = ser.style.backgroundPosition;
        node.style.left = ser.style.left;
        node.style.top = ser.style.top;
        node.style.zIndex = ser.style.zIndex;
        node.onclick = ser.onclick;
        node.onmousedown = ser.onmousedown
    };

    self.flipHeapCard = (node, reset) => {
        node.style.left = openHeapCoords.x + 'px';
        node.style.top = openHeapCoords.y + 'px';
        node.style.zIndex = ++openHeapZindex + '';
        node.removeClass('cardBack');
        if(!reset) {
            self.addDraggable(node);
            $sol.game.actionDone();
        }
    };

    self.flipCard = (node) => {
        if(node) { // if no null card
            node.removeClass('cardBack');
            self.addDraggable(node);
        }
    };

    self.updateCard = (card) => {
        card.getNode().style.zIndex = card.zIndex + '';
    };

    self.setStage = (element) => {
        stage = element;
    };

    self.removeFromStage = (node) => {
        node.parentElement.removeChild(node);
    };

    self.setSlots = (_slots) => {
        slots = _slots;
        closedHeapCoords = {x: slots.closedHeap.offsetLeft, y: slots.closedHeap.offsetTop};
        openHeapCoords = {x: slots.openHeap.offsetLeft, y: slots.openHeap.offsetTop};
        targets.push(_slots.slotKaro);
        targets.push(_slots.slotKreuz);
        targets.push(_slots.slotHerz);
        targets.push(_slots.slotPik);
    };

    self.actionDone = () => {
        $sol.game.traverseCards((card) => {
            if(card.state !== $sol.constants.CARD_STATE_ON_HEAP) {
                card.getNode().onclick = () => {};
            }
        }).filter(card => {
            return card.isOpen() && card.state !== $sol.constants.CARD_STATE_ON_TARGET && card.getNextAppendingCard() === null;
        }).forEach(card => {
            addDoubleClick(card.getNode(), autoFindTargetTarget);
        });
    }

})($sol.ui = $sol.ui || {});