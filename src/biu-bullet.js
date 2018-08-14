class BiuBullet {
    constructor(obj) {
        this.dom = null;
        this.state = 0;
        this.cfgObj = null;
        this.speed = 0;
        this.startTime = 0;
        this.pausePos = 0;
        this.distination = 0;
        this.passed = 0;
        this.offset = 0;
        this.style = null;

        let bullet = this;
        Object.keys(obj).forEach(function(v){
            bullet[v] = obj[v]
        });
    }

    shot() {
        if (this.state != 0) return;
        this.state = 1;
        if (this.cfgObj.type === 0) {
            this.setTransition('transform', this.speed + 'ms', 'linear', this.offset + 'ms');
        } else if (this.cfgObj.type === 1 || this.cfgObj.type === 2) {
            //this.setTransition('transform', '0s', 'linear', this.cfgObj.offset + 'ms');
            this.dom.style.transition = 'transform 0s linear ' + this.offset + 'ms, opacity 0s linear ' + (this.speed + this.offset) + 'ms';
            this.dom.style.opacity = 0;
        }
        this.dom.style.transform = 'translateX(-' + this.distination + 'px)';
    }

    pause() {
        if (this.state != 1) return;
        this.state = 2;
        let passedTime = Date.now() - this.startTime;
        let passed = 0;
        if (passedTime < 0) {
            this.offset = -passedTime;
        } else {
            this.offset = 0;
            if (this.cfgObj.type === 0) {
                passed = passedTime / this.speed * (this.distination - this.passed);
            }
            this.speed -= passedTime;
        }
        
        if (this.cfgObj.type === 0) {
            this.passed += passed;
            this.setTransition('transform', '0s', 'linear', '0s');
            this.dom.style.transform = 'translateX(-' + this.passed + 'px)';
        } else if (this.cfgObj.type === 1 || this.cfgObj.type === 2) {
            if (passedTime < 0) {
                this.dom.style.transform = '';
            }
            this.dom.style.transition = '';
            this.dom.style.opacity = this.style.opacity;
        }
    }

    resume() {
        if (this.state != 2) return;
        this.state = 1;
        this.startTime = Date.now() + this.offset;
        if (this.cfgObj.type === 0) {
            this.setTransition('transform', this.speed + 'ms', 'linear', this.offset + 'ms');
        } else if (this.cfgObj.type === 1 || this.cfgObj.type === 2) {
            this.dom.style.transition = 'transform 0s linear ' + this.offset + 'ms, opacity 0s linear ' + (this.speed + this.offset) + 'ms';
            this.dom.style.opacity = 0;
        }
        this.dom.style.transform = 'translateX(-' + this.distination + 'px)';
    }

    setTransition(prop, dur, t, delay) {
        this.dom.style.transition = [prop, dur, t, delay].join(' ')
    }

    setTextShadow() {
        /*
        let color = '#000';
        if (this.cfgObj.color) {
            color = this.getShadowColor(this.cfgObj.color);
            if (!color) return;
        } else {
            color = '#000';
        }
        
        this.dom.style.textShadow = [
            '-' + width + 'px 0 1px ' + color,
            width + 'px 0 1px ' + color,
            '0 -' + width + 'px 1px ' + color,
            '0 ' + width + 'px 1px ' + color,
        ].join(',');
        */
        this.dom.style.textShadow = '0 0 1px #000, 0 0 1px #000, 0 0 1px #000';
    }
}

function getShadowColor(cStr) {
    let r, g, b, gray;
    let pRgb = /^rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)$/i;
    if (/^#(([a-z]|\d){3}|([a-z]|\d){6})$/i.test(cStr)) {
        if (cStr.length === 4) {
            r = parseInt('0x' + cStr[1] + cStr[1]);
            g = parseInt('0x' + cStr[2] + cStr[2]);
            b = parseInt('0x' + cStr[3] + cStr[3]);
        } else if (cStr.length === 7) {
            r = parseInt('0x' + cStr.slice(1, 3));
            g = parseInt('0x' + cStr.slice(3, 5));
            b = parseInt('0x' + cStr.slice(5, 7));
        }
    } else if (pRgb.test(cStr)) {
        let arr = pRgb.exec(cStr);
        r = parseInt(arr[1]);
        g = parseInt(arr[2]);
        b = parseInt(arr[3]);
    } else {
        return '#000'; //black text shadow for ilegal color
    }
    gray = (r * 299 + g * 587 + b * 114 + 500) / 1000;
    if (gray > 223) {
        return '#000';
    } else if (gray < 32) {
        return '#fff';
    }
}

module.exports = BiuBullet;