<?php
require "connection.php";
session_start();

header("Content-Type: application/json");

if (!isset($_SESSION['CusUUID'])) {
    echo json_encode(["success" => false, "message" => "Not logged in"]);
    exit;
}

$conn = openConnection();
$user_id = $_SESSION['CusUUID'];


$stmt = mysqli_prepare($conn,
    "SELECT CusUUID, FirstName, LastName, MI, dob, emailAddress, phoneNumber, Username, billingAdd, shippingAdd FROM CustInfo WHERE CusUUID = ?"
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
            "SELECT ShirtID, SizeName, ColorName, DesignName, Price, Stock FROM Shirts WHERE ShirtID = ?"
        );
        
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, "s", $shirtID);
            mysqli_stmt_execute($stmt);
            $shirt_result = mysqli_stmt_get_result($stmt);
            $shirt = mysqli_fetch_assoc($shirt_result);
            mysqli_stmt_close($stmt);
            
            if ($shirt) {
                $shirt['Quantity'] = $quantity;
                $shirt['Subtotal'] = $shirt['Price'] * $quantity;
                $cart_items[] = $shirt;
            }
        }
    }
}

$cart_map = [];
if (!empty($_SESSION['cart'])) {
    foreach ($_SESSION['cart'] as $sid => $q) {
        $cart_map[$sid] = intval($q);
    }
}

echo json_encode([
    "success" => true,
    "user" => $user,
    "cart" => $cart_map,
    "cartItems" => $cart_items
]);
?>