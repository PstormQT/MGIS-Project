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

// Validate required fields
if (!isset($data['cart']) || !isset($data['shippingAddID']) || !isset($data['billingAddID'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: cart, shippingAddID, billingAddID']);
    exit;
}

$conn = openConnection();
if (!$conn) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

try {
    $conn->begin_transaction();

    $cart = $data['cart'];
    $shippingAddID = intval($data['shippingAddID']);
    $billingAddID = intval($data['billingAddID']);
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
        $stmt->bind_param("isydd", $orderUUID, $shirtID, $quantity, $pricePerUnit, $subtotal);
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
