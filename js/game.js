$sol = window.$sol || {};
(function Game(self) {

    let heap;
    let nullCards = [];
    let targets = [];
    let cash = 0;

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
            if(parentCard) {
                parentCard.appendCard(null);
            }
            if(card) {
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
            if(nextCard) {
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
        }
    }

    function Heap() {
        let cards;
        let counterFn;
        let index;
        this.init = (_cards) => {
            cards = _cards;
            index = cards.length - 1;
        };
        this.takeSnapshot = () => {
            return {
                cards: JSON.parse(JSON.stringify(cards)),
                index: index
            }
        };
        this.nextCard = () => {
            if(index === -1) {
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
            if(index !== -1) {
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
            if(cards) {
                cards.forEach(card => fn(card));
            }
            return cards;
        };
        this.flipIfEmptyOpenHeap = () => {
            const topOpenCard = cards.find(card => card.state === $sol.constants.CARD_STATE_ON_HEAP && card.isOpen());
            if(!topOpenCard) {
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
        const heap = [];
        this.getLast = () => {
            return heap[heap.length - 1];
        };
        this.put = (card) => {
            card.zIndex = 100;
            if(heap.length !== 0) {
                card.zIndex = heap[heap.length-1].zIndex + 1;
            }
            heap.push(card.withState($sol.constants.CARD_STATE_ON_TARGET).withParent(null));
            cash += 5;
            return card;
        };
        this.remove = () => {
            const result = heap.pop();
            if(result) {
                cash -= 5;
            }
            return result;
        };
        this.canPut = (card) => {
            return card.color === color &&
                ((heap.length === 0 && card.type === 12)
                    || (heap.length !== 0 && (heap[heap.length -1].type === card.type + 12 || heap[heap.length -1].type === card.type - 1)));
        }
    }

    function mixCards() {
        const tmpCards = [];
        function rand(arr) {
            let candidate = Math.floor(Math.random() * $sol.constants.NUM_CARDS);
            if(arr.includes(candidate)) {
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
            for(let i = 0; i < $sol.constants.NUM_CARDS; i++) {
                rand(cardIndices);
            }
            return cardIndices;
        }
        toCards(shuffle()).forEach(c => {
            tmpCards.push(new Card(c[0], c[1]));
        });
       // console.log(JSON.stringify(tmpCards));
        return tmpCards;
       // return $sol.test.fromTestDeck();
       // const result = [];
       // const stored = [{"color":1,"type":11,"state":1,"zIndex":10,"x":null,"y":null},{"color":1,"type":4,"state":1,"zIndex":10,"x":null,"y":null},{"color":0,"type":8,"state":1,"zIndex":10,"x":null,"y":null},{"color":3,"type":2,"state":1,"zIndex":10,"x":null,"y":null},{"color":3,"type":4,"state":1,"zIndex":10,"x":null,"y":null},{"color":0,"type":0,"state":1,"zIndex":10,"x":null,"y":null},{"color":0,"type":4,"state":1,"zIndex":10,"x":null,"y":null},{"color":1,"type":12,"state":1,"zIndex":10,"x":null,"y":null},{"color":0,"type":12,"state":1,"zIndex":10,"x":null,"y":null},{"color":3,"type":5,"state":1,"zIndex":10,"x":null,"y":null},{"color":3,"type":9,"state":1,"zIndex":10,"x":null,"y":null},{"color":1,"type":7,"state":1,"zIndex":10,"x":null,"y":null},{"color":3,"type":7,"state":1,"zIndex":10,"x":null,"y":null},{"color":2,"type":3,"state":1,"zIndex":10,"x":null,"y":null},{"color":3,"type":3,"state":1,"zIndex":10,"x":null,"y":null},{"color":0,"type":10,"state":1,"zIndex":10,"x":null,"y":null},{"color":1,"type":8,"state":1,"zIndex":10,"x":null,"y":null},{"color":1,"type":3,"state":1,"zIndex":10,"x":null,"y":null},{"color":2,"type":7,"state":1,"zIndex":10,"x":null,"y":null},{"color":1,"type":6,"state":1,"zIndex":10,"x":null,"y":null},{"color":2,"type":8,"state":1,"zIndex":10,"x":null,"y":null},{"color":2,"type":0,"state":1,"zIndex":10,"x":null,"y":null},{"color":3,"type":8,"state":1,"zIndex":10,"x":null,"y":null},{"color":2,"type":5,"state":1,"zIndex":10,"x":null,"y":null},{"color":2,"type":10,"state":1,"zIndex":10,"x":null,"y":null},{"color":2,"type":2,"state":1,"zIndex":10,"x":null,"y":null},{"color":0,"type":11,"state":1,"zIndex":10,"x":null,"y":null},{"color":0,"type":9,"state":1,"zIndex":10,"x":null,"y":null},{"color":2,"type":9,"state":1,"zIndex":10,"x":null,"y":null},{"color":1,"type":9,"state":1,"zIndex":10,"x":null,"y":null},{"color":3,"type":10,"state":1,"zIndex":10,"x":null,"y":null},{"color":2,"type":12,"state":1,"zIndex":10,"x":null,"y":null},{"color":1,"type":0,"state":1,"zIndex":10,"x":null,"y":null},{"color":2,"type":1,"state":1,"zIndex":10,"x":null,"y":null},{"color":1,"type":1,"state":1,"zIndex":10,"x":null,"y":null},{"color":3,"type":6,"state":1,"zIndex":10,"x":null,"y":null},{"color":2,"type":4,"state":1,"zIndex":10,"x":null,"y":null},{"color":3,"type":12,"state":1,"zIndex":10,"x":null,"y":null},{"color":3,"type":1,"state":1,"zIndex":10,"x":null,"y":null},{"color":2,"type":6,"state":1,"zIndex":10,"x":null,"y":null},{"color":0,"type":6,"state":1,"zIndex":10,"x":null,"y":null},{"color":0,"type":1,"state":1,"zIndex":10,"x":null,"y":null},{"color":2,"type":11,"state":1,"zIndex":10,"x":null,"y":null},{"color":0,"type":2,"state":1,"zIndex":10,"x":null,"y":null},{"color":1,"type":5,"state":1,"zIndex":10,"x":null,"y":null},{"color":0,"type":7,"state":1,"zIndex":10,"x":null,"y":null},{"color":1,"type":10,"state":1,"zIndex":10,"x":null,"y":null},{"color":0,"type":5,"state":1,"zIndex":10,"x":null,"y":null},{"color":0,"type":3,"state":1,"zIndex":10,"x":null,"y":null},{"color":3,"type":11,"state":1,"zIndex":10,"x":null,"y":null},{"color":1,"type":2,"state":1,"zIndex":10,"x":null,"y":null},{"color":3,"type":0,"state":1,"zIndex":10,"x":null,"y":null}];
       // stored.forEach(st => result.push(new Card(st.color, st.type)));
       // return result;
    }

    self.findTopLaneCards = () => {
        function doFindLast(nc) {
            let res = nc;
            let candidate;
            while((candidate = res.getNextAppendingCard()) !== null) {
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
        return targets[targetIndex].getLast() === card;
    };

    self.pushToTarget = (card, targetIndex) => {
        targets[targetIndex].put(card);
        card.updateLayout();
    };

    self.removeCardFromTarget = (card) => {
        const target = targets.find(t => {
            return t.getLast() === card;
        });
        if(target) {
            target.remove();
        }
    };

    self.checkAndTurn = () => {
      self.findTopLaneCards().filter(card => {
          return !card.isOpen();
      }).forEach(card => card.flipCard());
    };

    self.actionDone = () => {
        // TODO: Implement history
         if(!heap.flipIfEmptyOpenHeap()) {
            $sol.ui.actionDone();
         }
         heap.triggerDone();
    };

    // Forward references
    self.flipNextHeapCard = null;
    self.traverseCards = null;

    self.newGame = () => {
        cash -= 52;
        let i, j;
        targets = [];
        nullCards = [];
        for(i = 0; i < 4; i++) {
            targets.push(new Target(i));
        }
        heap.traverseCards(card => {
            $sol.ui.removeFromStage(card.getNode());
        });
        heap.init(mixCards());
        for (i = 0; i < $sol.constants.NUM_LANES; i++) {
            nullCards.push(new Card(null, null).withProps(i, -1).createNode(true));
            for(j = 0; j <= i; j++) {
                heap.nextCard()
                    .withProps(i, j, i === j)
                    .withState($sol.constants.CARD_STATE_ON_FIELD)
                    .withParent(heap.findCard(i, j - 1) || nullCards[i])
                    .createNode();
            }
        }
        heap.createNodes();
        heap.flipNext();

    };

    self.init = (counterFn) => {
        heap = new Heap();
        heap.setCounterFn(counterFn);
        self.traverseCards = heap.traverseCards;
        self.flipNextHeapCard = heap.flipNext;
        self.newGame();
    };

    self.Card = Card;

})($sol.game = $sol.game || {});