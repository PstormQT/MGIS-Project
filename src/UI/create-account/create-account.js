function createAccount(data) {
    fetch("../../backend/createAccount.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) throw new Error("PHP file error");
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

// Copy billing address to shipping when checkbox checked
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
        if (!field) return;

        if (this.checked) {
            // Copy value from billing
            const billingName = name.replace("shipping", "billing");
            field.value = document.querySelector(`[name="${billingName}"]`).value;
            field.disabled = true; // disable input so user cannot edit
        } else {
            field.disabled = false;
        }
    });
});

// Form submit handler
document.getElementById("accountForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const formData = new FormData(this);
    const data = {};

    const sameAsBilling = document.getElementById("sameAsBilling").checked;

    formData.forEach((value, key) => {
        // If sameAsBilling is checked, skip shipping fields (PHP will use billing)
        if (sameAsBilling && key.startsWith("shipping_")) return;
        data[key] = value;
    });

    console.log("Collected Form Data:", data);
    createAccount(data);
});