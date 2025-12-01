<?php
require_once 'db.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));
$method = $_SERVER['REQUEST_METHOD'];

// Helper to cleanup old sessions
function cleanupSessions($db) {
    $stmt = $db->prepare("DELETE FROM sessions WHERE expires_at < NOW()");
    $stmt->execute();
}

if ($method == 'POST' && isset($_GET['action']) && $_GET['action'] == 'login') {
    if(!empty($data->email) && !empty($data->password)) {
        $query = "SELECT id, name, email, password_hash FROM users WHERE email = :email LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":email", $data->email);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if(password_verify($data->password, $row['password_hash'])) {

                // Generate secure token
                $token = bin2hex(random_bytes(32));
                $expires = date('Y-m-d H:i:s', strtotime('+24 hours'));

                // Store session
                $sessQuery = "INSERT INTO sessions (token, user_id, expires_at) VALUES (:token, :uid, :exp)";
                $sessStmt = $db->prepare($sessQuery);
                $sessStmt->bindParam(":token", $token);
                $sessStmt->bindParam(":uid", $row['id']);
                $sessStmt->bindParam(":exp", $expires);
                $sessStmt->execute();

                cleanupSessions($db);

                echo json_encode([
                    "token" => $token,
                    "user" => [
                        "id" => $row['id'],
                        "name" => $row['name'],
                        "email" => $row['email']
                    ]
                ]);
            } else {
                http_response_code(401);
                echo json_encode(["message" => "Invalid password."]);
            }
        } else {
            http_response_code(404);
            echo json_encode(["message" => "User not found."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Incomplete data."]);
    }
}
elseif ($method == 'POST' && isset($_GET['action']) && $_GET['action'] == 'register') {
    if(!empty($data->email) && !empty($data->password) && !empty($data->name)) {
        $query = "INSERT INTO users (id, name, email, password_hash) VALUES (:id, :name, :email, :password_hash)";
        $stmt = $db->prepare($query);

        $id = uniqid('u-');
        $password_hash = password_hash($data->password, PASSWORD_BCRYPT);

        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":email", $data->email);
        $stmt->bindParam(":password_hash", $password_hash);

        try {
            if($stmt->execute()) {
                // Auto-login after register
                $token = bin2hex(random_bytes(32));
                $expires = date('Y-m-d H:i:s', strtotime('+24 hours'));

                $sessQuery = "INSERT INTO sessions (token, user_id, expires_at) VALUES (:token, :uid, :exp)";
                $sessStmt = $db->prepare($sessQuery);
                $sessStmt->bindParam(":token", $token);
                $sessStmt->bindParam(":uid", $id);
                $sessStmt->bindParam(":exp", $expires);
                $sessStmt->execute();

                echo json_encode([
                    "token" => $token,
                    "user" => [
                        "id" => $id,
                        "name" => $data->name,
                        "email" => $data->email
                    ]
                ]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "Unable to register user."]);
            }
        } catch (PDOException $e) {
            http_response_code(400);
            echo json_encode(["message" => "Registration failed: " . $e->getMessage()]);
        }
    }
}
elseif ($method == 'POST' && isset($_GET['action']) && $_GET['action'] == 'forgot_password') {
    if(!empty($data->email)) {
        // Logic to generate token and "send email"
        $query = "SELECT id FROM users WHERE email = :email";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":email", $data->email);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $token = bin2hex(random_bytes(32));
            $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));

            $insQuery = "INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (:id, :uid, :token, :exp)";
            $insStmt = $db->prepare($insQuery);
            $tokenId = uniqid('prt-');
            $insStmt->bindParam(":id", $tokenId);
            $insStmt->bindParam(":uid", $row['id']);
            $insStmt->bindParam(":token", $token);
            $insStmt->bindParam(":exp", $expires);
            $insStmt->execute();

            // In real app, send email here.
            echo json_encode(["success" => true, "message" => "If email exists, reset link sent."]);
        } else {
             // Don't reveal user existence
             echo json_encode(["success" => true, "message" => "If email exists, reset link sent."]);
        }
    }
}
elseif ($method == 'POST' && isset($_GET['action']) && $_GET['action'] == 'reset_password') {
    if(!empty($data->token) && !empty($data->newPassword)) {
        $query = "SELECT user_id FROM password_reset_tokens WHERE token = :token AND expires_at > NOW() AND used_at IS NULL";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":token", $data->token);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $newHash = password_hash($data->newPassword, PASSWORD_BCRYPT);

            $updQuery = "UPDATE users SET password_hash = :hash WHERE id = :uid";
            $updStmt = $db->prepare($updQuery);
            $updStmt->bindParam(":hash", $newHash);
            $updStmt->bindParam(":uid", $row['user_id']);

            if ($updStmt->execute()) {
                // Mark token used
                $markQuery = "UPDATE password_reset_tokens SET used_at = NOW() WHERE token = :token";
                $markStmt = $db->prepare($markQuery);
                $markStmt->bindParam(":token", $data->token);
                $markStmt->execute();

                echo json_encode(["success" => true, "message" => "Password updated."]);
            } else {
                http_response_code(500);
                echo json_encode(["message" => "Update failed."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Invalid or expired token."]);
        }
    }
}
else {
    http_response_code(404);
    echo json_encode(["message" => "Endpoint not found."]);
}
