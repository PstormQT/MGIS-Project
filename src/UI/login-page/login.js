document.getElementById("login-form").addEventListener("submit", async function(e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("../../backend/login.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ Username: username, Password: password })
        });

        const data = await response.json();

        if (data.success) {
            alert("Login successful!");
            window.location.href = "../dashboard/dashboard.html"; 
        } else {
            alert("Login failed: " + data.message);
        }

    } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong");
    }
});