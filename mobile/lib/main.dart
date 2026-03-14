import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'models/work_order.dart';
import 'screens/login_screen.dart';
import 'screens/scanner_screen.dart';
import 'screens/work_order_detail_screen.dart';
import 'screens/work_orders_screen.dart';
import 'services/local_store.dart';
import 'services/supabase_config.dart';
import 'services/work_order_repository.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (SupabaseConfig.isConfigured) {
    await Supabase.initialize(
      url: SupabaseConfig.url,
      anonKey: SupabaseConfig.anonKey,
    );
  }

  runApp(const AssetOpsMobileApp());
}

class AssetOpsMobileApp extends StatelessWidget {
  const AssetOpsMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AssetOps Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF4F46E5)),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFF0B1220),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0F172A),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: const Color(0xFF0F172A),
          indicatorColor: const Color(0xFF4F46E5),
          labelTextStyle: WidgetStateProperty.resolveWith<TextStyle?>((states) {
            if (states.contains(WidgetState.selected)) {
              return const TextStyle(color: Colors.white, fontWeight: FontWeight.w700);
            }
            return const TextStyle(color: Colors.white70);
          }),
        ),
      ),
      home: const AuthGate(),
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    if (!SupabaseConfig.isConfigured) {
      return const _SetupRequiredScreen();
    }

    return StreamBuilder<AuthState>(
      stream: Supabase.instance.client.auth.onAuthStateChange,
      initialData: AuthState(
        AuthChangeEvent.initialSession,
        Supabase.instance.client.auth.currentSession,
      ),
      builder: (context, snapshot) {
        final session = snapshot.data?.session;
        if (session == null) {
          return const LoginScreen();
        }
        return HomeScreen(userId: session.user.id);
      },
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.userId});

  final String userId;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _repository = WorkOrderRepository(LocalStore());
  final _connectivity = Connectivity();

  late StreamSubscription<List<ConnectivityResult>> _connectivitySub;
  List<WorkOrder> _workOrders = [];
  int _pendingSyncCount = 0;
  int _tabIndex = 0;
  bool _loading = true;
  bool _isOnline = false;

  @override
  void initState() {
    super.initState();
    _bootstrap();
    _connectivitySub = _connectivity.onConnectivityChanged.listen((
      results,
    ) async {
      final online = !results.contains(ConnectivityResult.none);
      if (_isOnline != online) {
        setState(() => _isOnline = online);
      }
      if (online) {
        await _repository.syncPendingChanges();
        await _loadData();
      }
    });
  }

  Future<void> _bootstrap() async {
    final current = await _connectivity.checkConnectivity();
    _isOnline = !current.contains(ConnectivityResult.none);
    await _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final workOrders = await _repository.loadWorkOrders(
      isOnline: _isOnline,
      userId: widget.userId,
    );
    final pendingCount = await _repository.getPendingSyncCount();
    if (!mounted) return;
    setState(() {
      _workOrders = workOrders;
      _pendingSyncCount = pendingCount;
      _loading = false;
    });
  }

  Future<void> _syncNow() async {
    await _repository.syncPendingChanges();
    await _loadData();
  }

  Future<void> _openDetails(WorkOrder workOrder) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => WorkOrderDetailScreen(
          workOrder: workOrder,
          onSave: (status, notes) => _repository.updateWorkOrder(
            workOrderId: workOrder.id,
            status: status,
            notes: notes,
            isOnline: _isOnline,
          ),
        ),
      ),
    );
    await _loadData();
  }

  Future<void> _signOut() async {
    await Supabase.instance.client.auth.signOut();
  }

  void _onScan(String code) {
    final message = code.startsWith('asset:') || code.startsWith('wo:')
        ? 'Scanned: $code. You can map this to asset/work-order lookup API.'
        : 'Scanned: $code';
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  void dispose() {
    _connectivitySub.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      _loading
          ? const Center(child: CircularProgressIndicator())
          : WorkOrdersScreen(
              workOrders: _workOrders,
              pendingSyncCount: _pendingSyncCount,
              isOnline: _isOnline,
              onRefresh: _loadData,
              onSyncNow: _syncNow,
              onOpenDetails: _openDetails,
            ),
      ScannerScreen(onCodeScanned: _onScan),
      _OfflineInfoScreen(
        pendingSyncCount: _pendingSyncCount,
        isOnline: _isOnline,
        onSyncNow: _syncNow,
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: Image.asset(
                'assets/app_icon.png',
                width: 42,
                height: 42,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              _tabIndex == 0
                  ? 'Work Orders'
                  : _tabIndex == 1
                  ? 'QR / Barcode Scanner'
                  : 'Offline Queue',
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: _signOut,
            tooltip: 'Sign out',
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF0B1220), Color(0xFF111827), Color(0xFF312E81)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: pages[_tabIndex],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tabIndex,
        onDestinationSelected: (idx) => setState(() => _tabIndex = idx),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.assignment_outlined, color: Colors.white70),
            selectedIcon: const Icon(Icons.assignment, color: Colors.white),
            label: 'Work',
          ),
          NavigationDestination(
            icon: const Icon(Icons.qr_code_scanner, color: Colors.white70),
            selectedIcon: const Icon(Icons.qr_code_scanner, color: Colors.white),
            label: 'Scan',
          ),
          NavigationDestination(
            icon: const Icon(Icons.cloud_off_outlined, color: Colors.white70),
            selectedIcon: const Icon(Icons.cloud_done, color: Colors.white),
            label: 'Offline',
          ),
        ],
      ),
    );
  }
}

class _SetupRequiredScreen extends StatelessWidget {
  const _SetupRequiredScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 540),
            child: Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              child: const Padding(
                padding: EdgeInsets.all(20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Mobile setup required',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    SizedBox(height: 10),
                    Text(
                      'This app now requires login. Run with Supabase config:',
                      style: TextStyle(color: Color(0xFF475569)),
                    ),
                    SizedBox(height: 10),
                    SelectableText(
                      'flutter run --dart-define=SUPABASE_URL=https://YOUR-PROJECT.supabase.co --dart-define=SUPABASE_ANON_KEY=YOUR_ANON_KEY',
                      style: TextStyle(fontFamily: 'monospace', fontSize: 13),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _OfflineInfoScreen extends StatelessWidget {
  const _OfflineInfoScreen({
    required this.pendingSyncCount,
    required this.isOnline,
    required this.onSyncNow,
  });

  final int pendingSyncCount;
  final bool isOnline;
  final Future<void> Function() onSyncNow;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
            side: const BorderSide(color: Color(0xFFE2E8F0)),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Basic Mobile Offline Mode',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 10),
                Text(
                  isOnline
                      ? 'Internet is available. You can sync queued updates now.'
                      : 'No internet connection. Continue working offline. Updates will sync when connected.',
                ),
                const SizedBox(height: 10),
                Text(
                  'Pending updates: $pendingSyncCount',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: onSyncNow,
                  icon: const Icon(Icons.sync),
                  label: const Text('Sync queued updates'),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
