document.addEventListener('DOMContentLoaded', function() {
    const emailForm = document.getElementById('email-form');
    const codeForm = document.getElementById('code-form');
    const passwordForm = document.getElementById('password-form');

    let resetState = {
        email: null,
        resetToken: null
    };

    // Step 1: Send reset email
    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const messageEl = document.getElementById('email-message');

        messageEl.textContent = 'Sending...';
        messageEl.className = '';

        try {
            const response = await fetch('../../backend/password-reset.php?action=send_reset_email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.success) {
                resetState.email = email;
                resetState.resetToken = data.resetToken;
                messageEl.textContent = 'Verification code sent to your email!';
                messageEl.className = 'success';
                
                // Show code section
                document.getElementById('code-section').style.display = 'block';
                emailForm.style.display = 'none';
            } else {
                if (data.message === 'Email not found') {
                    document.getElementById('reset-form-section').style.display = 'none';
                    document.getElementById('no-account-message').style.display = 'block';
                } else {
                    messageEl.textContent = data.message || 'Error sending reset code';
                    messageEl.className = 'error';
                }
            }
        } catch (error) {
            messageEl.textContent = 'Error: ' + error.message;
            messageEl.className = 'error';
        }
    });

    // Step 2: Verify code
    codeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('verification-code').value.trim();
        const messageEl = document.getElementById('code-message');

        messageEl.textContent = 'Verifying...';
        messageEl.className = '';

        try {
            const response = await fetch('../../backend/password-reset.php?action=verify_code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: resetState.email,
                    code,
                    resetToken: resetState.resetToken
                })
            });

            const data = await response.json();

            if (data.success) {
                messageEl.textContent = 'Code verified!';
                messageEl.className = 'success';
                
                // Show password section
                document.getElementById('code-section').style.display = 'none';
                document.getElementById('password-section').style.display = 'block';
            } else {
                messageEl.textContent = data.message || 'Invalid code';
                messageEl.className = 'error';
            }
        } catch (error) {
            messageEl.textContent = 'Error: ' + error.message;
            messageEl.className = 'error';
        }
    });

    // Step 3: Reset password
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const messageEl = document.getElementById('password-message');

        if (newPassword.length < 8) {
            messageEl.textContent = 'Password must be at least 8 characters long';
            messageEl.className = 'error';
            return;
        }

        if (newPassword !== confirmPassword) {
            messageEl.textContent = 'Passwords do not match';
            messageEl.className = 'error';
            return;
        }

        messageEl.textContent = 'Resetting password...';
        messageEl.className = '';

        try {
            const response = await fetch('../../backend/password-reset.php?action=reset_password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: resetState.email,
                    newPassword,
                    resetToken: resetState.resetToken
                })
            });

            const data = await response.json();

            if (data.success) {
                document.getElementById('reset-form-section').style.display = 'none';
                document.getElementById('success-message').style.display = 'block';
            } else {
                messageEl.textContent = data.message || 'Error resetting password';
                messageEl.className = 'error';
            }
        } catch (error) {
            messageEl.textContent = 'Error: ' + error.message;
            messageEl.className = 'error';
        }
    });
});
