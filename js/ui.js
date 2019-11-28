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
    let openHeapZindex = 100;

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
        self.translateCard(card.getNode(), targets[i].offsetLeft, targets[i].offsetTop).then(() => {
            $sol.game.checkAndTurn();
            $sol.game.actionDone();
        });
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
        return new Promise((resolve) => {
            const card = node.getCard();
            card.withParent(parentCard);
            card.zIndex = parentCard.zIndex + 1;
            node.style.zIndex = card.zIndex + '';
            card.x = parentCard.x;
            card.y = parentCard.y + 1;
            self.translateCard(card.getNode(),
                card.x * $sol.constants.LANE_WIDTH,
                $sol.constants.LANES_TOP + card.y * $sol.constants.CARD_TOP_OFFSET,
                $sol.constants.ANI_STEPS_APPENDCARD,
                $sol.constants.ANI_APPENDCARD_RESOLVE_AFTER)
                .then(() => {
                    resolve();
                });
        });
    }

    function resetCard(node) {
        const card = node.getCard();
        return new Promise(resolve => {
            switch (card.state) {
                case $sol.constants.CARD_STATE_ON_TARGET:
                    for (let i = 0; i < targets.length; i++) {
                        if ($sol.game.isCardOnTopOfTarget(card, i)) {
                            self.translateCard(node, targets[i].offsetLeft, targets[i].offsetTop, $sol.constants.ANI_STEPS_APPENDCARD)
                                .then(() => {
                                    node.style.zIndex = card.zIndex + '';
                                    resolve();
                                });
                        }
                    }
                    break;
                case $sol.constants.CARD_STATE_ON_HEAP:
                    self.translateCard(node, openHeapCoords.x, openHeapCoords.y, $sol.constants.ANI_STEPS_APPENDCARD)
                        .then(() => {
                            node.style.zIndex = card.zIndex + '';
                            resolve();
                        });
                    break;
                case $sol.constants.CARD_STATE_ON_FIELD:
                    const parentCard = card.getParentCard();
                    self.translateCard(node, card.x * $sol.constants.LANE_WIDTH,
                        $sol.constants.LANES_TOP + card.y * $sol.constants.CARD_TOP_OFFSET,
                        $sol.constants.ANI_STEPS_APPENDCARD)
                        .then(() => {
                            if (parentCard) {
                                card.zIndex = parentCard.zIndex + 1;
                                node.style.zIndex = card.zIndex + '';
                            }
                            resolve();
                        });
                    break;
            }
        });
    }

    function addDoubleClick(node, fn) {
        node.onclick = () => {
            let clickableAgain = true;
            setTimeout(() => {
                clickableAgain = false;
                node.onclick = () => {};
                if(node.getCard().state !== $sol.constants.CARD_STATE_ON_TARGET) {
                    addDoubleClick(node, fn);
                }
            }, $sol.constants.DOUBLE_CLICK_TIMEOUT);
            node.onclick = () => {
                $sol.game.mouseDown(-1);
                if(clickableAgain) {
                    fn(node);
                }
            }
        }
    }

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
        const triggerAfterAppendAll =  ($sol.constants.ANI_STEPS_APPENDCARD -
            $sol.constants.ANI_APPENDCARD_RESOLVE_AFTER + 1) * $sol.constants.MILLIS_PER_STEP;
        function appendAll(nodesProps, cb) {
            if(nodesProps.length === 0) {
                if(cb) {
                    // setTimeout(cb, triggerAfterAppendAll);
                    cb();
                }
                return;
            }
            const np = nodesProps.shift();
            const card = np.node.getCard();
            const appendix = card.getNextAppendingCard();
            if(appendix !== null) {
                appendNode(card, appendix.getNode()).then(_ => {
                    appendAll(nodesProps, cb);
                });
            } else if(cb) {
                setTimeout(cb, triggerAfterAppendAll);
            }
        }
        node.onmousedown = (evt) => {
            $sol.game.mouseDown(1);
            const all = initAll(collectAll(node));
            const startX = evt.clientX;
            const startY = evt.clientY;
            const oldZIndex = node.style.zIndex;
            let moved = false;
            document.onmousemove = (evtM) => {
                const diffX = evtM.clientX - startX;
                const diffY = evtM.clientY - startY;
                moveAll(all, diffX, diffY);
                moved = moved || Math.abs(diffX) > 1 ||  Math.abs(diffY) > 1;
            };
            document.onmouseup = () => {
                document.onmousemove = () => {};
                document.onmouseup = () => {};
                node.style.zIndex = oldZIndex;
                if(!moved) {
                    node.style.zIndex = node.getCard().zIndex + '';
                    return;
                }
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
                    appendNode(slots[0], node).then(() => {
                        appendAll(all.slice(), () => {
                            $sol.game.checkAndTurn();
                            $sol.game.actionDone();
                        });

                    });

                } else {
                    resetCard(node).then(_ => {
                        appendAll(all.slice());
                    });

                }
                return true;
            };
            return true;
        }
    };

    self.createNode = (props) => {

        const node = document.createElement('DIV');
        node.addClass('tile').addClass('card');
        const inner = document.createElement('DIV');

        const backInner = document.createElement('DIV');
        const frontInner = document.createElement('DIV');
        inner.appendChild(frontInner);
        inner.appendChild(backInner);
        node.appendChild(inner);
        if(props.ghost) {
            node.addClass('ghostCard');
        } else if(!props.open) {
            // node.addClass('cardBack');

        } else {
            node.addClass('turned');
            self.addDraggable(node);
        }
        frontInner.style.backgroundPosition = calculateBgPos(props.color, props.type);
        inner.addClass('inner');
        frontInner.addClass('cardFront');
        backInner.addClass('cardBack');
        if(props.x !== null) {
            self.translateCard(node, props.x * $sol.constants.LANE_WIDTH, $sol.constants.LANES_TOP + props.y * $sol.constants.CARD_TOP_OFFSET);
        } else { // Heap
            // node.addClass('cardBack');
            node.style.zIndex = props.z;
            node.style.left = closedHeapCoords.x + 'px';
            node.style.top = closedHeapCoords.y + 'px';
            node.onclick = () => {
                $sol.game.mouseDown(1);
                $sol.game.flipNextHeapCard();
            }
        }
        stage.appendChild(node);
        return node;
    };

    self.serialize = (node) => {
        return {
            clazz: node.getAttribute('class'),
            style: {
                left: node.offsetLeft,
                top: node.offsetTop,
                zIndex: node.style.zIndex
            },
            onclick: node.onclick,
            onmousedown: node.onmousedown
        }
    };

    self.deserialize = (node, ser) => {
        return new Promise((resolve) => {
            node.setAttribute('class', ser.clazz);
            self.translateCard(node, ser.style.left, ser.style.top).then(() => {
                node.style.zIndex = ser.style.zIndex;
                node.onclick = ser.onclick;
                node.onmousedown = ser.onmousedown;
                resolve();
            });
        });

    };

    self.flipHeapCard = (node) => {
        node.style.zIndex = ++openHeapZindex + '';
        node.getCard().zIndex = openHeapZindex;
        node.addClass('turned');
        self.translateCard(node, openHeapCoords.x, openHeapCoords.y).then(() => {
            self.addDraggable(node);
            $sol.game.actionDone();
        });
    };

    self.translateCard = (node, left, top, _steps, _resolveAfter) => {
        const steps = _steps || $sol.constants.ANI_STEPS_TRANSLATECARD;
        const resolveAfter = _resolveAfter || steps;
        let resolved = false;
        return new Promise((resolve) => {
            const x = node.offsetLeft;
            const y = node.offsetTop;
            const diffX = left - x;
            const diffY = top -y;
            const stepX = diffX / steps;
            const stepY = diffY / steps;
            const stepsX = [];
            const stepsY = [];
            for (let i = 0; i < steps; i++) {
                stepsX.push(x + stepX * i);
                stepsY.push(y + stepY * i);
            }
            let c = 0;
            const oldZIndex = node.style.zIndex;
            node.style.zIndex = 7777 + '';
            const interval = window.setInterval(() => {
                if(c < steps) {
                    node.style.left = stepsX[c] + 'px';
                    node.style.top = stepsY[c] + 'px';
                    if(c === resolveAfter) {
                        resolved = true;
                        resolve();
                    }
                    c++;
                } else {
                    node.style.left = left + 'px';
                    node.style.top = top + 'px';
                    window.clearInterval(interval);
                    node.style.zIndex = oldZIndex; // Might be modified after resolve.
                    if(!resolved) {
                        resolve();
                    }
                }
            }, $sol.constants.MILLIS_PER_STEP);
        });
    };

    self.flipCard = (node) => {
        if(node) { // if no null card
            node.addClass('turned');
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
