import 'package:assetops_mobile/main.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('shows setup screen without Supabase defines', (WidgetTester tester) async {
    await tester.pumpWidget(const AssetOpsMobileApp());

    expect(find.text('Mobile setup required'), findsOneWidget);
  });
}
