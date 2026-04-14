// Helper: try multiple candidate backend paths until one succeeds
async function fetchBackendWithFallback(pathCandidates, options){
    let lastErr = null;
    for (const p of pathCandidates){
        try{
            const res = await fetch(p, options);
            if (!res.ok) {
                // record and continue trying
                const text = await res.text().catch(()=>'');
                lastErr = new Error(`HTTP ${res.status} at ${p}: ${text}`);
                continue;
            }
            return res;
        }catch(err){
            lastErr = err;
            continue;
        }
    }
    throw lastErr || new Error('No path candidates provided');
}

function createAccount(data) {
    const candidates = [
        '/backend/createAccount.php',
        '../backend/createAccount.php',
        '../../backend/createAccount.php',
        './backend/createAccount.php',
        'backend/createAccount.php'
    ];

    return fetchBackendWithFallback(candidates, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
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
            message.textContent = "System is currently unavailable. Check server routes or see browser console for details.";
            message.style.color = "red";
        }
        return { success: false, message: error.message };
    });
}

// Copy billing -> shipping when checkbox is toggled
const sameBox = document.getElementById("sameAsBilling");
if (sameBox){
    sameBox.addEventListener("change", function () {
        const shippingFields = [
            "shipping_AddressLine1",
            "shipping_AddressLine2",
            "shipping_City",
            "shipping_State",
            "shipping_ZipCode"
        ];

        shippingFields.forEach(name => {
            const field = document.querySelector('[name="' + name + '"]');
            if (!field) return;

            if (this.checked) {
                const billingName = name.replace("shipping_", "billing_");
                const billingField = document.querySelector('[name="' + billingName + '"]');
                field.value = billingField ? billingField.value : '';
                field.disabled = true;
            } else {
                field.disabled = false;
            }
        });
    });
}

// Submit handler
const acctForm = document.getElementById("accountForm");
if (acctForm){
    acctForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const formData = new FormData(this);
        const data = {};

        formData.forEach((value, key) => {
            data[key] = value;
        });

        const sameAsBilling = document.getElementById("sameAsBilling") && document.getElementById("sameAsBilling").checked;

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
                setTimeout(()=>{
                    window.location.href = "/UI/login-page/login.html";
                }, 1200);
            }
        });
    });
} else {
    console.warn('Account form not found on page');
}
