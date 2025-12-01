<?php
// IMPORTANT: For production, you MUST restrict this to your specific frontend domain.
// Example: header("Access-Control-Allow-Origin: https://app.codemotard.fr");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    public function __construct() {
        $config = require __DIR__ . '/../config/database.php';
        $this->host = $config['host'];
        $this->db_name = $config['dbname'];
        $this->username = $config['user'];
        $this->password = $config['password'];
    }

    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4";

            $this->conn = new PDO(
                $dsn,
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]
            );

        } catch(PDOException $exception) {

            // DEBUG MODE — TEMPORARY
            http_response_code(500);
            echo json_encode([
                "error" => "Connection error",
                "details" => $exception->getMessage(),   // ← IMPORTANT for diagnosis
                "host" => $this->host,
                "dbname" => $this->db_name,
                "username" => $this->username
            ]);
            exit;
        }

        return $this->conn;
    }
}


// Helper to authenticate request
function authenticate($db) {
    $headers = getallheaders();
    $token = null;

    if (isset($headers['Authorization'])) {
        $token = str_replace('Bearer ', '', $headers['Authorization']);
    }

    if (!$token) return null;

    $query = "SELECT user_id FROM sessions WHERE token = :token AND expires_at > NOW() LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":token", $token);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['user_id'];
    }

    return null;
}
