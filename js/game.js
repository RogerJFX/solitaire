$sol = window.$sol || {};
(function Game(self) {

    let heap;
    let nullCards = [];
    let targets = [];

    function Card(color, type) {
        const me = this;

        this.color = color;
        this.type = type;

        let open = false;
        this.zIndex = 10;
        let node;
        this.x = null;
        this.y = null;

        let nextCard = null;
        let parentCard = null;

        this.withProps = (_x, _y, _open) => {
            this.x = _x;
            this.y = _y;
            open = _open;
            return me;
        };

        this.withParent = (card) => {
            if(card) {
                if(parentCard) {
                    parentCard.appendCard(null);
                }
                parentCard = card;
                card.appendCard(me);
            }
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
            return (me.type === null && other.type === 11)
                || (me.color % 2 !== other.color % 2 && me.type === other.type + 1);
        };

        this.getNode = () => {
            return node;
        };

        this.appendCard = (_nextCard) => {
            nextCard = _nextCard || null;
            if(nextCard) {
                nextCard.zIndex = this.zIndex + 1;
            }
        };

        this.getNextAppendingCard = () => {
            return nextCard;
        };

        this.isOpen = () => {
            return open;
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

        this.put = (card) => {
            heap.push(card);
        };
        this.remove = () => {
            return heap.pop();
        };
        this.canPut = (card) => {
            return card.color === color &&
                ((heap.length === 0 && card.type === 12)
                    || (heap.length !== 0 && heap[heap.length -1].type === card.type - 1));
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
        return tmpCards;
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

    self.checkAndTurn = () => {
      self.findTopLaneCards().filter(card => {
          return !card.isOpen();
      }).forEach(card => card.flipCard());
    };

    self.init = () => {
        let i, j;
        for(i = 0; i < 4; i++) {
            targets.push(new Target(i));
        }
        heap = new Heap(mixCards());
        for (i = 0; i < $sol.constants.NUM_LANES; i++) {
            nullCards.push(new Card(null, null).withProps(null, -1));
            for(j = 0; j <= i; j++) {
                heap.nextCard()
                    .withProps(i, j, i === j)
                    .withParent(heap.findCard(i, j - 1) || nullCards[i])
                    .createNode();
            }
        }
        heap.createNodes();
        heap.flipNext();
    }

})($sol.game = $sol.game || {});