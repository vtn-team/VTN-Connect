# 環境構築

1. Docker Desktopを起動する
2. このフォルダ内で右クリック、「ターミナルで開く」を選択
3. docker-compose up  コマンドを実行
4. http://localhost:8080 にアクセス
5. 「SQL」を選択、vtn-connect.sqlファイルの中身をコピペして実行する
6. cd ..\src
7. composer installを実行する (要composerのインストール)
8. http://localhost にアクセスする
9. Helloと出てきたら成功

おわり

※本番は別途用意する
※DBパスワードはローカル環境の場合はrootで良いと思うが、不安なら.envを開いて都合に応じて書き換えること

