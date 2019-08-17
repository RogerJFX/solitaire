$sol = window.$sol || {};
(function Game(self) {

    let heap;
    let nullCards = [];
    let targets = [];

    function Card(color, type) {
        const me = this;

        this.color = color;
        this.type = type;

        this.state = $sol.constants.CARD_STATE_ON_HEAP;

        let open = false;
        this.zIndex = 10;
        let node;
        this.x = null;
        this.y = null;
        this.onTargetHeap = false;

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

        this.createNode = () => {
            node = $sol.ui.createNode({
                color: me.color,
                type: me.type,
                x: me.x,
                y: me.y,
                open: open,
                visible: !!this.color
            }).setCard(me);
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

    function Heap(_cards) {
        const cards = _cards;
        let index = cards.length - 1;
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
            this.nextCard().flipHeapCard();
        };
        this.findCard = (x, y) => {
            return cards.find(card => {
                return x === card.x && y === card.y
            });
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
            heap.push(card.withState($sol.constants.CARD_STATE_ON_TARGET));
            return card;
        };
        this.remove = () => {
            return heap.pop();
        };
        this.canPut = (card) => {
            return card.color === color &&
                ((heap.length === 0 && card.type === 12)
                    || (heap.length !== 0 && (heap[heap.length -1].type === card.type + 12) || (heap[heap.length -1].type === card.type - 1)));
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
        console.log(JSON.stringify(tmpCards));
        return tmpCards;
        // const stored = [{"color":3,"type":11,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":3,"type":7,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":3,"type":12,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":1,"type":12,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":2,"type":6,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":2,"type":3,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":0,"type":5,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":1,"type":2,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":2,"type":11,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":2,"type":4,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":3,"type":9,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":3,"type":2,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":2,"type":8,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":1,"type":5,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":0,"type":0,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":0,"type":1,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":3,"type":10,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":3,"type":4,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":3,"type":5,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":2,"type":0,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":3,"type":3,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":0,"type":9,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":1,"type":3,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":2,"type":10,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":1,"type":10,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":0,"type":7,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":3,"type":0,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":0,"type":2,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":2,"type":1,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":1,"type":8,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":2,"type":2,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":3,"type":8,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":0,"type":12,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":2,"type":5,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":2,"type":9,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":0,"type":8,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":2,"type":12,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":0,"type":3,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":1,"type":0,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":1,"type":11,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":3,"type":6,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":1,"type":1,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":1,"type":7,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":1,"type":4,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":1,"type":9,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":0,"type":4,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":0,"type":10,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":1,"type":6,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":2,"type":7,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":3,"type":1,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":0,"type":6,"zIndex":10,"x":null,"y":null,"onTargetHeap":false},{"color":0,"type":11,"zIndex":10,"x":null,"y":null,"onTargetHeap":false}];
        // const result = [];
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

    self.init = () => {
        let i, j;
        targets = [];
        for(i = 0; i < 4; i++) {
            targets.push(new Target(i));
        }
        heap = new Heap(mixCards());
        for (i = 0; i < $sol.constants.NUM_LANES; i++) {
            nullCards.push(new Card(null, null).withProps(i, -1));
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
    }

})($sol.game = $sol.game || {});