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

        // Fetch items for each recurring invoice to be consistent
        $qItems = "SELECT
            id, recurring_invoice_id as recurringInvoiceId, description, quantity, price, vat_rate as vatRate, service_id as serviceId
            FROM recurring_invoice_items WHERE recurring_invoice_id = :rid";
        $sItems = $db->prepare($qItems);
        $sItems->bindParam(":rid", $inv['id']);
        $sItems->execute();
        $inv['items'] = $sItems->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode($invoices);
}
elseif ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    // ACTION: PROCESS DUE
    if (isset($_GET['action']) && $_GET['action'] == 'process_due') {
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

                // Fetch template items
                $qItems = "SELECT * FROM recurring_invoice_items WHERE recurring_invoice_id = :rid";
                $sItems = $db->prepare($qItems);
                $sItems->bindParam(":rid", $rec['id']);
                $sItems->execute();
                $items = $sItems->fetchAll(PDO::FETCH_ASSOC);

                // Calculate Totals
                $subtotal = 0;
                $taxAmount = 0;

                foreach ($items as $item) {
                    $lineTotal = $item['quantity'] * $item['price'];
                    $lineTax = $lineTotal * ($item['vat_rate'] / 100);
                    $subtotal += $lineTotal;
                    $taxAmount += $lineTax;
                }
                $total = $subtotal + $taxAmount;

                // Create Invoice
                $invId = uniqid('inv-');
                $number = 'INV-' . date('Ymd') . '-' . substr($invId, -4);
                $invDate = $today;
                $status = 'DRAFT';

                $insInv = "INSERT INTO invoices (id, user_id, client_id, type, number, date, status, subtotal, tax_amount, total, source_recurring_invoice_id)
                           VALUES (:id, :uid, :cid, 'INVOICE', :num, :date, :status, :sub, :tax, :tot, :src)";
                $sInv = $db->prepare($insInv);
                $sInv->bindParam(":id", $invId);
                $sInv->bindParam(":uid", $userId);
                $sInv->bindParam(":cid", $rec['client_id']);
                $sInv->bindParam(":num", $number);
                $sInv->bindParam(":date", $invDate);
                $sInv->bindParam(":status", $status);
                $sInv->bindParam(":sub", $subtotal);
                $sInv->bindParam(":tax", $taxAmount);
                $sInv->bindParam(":tot", $total);
                $sInv->bindParam(":src", $rec['id']);
                $sInv->execute();

                // Insert Invoice Items
                foreach ($items as $item) {
                    $invItemId = uniqid('ii-');
                    $insItem = "INSERT INTO invoice_items (id, invoice_id, description, quantity, price, vat_rate, service_id)
                                VALUES (:id, :inv_id, :desc, :qty, :price, :vat, :svc)";
                    $sItem = $db->prepare($insItem);
                    $sItem->bindParam(":id", $invItemId);
                    $sItem->bindParam(":inv_id", $invId);
                    $sItem->bindParam(":desc", $item['description']);
                    $sItem->bindParam(":qty", $item['quantity']);
                    $sItem->bindParam(":price", $item['price']);
                    $sItem->bindParam(":vat", $item['vat_rate']);
                    $sItem->bindParam(":svc", $item['service_id']);
                    $sItem->execute();
                }

                // Calculate next date
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
                    "subtotal" => $subtotal,
                    "taxAmount" => $taxAmount,
                    "total" => $total
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

    // CREATE RECURRING INVOICE
    if(!empty($data->clientId) && !empty($data->label)) {
        try {
            $db->beginTransaction();
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
            $stmt->execute();

            // Insert Items
            if (!empty($data->items) && is_array($data->items)) {
                foreach ($data->items as $item) {
                    $itemId = uniqid('rii-');
                    $qItem = "INSERT INTO recurring_invoice_items (id, recurring_invoice_id, description, quantity, price, vat_rate, service_id)
                              VALUES (:id, :rid, :desc, :qty, :price, :vat, :svc)";
                    $sItem = $db->prepare($qItem);
                    $sItem->bindParam(":id", $itemId);
                    $sItem->bindParam(":rid", $id);
                    $sItem->bindParam(":desc", $item->description);
                    $sItem->bindParam(":qty", $item->quantity);
                    $sItem->bindParam(":price", $item->price);
                    $sItem->bindParam(":vat", $item->vatRate);
                    $svc = isset($item->serviceId) ? $item->serviceId : null;
                    $sItem->bindParam(":svc", $svc);
                    $sItem->execute();
                }
            }

            $db->commit();
            echo json_encode(["id" => $id, "message" => "Recurring Invoice Created"]);
        } catch (Exception $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(["message" => "Error creating recurring invoice: " . $e->getMessage()]);
        }
    }
}
elseif ($method == 'PUT') {
    $data = json_decode(file_get_contents("php://input"));
    if(!empty($data->id)) {
        try {
            $db->beginTransaction();
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
            $stmt->execute();

            // Update Items (Delete & Re-insert)
            $delQ = "DELETE FROM recurring_invoice_items WHERE recurring_invoice_id = :rid";
            $delStmt = $db->prepare($delQ);
            $delStmt->bindParam(":rid", $data->id);
            $delStmt->execute();

            if (!empty($data->items) && is_array($data->items)) {
                foreach ($data->items as $item) {
                    $itemId = uniqid('rii-');
                    $qItem = "INSERT INTO recurring_invoice_items (id, recurring_invoice_id, description, quantity, price, vat_rate, service_id)
                              VALUES (:id, :rid, :desc, :qty, :price, :vat, :svc)";
                    $sItem = $db->prepare($qItem);
                    $sItem->bindParam(":id", $itemId);
                    $sItem->bindParam(":rid", $data->id);
                    $sItem->bindParam(":desc", $item->description);
                    $sItem->bindParam(":qty", $item->quantity);
                    $sItem->bindParam(":price", $item->price);
                    $sItem->bindParam(":vat", $item->vatRate);
                    $svc = isset($item->serviceId) ? $item->serviceId : null;
                    $sItem->bindParam(":svc", $svc);
                    $sItem->execute();
                }
            }

            $db->commit();
            echo json_encode(["message" => "Recurring Invoice Updated"]);
        } catch (Exception $e) {
            $db->rollBack();
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
