# かんじょうにっき - 感情日記アプリ

一般社団法人NAMIDAサポート協会が提唱するテープ式心理学に基づいた、自己肯定感を育てる感情日記アプリです。

## 🌟 主な機能

### ユーザー向け機能
- **感情日記**: ネガティブ・ポジティブ両方の感情を記録・分析
- **無価値感推移**: グラフによる自己肯定感の可視化
- **日記検索**: キーワード・日付・感情での高度な検索
- **SNSシェア**: 成長の記録をシェア（X/Twitterシェア対応）
- **レスポンシブデザイン**: 全デバイス対応
- **カウンセラーコメント**: カウンセラーからのフィードバック表示
- **データバックアップ**: ローカルデータのバックアップと復元

### 管理者向け機能
- **管理画面**: カウンセラー専用の統合管理システム
- **カレンダー検索**: 視覚的な日付検索機能
- **カウンセラーメモ**: 各日記への専門的なメモ機能
- **担当者管理**: ワンクリックでの担当者割り当て
- **緊急度管理**: 3段階の緊急度設定・監視
- **データ管理**: Supabaseとの連携・同期機能

### 新機能（最新実装）
- **自動同期機能**: ローカルデータの自動Supabase同期
- **同意履歴管理**: プライバシーポリシー同意の完全追跡
- **デバイス認証システム**: PIN番号認証、秘密の質問、セキュリティダッシュボード
- **メンテナンスモード**: システム保守時の適切な案内
- **ポジティブ感情対応**: 嬉しい、感謝、達成感、幸せなどのポジティブ感情にも対応
- **ローカルモード**: Supabase接続なしでも動作可能なモード

## 🚀 技術スタック

- **フロントエンド**: React + TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: Supabase (PostgreSQL)
- **認証**: カスタム認証システム
- **デプロイ**: Netlify
- **開発環境**: Vite

## 📦 セットアップ手順

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
`.env.example`を参考に`.env`ファイルを作成：

```env
# Supabase設定
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# ローカルモード設定（オプション）
VITE_LOCAL_MODE=false

# メンテナンスモード設定（オプション）
VITE_MAINTENANCE_MODE=false
VITE_MAINTENANCE_MESSAGE=システムメンテナンス中です
VITE_MAINTENANCE_END_TIME=2025-01-22T10:00:00Z
```

### 3. Supabaseデータベースの設定
`supabase/migrations/`内のSQLファイルを実行してデータベーススキーマを作成

### 4. 開発サーバーの起動
```bash
npm run dev
```

## 🗄️ データベース構成

### 主要テーブル
- **users**: ユーザー情報
- **diary_entries**: 日記エントリー
- **counselors**: カウンセラー情報
- **chat_rooms**: チャットルーム
- **messages**: メッセージ
- **consent_histories**: 同意履歴

## 👥 カウンセラーアカウント

| 名前 | メールアドレス | パスワード |
|------|----------------|------------|
| 心理カウンセラー仁 | jin@namisapo.com | counselor123 |
| 心理カウンセラーAOI | aoi@namisapo.com | counselor123 |
| 心理カウンセラーあさみ | asami@namisapo.com | counselor123 |
| 心理カウンセラーSHU | shu@namisapo.com | counselor123 |
| 心理カウンセラーゆーちゃ | yucha@namisapo.com | counselor123 |
| 心理カウンセラーSammy | sammy@namisapo.com | counselor123 |

## 🔧 新機能の詳細

### 自動同期機能
- アプリ起動時の自動ユーザー作成・確認
- 5分間隔でのローカルデータ自動同期
- 手動同期オプションも利用可能
- エラーハンドリングと状態表示

### 同意履歴管理
- プライバシーポリシー同意の完全追跡
- 法的要件に対応した履歴保存
- CSV出力機能
- 管理画面での一覧・検索機能

### デバイス認証システム
- デバイスフィンガープリント生成・照合
- PIN番号認証（6桁）
- 秘密の質問による復旧機能
- アカウントロック機能（5回失敗で24時間ロック）
- セキュリティイベントログ
- デバイス認証管理画面
- セキュリティダッシュボード

### カウンセラーコメント機能
- カウンセラーメモをユーザーに表示する機能
- カウンセラー名の表示
- 表示/非表示の切り替え
- ユーザー検索画面での表示

### データバックアップ・復元機能
- ローカルデータのJSONバックアップ
- バックアップファイルからの復元
- 端末変更時のデータ移行サポート

### ポジティブ感情対応
- 嬉しい、感謝、達成感、幸せなどのポジティブ感情にも対応
- 感情選択UIの改善（ネガティブ/ポジティブのセクション分け）
- 感情タイプ説明ページの拡充

### ローカルモード
- Supabase接続なしでも動作可能
- 環境変数による簡単な切り替え
- オフライン環境でも利用可能

## 📱 対応環境

- **ブラウザ**: Chrome, Firefox, Safari, Edge (最新版)
- **デバイス**: デスクトップ, タブレット, スマートフォン
- **OS**: Windows, macOS, iOS, Android

## 🚀 デプロイ

### Netlifyデプロイ手順
1. `npm run build`でビルド
2. `dist`フォルダをNetlifyにアップロード
3. 環境変数を設定
4. `netlify.toml`の設定を確認

## 🔒 セキュリティ

- Row Level Security (RLS) による適切なデータアクセス制御
- カウンセラー専用認証システム
- ユーザーデータの適切な保護
- 同意履歴の法的要件対応
- デバイス認証によるセキュリティ強化

## 📄 重要な制約事項

- `pages`ディレクトリ以外は変更しないこと
- Tailwind設定ファイルに手を加えないこと
- 新しい依存パッケージはインストールしないこと
- データベースマイグレーションファイルは変更しないこと

## 🤝 開発者向け情報

### プロジェクト構造
```
src/
├── components/          # 共通コンポーネント
│   ├── AdminPanel.tsx   # 管理画面
│   ├── AutoSyncSettings.tsx # 自動同期設定
│   ├── ConsentHistoryManagement.tsx # 同意履歴管理
│   └── ...
├── pages/               # ページコンポーネント
├── lib/                 # ライブラリ
│   ├── supabase.ts      # Supabase設定
│   └── deviceAuth.ts    # デバイス認証
├── hooks/               # カスタムフック
│   ├── useSupabase.ts   # Supabase連携
│   ├── useAutoSync.ts   # 自動同期
│   └── useMaintenanceStatus.ts # メンテナンス状態
└── ...
```

## 📞 サポート

- **メール**: info@namisapo.com
- **受付時間**: 平日 9:00-17:00

---

**一般社団法人NAMIDAサポート協会**  
テープ式心理学による心の健康サポート