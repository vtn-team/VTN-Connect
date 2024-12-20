const host = 'localhost';
const user = process.env.DB_USER;
const password = process.env.DB_PWD;
const database = "vtn-game-sample";

const Importer = require('mysql-import');
const importer = new Importer({host, user, password, database});

importer.onProgress(function(progress: any) {
  var percent = Math.floor(progress.bytes_processed / progress.total_bytes * 10000) / 100;
  console.log(`${percent}% Completed`);
});

if(process.argv[2] != "")
{
  importer.import(process.argv[2]).then(()=>{
    var files_imported = importer.getImported();
    console.log(`${files_imported.length} SQL file(s) imported.`);
  }).catch(function(err: any) {
    console.error(err);
  });
}
