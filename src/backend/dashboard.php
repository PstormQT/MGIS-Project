<?php
require "connection.php";
session_start();

header("Content-Type: application/json");

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "Not logged in"]);
    exit;
}

$conn = openConnection();
$user_id = $_SESSION['user_id'];


$stmt = mysqli_prepare($conn,
    "SELECT CusUUID, FirstName, LastName, MI, dob, emailAddress, phoneNumber, Username FROM CustInfo WHERE CusUUID = ?"
);

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Database error"]);
    exit;
}

mysqli_stmt_bind_param($stmt, "i", $user_id);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$user = mysqli_fetch_assoc($result);
mysqli_stmt_close($stmt);

if (!$user) {
    echo json_encode(["success" => false, "message" => "User not found"]);
    exit;
}

$cart_items = [];
if (!empty($_SESSION['cart'])) {
    foreach ($_SESSION['cart'] as $shirtID => $quantity) {
        $stmt = mysqli_prepare($conn,
            "SELECT ShirtID, Color, Design, Price FROM ShirtInventory WHERE ShirtID = ?"
        );
        
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, "s", $shirtID);
            mysqli_stmt_execute($stmt);
            $shirt_result = mysqli_stmt_get_result($stmt);
            $shirt = mysqli_fetch_assoc($shirt_result);
            mysqli_stmt_close($stmt);
            
            if ($shirt) {
                $shirt['quantity'] = $quantity;
                $shirt['subtotal'] = $shirt['Price'] * $quantity;
                $cart_items[] = $shirt;
            }
        }
    }
}

echo json_encode([
    "success" => true,
    "user" => $user,
    "cart" => $cart_items
]);
?>