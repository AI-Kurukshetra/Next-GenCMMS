import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key, required this.onCodeScanned});

  final void Function(String code) onCodeScanned;

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  bool _didScan = false;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        MobileScanner(
          onDetect: (capture) {
            if (_didScan) return;
            final code = capture.barcodes.first.rawValue;
            if (code == null || code.isEmpty) return;
            _didScan = true;
            widget.onCodeScanned(code);
          },
        ),
        Align(
          alignment: Alignment.topCenter,
          child: Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.65),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Text(
              'Scan QR / Barcode to open asset or work order',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
            ),
          ),
        ),
        Align(
          alignment: Alignment.bottomCenter,
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: FilledButton.icon(
              onPressed: () => setState(() => _didScan = false),
              icon: const Icon(Icons.refresh),
              label: const Text('Scan again'),
            ),
          ),
        ),
      ],
    );
  }
}
