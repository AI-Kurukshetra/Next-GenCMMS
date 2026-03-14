import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';

import '../models/work_order.dart';

class LocalStore {
  Database? _db;

  Future<Database> _database() async {
    if (_db != null) return _db!;

    final dbPath = await getDatabasesPath();
    final path = p.join(dbPath, 'assetops_mobile.db');

    _db = await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE work_orders (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            status TEXT NOT NULL,
            priority TEXT NOT NULL,
            asset_name TEXT NOT NULL,
            notes TEXT,
            updated_at TEXT NOT NULL,
            is_synced INTEGER NOT NULL
          )
        ''');
        await db.execute('''
          CREATE TABLE sync_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            work_order_id TEXT NOT NULL,
            status TEXT NOT NULL,
            notes TEXT,
            updated_at TEXT NOT NULL
          )
        ''');
      },
    );

    return _db!;
  }

  Future<List<WorkOrder>> getWorkOrders() async {
    final db = await _database();
    final rows = await db.query('work_orders', orderBy: 'updated_at DESC');
    return rows.map(WorkOrder.fromMap).toList();
  }

  Future<void> upsertWorkOrders(List<WorkOrder> orders) async {
    final db = await _database();
    final batch = db.batch();
    for (final order in orders) {
      batch.insert(
        'work_orders',
        order.toMap(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }

  Future<void> updateWorkOrderOffline({
    required String workOrderId,
    required String status,
    required String? notes,
  }) async {
    final db = await _database();
    final now = DateTime.now().toIso8601String();

    await db.update(
      'work_orders',
      {
        'status': status,
        'notes': notes,
        'updated_at': now,
        'is_synced': 0,
      },
      where: 'id = ?',
      whereArgs: [workOrderId],
    );

    await db.insert('sync_queue', {
      'work_order_id': workOrderId,
      'status': status,
      'notes': notes,
      'updated_at': now,
    });
  }

  Future<List<Map<String, dynamic>>> getSyncQueue() async {
    final db = await _database();
    return db.query('sync_queue', orderBy: 'id ASC');
  }

  Future<void> removeFromQueue(int queueId) async {
    final db = await _database();
    await db.delete('sync_queue', where: 'id = ?', whereArgs: [queueId]);
  }

  Future<void> markSynced(String workOrderId) async {
    final db = await _database();
    await db.update(
      'work_orders',
      {'is_synced': 1},
      where: 'id = ?',
      whereArgs: [workOrderId],
    );
  }

  Future<int> pendingQueueCount() async {
    final db = await _database();
    final result = await db.rawQuery('SELECT COUNT(*) as count FROM sync_queue');
    return (result.first['count'] as int?) ?? 0;
  }
}
