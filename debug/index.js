import Animate from "../src/animate"

window.addEventListener("load", ()=> {

    const ext = new Animate( document.querySelector("div"), [
        "frames", [ "fade-in", { duration: 3 },
            [ 0, { opacity: 1 } ],
            [ 100, { opacity: 0 } ],
        ]
    ] );

    const bob = ext.on( (data) => console.log(data) );
    bob( { action: [ "fade-in" ] } );

});