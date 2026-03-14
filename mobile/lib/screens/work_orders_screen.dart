import 'package:flutter/material.dart';

import '../models/work_order.dart';

class WorkOrdersScreen extends StatelessWidget {
  const WorkOrdersScreen({
    super.key,
    required this.workOrders,
    required this.pendingSyncCount,
    required this.isOnline,
    required this.onRefresh,
    required this.onSyncNow,
    required this.onOpenDetails,
  });

  final List<WorkOrder> workOrders;
  final int pendingSyncCount;
  final bool isOnline;
  final Future<void> Function() onRefresh;
  final Future<void> Function() onSyncNow;
  final void Function(WorkOrder workOrder) onOpenDetails;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isOnline ? const Color(0xFFECFDF3) : const Color(0xFFFFF7ED),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isOnline ? const Color(0xFF86EFAC) : const Color(0xFFFED7AA),
            ),
          ),
          child: Row(
            children: [
              Icon(
                isOnline ? Icons.cloud_done_outlined : Icons.cloud_off_outlined,
                color: isOnline ? const Color(0xFF15803D) : const Color(0xFFC2410C),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  isOnline
                      ? 'Online mode. ${pendingSyncCount == 0 ? 'All updates synced.' : '$pendingSyncCount pending updates.'}'
                      : 'Offline mode. Changes will be queued for sync.',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              TextButton(
                onPressed: onSyncNow,
                child: const Text('Sync now'),
              ),
            ],
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: onRefresh,
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              itemCount: workOrders.length,
              itemBuilder: (context, index) {
                final wo = workOrders[index];
                return Card(
                  elevation: 0,
                  margin: const EdgeInsets.only(bottom: 10),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(14),
                    title: Text(
                      wo.title,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    subtitle: Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(wo.assetName),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              _Chip(label: wo.priority.toUpperCase(), color: _priorityColor(wo.priority)),
                              const SizedBox(width: 6),
                              _Chip(label: wo.status.replaceAll('_', ' '), color: _statusColor(wo.status)),
                              if (!wo.isSynced) ...[
                                const SizedBox(width: 6),
                                const _Chip(label: 'PENDING SYNC', color: Color(0xFFF59E0B)),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => onOpenDetails(wo),
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }

  Color _priorityColor(String value) {
    switch (value) {
      case 'critical':
        return const Color(0xFFDC2626);
      case 'high':
        return const Color(0xFFEA580C);
      case 'medium':
        return const Color(0xFF2563EB);
      default:
        return const Color(0xFF4B5563);
    }
  }

  Color _statusColor(String value) {
    switch (value) {
      case 'completed':
        return const Color(0xFF16A34A);
      case 'in_progress':
        return const Color(0xFF7C3AED);
      case 'assigned':
        return const Color(0xFF0EA5E9);
      default:
        return const Color(0xFF4B5563);
    }
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }
}
