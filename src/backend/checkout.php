<?php
session_start();
header('Content-Type: application/json');
require_once 'connection.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check if user is logged in
if (!isset($_SESSION['CusUUID'])) {
    http_response_code(401);
    echo json_encode(['error' => 'User not authenticated']);
    exit;
}

$cusUUID = $_SESSION['CusUUID'];
$data = json_decode(file_get_contents('php://input'), true);

// If cart not provided, use session cart
if (!isset($data['cart'])) {
    $cart = [];
    if (!empty($_SESSION['cart'])) {
        foreach ($_SESSION['cart'] as $sid => $q) {
            $cart[] = ['shirtID' => $sid, 'quantity' => intval($q)];
        }
    }
} else {
    $cart = $data['cart'];
}

// Open DB connection early (needed for fetching user addresses)
$conn = openConnection();
if (!$conn) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// Determine shipping/billing address IDs
if (isset($data['shippingAddID']) && isset($data['billingAddID'])) {
    $shippingAddID = intval($data['shippingAddID']);
    $billingAddID = intval($data['billingAddID']);
} else {
    // Fetch from CustInfo
    $stmt = $conn->prepare("SELECT shippingAdd, billingAdd FROM CustInfo WHERE CusUUID = ?");
    if (!$stmt) {
        throw new Exception("Database error: " . $conn->error);
    }
    $stmt->bind_param("i", $cusUUID);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();
    $stmt->close();
    $shippingAddID = isset($row['shippingAdd']) ? intval($row['shippingAdd']) : null;
    $billingAddID = isset($row['billingAdd']) ? intval($row['billingAdd']) : null;
}

if (empty($cart)) {
    throw new Exception('Cart is empty');
}

try {
    $conn->begin_transaction();

    $totalPrice = 0;

    // Validate and calculate total
    foreach ($cart as $item) {
        $shirtID = $item['shirtID'];
        $quantity = intval($item['quantity']);

        // Get shirt info and verify stock
        $stmt = $conn->prepare("SELECT Price, Stock FROM Shirts WHERE ShirtID = ?");
        if (!$stmt) {
            throw new Exception("Database error: " . $conn->error);
        }
        $stmt->bind_param("s", $shirtID);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            throw new Exception("Shirt ID $shirtID not found");
        }

        $shirt = $result->fetch_assoc();
        
        // Check stock availability
        if ($shirt['Stock'] < $quantity) {
            throw new Exception("Insufficient stock for Shirt ID $shirtID. Available: " . $shirt['Stock'] . ", Requested: " . $quantity);
        }

        $totalPrice += floatval($shirt['Price']) * $quantity;
        $stmt->close();
    }

    // Create order in OrderHistory
    $stmt = $conn->prepare("INSERT INTO OrderHistory (CusUUID, TotalPrice, ShippingAddID, BillingAddID, OrderStatus) VALUES (?, ?, ?, ?, 'confirmed')");
    if (!$stmt) {
        throw new Exception("Database error: " . $conn->error);
    }
    $stmt->bind_param("idii", $cusUUID, $totalPrice, $shippingAddID, $billingAddID);
    $stmt->execute();
    $orderUUID = $conn->insert_id;
    $stmt->close();

    // Add items to OrderItems table and decrease inventory
    foreach ($cart as $item) {
        $shirtID = $item['shirtID'];
        $quantity = intval($item['quantity']);

        // Get shirt price
        $stmt = $conn->prepare("SELECT Price FROM Shirts WHERE ShirtID = ?");
        if (!$stmt) {
            throw new Exception("Database error: " . $conn->error);
        }
        $stmt->bind_param("s", $shirtID);
        $stmt->execute();
        $result = $stmt->get_result();
        $shirt = $result->fetch_assoc();
        $pricePerUnit = floatval($shirt['Price']);
        $subtotal = $pricePerUnit * $quantity;
        $stmt->close();

        // Insert order item
        $stmt = $conn->prepare("INSERT INTO OrderItems (OrderUUID, ShirtID, Quantity, PricePerUnit, Subtotal) VALUES (?, ?, ?, ?, ?)");
        if (!$stmt) {
            throw new Exception("Database error: " . $conn->error);
        }
        // OrderUUID (int), ShirtID (string), Quantity (int), Price (double), Subtotal (double)
        $stmt->bind_param("isidd", $orderUUID, $shirtID, $quantity, $pricePerUnit, $subtotal);
        $stmt->execute();
        $stmt->close();

        // Decrease inventory
        $stmt = $conn->prepare("UPDATE Shirts SET Stock = Stock - ? WHERE ShirtID = ?");
        if (!$stmt) {
            throw new Exception("Database error: " . $conn->error);
        }
        $stmt->bind_param("is", $quantity, $shirtID);
        $stmt->execute();
        $stmt->close();
    }

    // Clear the cart session
    unset($_SESSION['cart']);

    $conn->commit();
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'orderUUID' => $orderUUID,
        'orderID' => $orderUUID,
        'totalPrice' => number_format($totalPrice, 2, '.', ''),
        'message' => 'Order created successfully'
    ]);

} catch (Exception $e) {
    $conn->rollback();
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
} finally {
    $conn->close();
}
?>
