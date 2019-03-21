import {TimelineMax, TweenMax} from "gsap/all"
import * as Ease from "gsap/all"
import {stream} from "air-stream"

export default (view, frames) =>

    stream((emt, {sweep, hook}) => {

        const _cache = [];

        sweep.add(() => _cache.map(([_, tl]) => tl.kill()));


        hook.add(([ data, { action = "default" } = {} ]) => {

            frames.find( ( { name } ) => name === action );

        });

    });


    function parseEase(string) {
        const easing = string.split(".");
        if (easing.length === 2) return Ease[easing[0]][easing[1]];
        const cfgExp = /true|false|(-?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/ig;
        const config = string.match(cfgExp).map(JSON.parse);
        return Ease[easing[0]][easing[1]].config.apply(null, config);
    }