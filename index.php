<?php
declare(strict_types=1);

// ตั้งค่า default response เป็น JSON
header('Content-Type: application/json; charset=utf-8');

// อ่าน method และ path
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri    = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';

// Helper: ส่ง JSON + สถานะ
function send_json($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Helper: สร้าง/แคช PDO
function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_PERSISTENT         => true,
        PDO::ATTR_TIMEOUT            => 60,
    ];
    // ปรับ host/db/user/pass ให้ตรงสภาพแวดล้อมจริง
    $pdo = new PDO(
        'mysql:host=container_mysql;dbname=testdb;charset=utf8mb4',
        'testuser',
        'testpass',
        $options
    );
    return $pdo;
}

// Routing แบบเรียบง่าย
switch (true) {

    // GET /
    case $uri === '/' && $method === 'GET':
        send_json(['message' => 'Hello World from PHP (Nginx + FPM + MySQL)']);

    // POST /users
    case $uri === '/users' && $method === 'POST':
        $raw  = file_get_contents('php://input');
        $data = json_decode($raw, true);

        if (!is_array($data) || empty($data['username']) || empty($data['email'])) {
            send_json(['error' => 'Name and email are required'], 400);
        }

        try {
            $pdo  = db();
            // ถ้าต้องการ ACID แบบชัวร์ ให้เปิด transaction ได้:
            // $pdo->beginTransaction();

            $stmt = $pdo->prepare('INSERT INTO users (username, email) VALUES (?, ?)');
            $stmt->execute([$data['username'], $data['email']]);
            $id = (int) $pdo->lastInsertId();

            // $pdo->commit();

            send_json(['message' => 'User created successfully', 'user_id' => $id], 201);
        } catch (PDOException $e) {
            // ถ้าใช้ transaction:
            // if ($pdo?->inTransaction()) $pdo->rollBack();
            send_json(['error' => $e->getMessage()], 500);
        }

    // GET /users/{id}
    case $method === 'GET' && preg_match('#^/users/(\d+)$#', $uri, $m):
        $userId = (int) $m[1];

        try {
            $pdo  = db();
            $stmt = $pdo->prepare('SELECT user_id, username, email FROM users WHERE user_id = ?');
            $stmt->execute([$userId]);
            $row = $stmt->fetch();

            if (!$row) {
                send_json(['error' => 'Not Found'], 404);
            }
            send_json($row, 200);
        } catch (PDOException $e) {
            send_json(['error' => $e->getMessage()], 500);
        }

    // ไม่ตรง route ใด ๆ
    default:
        send_json(['error' => 'Not Found'], 404);
}
