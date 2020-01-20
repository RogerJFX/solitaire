window.$sol = window.$sol || {};
(function Animator(self) {
    const $sol = window.$sol;
    const nodes = [];
    let windowWidth, windowHeight, stageTop, stageLeft;
    let interval;

    function Animated(node, sx, sy) {
        let x = node.offsetLeft;
        let y = node.offsetTop;
        this.update = () => {
            x += sx;
            y += sy;
            if(x < -stageLeft -  $sol.constants.CARD_WIDTH - 10 || x > windowWidth - stageLeft + 10) {
                node.style.left = '-1000px';
                node.style.top = '-1000px';
                return false;
            }
            if(y > windowHeight - $sol.constants.CARD_HEIGHT + stageTop) {
                y = windowHeight - $sol.constants.CARD_HEIGHT + stageTop;
                sy *= -.89;
            }
            sy += .98;
            node.style.left = Math.floor(x) + 'px';
            node.style.top = Math.floor(y) + 'px';
            return true;
        }
    }

    function xRand() {
        const minus = Math.random() > .5 ? 1 : -1;
        const c = 3;
        const f = 6;
        return Math.floor((c + Math.random() * f) * minus);
    }

    self.throwNode = (node) => {
        nodes.push(new Animated(node, xRand(), Math.random() * -18 ));
        if(!interval) {
            document.body.style.overflow = 'hidden';
            interval = window.setInterval(() => {
                nodes.forEach(node => {
                    if(!node.update()) {
                        const index = nodes.indexOf(node);
                        nodes.splice(index, 1);
                    }
                });
                if(nodes.length === 0) {
                    window.clearInterval(interval);
                    interval = null;
                    document.body.style.overflow = 'auto';
                }
            }, 33);
        }
    };

    self.init = () => {
        stageTop = document.getElementById('backstage').offsetTop;
        stageLeft = document.getElementById('backstage').offsetLeft;
        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;
        return self;
    }

})(window.$sol.animator = window.$sol.animator || {});
