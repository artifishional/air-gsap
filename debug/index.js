import { animate } from "../src/index"


const stream = animate( [ document.body ], [{
    name: "default",
    prop: (data) => ({ duration: 5 }),
    keys: [
        { offset: 0, prop: (data) => ({ color: `rgb(${data.colorRED},255,0)` }) },
        { offset: 0.5, prop: (data) => ({ color: `rgb(${data.colorRED},654,0)` }) },
        { offset: 1, prop: (data) => ({ color: `rgb(${data.colorRED},0,0)` }) },
    ] }]
);




const connector = stream.on( ({ action }) => {
    console.log(action, "complete");
} );

connector( [ { colorRED: 255 }, { action: "default" } ] );


setTimeout(() => {

    connector( [ { colorRED: 255 }, { action: "default" } ] );

}, 5000);


connector();