<?php
require "connection.php";
session_start();

function loginUser($data) {
    $conn = openConnection();

    $stmt = mysqli_prepare($conn,
        "SELECT CusUUID, Username, Password FROM CustInfo WHERE Username = ?"
    );

    if (!$stmt) {
        return ["success" => false, "message" => "Prepare failed"];
    }

    mysqli_stmt_bind_param($stmt, "s", $data['Username']);
    mysqli_stmt_execute($stmt);

    $result = mysqli_stmt_get_result($stmt);
    $user = mysqli_fetch_assoc($result);

    mysqli_stmt_close($stmt);

    if (!$user) {
        return ["success" => false, "message" => "User not found"];
    }

    if (!password_verify($data['Password'], $user['Password'])) {
        return ["success" => false, "message" => "Incorrect password"];
    }

    // Use consistent session key (CusUUID) used throughout backend
    $_SESSION['CusUUID'] = $user['CusUUID'];
    $_SESSION['Username'] = $user['Username'];

    return ["success" => true, "message" => "Login successful", "CusUUID" => $user['CusUUID']];
}

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $input = json_decode(file_get_contents("php://input"), true);

    if (!$input) {
        echo json_encode(["success" => false, "message" => "Invalid JSON"]);
        exit;
    }

    echo json_encode(loginUser($input));
    exit;
}
?>