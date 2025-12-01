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
        id, user_id as userId, name, email, address, siret, notes,
        created_at as createdAt, updated_at as updatedAt
        FROM clients WHERE user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $userId);
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}
elseif ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    if(!empty($data->name)) {
        $id = $data->id ?? uniqid('c-');
        $query = "INSERT INTO clients (id, user_id, name, email, address, siret, notes) VALUES (:id, :uid, :name, :email, :addr, :siret, :notes)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":uid", $userId);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":email", $data->email);
        $stmt->bindParam(":addr", $data->address);
        $stmt->bindParam(":siret", $data->siret);
        $stmt->bindParam(":notes", $data->notes);
        if ($stmt->execute()) {
             // Return camelCase object
             echo json_encode([
                 "id" => $id, "userId" => $userId, "name" => $data->name,
                 "email" => $data->email, "address" => $data->address,
                 "siret" => $data->siret, "notes" => $data->notes
             ]);
        } else {
             http_response_code(500);
             echo json_encode(["message" => "Error creating client"]);
        }
    }
}
elseif ($method == 'PUT') {
    $data = json_decode(file_get_contents("php://input"));
    if(!empty($data->id)) {
        $query = "UPDATE clients SET name = :name, email = :email, address = :addr, siret = :siret, notes = :notes WHERE id = :id AND user_id = :uid";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":uid", $userId);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":email", $data->email);
        $stmt->bindParam(":addr", $data->address);
        $stmt->bindParam(":siret", $data->siret);
        $stmt->bindParam(":notes", $data->notes);
        if ($stmt->execute()) {
             echo json_encode($data);
        } else {
             http_response_code(500);
             echo json_encode(["message" => "Error updating client"]);
        }
    }
}
elseif ($method == 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $query = "DELETE FROM clients WHERE id = :id AND user_id = :user_id";
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
