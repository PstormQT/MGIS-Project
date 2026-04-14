function createAccount(data) {
    return fetch("../../backend/createAccount.php", {
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
            message.textContent = result.message || "Account created, please login";
            message.style.color = result.success ? "green" : "red";
        }
        return result;
    })
    .catch(error => {
        console.error("Error fetching data:", error);
        const message = document.querySelector("#message");
        if (message) {
            message.textContent = "System is Currently in Maintainance, Please try again later";
            message.style.color = "red";
        }
    });
}

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
            const billingName = name.replace("shipping_", "billing_");
            const billingField = document.querySelector(`[name="${billingName}"]`);
            field.value = billingField ? billingField.value : '';
            field.disabled = true;
        } else {
            field.disabled = false;
        }
    });
});



document.getElementById("accountForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const formData = new FormData(this);
    const data = {};

    formData.forEach((value, key) => {
        data[key] = value;
    });

    const sameAsBilling = document.getElementById("sameAsBilling").checked;

    if (sameAsBilling) {
        data['shipping_AddressLine1'] = data['billing_AddressLine1'] ?? '';
        data['shipping_AddressLine2'] = data['billing_AddressLine2'] ?? '';
        data['shipping_City'] = data['billing_City'] ?? '';
        data['shipping_State'] = data['billing_State'] ?? '';
        data['shipping_ZipCode'] = data['billing_ZipCode'] ?? '';
    }

    console.log("Collected Form Data:", data);
    createAccount(data).then(result => {
        if (result && result.success){
            wait(2000)
            window.location.href = "../login-page/login.html"
        }
    });
});