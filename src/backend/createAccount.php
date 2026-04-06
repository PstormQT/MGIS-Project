<?php

require "connection.php";

function insertAddress($conn, $line1, $line2, $city, $state, $zip) {
    $sql = "INSERT INTO AddBook (AddressLine1, AddressLine2, City, State, ZipCode)
            VALUES (?, ?, ?, ?, ?)";

    $stmt = mysqli_prepare($conn, $sql);

    if (!$stmt) {
        throw new Exception("Address prepare failed");
    }

    mysqli_stmt_bind_param($stmt, "ssssi", $line1, $line2, $city, $state, $zip);

    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception("Address insert failed");
    }

    $id = mysqli_insert_id($conn);
    mysqli_stmt_close($stmt);

    return $id;
}

function createAccountInDB($data) {
    $conn = openConnection();
    mysqli_begin_transaction($conn);

    try {
        // insert billing address
        $billingID = insertAddress(
            $conn,
            $data['billing_AddressLine1'],
            $data['billing_AddressLine2'] ?? '',
            $data['billing_City'],
            $data['billing_State'],
            $data['billing_ZipCode']
        );

        // Insert Shipping Address
        $shippingID = $billingID; // default to billingID

        // Check if shipping fields exist and are different
        $shippingProvided = !empty($data['shipping_AddressLine1']) ||
                            !empty($data['shipping_City']) ||
                            !empty($data['shipping_State']) ||
                            !empty($data['shipping_ZipCode']);

        if ($shippingProvided) {
            $isDifferent = (
                ($data['shipping_AddressLine1'] ?? '') !== $data['billing_AddressLine1'] ||
                ($data['shipping_AddressLine2'] ?? '') !== ($data['billing_AddressLine2'] ?? '') ||
                ($data['shipping_City'] ?? '') !== $data['billing_City'] ||
                ($data['shipping_State'] ?? '') !== $data['billing_State'] ||
                ($data['shipping_ZipCode'] ?? '') != $data['billing_ZipCode']
            );

            if ($isDifferent) {
                $shippingID = insertAddress(
                    $conn,
                    $data['shipping_AddressLine1'],
                    $data['shipping_AddressLine2'] ?? '',
                    $data['shipping_City'],
                    $data['shipping_State'],
                    $data['shipping_ZipCode']
                );
            }
        }

        // insert customer info
        $sqlCustomer = "INSERT INTO CustInfo 
            (FirstName, LastName, MI, dob, billingAdd, shippingAdd, emailAddress, Password, phoneNumber, Username)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = mysqli_prepare($conn, $sqlCustomer);

        if (!$stmt) {
            throw new Exception("Customer prepare failed");
        }

        $hashedPassword = password_hash($data['Password'], PASSWORD_DEFAULT);

        mysqli_stmt_bind_param(
            $stmt,
            "ssssiiisss",
            $data['FirstName'],
            $data['LastName'],
            $data['MI'] ?? '',
            $data['dob'] ?? null,
            $billingID,
            $shippingID,
            $data['emailAddress'],
            $hashedPassword,
            $data['phoneNumber'] ?? '',
            $data['Username']
        );

        if (!mysqli_stmt_execute($stmt)) {
            throw new Exception("Customer insert failed");
        }

        $cusUUID = mysqli_insert_id($conn);
        mysqli_stmt_close($stmt);

        mysqli_commit($conn);

        return [
            "success" => true,
            "message" => "Account created successfully",
            "CusUUID" => $cusUUID
        ];

    } catch (Exception $e) {
        mysqli_rollback($conn);

        return [
            "success" => false,
            "message" => $e->getMessage()
        ];
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