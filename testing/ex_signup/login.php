<?php
// Start the session
session_start();

// Include dc connection credentials and open connection
require_once('db_connect.php');
$conn = mysqli_connect($host, $user, $pass, $db);

// Check if the connection worked
if (!$conn) {
    echo "<h6 style='color: red;'>Connection Failed</h6>";
    // mysqli_connect_error() tells us exactly what went wrong
    die("Error details: " . mysqli_connect_error());
}
echo "<h6 style='color: green;'>Connected Successfully</h6>";

// Check for 'msg' in the URL (from logout.php)
if ( isset($_GET['msg'])) {
    // Alert the user
    echo match ($_GET['msg']) {
        'logged_out' => "<h6 style='color: green;'>Logged Out Successfully</h6>",
        default => "<h6 style='color: red;'>Please log in to access the Dashboard</h6>",
    };
}

// Check if form is ready for processing (info entered and button clicked)
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Read in form data
    $user_attempt = $_POST['user_name'];
    $pass_attempt = $_POST['password'];

    // Prepare/Bind/Execute: Find the user by user_name
    $stmt = mysqli_prepare($conn, "SELECT id, password FROM accounts WHERE user_name = ?");
    mysqli_stmt_bind_param($stmt, "s",$user_attempt);
    mysqli_stmt_execute($stmt);

    // Get the result
    $result = mysqli_stmt_get_result($stmt);

    if ($row = mysqli_fetch_assoc($result)) {
        // Verify: compare the raw password to the stored hash
        if (password_verify($pass_attempt, $row['password'])) {
            // SUCCESS! Regenerate ID for security and set Session
            session_regenerate_id();
            $_SESSION['user_id'] = $row['id'];
            $_SESSION['user_name'] = $user_attempt;

            header("Location: dashboard.php");
            exit;
        } else {
            $error = "Invalid username or password";
        }
    } else {
        $error = "Invalid username or password";
    }

    // close db connection
    mysqli_stmt_close($stmt);
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Account Sign-up</title>
    <style>
        * {
            font-family: sans-serif;
        }
    </style>
</head>
<body>
    <h3>Login</h3>
    <?php if($error) echo "<p style='color:red;'>$error</p>"; ?>

    <form method="POST">
        <input type="text" name="user_name" placeholder="Username" required><br>
        <input type="password" name="password" placeholder="Password" required><br>
        <hr>
        <button type="submit">Login</button>
    </form>

</body>
</html>

