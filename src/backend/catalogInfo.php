<?php

require "connection.php";

function getCountFromDB($shirtID) {
    $conn = openConnection();

    $sql = "SELECT ShirtID, Count FROM ShirtInventory WHERE ShirtID = ?";

    $stmt = mysqli_prepare($conn, $sql);

    if (!$stmt) {
        throw new Exception("Database died");
    }

    mysqli_stmt_bind_param($stmt, "s", $shirtID);
    mysqli_stmt_execute($stmt);

    $result = mysqli_stmt_get_result($stmt);

    if ($row = mysqli_fetch_assoc($result)) {
        return $row['Count'];
    } else {
        return 0;
    }
}


header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "GET") {

    $shirtID = $_GET['shirtID'] ?? "";

    if (empty($shirtID)) {
        echo json_encode(["error" => "Missing shirtID", "count" => 0]);
        exit;
    }

    $count = getCountFromDB($shirtID);

    echo json_encode([
        "count" => $count,
    ]);

    exit;
}
?>