<?php
// Access the existing session
session_start();

// UNSET all session variables
$_SESSION = [];

// DESTROY the session file on the server
session_destroy();

// REDIRECT back to the login page
header("Location: login.php?msg=logged_out");
exit;


