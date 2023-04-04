window.$sol = window.$sol || {};
(function Game(self) {
    const $sol = window.$sol;
    let heap;
    let nullCards = [];
    let history = [];
    let targets = [];
    let cash = 0;
    let mouseDownCount = 0;
    let autoRunning = false;

    function Card(color, type) {
        const me = this;

        this.color = color;
        this.type = type;

        this.state = $sol.constants.CARD_STATE_ON_HEAP;
        this.zIndex = 10;
        this.x = null;
        this.y = null;

        let open = false;
        let node;

        let nextCard = null;
        let parentCard = null;

        this.serialize = () => {
            return {
                card: me,
                x: me.x,
                y: me.y,
                z: me.zIndex,
                state: me.state,
                open: open,
                nextCard: nextCard,
                parentCard: parentCard,
                nodeProps: $sol.ui.serialize(node)
            };
        };

        this.mustRenderByHistoryBack = (ser) => {
            return me.x !== ser.x || me.y !== ser.y || open !== ser.open || me.state !== ser.state;
        };

        this.deserialize = (ser, dry) => {
            me.x = ser.x;
            me.y = ser.y;
            me.zIndex = ser.z;
            me.state = ser.state;
            open = ser.open;
            nextCard = ser.nextCard;
            parentCard = ser.parentCard;
            if (!dry) {
                return $sol.ui.deserialize(node, ser.nodeProps);
            }
        };

        this.withProps = (_x, _y, _open) => {
            this.x = _x;
            this.y = _y;
            open = _open;
            return me;
        };

        this.withState = (_state) => {
            this.state = _state;
            return this;
        };

        this.withParent = (card) => {
            if (parentCard) {
                parentCard.appendCard(null);
            }
            if (card) {
                card.appendCard(me);
            }
            parentCard = card;
            return me;
        };

        this.flipHeapCard = () => {
            open = true;
            $sol.ui.flipHeapCard(node);
        };

        this.flipCard = () => {
            open = true;
            $sol.ui.flipCard(node);
        };

        this.createNode = (ghost) => {
            node = $sol.ui.createNode({
                color: me.color,
                type: me.type,
                x: me.x,
                y: me.y,
                z: me.zIndex,
                open: open,
                ghost: ghost
            }).setCard(me);
            return me;
        };

        this.canAppend = (other) => {
            const otherType = other.type === 12 ? -1 : other.type;
            return (me.type === null && otherType === 11)
                || (me.color % 2 !== other.color % 2 && me.type === otherType + 1);
        };

        this.getNode = () => {
            return node;
        };

        this.updateLayout = () => {
            $sol.ui.updateCard(me);
        };

        this.appendCard = (_nextCard) => {
            nextCard = _nextCard || null;
            if (nextCard) {
                nextCard.withState($sol.constants.CARD_STATE_ON_FIELD).zIndex = this.zIndex + 1;
            }
        };

        this.getNextAppendingCard = () => {
            return nextCard;
        };

        this.isOpen = () => {
            return open;
        };

        this.getParentCard = () => {
            return parentCard;
        };

        this.equals = (other) => {
            return other && me.type === other.type && me.color === other.color;
        };
    }

    function Heap() {
        let cards;
        let counterFn;
        let index;
        this.init = (_cards) => {
            cards = _cards;
            index = cards.length - 1;
            for (let i = 0; i < cards.length - 1; i++) {
                cards[i].zIndex = 10 + i;
            }
        };
        this.takeSnapshot = () => {
            return {
                cards: cards.map(card => card.serialize()),
                heap: {
                    index: index + ''
                },
                targets: targets.map(target => target.serialize()),
                nullCards: nullCards.map(card => card.serialize()),
                cash: cash
            };
        };
        this.fromSnapshot = (ser) => {
            return new Promise((resolve, reject) => {
                index = Number(ser.heap.index);
                cash = ser.cash;
                for (let i = 0; i < targets.length; i++) {
                    targets[i].deserialize(ser.targets[i]);
                }
                ser.nullCards.forEach(item => item.card.deserialize(item));

                ser.cards.filter(item => !item.card.mustRenderByHistoryBack(item)).forEach(item => item.card.deserialize(item, true));

                // Rendering
                const relevantCards = ser.cards.filter(item => item.card.mustRenderByHistoryBack(item));
                const turned = relevantCards.filter(item => item.nodeProps.clazz.includes('turned'));
                const notTurned = relevantCards.filter(item => !item.nodeProps.clazz.includes('turned'));

                let count = relevantCards.length;

                function resolveIfFinished() {
                    if (--count === 0) {
                        ser.cards.filter(card => card && card.updateLayout).forEach(card => card.updateLayout());
                        resolve();
                    }
                }

                notTurned.forEach(item => item.card.deserialize(item).then(() => {
                    resolveIfFinished();
                }));
                setTimeout(() => {
                    turned.forEach(item => item.card.deserialize(item).then(() => resolveIfFinished()));
                }, 40);
            });
        };
        this.nextCard = () => {
            if (index === -1) {
                return null;
            }
            return cards[index--];
        };
        this.createNodes = () => {
            for (let i = index; i >= 0; i--) {
                cards[i].createNode();
            }
        };
        this.flipNext = () => {
            if (index !== -1) {
                this.nextCard().flipHeapCard();
                return true;
            }
            return false;
        };
        this.findCard = (x, y) => {
            return cards.find(card => {
                return x === card.x && y === card.y
            });
        };
        this.traverseCards = (fn) => {
            if (cards) {
                cards.forEach(card => fn(card));
            }
            return cards;
        };
        this.flipIfEmptyOpenHeap = () => {
            const topOpenCard = cards.find(card => card.state === $sol.constants.CARD_STATE_ON_HEAP && card.isOpen());
            if (!topOpenCard) {
                return this.flipNext();
            }
            return false;
        };
        this.setCounterFn = (fn) => {
            counterFn = fn;
        };
        this.triggerDone = () => {
            const onOpenHeap = cards.filter(card => card.state === $sol.constants.CARD_STATE_ON_HEAP && card.isOpen()).length;
            counterFn([index + 1, onOpenHeap, cash]);
        }
    }

    function Target(_color) {
        const color = _color;
        let heap = [];
        this.serialize = () => {
            return JSON.stringify(heap);
        };
        this.deserialize = (ser) => {
            heap = JSON.parse(ser);
        };
        this.getLast = () => {
            if(heap.length === 0) {
                return null;
            }
            return heap[heap.length - 1];
        };
        this.put = (card) => {
            card.zIndex = 100;
            if (heap.length !== 0) {
                card.zIndex = heap[heap.length - 1].zIndex + 1;
            }
            heap.push(card.withState($sol.constants.CARD_STATE_ON_TARGET).withParent(null));
            cash += 5;
            checkTargetsFullAndAnimate();
            return card;
        };
        this.correctZIndices = () => {
            for (let i = 0; i < heap.length; i++) {
                heap[i].zIndex = 100 + i;
                if(heap[i].updateLayout) { // otherwise deserialized
                    heap[i].updateLayout();
                }

            }
        };
        this.checkDone = () => {
            return heap.length === 13;
        };
        this.remove = () => {
            const result = heap.pop();
            if (result) {
                cash -= 5;
            }
            return result;
        };
        this.canPut = (card) => {
            return card.color === color &&
                ((heap.length === 0 && card.type === 12)
                    || (heap.length !== 0 && (heap[heap.length - 1].type === card.type + 12 || heap[heap.length - 1].type === card.type - 1)));
        }
    }

    function mixCards() {
        const tmpCards = [];

        function rand(arr) {
            let candidate = Math.floor(Math.random() * $sol.constants.NUM_CARDS);
            if (arr.includes(candidate)) {
                return rand(arr);
            }
            arr.push(candidate);
        }

        function toCards(nums) {
            return nums.map(n => {
                return [n % 4, Math.floor(n / 4)];
            })
        }

        function shuffle() {
            const cardIndices = [];
            for (let i = 0; i < $sol.constants.NUM_CARDS; i++) {
                rand(cardIndices);
            }
            return cardIndices;
        }

        toCards(shuffle()).forEach(c => {
            tmpCards.push(new Card(c[0], c[1]));
        });

        return tmpCards;
    }

    function checkTargetsFullAndAnimate() {
        let done = true;
        targets.forEach(target => {
            if(!target.checkDone()) {
                done = false;
            }
        });
        if(done) {
            window.setTimeout(()=> {
                let i = 0;
                const animator = $sol.animator.init();
                heap.traverseCards(card => {
                    window.setTimeout(() => {
                        animator.throwNode(card.getNode());
                    }, i++ * 40);
                });
            }, 500); // Just wait for the proper coords.
        }
    }

    self.findTopLaneCards = () => {
        function doFindLast(nc) {
            let res = nc;
            let candidate;
            while ((candidate = res.getNextAppendingCard()) !== null) {
                res = candidate;
            }
            return res;
        }

        return nullCards.map(nc => {
            return doFindLast(nc);
        });
    };

    self.canPushToTarget = (card, targetIndex) => {
        return targets[targetIndex].canPut(card);
    };

    self.isCardOnTopOfTarget = (card, targetIndex) => {
        return card.equals(targets[targetIndex].getLast());
    };

    self.pushToTarget = (card, targetIndex) => {
        targets[targetIndex].put(card);
        card.updateLayout();
    };

    self.autoFindTarget = (card, fn) => {
        for (let i = 0; i < targets.length; i++) {
            if (self.canPushToTarget(card, i)) {
                fn(card, i);
                return true;
            }
        }
        return false;
    };

    self.autoPushToTarget = (force) => {
		if(autoRunning && !force) {
			return;
		}
		autoRunning = true;
        self.mouseDown(1);
        const success = self.findTopLaneCards().find(card => self.autoFindTarget(card, $sol.ui.doPushToTarget));
        if (success) {
            setTimeout(() => self.autoPushToTarget(true), $sol.constants.AUTO_PLAY_TIMEOUT);
        } else {
			autoRunning = false;
		}
    };

    self.removeCardFromTarget = (card) => {
        const target = targets.find(t => {
            return card.equals(t.getLast());
        });
        if (target) {
            target.remove();
        }
    };

    self.checkAndTurn = () => {
        self.findTopLaneCards().filter(card => {
            return !card.isOpen();
        }).forEach(card => card.flipCard());
    };

    self.actionDone = (t) => {
        $sol.ui.fillOpenThumbs();
        if (!heap.flipIfEmptyOpenHeap()) {
            $sol.ui.actionDone();
        }
        if(typeof t == 'number') {
            targets[t].correctZIndices();
        }
        heap.triggerDone();
        toHistory(heap.takeSnapshot());
    };

    // Records one action. Important for history.
    self.mouseDown = (add) => {
        mouseDownCount += add;
    };

    function toHistory(snapshot) {
        if (history.length > 0 && history[history.length - 1][0] === mouseDownCount) {
            history[history.length - 1] = [mouseDownCount, snapshot];
        } else {
            history.push([mouseDownCount, snapshot]);
        }
    }

    self.historyBack = () => {
        if (history.length > 1) {
            history.pop();
            heap.fromSnapshot(history.pop()[1]).then(() => {
                self.actionDone();
            });
        }
    };

    // Forward references
    self.flipNextHeapCard = null;
    self.traverseCards = null;

    self.newGame = () => {
        mouseDownCount = 0;
        cash -= 52;
        let i, j;
        targets = [];
        history = [];
        nullCards = [];
        for (i = 0; i < 4; i++) {
            targets.push(new Target(i));
        }
        heap.traverseCards(card => {
            $sol.ui.removeFromStage(card.getNode());
        });
        heap.init(mixCards());
        const tmpOpenCards = [];
        for (i = 0; i < $sol.constants.NUM_LANES; i++) {
            nullCards.push(new Card(null, null).withProps(i, -1).createNode(true));
            for (j = 0; j <= i; j++) {
                tmpOpenCards.push(heap.nextCard()
                    .withProps(i, j, i === j)
                    .withState($sol.constants.CARD_STATE_ON_FIELD)
                    .withParent(heap.findCard(i, j - 1) || nullCards[i]));
            }
        }
        tmpOpenCards.sort((a, b) => {
            return b.x - a.x;
        }).sort((a, b) => {
            return a.y - b.y;
        });
        new Promise((resolve) => {
            let i = 0;
            const interval = window.setInterval(() => {
                tmpOpenCards[i].createNode();
                if (++i === tmpOpenCards.length) {
                    window.clearInterval(interval);
                    resolve();
                }
            }, 50);
        }).then(() => {
            heap.createNodes();
            heap.flipNext();
        });
    };

    self.init = (counterFn) => {
        heap = new Heap();
        heap.setCounterFn(counterFn);
        self.traverseCards = heap.traverseCards;
        self.flipNextHeapCard = heap.flipNext;
        self.newGame();
    };

    self.Card = Card;

})(window.$sol.game = window.$sol.game || {});
