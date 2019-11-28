$sol = window.$sol || {};
(function Robot(self) {

    function cardEquals(c1, c2) {
        return c1.x === c2.x && c1.y === c2.y && c1.state === c2.state && c1.open === c2.open;
    }

    function Situation(_cards, _parent, _heap, _fn) {
        this.cards = _cards.map(card => serialize(card));
        this.parent = _parent;
        this.fn = _fn;
        this.children = [];
        this.pushChildSituation = (cards) => {
            const candidate = new Situation(cards, this);
            if (!this.equals(candidate) && !this.findEqualParent(this)) {
                this.children.push(candidate);
            }
        };
        // To prevent endless loops/recursion
        this.findEqualParent = s => {
            const situation = s || this;
            if (this.parent) {
                if (situation.equals(this.parent)) {
                    return true;
                }
                return this.parent.findEqualParent(this);
            }
            return false;
        };
        this.equals = (other) => {
            const otherCards = other.cards;
            for (let i = 0; i < this.cards.length; i++) {
                if (!cardEquals(this.cards[i], otherCards[i])) {
                    return false;
                }
            }
            return true;
        };
        function serialize(card) {
            return {
                card: card,
                x: card.x,
                y: card.y,
                state: card.state,
                open: card.isOpen()
            }
        }
    }

    function findPossibleMoves() {
        const possibleMoveFns = [];
        const openCards = currSituation.cards.filter(card => card.open === true);
        const cardsOnTarget = openCards
            .filter(card => card.state === $sol.constants.CARD_STATE_ON_TARGET)
            .filter(card => {
                for (let i = 0; i < 4; i++) {
                    if ($sol.game.isCardOnTopOfTarget(card.card, i)) {
                        return true;
                    }
                }
                return false;
            });

        const cardOpenOnHeap = openCards.filter(card => card.state === $sol.constants.CARD_STATE_ON_HEAP && card.open === true);
        const lastOpenOnHeap = cardOpenOnHeap.length === 0 ? null : cardOpenOnHeap[0];

        // push to target?
        const targetCandidates = $sol.game.findTopLaneCards();
        if (lastOpenOnHeap) {
            targetCandidates.push(lastOpenOnHeap.card);
        }
        targetCandidates.forEach(card => {
            $sol.game.autoFindTarget(card, (c, i) => {
                possibleMoveFns.push(() => {
                    $sol.game.pushToTarget(c, i);
                    $sol.game.checkAndTurn(true);
                });
                console.log(`can push ${$sol.test.getType(c)} to target ${i}`);
            })
        });

        // remove from target?
        const topLaneCards = $sol.game.findTopLaneCards();
        cardsOnTarget.forEach(card => {
            topLaneCards.forEach(tlCard => {
                if (tlCard.canAppend(card.card)) {
                    possibleMoveFns.push(() => {
                        $sol.game.removeCardFromTarget(card.card);
                        tlCard.appendCard(card.card);
                        tlCard.correctLaneCoords();
                    });
                    console.log('can remove from target');
                }
            })
        });

        // normal moves in field?
        const cardsOnField = openCards.filter(card => card.state === $sol.constants.CARD_STATE_ON_FIELD);
        if (lastOpenOnHeap) {
            cardsOnField.push(lastOpenOnHeap);
        }
        cardsOnField.forEach(card => {
            topLaneCards.forEach(tlCard => {
                if (!card.card.equals(card.card.getParentCard()) && tlCard.canAppend(card.card)) {
                    possibleMoveFns.push(() => {
                        tlCard.appendCard(card.card);
                        tlCard.correctLaneCoords();
                        $sol.game.checkAndTurn(true);
                    });
                    console.log(`can move ${$sol.test.getType(card.card)} to ${$sol.test.getType(tlCard)} in field`);
                }
            })
        });
        possibleMoveFns.push(flipNext);
        return possibleMoveFns;
    }

    function flipNext() {
        $sol.game.flipNextHeapCard(true);
    }

    let rootSituation;
    let currSituation;

    self.init = _ => {
        rootSituation = null;
        currSituation = null;
    };

    self.record = (cards, parent) => {
        currSituation = new Situation(cards, parent);
        parent ? parent.pushChildSituation(cards) : rootSituation = currSituation;
    };

    self.getCurrSituation = _ => currSituation;

    self.next = () => {
        console.log(currSituation, findPossibleMoves());
    }
})($sol.robot = $sol.robot || {});