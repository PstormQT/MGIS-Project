<?php

require "connection.php";

    function getCountFromDB($size, $color, $design){
        $conn = openConnection();

        $shirtID = $size * 10000 + $color * 100 + $design;

        $sql = "SELECT ShirtID, ShirtCT FROM shirts WHERE ShirtID = ?";

        $stmt = mysqli_prepare($conn, $sql);

        if (!$stmt) {
            throw new Exception("Database died");
        }

        mysqli_stmt_bind_param($stmt, "i", $shirtID);

        mysqli_stmt_execute($stmt);

        $result = mysqli_stmt_get_result($stmt);

        if ($row = mysqli_fetch_assoc($result)) {
            return $row['ShirtCT'];
        } else {
            return null;
        }
    }


    function mockDatabase ($size, $color, $design){
        return ($size * 10000 + $color * 100 + $design)* 20;
    }



    header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $size   = $_POST['size'] ?? 1;
    $color  = $_POST['color'] ?? 1;
    $design = $_POST['design'] ?? 1;

    $count = mockDatabase($size, $color, $design);

    echo json_encode([
        "count" => $count,
    ]);

    exit;
}
?>