import axios from 'axios';

const drawImgCache = {};

export default class Drawer {

    private canvas = document.createElement('canvas');
    private ctx!: CanvasRenderingContext2D | null;

    constructor(w, h) {
        this.canvas.width = w;
        this.canvas.height = h;
        this.ctx = this.canvas.getContext('2d');
    }

    public init(w, h) {
        this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvas.width = w;
        this.canvas.height = h;
    }

    public clear(x, y, w, h, options) {
        const innerOptions = Object.assign({
            rotate: 0,
            fillColor: null
        }, options);
        if (innerOptions.rotate) {
            this.ctx?.save();
            const rotate = innerOptions.rotate * Math.PI / 180;
            this.ctx?.translate(x, y);
            this.ctx?.rotate(rotate);
            this.ctx?.clearRect(0, 0, w, h);
            if (innerOptions.fillColor) {
                if (this.ctx) {
                    this.ctx.fillStyle = innerOptions.fillColor;
                }
                this.ctx?.fillRect(0, 0, w, h);
            }
            this.ctx?.translate(-x, -y);
            this.ctx?.restore();
        } else {
            this.ctx?.clearRect(x, y, w, h);
            if (innerOptions.fillColor) {
                if (this.ctx) {
                    this.ctx.fillStyle = innerOptions.fillColor;
                }
                this.ctx?.fillRect(x, y, w, h);
            }
        }
    }

    public fillBg(color) {
        this.ctx?.save();
        if (this.ctx) {
            this.ctx.fillStyle = color;
        }
        this.ctx?.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx?.fill();
        this.ctx?.restore();
    }

    public getImg(source) {
        return new Promise((resolve, reject)=> {
            let img = new Image();
            img.onload = ()=> resolve(img);
            img.onerror = ()=> reject('getImg err');
            this.getImgUrl(source)
                .then((url: any)=> {
                    if(url.indexOf('http') >= 0) {
                        img.crossOrigin = '';
                    }
                    img.src = url;
                })
                .catch(err=> reject(err));
        });
    }

    public getImgUrl(source = '') {
        return new Promise((resolve, reject)=> {
            if (source.indexOf('data:image/') >= 0) {
                resolve(source);
            } else if(drawImgCache[source]) {
                console.log('从缓存获取图片');
                resolve(drawImgCache[source]);
            } else {
                axios.get(source, {responseType: 'blob'})
                    .then(data=> {
                        console.log(data);
                        let reader = new FileReader();
                        reader.onload = (e: any)=> {
                            drawImgCache[source] = e.currentTarget.result;
                            resolve(e.currentTarget.result);
                        };
                        reader.onerror = (e)=> reject(e);
                        reader.readAsDataURL(data.data);
                    })
                    .catch(err=> reject(err));
            }
        });
    }

    public drawImg(source, x = 0, y = 0, w = -1, h = -1, options: {
        isCircle?: boolean,
        rotate?: number,
        fit?: string,
        position?: string
    } = {}) {
        return new Promise((resolve, reject)=> {
            const innerOptions = Object.assign({
                isCircle: false,
                rotate: 0,
                fit: '',
                position: 'top-left'
            }, options);
            this.getImg(source)
                .then((img: any)=> {
                    const sw = img.width;
                    const sh = img.height;
                    if (w === -1) {
                        w = sw;
                    }
                    if (h === -1) {
                        h = sh;
                    }
                    const offset = {
                        x: 0,
                        y: 0,
                        w,
                        h
                    };
                    let clip = false;
                    if (innerOptions.fit === 'cover') {
                        const scale = Math.max(w / sw, h / sh);
                        offset.w = sw * scale;
                        offset.h = sh * scale;
                        const cx = -(offset.w - w) / 2;
                        const cy = -(offset.h - h) / 2;
                        switch(innerOptions.position) {
                        case 'top-left':
                            offset.x = 0;
                            offset.y = 0;
                            break;
                        case 'top-center':
                            offset.x = cx;
                            offset.y = 0;
                            break;
                        case 'top-right':
                            offset.x = cx * 2;
                            offset.y = 0;
                            break;
                        case 'center-left':
                            offset.x = 0;
                            offset.y = cy;
                            break;
                        case 'center-center':
                            offset.x = cx;
                            offset.y = cy;
                            break;
                        case 'center-right':
                            offset.x = cx * 2;
                            offset.y = cy;
                            break;
                        case 'bottom-left':
                            offset.x = 0;
                            offset.y = cy * 2;
                            break;
                        case 'bottom-center':
                            offset.x = cx;
                            offset.y = cy * 2;
                            break;
                        case 'bottom-right':
                            offset.x = cx * 2;
                            offset.y = cy * 2;
                            break;
                        }
                        if (scale !== 1) {
                            clip = true;
                        }
                    }
                    if (innerOptions.isCircle) {
                        this.ctx?.save();
                        this.ctx?.beginPath();
                        this.ctx?.arc(x + w / 2, y + w / 2, w / 2, 0, 2 * Math.PI, false);
                        this.ctx?.clip();
                        this.ctx?.drawImage(img, x, y, w, w);
                        this.ctx?.closePath();
                        this.ctx?.restore();
                    } else {
                        if (innerOptions.rotate) {
                            this.ctx?.save();
                            const rotate = innerOptions.rotate * Math.PI / 180;
                            this.ctx?.translate(x, y);
                            this.ctx?.rotate(rotate);
                            if (clip) {
                                this.ctx?.rect(0, 0, w, h);
                                this.ctx?.clip();
                            }
                            this.ctx?.drawImage(img, offset.x, offset.y, offset.w, offset.h);
                            this.ctx?.translate(-x, -y);
                            this.ctx?.restore();
                        } else {
                            if (clip) {
                                this.ctx?.save();
                                this.ctx?.rect(x, y, w, h);
                                this.ctx?.clip();
                            }
                            this.ctx?.drawImage(img, x + offset.x, y + offset.y, offset.w, offset.h);
                            if (clip) {
                                this.ctx?.restore();
                            }
                        }
                    }
                    resolve(this);
                })
                .catch(e=> {
                    console.log(e);
                    resolve(this);
                });
        });
    }

    public drawCircle(x, y, r, color) {
        return new Promise((resolve, reject)=> {
            this.ctx?.save();
            this.ctx?.beginPath();
            this.ctx?.arc(x + r, y + r, r, 0, 2 * Math.PI, false);
            if (this.ctx) {
                this.ctx.fillStyle = color;
            }
            this.ctx?.fill();
            this.ctx?.closePath();
            this.ctx?.restore();
            resolve(this);
        });
    }

    public drawText(text, x, y, options: {
        fontWeight?: 'normal' | 'bold',
        fontSize?: number,
        fontFamily?: string,
        color?: string,
        center?: boolean,
        rotate?: number,
        maxLine?: number,
        maxWidth?: number,
        lineSpace?: number
    } = {}) {
        if (text === undefined) {
            text = '';
        }
        return new Promise((resolve, reject)=> {
            const innerOptions = Object.assign({
                fontWeight: 'normal',
                fontSize: 28,
                fontFamily: 'Avenir, Helvetica, Arial, sans-serif',
                color: '#000000',
                center: false,
                rotate: 0,
                maxLine: 0,
                maxWidth: 0,
                lineSpace: 0
            }, options);
            this.ctx?.save();
            this.ctx?.beginPath();
            if (this.ctx) {
                this.ctx.font = `${innerOptions.fontWeight} ${innerOptions.fontSize}px ${innerOptions.fontFamily}`;
                this.ctx.fillStyle = innerOptions.color;
                this.ctx.textBaseline = 'top';
            }
            let dText: any = `${text}`.split('');
            let textList: string[] = [];
            let textWidth = this.ctx?.measureText(dText.join('')).width || 0;
            if (innerOptions.maxWidth > 0 && textWidth > innerOptions.maxWidth) {
                let line = 0;
                // 自动换行处理
                while (dText.length > 0) {
                    line++;
                    let world = dText.shift() || '';
                    while((this.ctx?.measureText(world).width || 0) < innerOptions.maxWidth) {
                        if (dText.length === 0) {
                            break;
                        }
                        const w = dText.shift();
                        if ((this.ctx?.measureText(world + w).width || 0) > innerOptions.maxWidth) {
                            dText.unshift(w);
                            break;
                        }
                        world += w;
                    }
                    textList.push(world);
                    // 如果设置了最多行数，则可以提前跳出
                    if (innerOptions.maxLine > 0 && line > innerOptions.maxLine) {
                        return;
                    }
                }
                dText = dText.join('');
                if(dText.length > 0) {
                    // 说明还有剩下，取出最后一行来加省略号
                    dText = textList.pop();
                    const ellipsis = '...';
                    const eWidth = this.ctx?.measureText(ellipsis).width || 0;
                    while(eWidth <= innerOptions.maxWidth) {
                        dText = dText.slice(0, -1);
                        if (dText === '' || (((this.ctx?.measureText(dText).width || 0) + eWidth) <= innerOptions.maxWidth)) {
                            break;
                        }
                    }
                    textWidth = this.ctx?.measureText(dText).width || 0 + eWidth;
                    dText += ellipsis;
                    textList.push(dText);
                }
            } else {
                textList.push(dText.join(''));
            }
            textWidth = innerOptions.maxWidth || this.ctx?.measureText(textList[0] || '').width || 0;
            if (innerOptions.center) {
                x -= textWidth / 2;
            }
            if (innerOptions.rotate) {
                this.ctx?.save();
                const rotate = innerOptions.rotate * Math.PI / 180;
                if (options.center) {
                    y += -1 * Math.sin(rotate) * textWidth / 2;
                }
                this.ctx?.translate(x, y);
                this.ctx?.rotate(rotate);
                textList.forEach((line, index)=> {
                    this.ctx?.fillText(line, 0, index * innerOptions.fontSize * innerOptions.lineSpace);
                });
                this.ctx?.translate(-x, -y);
                this.ctx?.restore();
            } else {
                textList.forEach((line, index)=> {
                    this.ctx?.fillText(line, x, y + index * innerOptions.fontSize + index * innerOptions.lineSpace);
                });
            }
            this.ctx?.closePath();
            this.ctx?.restore();
            resolve(this);
        });
    }

    public export() {
        return this.canvas.toDataURL('image/png');
    }
}
