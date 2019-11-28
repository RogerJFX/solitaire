$sol = window.$sol || {};
(function Test(self) {
    // Just for some testing.

    const TYPES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'B', 'D', 'K', 'A'];

    const COLORS = ['Karo', 'Kreuz', 'Herz', 'Pik'];

    const TEST_DECK = [
        ['Karo', 'K'],
        ['Karo', 'D'],
        ['Karo', 'B'],
        ['Karo', '10'],
        ['Karo', '9'],
        ['Karo', '8'],
        ['Karo', '7'],
        ['Karo', '6'],
        ['Karo', '5'],
        ['Karo', '4'],
        ['Karo', '3'],
        ['Karo', '2'],
        ['Karo', 'A'],

        ['Herz', 'B'],
        ['Herz', '10'],
        ['Herz', '9'],
        ['Herz', '8'],
        ['Herz', '7'],
        ['Herz', '6'],
        ['Herz', '5'],
        ['Herz', '4'],
        ['Herz', '3'],
        ['Herz', '2'],
        ['Herz', 'A'],
        ['Herz', 'D'],
        ['Herz', 'K'],


        ['Pik', '2'],
        ['Pik', '3'],
        ['Pik', '4'],
        ['Pik', '5'],
        ['Pik', '6'],
        ['Pik', '7'],
        ['Pik', '8'],
        ['Pik', '9'],
        ['Pik', '10'],
        ['Pik', 'B'],
        ['Pik', 'D'],
        ['Pik', 'K'],
        ['Pik', 'A'],

        ['Kreuz', '2'],
        ['Kreuz', '3'],
        ['Kreuz', '4'],
        ['Kreuz', '5'],
        ['Kreuz', '6'],
        ['Kreuz', '7'],
        ['Kreuz', '8'],
        ['Kreuz', '9'],
        ['Kreuz', '10'],
        ['Kreuz', 'B'],
        ['Kreuz', 'D'],
        ['Kreuz', 'K'],
        ['Kreuz', 'A'],

    ];

    // Just for some logging.
    self.getType = (card) => {
        return `${COLORS[card.color]}::${TYPES[card.type]}`;
        // return [COLORS[card.color], TYPES[card.type]];
    };

    self.fromTestDeck = () => {
        return TEST_DECK.map(c => {
            return new $sol.game.Card(COLORS.indexOf(c[0]),TYPES.indexOf(c[1]));
        })
    }


})($sol.test = $sol.test || {});