<?php
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

// Check if form is ready for processing (info entered and button clicked)
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Read in form data
    $first_name = $_POST['first_name'];
    $last_name = $_POST['last_name'];
    $email = $_POST['email'];
    $user_name = $_POST['user_name'];
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);

    // Prepare the template
    $sql = "INSERT INTO accounts (first_name, last_name, email, user_name, password) VALUES (?, ?, ?, ?, ?)";
    $stmt = mysqli_prepare($conn, $sql);

    // Bind the data
    mysqli_stmt_bind_param($stmt, "sssss", $first_name, $last_name, $email, $user_name, $password);

    // Execute
    if (mysqli_stmt_execute($stmt)) {
        echo "<h5 style='color: green;'>Account Created Successfully</h5>";
    } else {
        echo "<h5 style='color: red;'>Account Created Failed</h5>";
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

<form method="POST">
    <input type="text" name="first_name" placeholder="First Name" required><br>
    <input type="text" name="last_name" placeholder="Last Name" required><br>
    <input type="text" name="email" placeholder="Email" required><br>
    <hr>
    <input type="text" name="user_name" placeholder="Username" required><br>
    <input type="password" name="password" placeholder="Password" required><br>
    <hr>
    <button type="submit">Sign Up</button>
</form>

</body>
</html>

