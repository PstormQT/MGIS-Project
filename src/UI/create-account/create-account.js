function createAccount(data) {
    fetch("../../backend/createAccount.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("PHP file error");
        }
        return response.json();
    })
    .then(result => {
        console.log("Response from DB:", result);

        const message = document.querySelector("#message");
        if (message) {
            message.textContent = result.message || "Account created!";
        }
    })
    .catch(error => {
        console.error("Error fetching data:", error);
    });
}

document.getElementById("sameAsBilling").addEventListener("change", function () {
    if (this.checked) {
        document.querySelector('[name="shipping_AddressLine1"]').value =
            document.querySelector('[name="billing_AddressLine1"]').value;

        document.querySelector('[name="shipping_AddressLine2"]').value =
            document.querySelector('[name="billing_AddressLine2"]').value;

        document.querySelector('[name="shipping_City"]').value =
            document.querySelector('[name="billing_City"]').value;

        document.querySelector('[name="shipping_State"]').value =
            document.querySelector('[name="billing_State"]').value;

        document.querySelector('[name="shipping_ZipCode"]').value =
            document.querySelector('[name="billing_ZipCode"]').value;
    }
});


// Form handler
document.getElementById("accountForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const formData = new FormData(this);
    const data = {};

    formData.forEach((value, key) => {
        data[key] = value;
    });

    console.log("Collected Form Data:", data);
    createAccount(data);
});


document.getElementById("sameAsBilling").addEventListener("change", function () {
    const shippingFields = [
        "shipping_AddressLine1",
        "shipping_AddressLine2",
        "shipping_City",
        "shipping_State",
        "shipping_ZipCode"
    ];

    shippingFields.forEach(name => {
        const field = document.querySelector(`[name="${name}"]`);
        if (field) {
            field.disabled = this.checked;
        }
    });
});