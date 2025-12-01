<?php
require_once 'db.php';
$database = new Database();
$db = $database->getConnection();
$userId = authenticate($db);

if (!$userId) {
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    $query = "SELECT
        id, user_id as userId, name, description, unit_price as unitPrice,
        vat_rate as vatRate, is_active as isActive, created_at as createdAt, updated_at as updatedAt
        FROM services WHERE user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $userId);
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}
elseif ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    if(!empty($data->name)) {
        $id = $data->id ?? uniqid('s-');
        $query = "INSERT INTO services (id, user_id, name, description, unit_price, vat_rate) VALUES (:id, :uid, :name, :desc, :price, :vat)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":uid", $userId);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":desc", $data->description);
        $stmt->bindParam(":price", $data->unitPrice);
        $stmt->bindParam(":vat", $data->vatRate);
        if ($stmt->execute()) {
             echo json_encode([
                 "id" => $id, "userId" => $userId, "name" => $data->name,
                 "description" => $data->description, "unitPrice" => $data->unitPrice,
                 "vatRate" => $data->vatRate
             ]);
        } else {
             http_response_code(500);
             echo json_encode(["message" => "Error creating service"]);
        }
    }
}
elseif ($method == 'PUT') {
    $data = json_decode(file_get_contents("php://input"));
    if(!empty($data->id)) {
        $query = "UPDATE services SET name = :name, description = :desc, unit_price = :price, vat_rate = :vat WHERE id = :id AND user_id = :uid";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":uid", $userId);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":desc", $data->description);
        $stmt->bindParam(":price", $data->unitPrice);
        $stmt->bindParam(":vat", $data->vatRate);

        if ($stmt->execute()) {
             echo json_encode($data);
        } else {
             http_response_code(500);
             echo json_encode(["message" => "Error updating service"]);
        }
    }
}
elseif ($method == 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $query = "DELETE FROM services WHERE id = :id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":user_id", $userId);
        if ($stmt->execute()) {
             echo json_encode(["message" => "Deleted"]);
        } else {
             http_response_code(500);
             echo json_encode(["message" => "Failed to delete"]);
        }
    }
}
