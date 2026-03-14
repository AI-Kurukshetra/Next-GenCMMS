class WorkOrder {
  WorkOrder({
    required this.id,
    required this.title,
    required this.status,
    required this.priority,
    required this.assetName,
    required this.updatedAt,
    this.notes,
    this.isSynced = true,
  });

  final String id;
  final String title;
  final String status;
  final String priority;
  final String assetName;
  final String? notes;
  final DateTime updatedAt;
  final bool isSynced;

  WorkOrder copyWith({
    String? status,
    String? notes,
    DateTime? updatedAt,
    bool? isSynced,
  }) {
    return WorkOrder(
      id: id,
      title: title,
      status: status ?? this.status,
      priority: priority,
      assetName: assetName,
      notes: notes ?? this.notes,
      updatedAt: updatedAt ?? this.updatedAt,
      isSynced: isSynced ?? this.isSynced,
    );
  }

  factory WorkOrder.fromMap(Map<String, dynamic> map) {
    return WorkOrder(
      id: map['id'] as String,
      title: map['title'] as String,
      status: map['status'] as String,
      priority: map['priority'] as String,
      assetName: (map['asset_name'] ?? 'Unknown Asset') as String,
      notes: map['notes'] as String?,
      updatedAt: DateTime.parse(map['updated_at'] as String),
      isSynced: (map['is_synced'] as int? ?? 1) == 1,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'status': status,
      'priority': priority,
      'asset_name': assetName,
      'notes': notes,
      'updated_at': updatedAt.toIso8601String(),
      'is_synced': isSynced ? 1 : 0,
    };
  }
}
