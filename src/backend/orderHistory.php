<?php
session_start();
header('Content-Type: application/json');
require_once 'connection.php';

// Check if user is logged in
if (!isset($_SESSION['CusUUID'])) {
    http_response_code(401);
    echo json_encode(['error' => 'User not authenticated']);
    exit;
}

$cusUUID = $_SESSION['CusUUID'];
$conn = openConnection();

if (!$conn) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

try {
    // Check if specific order ID is requested
    $orderID = isset($_GET['orderID']) ? intval($_GET['orderID']) : null;
    
    if ($orderID) {
        // Fetch specific order
        $stmt = $conn->prepare("
            SELECT 
                o.OrderUUID,
                o.OrderDateTime,
                o.TotalPrice,
                o.OrderStatus,
                a.AddressLine1,
                a.AddressLine2,
                a.City,
                a.State,
                a.ZipCode
            FROM OrderHistory o
            LEFT JOIN AddBook a ON o.ShippingAddID = a.addUUID
            WHERE o.CusUUID = ? AND o.OrderUUID = ?
        ");
        
        if (!$stmt) {
            throw new Exception("Database error: " . $conn->error);
        }
        
        $stmt->bind_param("ii", $cusUUID, $orderID);
        $stmt->execute();
        $ordersResult = $stmt->get_result();
        $stmt->close();
    } else {
        // Fetch all orders for the user
        $stmt = $conn->prepare("
            SELECT 
                o.OrderUUID,
                o.OrderDateTime,
                o.TotalPrice,
                o.OrderStatus,
                a.AddressLine1,
                a.AddressLine2,
                a.City,
                a.State,
                a.ZipCode
            FROM OrderHistory o
            LEFT JOIN AddBook a ON o.ShippingAddID = a.addUUID
            WHERE o.CusUUID = ?
            ORDER BY o.OrderDateTime DESC
        ");
        
        if (!$stmt) {
            throw new Exception("Database error: " . $conn->error);
        }
        
        $stmt->bind_param("i", $cusUUID);
        $stmt->execute();
        $ordersResult = $stmt->get_result();
        $stmt->close();
    }

    $orders = [];
    while ($order = $ordersResult->fetch_assoc()) {
        $orderUUID = $order['OrderUUID'];

        // Fetch order items with shirt details
        $itemStmt = $conn->prepare("
            SELECT 
                oi.OrderItemID,
                oi.ShirtID,
                oi.Quantity,
                oi.PricePerUnit,
                oi.Subtotal,
                s.SizeName as Size,
                s.ColorName as Color,
                s.DesignName as Design
            FROM OrderItems oi
            JOIN Shirts s ON oi.ShirtID = s.ShirtID
            WHERE oi.OrderUUID = ?
        ");
        
        if (!$itemStmt) {
            throw new Exception("Database error: " . $conn->error);
        }
        
        $itemStmt->bind_param("i", $orderUUID);
        $itemStmt->execute();
        $itemsResult = $itemStmt->get_result();
        $itemStmt->close();

        $items = [];
        while ($item = $itemsResult->fetch_assoc()) {
            $items[] = $item;
        }

        $order['items'] = $items;
        $orders[] = $order;
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'orders' => $orders
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
} finally {
    $conn->close();
}
?>
