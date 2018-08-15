class BiuTrack {
    /**
     * Create a danmaku track
     * @param {number} type type of track. 0=roll, 1=top, 2=bottom
     */
    constructor() {
        this.track = [];
        this.topWhenFull = 0;
    }

    sync(t) {
        this.track.forEach(v => {
            if (v.appear) {
                v.appear += t;
            }
            v.finish += t;
        });
    }

    clear() {
        this.track.splice(0, this.track.length);
        this.topWhenFull = 0;
    }

    roll(timestamp, cch, appear, touchLeft, finish, height) {
        let track = this.track;
        let top = 0;
        let maxTop = cch - height;
        if (track.length === 0) {
            //initialize track array
            track.push({
                appear: appear,
                finish: finish,
                height: height,
            });
            return 0;
        }
        let need = 0;
        let i, j;
        loop1:
        for (i = 0; i < track.length; ++i) {
            if (timestamp >= track[i].appear && track[i].finish <= touchLeft) {
                need = height - track[i].height;
                if (need > 0) {
                    //this track can not fit current danmaku
                    if (top > maxTop) {
                        break;   
                    }
                    let temp = track[i].height;  //record combined tracks height
                    for (j = i + 1; j < track.length; ++j) {
                        temp += track[j].height;
                        if (timestamp >= track[j].appear && track[j].finish <= touchLeft) {
                            need -= track[j].height;
                            if (need === 0) {
                                track.splice(i + 1, j - i);
                                track[i].appear = appear;
                                track[i].finish = finish;
                                track[i].height = height;
                                return top;
                            } else {
                                track.splice(i + 1, j - i - 1);
                                track[i].appear = appear;
                                track[i].finish = finish;
                                track[i].height = height;
                                track[i + 1].height = -need;
                                return top;
                            }
                        } else {
                            i = j;
                            top += temp;
                            continue loop1;
                        }
                    }
                    //not enough
                    track.splice(i + 1, j - i);
                    track[i].appear = appear;
                    track[i].finish = finish;
                    track[i].height = height;
                    return top;
                } else {
                    let free = -need;
                    if (free > 0) {
                        //have free space
                        track.splice(i, 0, {
                            appear: appear,
                            finish: finish,
                            height: track[i].height - free,
                        });
                        track[i + 1].height = free;
                        return top;
                    } else {
                        //perfect!
                        track[i].appear = appear;
                        track[i].finish = finish;                    
                        return top;
                    }
                }
            }
            top += track[i].height;
        }
        //no suitable track
        if (top <= maxTop) {
            track.push({
                appear: appear,
                finish: finish,
                height: height,
            });
            return top;
        } else {
            if (this.topWhenFull > maxTop) {
                this.topWhenFull = 0;
            }
            top = this.topWhenFull;
            this.topWhenFull += height;
            return top;
        }
    }

    top(timestamp, cch, finish, height) {
        let track = this.track;
        let top = 0;
        let maxTop = cch - height;
        if (track.length === 0) {
            //initialize track array
            track.push({
                finish: finish,
                height: height,
            });
            return 0;
        }
        let need = 0;
        let i, j;
        loop1:
        for (i = 0; i < track.length; ++i) {
            if (track[i].finish <= timestamp) {
                need = height - track[i].height;
                if (need > 0) {
                    //this track can not fit current danmaku
                    if (top > maxTop) {
                        break;   
                    }
                    let temp = track[i].height;
                    for (j = i + 1; j < track.length; ++j) {
                        temp += track[j].height;
                        if (track[j].finish <= timestamp) {
                            need -= track[j].height;
                            if (need === 0) {
                                track.splice(i + 1, j - i);
                                track[i].finish = finish;
                                track[i].height = height;
                                return top;
                            } else {
                                track.splice(i + 1, j - i - 1);
                                track[i].finish = finish;
                                track[i].height = height;
                                track[i + 1].height = -need;
                                return top;
                            }
                        } else {
                            i = j;
                            top += temp;
                            continue loop1;
                        }
                    }
                    //not enough
                    track.splice(i + 1, j - i);
                    track[i].finish = finish;
                    track[i].height = height;
                    return top;
                } else {
                    let free = -need;
                    if (free > 0) {
                        //have free space
                        track.splice(i, 0, {
                            finish: finish,
                            height: track[i].height - free,
                        });
                        track[i + 1].height = free;
                        return top;
                    } else {
                        //perfect!
                        track[i].finish = finish;                    
                        return top;
                    }
                }
            }
            top += track[i].height;
        }
        //no suitable track
        if (top <= maxTop) {
            track.push({
                finish: finish,
                height: height,
            });
            return top;
        } else {
            if (this.topWhenFull > maxTop) {
                this.topWhenFull = 0;
            }
            top = this.topWhenFull;
            this.topWhenFull += height;
            return top;
        }
    }

    bottom(timestamp, cch, finish, height) {
        let top = this.top(timestamp, cch, finish, height);
        return cch - top - height;
    }
}

module.exports = BiuTrack;