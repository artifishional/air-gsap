import {Schema} from "air-schema"
import {TimelineMax, TweenMax} from "gsap/all"
import * as Ease from "gsap/all"
import {stream} from "air-stream"
import {Howler} from "howler"
import { def, utils } from "air-m2"

const {performance} = window;

function setprops(
    node, {muted = null, argv = null, class: _class, attribute, order, style, sound, ...props} = {},
    {resources, targeting = []} = {},
    intl,
    view = null
) {

    if (order === "tofront" && node.parentNode) {
        node.parentNode.append(node);
    }

    if (_class) {
        _class
            .split(" ")
            .filter(Boolean)
            .map(cls => ({cls: cls[0] === "!" ? cls.substr(1) : cls, toggle: cls[0] !== "!"}))
            .map(({cls, toggle}) => node.classList.toggle(cls, toggle));
    }

    if (muted !== null) {
        Howler.mute(muted);
    }

    if (sound) {
        const {sound: _sound} = resources.find(({type, name}) => name === sound && type === "sound") || {};
        _sound && _sound.play();
    }

    //view && view.setprops(argv, intl);

    if (attribute) {
        for (let key in attribute) {
            node.setAttribute(key, attribute[key]);
        }
    }
    if (style) {
        for (let key in style) {
            node.style[key] = style[key];
        }
    }
    return props;
}

export default (view, { keyframes, targets }, key) =>
    stream((emt, { sweep, hook }) => {

        const intl = {};

        emt.kf();

        const _cache = [];
        //let _schema = new Schema(frames);

        sweep.add(() => _cache.map(([_, tl]) => tl.kill()));
        hook.add(({
            requesterID = 0,
            intl,
            data: [ data, action = "default" ],
            env: { time = performance.now(), ttmp = time, state = "play" } = {}
        } = {}) => {

            let inSchema = keyframes.find( ([ name ]) => action === name );

            if(!inSchema) {
                inSchema = [ action, () => ({ duration: 1e-10 }), [ 1, () => data ] ];
            }

            
            if (data) {

                inSchema = [ inSchema[0], inSchema[1](data), ...inSchema.slice(2).map( ([ offset, fn ]) =>
                    [ offset, fn(data) ]
                ) ];

                //let data = null;

                const [name, {
                    duration = -1,
                    delay = 0,
                    log = false,
                    ...gprops
                }, ...keys] = inSchema;

                log && console.log(ttmp, key, [name, {duration, ...gprops}, ...keys]);
                const from = (time - ttmp) / 1000 - delay;

                const gr = targets;


                //const gr = view.query(query);

                //if (!gr) return emt({action: `${schema[0]}-complete`});


                _cache.map(([_, tl]) => tl.kill());
                _cache.length = 0;

                if (duration === -1) {
                    if (state === "play") {
                        if (from < 0) {
                            const tl = TweenMax.delayedCall(from < 0 ? -from : 0, () => setprops(gr, gprops, view.props, intl, view));
                            _cache.push([name, tl]);
                        } else {
                            setprops(gr, gprops, view.props, intl, view);
                        }
                    }
                } else {

                    if (state === "play") {
                        const tl = new TimelineMax({
                            paused: true,
                            delay: from < 0 ? -from : 0,
                            tweens: [].concat(...keys
                                .map(([to, props], i, arr) => [to - (arr[i - 1] ? arr[i - 1][0] : 0), props])
                                .map(([range, props]) => {

                                    const dur = range ? duration * range : 1e-10;
                                    const {ease = "Power1.easeOut", ...cutprops} =
                                        setprops(document.createElement("div"), {...gprops, ...props}, view.props, intl);

                                    const res = [];

                                    const set = {
                                        ease: parseEase(ease),
                                        ...cutprops,
                                        onComplete: () => setprops(gr, {...gprops, ...props}, view.props, intl, view)
                                    };
                                    
                                    const datasTargets = gr.filter( ({ type }) => type === "data" );

                                    if(datasTargets.length) {
                                        const cutten = utils.copy( props );
                                        res.push(new TweenMax(cutten, dur, {
                                            ...set, ...gprops,
                                            onUpdate: () => {
                                                view.update( cutten, intl );
                                            }
                                        }));
                                    }

                                    const activesTargets = gr.filter( ({ type }) => type === "active" );

                                    if (cutprops.hasOwnProperty("scaleX") &&
                                        activesTargets.length
                                    ) {
                                        res.push(new TweenMax(gr.map(({ node }) => node), dur, {
                                            ...set,
                                            ...cutprops
                                        }));
                                    }

                                    return res;
                                })),
                            align: "sequence",
                            onComplete: () => emt({requesterID, action: `${name}-complete`})
                        });
                        from <= 0 ? tl.restart(true) : tl.play(from, false);
                        _cache.push([name, tl]);
                    }
                }
            } else {
                //todo need timer
                return emt({requesterID, action: `${action}-complete`});
            }

        });
    });

function parseEase(string) {
    const easing = string.split(".");
    if (easing.length === 2) return Ease[easing[0]][easing[1]];
    const cfgExp = /true|false|(-?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/ig;
    const config = string.match(cfgExp).map(JSON.parse);
    return Ease[easing[0]][easing[1]].config.apply(null, config);
}