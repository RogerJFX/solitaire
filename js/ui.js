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
    // Ugly, but too lazy.
    Element.prototype.setCard = function (card) {
        this.getCard = () => {
            return card;
        };
        return this;
    };

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

    function findTarget(node) {
        return $sol.game.findTopLaneCards().filter(c => {
            return (c.x === null && c.canAppend(node.getCard())) || (c.getNode() && intersect(node, c.getNode()) && c.canAppend(node.getCard()));
        });
    }

    function appendNode(parentCard, node) {
        const card = node.getCard();
        card.withParent(parentCard);
        node.style.zIndex = parentCard.zIndex + 1 + '';
        card.x = parentCard.x;
        card.y = parentCard.y + 1;
        node.style.left = card.x * $sol.constants.LANE_WIDTH + 'px';
        node.style.top = ($sol.constants.LANES_TOP + card.y * $sol.constants.CARD_TOP_OFFSET) + 'px';
    }

    function resetCard(node) {
        const card = node.getCard();
        node.style.left = card.x * $sol.constants.LANE_WIDTH + 'px';
        node.style.top = ($sol.constants.LANES_TOP + card.y * $sol.constants.CARD_TOP_OFFSET) + 'px';
    }

    self.listenToHeapClick = (node) => {
        self.flipCard(node);
    };
    // TODO: move all children.
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
                    appendNode(card, appendix);
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
                node.style.zIndex = oldZIndex;
                const slots = findTarget(node);
                if(slots.length !== 0) {
                    appendNode(slots[0], node);
                    appendAll(all.slice());
                    $sol.game.checkAndTurn();
                } else {
                    resetCard(node);
                    appendAll(all.slice());
                }
            };
        }
    };

    self.createNode = (props) => {
        const node = document.createElement('DIV');
        node.addClass('tile').addClass('card');
        if(!props.open) {
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
            node.onclick = () => self.flipCard(node);
        }
        stage.appendChild(node);
        return node;
    };

    self.flipHeapCard = (node) => {
        node.style.left = openHeapCoords.x + 'px';
        node.style.top = openHeapCoords.y + 'px';
        node.style.zIndex = ++openHeapZindex + '';
        node.removeClass('cardBack');
        self.addDraggable(node);
    };

    self.flipCard = (node) => {
        if(node) { // if no null card
            node.removeClass('cardBack');
            self.addDraggable(node);
        }
    };

    self.setStage = (element) => {
        stage = element;
    };
    self.setSlots = (_slots) => {
        slots = _slots;
        closedHeapCoords = {x: slots.closedHeap.offsetLeft, y: slots.closedHeap.offsetTop};
        openHeapCoords = {x: slots.openHeap.offsetLeft, y: slots.openHeap.offsetTop};
    };

})($sol.ui = $sol.ui || {});