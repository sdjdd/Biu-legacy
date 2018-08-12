import BiuBullet from './biu-bullet';

class Biu {
    constructor(obj) {
        //initialize container style
        this.el = document.querySelector(obj.el);
        this.container = document.createElement('div');
        this.container.style.position = 'relative';
        this.container.style.overflow = 'hidden';
        this.container.style.height = '100%';
        this.container.style.width = '100%';
        this.container.style.pointerEvents = 'none';
        this.el.appendChild(this.container);
        this.config = {
            fontSize: '25px',
            opacity: 1,
            speed: 6000,    // * millisecond to complete
            fontFamily: 'SimHei',
        }
        this.bList = [];    //flying danmaku node
        this.prepareList = []; //store danmaku when biu is paused 
        
        
        this.progress = 0;  //play progress

        this.timer = null;
        this.clip = new Map;              //danmaku data
        this.track = {    //flying danmaku track
            roll: new Map,
            top: new Map,
            bottom: new Map,
            rollTop: 0,
            topTop: 0
        }
        this.status = 0;    //1=playing, 2=pause
        this.pausedAt = 0;
    }

    play(t) {
        if (this.status === 1) {
            if (t !== undefined) {
                //switch timeline
                this.progress = Math.round(t / 10) * 10;
            }
            return;
        }
        let fromPause = this.status === 2;
        this.status = 1;
        let biu = this;

        if (fromPause) {
            let dur = Date.now() - biu.pausedAt;
            biu.syncTrack(dur);
            //resume every danmaku node
            this.bList.forEach(function(v){
                v.resume();
            });
        }

        if (t !== undefined) {
            biu.progress = Math.round(t / 10) * 10;
        }
        let f = function(){
            if (biu.progress % 1000 === 0) {
                biu.biu(biu.progress / 1000);
            }
            biu.progress += 10;
        };
        f();
        this.timer = setInterval(f, 10);

        //render and shot prepare danmaku
        if (biu.prepareList.length > 0) {
            biu.prepareList.forEach(function(v){
                biu.render(v);
            });
            biu.prepareList = [];
        }
    }

    biu(second) {
        let biu = this;
        let now = Date.now();
        //delete invisible danmaku node
        let i = 0;
        for (; i < this.bList.length; ++i) {
            if (this.bList[i].state == 1 && now >= this.bList[i].speed + this.bList[i].startTime) {
                biu.container.removeChild(this.bList[i].dom);
            } else {
                break;
            }
        }
        if (i > 0) this.bList.splice(0, i);

        let arr = this.clip.get(second);
        if (arr) biu.render(arr);
    }

    load(obj) {
        let s = obj.time;
        let ms = s % 1000;
        s = Math.floor(s / 1000);
        obj.offset = ms;
        if (this.clip.has(s)) {
            let arr = this.clip.get(s);
            //TODO:用二分查找优化
            for (let i = 0; i < arr.length; ++i) {
                if (arr[i].offset > obj.offset) {
                    arr.splice(i, 0, obj);
                    return;
                }
            }
            arr.push(obj);
        } else {
            this.clip.set(s, [obj])
        }
    }

    render(danmakus) {
        for (let i = 0; i < danmakus.length; ++i) {
            let node = danmakus[i];
            let dom = createBiuDom.call(this);
            dom.innerText = node.text;
            if (node.color) dom.style.color = node.color; //=node.style.color
            if (typeof node.style === 'object') {
                Object.keys(node.style).forEach(function(v){
                    dom.style[v] = node.style[v];
                });
            }
            switch (node.type) {
                case 2:
                    renderTopBullet.call(this, dom, node);
                    break;
                case 1:
                    break;
                default:
                    renderRollBullet.call(this, dom, node);
            }      
        }
    }

    shot(obj) {
        obj.offset = 0;
        if (this.status === 1) {
            this.render(obj).shot();
        } else {
            this.prepareList.push(obj);
        }
    }

    pause() {
        if (this.status === 2) return;
        this.status = 2;
        this.pausedAt = Date.now();
        clearInterval(this.timer);
        this.bList.forEach(function(v){
            v.pause()
        });
    }

    syncTrack(t) {
        this.track.roll.forEach(function(v){
            v.appear += t;
            v.finish += t;
        });
        this.track.top.forEach(function(v){
            v.finish += t;
        });
    }
}


function createBiuDom() {
    let dom = document.createElement('div');
    dom.style.position = 'absolute';
    dom.style.whiteSpace = 'pre';
    dom.style.display = 'inline-block';
    dom.style.userSelect = 'none';
    dom.style.webkitUserSelect = 'none';
    dom.style.pointerEvents = 'none';
    dom.style.color = '#fff';
    dom.style.fontSize = this.config.fontSize;
    dom.style.fontFamily = this.config.fontFamily;
    dom.style.fontWeight = 'bold';
    dom.style.opacity = this.config.opacity;
    dom.style.textShadow = '0 0 1px #000, 0 0 1px #000, 0 0 1px #000';
    return dom;
}

function renderRollBullet(dom, node) {
    let now = Date.now();
    dom.style.left = this.container.clientWidth + 1 + 'px'; //1 is shadow width
    dom.style.willChange = "transform";
    this.container.appendChild(dom);
    let bullet = new BiuBullet({
        cfgObj: node,
        dom: dom,
        speed: this.config.speed,
    });
    bullet.distination = this.container.clientWidth + dom.offsetWidth + 2 * 1;//1 is shadow width
    let pxSpeed = bullet.distination / bullet.speed;
    let finish = now + bullet.speed + node.offset;
    let touchLeft = (bullet.distination - dom.offsetWidth - 1) / pxSpeed + now + node.offset;//1 is shadow width
    let appear = dom.offsetWidth / pxSpeed + now + node.offset;
    let perfect = false;
    let top = 0;
    let track = this.track.roll;
    while (top <= this.container.clientHeight - dom.offsetHeight) {
        if (!track.has(top) || (now + node.offset > track.get(top).appear && track.get(top).finish < touchLeft)) {
            perfect = true;
            break;
        }
        top += dom.offsetHeight;
    }
    if (!perfect) {
        if (this.track.rollTop >= this.container.clientHeight - dom.offsetHeight) {
            this.track.rollTop = 0;
        }
        top = this.track.rollTop;
        this.track.rollTop += dom.offsetHeight;
    }

    dom.style.top = top + 'px';
    bullet.startTime = now + node.offset;
    track.set(top, {
        appear: appear,
        finish: finish
    });
    this.bList.push(bullet);
    bullet.shot();
}

function renderTopBullet(dom, node) {
    let now = Date.now();
    dom.style.left = this.container.clientWidth + 1 + 'px'; //1 is shadow width
    //dom.style.willChange = "opacity";
    this.container.appendChild(dom);
    let bullet = new BiuBullet({
        cfgObj: node,
        dom: dom,
        speed: this.config.speed,
    });
    bullet.distination = (this.container.clientWidth + dom.offsetWidth) / 2 + 1;//1 is shadow width
    let finish = now + bullet.speed + node.offset;
    let perfect = false;
    let top = 0;
    let track = this.track.top;
    while (top <= this.container.clientHeight - dom.offsetHeight) {
        if (!track.has(top) || now + node.offset > track.get(top).finish) {
            perfect = true;
            break;
        }
        top += dom.offsetHeight;
    }
    if (!perfect) {
        if (this.track.topTop >= this.container.clientHeight - dom.offsetHeight) {
            this.track.topTop = 0;
        }
        top = this.track.topTop;
        this.track.topTop += dom.offsetHeight;
    }
    dom.style.top = top + 'px';
    bullet.startTime = now + node.offset;
    track.set(top, {
        finish: finish
    });
    this.bList.push(bullet);
    bullet.shot();
}

export default Biu;
