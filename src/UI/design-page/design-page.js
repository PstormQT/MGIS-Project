let colorBase = "asset/shirt-color/";
let designBase = "asset/print-design/";

const selectColor = document.querySelector("#color");
const selectDesign = document.querySelector("#design");

const shirtBaseImg = document.querySelector(".base");
const shirtDesignImg = document.querySelector(".design");

selectColor.addEventListener("change", (e) => {
    let colorVal = e.target.value.toLowerCase(); 
    let colorFull = colorBase + "shirt-" + colorVal + ".png";

    console.log(colorFull);
    shirtBaseImg.src = colorFull;
});

selectDesign.addEventListener("change", (e) => {
    let designVal = e.target.value.toLowerCase(); 
    let designFull = designBase + designVal + ".png";

    console.log(designFull);
    shirtDesignImg.src = designFull;
});