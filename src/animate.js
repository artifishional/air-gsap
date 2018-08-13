import {Schema} from "air-schema"
import {TimelineMax, TweenMax} from "gsap/all"
import {stream} from "air-stream"

const {performance} = window;

function setprops(node, props) {
    if(props.hasOwnProperty("class")) {
        if(props.class[0] === "!") {
            node.classList.remove(props.class.substr(1));
        }
        else {
            node.classList.add(props.class);
        }
    }
    if(props.hasOwnProperty("attribute")) {
        for(let key in props.attribute) {
            node.setAttribute(key, props.attribute[key]);
        }
    }
}

/**
 * @param {Object} gr
 * @param {Object} frames
 * [ "frames", [ "frame-name", { query: "", duration: (ms) }
 *      [ 0 (%), { x: 100 (px), y: 100 (px) } ], (optional)
 *      [ 20 (%), { x: 100 (px), y: 200 (px) } ],
 *      [ 100 (%), { x: 200 (px), y: 100 (px) } ],
 * ]]
 * @param {String} key
 */

export default (view, frames/*, key*/) =>
    stream((emt, {sweep, hook}) => {

        emt.kf();

        const _cache = [];
        const _schema = new Schema(frames);

        sweep.add(() => _cache.map(([_, tl]) => tl.kill()));
        hook.add(({
            action: schema,
            env: {time = performance.now(), ttmp = time, state = "play"} = {}
        }) => {

            if(!schema) return;

            const inSchema = _schema.find(schema[0]);
            if (inSchema) {
                const from = (time - ttmp) / 1000;
                const [name, {duration = -1, delay = 0, query, ...gprops }, ...keys] = inSchema.merge(schema).toJSON();
                const gr = view.query(query);
                if(!gr) return emt({action: `${schema[0]}-complete`});

                const existIndex = _cache.findIndex(([x]) => name === x);
                if (existIndex > -1) {
                    _cache[existIndex][1].kill();
                    _cache.splice(existIndex, 1);
                }
                if(duration === -1) {
                    if (state === "play") {
                        if(from < 0) {
                            const tl = new TweenMax({v: 100}, 1e-10, {
                                delay: delay + (from < 0 ? -from : 0),
                                onComplete: () => setprops( gr, gprops )
                            } );
                            tl.restart(true);
                            _cache.push([name, tl]);
                        }
                        else {
                            setprops( gr, gprops );
                        }
                    }
                }
                else {
                    const startAt = keys[0] && keys[0][0] === 0 ? keys.shift()[1] : {};
                    if (state === "play") {
                        const tl = new TimelineMax({
                            paused: true,
                            delay: delay + (from < 0 ? -from : 0),
                            tweens: keys
                                .map(([to, props], i, arr) => [to - (arr[i - 1] ? arr[i - 1][0] : 0) / 100, props])
                                .map(([range, props]) => {
                                    return new TweenMax(gr, duration / range * 100, {startAt, ...gprops, ...props})
                                }),
                            align: "sequence",
                            onComplete: () => emt({action: `${name}-complete`})
                        });
                        from < 0 ? tl.restart(true) : tl.play(from, false);
                        _cache.push([name, tl]);
                    }
                }
            }
            else {
                //todo need timer
                return emt({action: `${schema[0]}-complete`});
            }

        });
    });