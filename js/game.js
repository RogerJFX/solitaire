$sol = window.$sol || {};
(function Game(self) {

    let cards = [];

    function Card(color, type) {
        const me = this;

        this.color = color;
        this.type = type;

        let open = false;
        let node;

        let nextCard = null;

        this.canLayDown = () => {

        };

        this.appendCard = (_nextCard) => {
            nextCard = _nextCard || null;
        }
    }

    function mixCards() {
        cards = [];
        function rand(arr) {
            let candidate = Math.floor(Math.random() * $sol.constants.NUM_CARDS);
            if(arr.includes(candidate)) {
                return rand(arr);
            }
            arr.push(candidate);
        }
        function toCards(num) {
            return num.map(n => {
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
            cards.push(new Card(c[0], c[1]));
        });
    }

    self.init = () => {
        mixCards();
        console.log(cards);
    }

})($sol.game = $sol.game || {});