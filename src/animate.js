import {Schema} from "air-schema"
import {TimelineMax, TweenMax} from "gsap/all"
import {Observable} from "air-stream"
const {performance} = window;

export default class Animate extends Observable {

    /**
     * @param {Object} gr
     * @param {Object} frames
     * [ "frames", [ "frame-name", { duration: (ms) }
     *      [ 0 (%), { x: 100 (px), y: 100 (px) } ], (optional)
     *      [ 20 (%), { x: 100 (px), y: 200 (px) } ],
     *      [ 100 (%), { x: 200 (px), y: 100 (px) } ],
     * ]]
     */
    constructor(gr, frames) {
        super(emt => {

            emt.kf();

            const _cache = [];
            const _schema = new Schema(frames);

            return ({
                dissolve = false,
                action: schema,
                env: {time = performance.now(), ttmp = time, state = "play"} = {}
            }) => {
                if (dissolve) {
                    _cache.map(([_, tl]) => tl.kill());
                }
                else {
                    const inSchema = _schema.find(schema[0]);
                    if (inSchema) {
                        const from = (time - ttmp) / 1000;
                        const [name, {duration, delay = 0}, ...keys] = inSchema.merge(schema).toJSON();
                        const startAt = keys[0] && keys[0][0] === 0 ? keys.shift()[1] : {};
                        const existIndex = _cache.findIndex(([x]) => name === x);
                        if (existIndex > -1) {
                            _cache[existIndex][1].kill();
                            _cache.splice(existIndex, 1);
                        }
                        if (state === "play") {
                            const tl = new TimelineMax({
                                delay: delay + (from < 0 ? -from : 0),
                                tweens: keys
                                    .map(([to, props], i, arr) => [to - (arr[i - 1] ? arr[i - 1][0] : 0) / 100, props])
                                    .map(([range, props]) => new TweenMax(gr, duration / range * 100, {startAt, ...props})),
                                align: "sequence",
                                onComplete: () => emt({action: `${name}-complete`})
                            });
                            from < 0 ? tl.restart(true) : tl.seek(from, false);
                            _cache.push([name, tl]);
                        }

                    }
                    else {
                        //todo need timer
                        emt({action: `${schema[0]}-complete`});
                    }
                }
            }
        });
    }

}