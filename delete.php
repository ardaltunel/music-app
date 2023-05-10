<?php
$connection = mysqli_connect ('localhost', 'ardaltun', 'A59i7a5zgB', 'ardaltun_music');

if (isset($_GET['id'])) {
    $id    = $_GET['id'];
    $query = "DELETE FROM `songs` WHERE id = '$id'";
    $run   = mysqli_query ($connection, $query);

    if ($run) {
        header ('location:index.php');
    }
    else {
        echo "Error: " . mysqli_error ($conn);
    }
}
?>