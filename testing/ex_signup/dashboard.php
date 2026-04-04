<?php
session_start();

// If the session variable isn't set, they aren't logged in
if (!isset($_SESSION['user_id'])) {
    heaeder("Location: login.php");
    exit;
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
    <h1>Welcome to the Dashboard, <?php echo htmlspecialchars($_SESSION['user_name']); ?>!</h1>
    <p>This content is only visible to authenticated users.</p>
    <a href="logout.php">Log Out</a>
</body>
</html>
