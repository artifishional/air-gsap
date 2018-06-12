import Animation from "../src/animation"

window.addEventListener("load", ()=> {

    const ext = new Animation( document.querySelector("div"), [
        "frames", [ "fade-in", { duration: 3 },
            [ 0, { opacity: 0 } ],
            [ 1, { opacity: 1 } ],
        ]
    ] );

    const bob = ext.on( (data) => console.log(data) );
    bob( { actions: [ "fade-in" ] } );

});