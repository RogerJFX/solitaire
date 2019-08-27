$sol = window.$sol || {};
(function Constants(self) {

    self.CARD_GRAPHIC_OFFSET = -8;
    self.CARD_WIDTH = 114.2;
    self.CARD_HEIGHT = 160;

    self.NUM_LANES = 7;
    self.LANE_WIDTH = 120;
    self.CARD_TOP_OFFSET = 32;
    self.LANES_TOP = 166;

    self.NUM_CARDS = 52;

    self.KREUZ = 2;
    self.PIK = 4;
    self.HERZ = 3;
    self.KARO = 1;

    self.CARD_STATE_ON_HEAP = 1;
    self.CARD_STATE_ON_TARGET = 2;
    self.CARD_STATE_ON_FIELD = 4;

    self.DOUBLE_CLICK_TIMEOUT = 500;


})($sol.constants = $sol.constants || {});