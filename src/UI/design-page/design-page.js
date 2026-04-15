let colorBase = "../../../asset/shirt-color/";
let designBase = "../../../asset/print-design/";

const selectColor = document.querySelector("#color");
const selectDesign = document.querySelector("#design");
const selectSize = document.querySelector("#size");

const shirtBaseImg = document.querySelector(".base");
const shirtDesignImg = document.querySelector(".design");

const sizeMap = {
    "2XS": "00",
    "XS": "01",
    "S": "02",
    "M": "03",
    "L": "04",
    "XL": "05",
    "2XL": "07",
    "3XL": "08"
};

const colorMap = {
    "blue": "00",
    "green": "01",
    "pink": "02",
    "red": "03"
};

function callToDB(shirtID) {
    fetch(`../../backend/catalogInfo.php?shirtID=${encodeURIComponent(shirtID)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("PHP file error");
            }
            return response.json();
        })
        .then(data => {
            console.log("Stock from DB:", data.stock);

            const countDisplay = document.querySelector("#count");
            if (countDisplay) {
                countDisplay.textContent = data.stock !== undefined ? data.stock : "N/A";
            }
        })
        .catch(error => {
            console.error("Error fetching data:", error);
        });
}

function generateShirtID() {
    const size = selectSize.value;
    const color = selectColor.value.toLowerCase();
    const design = selectDesign.value;

    const AA = sizeMap[size] || "00";
    const BB = colorMap[color] || "00";

    let designNumber = design.split("-")[1];
    const CC = designNumber.padStart(2, "0");

    const shirtID = AA + BB + CC;

    console.log("ShirtID:", shirtID);
    return shirtID;
}

function updateImages() {
    const color = selectColor.value.toLowerCase();
    const design = selectDesign.value.toLowerCase();

    shirtBaseImg.src = `${colorBase}shirt-${color}.png`;
    shirtDesignImg.src = `${designBase}${design.toLowerCase()}.png`;
}

function updateAll() {
    updateImages();
    const shirtID = generateShirtID();
    callToDB(shirtID);
}

selectColor.addEventListener("change", updateAll);
selectDesign.addEventListener("change", updateAll);
selectSize.addEventListener("change", updateAll);

document.addEventListener("DOMContentLoaded", () => {
    updateAll();

    const submitBtn = document.querySelector("#submit");
    if (submitBtn) {
        submitBtn.addEventListener("click", async () => {
            const shirtID = generateShirtID();
            const quantity = parseInt(document.querySelector("#quantity").value) || 1;
            try {
                const res = await fetch("../../backend/cart.php", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ shirtID, quantity })
                });
                const data = await res.json();
                if (data.success) {
                    alert(`Added to cart! ShirtID: ${shirtID}, Qty: ${quantity}`);
                    if (window.__appHeader) window.__appHeader.refreshCartCount();
                } else {
                    alert("Could not add to cart: " + (data.message || "Unknown error"));
                }
            } catch (err) {
                alert("Error: " + err.message);
            }
        });
    }
});