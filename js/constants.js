$sol = window.$sol || {};
(function Constants(self) {

    self.CARD_GRAPHIC_OFFSET = -8;
    self.CARD_WIDTH = 114.2;
    self.CARD_HEIGHT = 160;

    self.NUM_LANES = 7;
    self.LANE_WIDTH = 120;
    self.CARD_TOP_OFFSET = 35;
    self.LANES_TOP = 166;

    self.NUM_CARDS = 52;

    self.KREUZ = 2;
    self.PIK = 4;
    self.HERZ = 3;
    self.KARO = 1;

    self.CARD_STATE_ON_HEAP = 1;
    self.CARD_STATE_ON_TARGET = 2;
    self.CARD_STATE_ON_FIELD = 4;

    self.DOUBLE_CLICK_TIMEOUT = 1000;

    // Just for some logging.
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

    self.getType = (card) => {
        return [COLORS[card.color], TYPES[card.type]];
    };

    function colorFromCard(c) {
        COLORS.indexOf(c[0]);
    }

    self.fromTestDeck = () => {
        return TEST_DECK.map(c => {
            return new $sol.game.Card(COLORS.indexOf(c[0]),TYPES.indexOf(c[1]));
        })
    }

})($sol.constants = $sol.constants || {});