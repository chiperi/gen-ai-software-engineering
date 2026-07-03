// Widget + unit tests for the Flutter Web banking client.
//
// NOTE: lib/main.dart imports `dart:html` (used for the CSV download), so these
// tests must run on the web platform:
//
//     flutter test --platform chrome
//
// They require the Flutter SDK, which is not installed in the CI sandbox used to
// author them; run locally to execute.
@TestOn('browser')
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:banking_flutter/main.dart';

void main() {
  group('ApiResult', () {
    test('ok is true only for 2xx statuses', () {
      expect(ApiResult(200, null).ok, isTrue);
      expect(ApiResult(201, null).ok, isTrue);
      expect(ApiResult(299, null).ok, isTrue);
      expect(ApiResult(400, null).ok, isFalse);
      expect(ApiResult(404, null).ok, isFalse);
      expect(ApiResult(500, null).ok, isFalse);
    });
  });

  group('App shell', () {
    testWidgets('renders the title, API-status chip and the three nav destinations',
        (tester) async {
      await tester.pumpWidget(const BankingApp());
      await tester.pump(); // let initState/_pingHealth kick off

      expect(find.text('Banking Transactions'), findsWidgets);
      // With no backend reachable the chip settles on "API offline".
      expect(find.textContaining('API'), findsWidgets);

      expect(find.text('Transactions'), findsWidgets);
      expect(find.text('New'), findsOneWidget);
      expect(find.text('Accounts'), findsOneWidget);
    });

    testWidgets('navigates to the New transaction form and shows its fields',
        (tester) async {
      await tester.pumpWidget(const BankingApp());
      await tester.pump();

      await tester.tap(find.text('New'));
      await tester.pumpAndSettle();

      expect(find.text('New transaction'), findsWidgets);
      expect(find.widgetWithText(TextField, 'From account'), findsOneWidget);
      expect(find.widgetWithText(TextField, 'To account'), findsOneWidget);
      expect(find.widgetWithText(TextField, 'Amount'), findsOneWidget);
      expect(find.text('Create transaction'), findsOneWidget);
    });

    testWidgets('Account tools view exposes balance, summary and interest cards',
        (tester) async {
      await tester.pumpWidget(const BankingApp());
      await tester.pump();

      await tester.tap(find.text('Accounts'));
      await tester.pumpAndSettle();

      expect(find.text('Balance'), findsOneWidget);
      expect(find.text('Summary'), findsOneWidget);
      expect(find.text('Simple interest'), findsOneWidget);
      expect(find.text('Get balance'), findsOneWidget);
      expect(find.text('Calculate'), findsOneWidget);
    });
  });
}
