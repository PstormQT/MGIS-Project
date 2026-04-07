<?php
require "connection.php";

function insertAddress($conn, $line1, $line2, $city, $state, $zip) {
    $stmt = mysqli_prepare($conn, 
        "INSERT INTO AddBook (AddressLine1, AddressLine2, City, State, ZipCode) VALUES (?, ?, ?, ?, ?)"
    );
    if (!$stmt) throw new Exception("Address prepare failed: " . mysqli_error($conn));

    mysqli_stmt_bind_param($stmt, "sssss", $line1, $line2, $city, $state, $zip);
    if (!mysqli_stmt_execute($stmt)) throw new Exception("Address insert failed: " . mysqli_stmt_error($stmt));

    $id = mysqli_insert_id($conn);
    mysqli_stmt_close($stmt);
    return $id;
}

function createAccountInDB($data) {
    $conn = openConnection();
    mysqli_begin_transaction($conn);

    try {
        $billingID = insertAddress(
            $conn,
            $data['billing_AddressLine1'],
            $data['billing_AddressLine2'] ?? '',
            $data['billing_City'],
            $data['billing_State'],
            $data['billing_ZipCode']
        );

        $shippingID = $billingID;

        if (!empty($data['shipping_AddressLine1'])) {
            $shippingID = insertAddress(
                $conn,
                $data['shipping_AddressLine1'],
                $data['shipping_AddressLine2'] ?? '',
                $data['shipping_City'],
                $data['shipping_State'],
                $data['shipping_ZipCode']
            );
        }

        $stmt = mysqli_prepare($conn,
            "INSERT INTO CustInfo 
            (FirstName, LastName, MI, dob, billingAdd, shippingAdd, emailAddress, Password, phoneNumber, Username)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        if (!$stmt) throw new Exception("Customer prepare failed: " . mysqli_error($conn));

        $hashedPassword = password_hash($data['Password'], PASSWORD_DEFAULT);

        $dob = $data['dob'] ?? '';
        $mi  = $data['MI'] ?? '';
        $phone = $data['phoneNumber'] ?? '';

        mysqli_stmt_bind_param(
            $stmt,
            "ssssiissss",
            $data['FirstName'],
            $data['LastName'],
            $mi,
            $dob,
            $billingID,
            $shippingID,
            $data['emailAddress'],
            $hashedPassword,
            $phone,
            $data['Username']
        );

        if (!mysqli_stmt_execute($stmt)) throw new Exception("Customer insert failed: " . mysqli_stmt_error($stmt));

        $cusUUID = mysqli_insert_id($conn);
        mysqli_stmt_close($stmt);
        mysqli_commit($conn);

        return ["success" => true, "message" => "Account created successfully", "CusUUID" => $cusUUID];

    } catch (Exception $e) {
        mysqli_rollback($conn);
        return ["success" => false, "message" => $e->getMessage()];
    }
}

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input) {
        echo json_encode(["success" => false, "message" => "Invalid JSON"]);
        exit;
    }
    echo json_encode(createAccountInDB($input));
    exit;
}
?>