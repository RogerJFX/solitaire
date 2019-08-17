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

    self.getType = (card) => {
        const result = [];
        switch (card.color) {
            case 0:
                result[0] = 'Karo';
                break;
            case 1:
                result[0] = 'Kreuz';
                break;
            case 2:
                result[0] = 'Herz';
                break;
            case 3:
                result[0] = 'Pik';
                break;
        }

        result[1] = TYPES[card.type];

        return result;
    };

})($sol.constants = $sol.constants || {});