import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/work_order.dart';
import 'local_store.dart';
import 'supabase_config.dart';

class WorkOrderRepository {
  WorkOrderRepository(this._localStore);

  final LocalStore _localStore;

  Future<List<WorkOrder>> loadWorkOrders({
    required bool isOnline,
    required String userId,
  }) async {
    if (!isOnline || !SupabaseConfig.isConfigured) {
      return _localStore.getWorkOrders();
    }

    try {
      dynamic response;
      try {
        response = await Supabase.instance.client
            .from('work_orders')
            .select('id,title,status,priority,updated_at,assets(name)')
            .or('assigned_to.eq.$userId,created_by.eq.$userId')
            .order('updated_at', ascending: false)
            .limit(100);
      } catch (_) {
        // Fallback query if project schema differs from expected assigned fields.
        response = await Supabase.instance.client
            .from('work_orders')
            .select('id,title,status,priority,updated_at,assets(name)')
            .order('updated_at', ascending: false)
            .limit(100);
      }

      final orders = (response as List<dynamic>).map((row) {
        final map = row as Map<String, dynamic>;
        final asset = map['assets'];
        final assetName = asset is Map<String, dynamic>
            ? (asset['name']?.toString() ?? 'Unknown Asset')
            : 'Unknown Asset';
        return WorkOrder(
          id: map['id'] as String,
          title: map['title'] as String? ?? 'Untitled',
          status: map['status'] as String? ?? 'open',
          priority: map['priority'] as String? ?? 'medium',
          assetName: assetName,
          updatedAt: DateTime.tryParse(map['updated_at'] as String? ?? '') ??
              DateTime.now(),
          isSynced: true,
        );
      }).toList();

      await _localStore.upsertWorkOrders(orders);
      return orders;
    } catch (_) {
      // Fallback to local cache when remote fetch fails.
      return _localStore.getWorkOrders();
    }
  }

  Future<void> updateWorkOrder({
    required String workOrderId,
    required String status,
    required String? notes,
    required bool isOnline,
  }) async {
    await _localStore.updateWorkOrderOffline(
      workOrderId: workOrderId,
      status: status,
      notes: notes,
    );

    if (isOnline) {
      await syncPendingChanges();
    }
  }

  Future<int> getPendingSyncCount() => _localStore.pendingQueueCount();

  Future<void> syncPendingChanges() async {
    if (!SupabaseConfig.isConfigured) return;

    final queue = await _localStore.getSyncQueue();
    for (final item in queue) {
      final queueId = item['id'] as int;
      final workOrderId = item['work_order_id'] as String;
      final status = item['status'] as String;
      final notes = item['notes'] as String?;

      try {
        await Supabase.instance.client.from('work_orders').update({
          'status': status,
          'description': notes,
          'updated_at': DateTime.now().toIso8601String(),
        }).eq('id', workOrderId);

        await _localStore.markSynced(workOrderId);
        await _localStore.removeFromQueue(queueId);
      } catch (_) {
        break;
      }
    }
  }
}
