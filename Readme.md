# 環境構築

## データベース
1. Docker Desktopを起動する
2. Serverフォルダ内で右クリック、「ターミナルで開く」を選択
3. docker-compose up  コマンドを実行
4. http://localhost:8080 にアクセス
5. 「SQL」を選択、vtn-connect.sqlファイルの中身をコピペして実行する

## nodejsサーバ
1. nodejs公式[https://nodejs.org/en]にアクセスし、22.12(LTS)をダウンロード
2. NodeJSServerフォルダ内で右クリック、「ターミナルで開く」を選択
3. npm install コマンドを実行
4. ts\config\config.ts.sample をコピーしts\config\config.ts を作成。それぞれ必要な設定を入力する。
5. run.batを実行 

### サーバコード開発
1. NodeJSServerフォルダ内で右クリック、「ターミナルで開く」を選択
2. npx tsc コマンドを実行 ※コードを修正するたびに実行する事
3. node js/main.js を実行、サーバが起動する。 ※2回目以降は--useCacheをつけるとやや早くなる

## クライアントからローカルサーバを見る
1. Unityフォルダ内をUnityHubから登録し起動する
2. EventTestシーンを開き、EventオブジェクトについているGameAPIをLocalImplementsに変更
3. 再生するとローカルサーバに接続に行く

