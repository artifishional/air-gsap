import { animate } from "../src/index"


const stream = animate( [ document.body ], [{
    name: "default",
    prop: (schema) => ({ duration: 5 }),
    keys: [
        { offset: 1, prop: (schema) => ({ color: `rgb(${schema.colorRED},0,0)` }) }
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