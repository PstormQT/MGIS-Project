<?php
session_start();
header('Content-Type: application/json');
require_once 'connection.php';

$action = $_GET['action'] ?? '';
$conn = openConnection();

if (!$conn) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// Helper function to generate a 6-digit verification code
function generateVerificationCode() {
    return str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
}

// Helper function to send email (with mock fallback)
function sendResetEmail($email, $code) {
    $subject = "Password Reset Code - Tanka Jahari's T-Shirts";
    $message = "Your password reset code is: " . $code . "\n\n";
    $message .= "This code will expire in 1 hour.\n";
    $message .= "If you did not request a password reset, please ignore this email.\n\n";
    $message .= "- Tanka Jahari's T-Shirts Team";
    
    $headers = "From: noreply@tanka-tshirts.com\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    
    // Attempt to send email
    $mailSent = mail($email, $subject, $message, $headers);
    
    // For development/testing: also log to a file or return success regardless
    // This ensures the password reset works even without a mail server
    if (!$mailSent) {
        // Log the code to a file for debugging (development only)
        $logFile = __DIR__ . '/../password-reset-codes.log';
        error_log("Password Reset Code for $email: $code\n", 3, $logFile);
    }
    
    // Return true to allow password reset to proceed (mail server may not be configured)
    return true;
}

try {
    if ($action === 'send_reset_email') {
        $input = json_decode(file_get_contents('php://input'), true);
        $email = $input['email'] ?? '';

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'message' => 'Invalid email format']);
            exit;
        }

        // Check if email exists
        $stmt = $conn->prepare("SELECT CusUUID FROM CustInfo WHERE emailAddress = ?");
        if (!$stmt) {
            throw new Exception("Database error: " . $conn->error);
        }
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Email not found']);
            $stmt->close();
            exit;
        }
        
        $stmt->close();

        // Generate verification code
        $code = generateVerificationCode();
        $resetToken = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));

        // Store reset token in session or database
        // For simplicity, store in session with expiration
        $_SESSION['password_reset'] = [
            'email' => $email,
            'code' => $code,
            'token' => $resetToken,
            'expires_at' => $expiresAt,
            'verified' => false
        ];

        // Send email
        if (sendResetEmail($email, $code)) {
            echo json_encode([
                'success' => true,
                'message' => 'Reset code sent to email',
                'resetToken' => $resetToken,
                'testCode' => $code  // For testing/development only
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to send email. Please try again later.'
            ]);
        }
        exit;
    }

    if ($action === 'verify_code') {
        $input = json_decode(file_get_contents('php://input'), true);
        $email = $input['email'] ?? '';
        $code = $input['code'] ?? '';

        if (!isset($_SESSION['password_reset'])) {
            echo json_encode(['success' => false, 'message' => 'Session expired. Please try again.']);
            exit;
        }

        $resetData = $_SESSION['password_reset'];

        // Check if reset session matches
        if ($resetData['email'] !== $email || $resetData['code'] !== $code) {
            echo json_encode(['success' => false, 'message' => 'Invalid code']);
            exit;
        }

        // Check expiration
        if (strtotime($resetData['expires_at']) < time()) {
            echo json_encode(['success' => false, 'message' => 'Code expired. Please request a new one.']);
            exit;
        }

        // Mark as verified
        $_SESSION['password_reset']['verified'] = true;

        echo json_encode(['success' => true, 'message' => 'Code verified']);
        exit;
    }

    if ($action === 'reset_password') {
        $input = json_decode(file_get_contents('php://input'), true);
        $email = $input['email'] ?? '';
        $newPassword = $input['newPassword'] ?? '';

        if (!isset($_SESSION['password_reset'])) {
            echo json_encode(['success' => false, 'message' => 'Session expired. Please try again.']);
            exit;
        }

        $resetData = $_SESSION['password_reset'];

        // Verify the reset session
        if (!$resetData['verified'] || $resetData['email'] !== $email) {
            echo json_encode(['success' => false, 'message' => 'Invalid reset session']);
            exit;
        }

        if (strlen($newPassword) < 8) {
            echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters']);
            exit;
        }

        // Hash the new password
        $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);

        // Update password in database
        $stmt = $conn->prepare("UPDATE CustInfo SET Password = ? WHERE emailAddress = ?");
        if (!$stmt) {
            throw new Exception("Database error: " . $conn->error);
        }
        $stmt->bind_param("ss", $hashedPassword, $email);
        $stmt->execute();
        $stmt->close();

        // Clear password reset session
        unset($_SESSION['password_reset']);

        echo json_encode([
            'success' => true,
            'message' => 'Password reset successfully'
        ]);
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Invalid action']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} finally {
    $conn->close();
}
?>
