<?php

require "connection.php";

function getCountFromDB($shirtID) {
    $conn = openConnection();

    $sql = "SELECT ShirtID, ShirtCT FROM shirts WHERE ShirtID = ?";

    $stmt = mysqli_prepare($conn, $sql);

    if (!$stmt) {
        throw new Exception("Database died");
    }

    mysqli_stmt_bind_param($stmt, "s", $shirtID);
    mysqli_stmt_execute($stmt);

    $result = mysqli_stmt_get_result($stmt);

    if ($row = mysqli_fetch_assoc($result)) {
        return $row['ShirtCT'];
    } else {
        return 0;
    }
}

function mockDB($shirtID) {
    return $shirtID * 20;
}

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "GET") {

    $shirtID = $_GET['shirtID'] ?? "";

    if (empty($shirtID)) {
        echo json_encode(["error" => "Missing shirtID", "count" => 0]);
        exit;
    }

    $count = mockDB($shirtID);

    echo json_encode([
        "count" => $shirtID,
    ]);

    exit;
}
?>