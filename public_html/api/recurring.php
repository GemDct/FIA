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
    // List Recurring Invoices
    $query = "SELECT
        id, user_id as userId, client_id as clientId, label, frequency,
        start_date as startDate, end_date as endDate, next_run_date as nextRunDate,
        last_run_date as lastRunDate,
        is_active as isActive, created_at as createdAt, updated_at as updatedAt
        FROM recurring_invoices WHERE user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $userId);
    $stmt->execute();
    $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Convert boolean types
    foreach ($invoices as &$inv) {
        $inv['isActive'] = (bool)$inv['isActive'];
    }

    echo json_encode($invoices);
}
elseif ($method == 'POST') {
    // ... (rest of the file as previously written, ensuring camelCase returns where appropriate)
    // I already updated the process_due part to return camelCase.

    $data = json_decode(file_get_contents("php://input"));

    if (isset($_GET['action']) && $_GET['action'] == 'process_due') {
        // Logic repeated from previous step for context, but I won't rewrite the whole file just for this comment
        // ... see previous step ...
        // Re-writing the process_due logic to ensure it's preserved in this overwrite
         $today = date('Y-m-d');

        $query = "SELECT * FROM recurring_invoices WHERE user_id = :uid AND is_active = 1 AND next_run_date <= :today";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":uid", $userId);
        $stmt->bindParam(":today", $today);
        $stmt->execute();
        $dueInvoices = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $generated = [];
        $updatedRecurring = [];

        foreach ($dueInvoices as $rec) {
            try {
                $db->beginTransaction();

                $invId = uniqid('inv-');
                $number = 'INV-' . date('Ymd') . '-' . substr($invId, -4);
                $invDate = $today;
                $status = 'DRAFT';

                $insInv = "INSERT INTO invoices (id, user_id, client_id, type, number, date, status, subtotal, tax_amount, total, source_recurring_invoice_id)
                           VALUES (:id, :uid, :cid, 'INVOICE', :num, :date, :status, 0, 0, 0, :src)";
                $sInv = $db->prepare($insInv);
                $sInv->bindParam(":id", $invId);
                $sInv->bindParam(":uid", $userId);
                $sInv->bindParam(":cid", $rec['client_id']);
                $sInv->bindParam(":num", $number);
                $sInv->bindParam(":date", $invDate);
                $sInv->bindParam(":status", $status);
                $sInv->bindParam(":src", $rec['id']);
                $sInv->execute();

                $nextDate = $rec['next_run_date'];
                if ($rec['frequency'] == 'WEEKLY') {
                    $nextDate = date('Y-m-d', strtotime($nextDate . ' +1 week'));
                } elseif ($rec['frequency'] == 'MONTHLY') {
                    $nextDate = date('Y-m-d', strtotime($nextDate . ' +1 month'));
                } elseif ($rec['frequency'] == 'YEARLY') {
                    $nextDate = date('Y-m-d', strtotime($nextDate . ' +1 year'));
                }

                $updRec = "UPDATE recurring_invoices SET last_run_date = :last, next_run_date = :next WHERE id = :id";
                $sUpd = $db->prepare($updRec);
                $sUpd->bindParam(":last", $today);
                $sUpd->bindParam(":next", $nextDate);
                $sUpd->bindParam(":id", $rec['id']);
                $sUpd->execute();

                $db->commit();

                $generated[] = [
                    "id" => $invId,
                    "userId" => $userId,
                    "clientId" => $rec['client_id'],
                    "number" => $number,
                    "date" => $invDate,
                    "status" => $status,
                    "total" => 0
                ];

                $updatedRecurring[] = [
                    "id" => $rec['id'],
                    "userId" => $rec['user_id'],
                    "clientId" => $rec['client_id'],
                    "label" => $rec['label'],
                    "frequency" => $rec['frequency'],
                    "startDate" => $rec['start_date'],
                    "endDate" => $rec['end_date'],
                    "nextRunDate" => $nextDate,
                    "lastRunDate" => $today,
                    "isActive" => (bool)$rec['is_active']
                ];

            } catch (Exception $e) {
                $db->rollBack();
            }
        }

        echo json_encode(["generatedInvoices" => $generated, "updatedRecurringInvoices" => $updatedRecurring]);
        exit;
    }

    if(!empty($data->clientId) && !empty($data->label)) {
        $id = $data->id ?? uniqid('ri-');
        $query = "INSERT INTO recurring_invoices (id, user_id, client_id, label, frequency, start_date, end_date, next_run_date, is_active)
                  VALUES (:id, :uid, :cid, :label, :freq, :start, :end, :next, :active)";

        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":uid", $userId);
        $stmt->bindParam(":cid", $data->clientId);
        $stmt->bindParam(":label", $data->label);
        $stmt->bindParam(":freq", $data->frequency);
        $stmt->bindParam(":start", $data->startDate);
        $stmt->bindParam(":end", $data->endDate);

        $next = $data->nextRunDate ?? $data->startDate;
        $stmt->bindParam(":next", $next);

        $active = $data->isActive ? 1 : 0;
        $stmt->bindParam(":active", $active);

        if ($stmt->execute()) {
             echo json_encode(["id" => $id, "message" => "Recurring Invoice Created"]);
        } else {
             http_response_code(500);
             echo json_encode(["message" => "Error creating recurring invoice"]);
        }
    }
}
elseif ($method == 'PUT') {
    $data = json_decode(file_get_contents("php://input"));
    if(!empty($data->id)) {
        $query = "UPDATE recurring_invoices SET
            client_id = :cid, label = :label, frequency = :freq,
            start_date = :start, end_date = :end, next_run_date = :next, is_active = :active
            WHERE id = :id AND user_id = :uid";

        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":uid", $userId);
        $stmt->bindParam(":cid", $data->clientId);
        $stmt->bindParam(":label", $data->label);
        $stmt->bindParam(":freq", $data->frequency);
        $stmt->bindParam(":start", $data->startDate);
        $stmt->bindParam(":end", $data->endDate);

        $next = $data->nextRunDate ?? $data->startDate;
        $stmt->bindParam(":next", $next);

        $active = $data->isActive ? 1 : 0;
        $stmt->bindParam(":active", $active);

        if ($stmt->execute()) {
             echo json_encode(["message" => "Recurring Invoice Updated"]);
        } else {
             http_response_code(500);
             echo json_encode(["message" => "Error updating recurring invoice"]);
        }
    }
}
elseif ($method == 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $query = "DELETE FROM recurring_invoices WHERE id = :id AND user_id = :user_id";
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
