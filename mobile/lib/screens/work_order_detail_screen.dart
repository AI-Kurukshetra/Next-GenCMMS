import 'package:flutter/material.dart';

import '../models/work_order.dart';

class WorkOrderDetailScreen extends StatefulWidget {
  const WorkOrderDetailScreen({
    super.key,
    required this.workOrder,
    required this.onSave,
  });

  final WorkOrder workOrder;
  final Future<void> Function(String status, String notes) onSave;

  @override
  State<WorkOrderDetailScreen> createState() => _WorkOrderDetailScreenState();
}

class _WorkOrderDetailScreenState extends State<WorkOrderDetailScreen> {
  static const _statuses = ['open', 'assigned', 'in_progress', 'completed', 'cancelled'];

  late String _status;
  late TextEditingController _notesController;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _status = widget.workOrder.status;
    _notesController = TextEditingController(text: widget.workOrder.notes ?? '');
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await widget.onSave(_status, _notesController.text.trim());
      if (!mounted) return;
      Navigator.of(context).pop();
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Work Order Details')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(widget.workOrder.title,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Text(widget.workOrder.assetName,
              style: const TextStyle(color: Color(0xFF475569))),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _status,
            decoration: const InputDecoration(
              labelText: 'Status',
              border: OutlineInputBorder(),
            ),
            items: _statuses
                .map((s) => DropdownMenuItem(value: s, child: Text(s.replaceAll('_', ' '))))
                .toList(),
            onChanged: (v) {
              if (v != null) setState(() => _status = v);
            },
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _notesController,
            minLines: 4,
            maxLines: 8,
            decoration: const InputDecoration(
              labelText: 'Technician notes',
              border: OutlineInputBorder(),
              hintText: 'Add findings, work completed, and observations',
            ),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _saving ? null : _save,
            icon: _saving
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.save_outlined),
            label: Text(_saving ? 'Saving...' : 'Save Update'),
          ),
          const SizedBox(height: 8),
          const Text(
            'Works offline: updates are queued and synced automatically when internet is available.',
            style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }
}
