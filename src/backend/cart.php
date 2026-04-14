<?php
require "connection.php";
session_start();

function getStockFromDB($shirtID) {
    $conn = openConnection();

    $stmt = mysqli_prepare($conn,
        "SELECT Stock FROM Shirts WHERE ShirtID = ?"
    );

    mysqli_stmt_bind_param($stmt, "s", $shirtID);
    mysqli_stmt_execute($stmt);

    $result = mysqli_stmt_get_result($stmt);
    $row = mysqli_fetch_assoc($result);

    return $row ? intval($row['Stock']) : 0;
}

if (!isset($_SESSION['cart'])) {
    $_SESSION['cart'] = [];
}

header("Content-Type: application/json");
$method = $_SERVER["REQUEST_METHOD"];

if ($method === "POST") {
    $input = json_decode(file_get_contents("php://input"), true);

    $shirtID = $input['shirtID'] ?? "";
    $quantity = intval($input['quantity'] ?? 1);

    if (empty($shirtID)) {
        echo json_encode(["success" => false, "message" => "Missing shirtID"]);
        exit;
    }

    $stock = getStockFromDB($shirtID);

    $currentQty = $_SESSION['cart'][$shirtID] ?? 0;
    $newQty = $currentQty + $quantity;

    if ($newQty > $stock) {
        echo json_encode([
            "success" => false,
            "message" => "Not enough stock",
            "available" => $stock
        ]);
        exit;
    }

    $_SESSION['cart'][$shirtID] = $newQty;

    echo json_encode([
        "success" => true,
        "cart" => $_SESSION['cart']
    ]);
    exit;
}

if ($method === "GET") {
    echo json_encode([
        "success" => true,
        "cart" => $_SESSION['cart']
    ]);
    exit;
}

if ($method === "DELETE") {
    $input = json_decode(file_get_contents("php://input"), true);

    $shirtID = $input['shirtID'] ?? "";

    if (isset($_SESSION['cart'][$shirtID])) {
        unset($_SESSION['cart'][$shirtID]);
    }

    echo json_encode([
        "success" => true,
        "cart" => $_SESSION['cart']
    ]);
    exit;
}
?>