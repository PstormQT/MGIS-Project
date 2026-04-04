<?php
    require "dbInfo.php";

    function openConnection(){
        global $URL, $username, $password, $DBName;
        $conn = mysqli_connect($URL, $username, $password, $DBName);

        if (!$conn) {
            die("Connection failed: " . mysqli_connect_error());
        }

        return $conn;
    }

?>