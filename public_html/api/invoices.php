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
    // List Invoices
    $query = "SELECT
        id, user_id as userId, client_id as clientId, type, number, date,
        due_date as dueDate, status, notes, subtotal, tax_amount as taxAmount,
        total, converted_from_quote_id as convertedFromQuoteId,
        source_recurring_invoice_id as sourceRecurringInvoiceId,
        created_at as createdAt, updated_at as updatedAt
        FROM invoices WHERE user_id = :user_id ORDER BY created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $userId);
    $stmt->execute();
    $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($invoices as &$inv) {
        $qItems = "SELECT
            id, invoice_id as invoiceId, description, quantity, price, vat_rate as vatRate, service_id as serviceId
            FROM invoice_items WHERE invoice_id = :inv_id";
        $sItems = $db->prepare($qItems);
        $sItems->bindParam(":inv_id", $inv['id']);
        $sItems->execute();
        $inv['items'] = $sItems->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode($invoices);
}
elseif ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    if(!empty($data->clientId) && !empty($data->items)) {
        try {
            $db->beginTransaction();

            $invId = $data->id ?? uniqid('inv-');

            $query = "INSERT INTO invoices
                (id, user_id, client_id, type, number, date, due_date, status, notes, subtotal, tax_amount, total, converted_from_quote_id)
                VALUES
                (:id, :user_id, :client_id, :type, :number, :date, :due_date, :status, :notes, :subtotal, :tax_amount, :total, :converted_from)";

            $stmt = $db->prepare($query);
            $stmt->bindParam(":id", $invId);
            $stmt->bindParam(":user_id", $userId);
            $stmt->bindParam(":client_id", $data->clientId);
            $stmt->bindParam(":type", $data->type);
            $stmt->bindParam(":number", $data->number);
            $stmt->bindParam(":date", $data->date);
            $stmt->bindParam(":due_date", $data->dueDate);
            $stmt->bindParam(":status", $data->status);
            $stmt->bindParam(":notes", $data->notes);
            $stmt->bindParam(":subtotal", $data->subtotal);
            $stmt->bindParam(":tax_amount", $data->taxAmount);
            $stmt->bindParam(":total", $data->total);
            $stmt->bindParam(":converted_from", $data->convertedFromQuoteId);

            $stmt->execute();

            foreach ($data->items as $item) {
                $itemId = uniqid('ii-');
                $qItem = "INSERT INTO invoice_items (id, invoice_id, description, quantity, price, vat_rate, service_id)
                          VALUES (:id, :inv_id, :desc, :qty, :price, :vat, :svc)";
                $sItem = $db->prepare($qItem);
                $sItem->bindParam(":id", $itemId);
                $sItem->bindParam(":inv_id", $invId);
                $sItem->bindParam(":desc", $item->description);
                $sItem->bindParam(":qty", $item->quantity);
                $sItem->bindParam(":price", $item->price);
                $sItem->bindParam(":vat", $item->vatRate);
                $svc = isset($item->serviceId) ? $item->serviceId : null;
                $sItem->bindParam(":svc", $svc);
                $sItem->execute();
            }

            $db->commit();
            echo json_encode(["message" => "Invoice created", "id" => $invId]);
        } catch (Exception $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Missing clientId or items"]);
    }
}
elseif ($method == 'PUT') {
     $data = json_decode(file_get_contents("php://input"));
     if (!empty($data->id)) {
        try {
            $db->beginTransaction();

            $checkQ = "SELECT id FROM invoices WHERE id = :id AND user_id = :uid";
            $checkStmt = $db->prepare($checkQ);
            $checkStmt->bindParam(":id", $data->id);
            $checkStmt->bindParam(":uid", $userId);
            $checkStmt->execute();
            if ($checkStmt->rowCount() == 0) {
                throw new Exception("Invoice not found or unauthorized");
            }

            $query = "UPDATE invoices SET
                client_id = :client_id, type = :type, number = :number, date = :date,
                due_date = :due_date, status = :status, notes = :notes,
                subtotal = :subtotal, tax_amount = :tax_amount, total = :total
                WHERE id = :id AND user_id = :user_id";

            $stmt = $db->prepare($query);
            $stmt->bindParam(":id", $data->id);
            $stmt->bindParam(":user_id", $userId);
            $stmt->bindParam(":client_id", $data->clientId);
            $stmt->bindParam(":type", $data->type);
            $stmt->bindParam(":number", $data->number);
            $stmt->bindParam(":date", $data->date);
            $stmt->bindParam(":due_date", $data->dueDate);
            $stmt->bindParam(":status", $data->status);
            $stmt->bindParam(":notes", $data->notes);
            $stmt->bindParam(":subtotal", $data->subtotal);
            $stmt->bindParam(":tax_amount", $data->taxAmount);
            $stmt->bindParam(":total", $data->total);
            $stmt->execute();

            $delItems = "DELETE FROM invoice_items WHERE invoice_id = :inv_id";
            $delStmt = $db->prepare($delItems);
            $delStmt->bindParam(":inv_id", $data->id);
            $delStmt->execute();

            foreach ($data->items as $item) {
                $itemId = uniqid('ii-');
                $qItem = "INSERT INTO invoice_items (id, invoice_id, description, quantity, price, vat_rate, service_id)
                          VALUES (:id, :inv_id, :desc, :qty, :price, :vat, :svc)";
                $sItem = $db->prepare($qItem);
                $sItem->bindParam(":id", $itemId);
                $sItem->bindParam(":inv_id", $data->id);
                $sItem->bindParam(":desc", $item->description);
                $sItem->bindParam(":qty", $item->quantity);
                $sItem->bindParam(":price", $item->price);
                $sItem->bindParam(":vat", $item->vatRate);
                $svc = isset($item->serviceId) ? $item->serviceId : null;
                $sItem->bindParam(":svc", $svc);
                $sItem->execute();
            }

            $db->commit();
            echo json_encode(["message" => "Invoice updated"]);

        } catch (Exception $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
     } else {
         http_response_code(400);
         echo json_encode(["message" => "ID required for update"]);
     }
}
elseif ($method == 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $query = "DELETE FROM invoices WHERE id = :id AND user_id = :user_id";
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
