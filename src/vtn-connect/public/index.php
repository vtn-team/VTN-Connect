<?php
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

date_default_timezone_set('Asia/Tokyo');

require __DIR__ . '/../../vendor/autoload.php';
require __DIR__ . '/../config/dbconf.php';

$app = AppFactory::create();
$app->addRoutingMiddleware();
$errorMiddleware = $app->addErrorMiddleware(true, true, true);

function getPDOInstance() {
    static $pdo;
    if( $pdo === null ) {
        $conf = getDBConf();
        $pdo = new PDO('mysql:host=' . $conf['host'] . ';dbname=' . $conf['dbname'] . ';charset=utf8mb4', $conf['user'], $conf['pass']);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    }
    return $pdo;
};

$app->get('/', function (Request $request, Response $response, array $args) {
    $response->getBody()->write("Hello");
    $pdo = getPDOInstance();
    return $response;
});

$app->get('/{name}', function (Request $request, Response $response, array $args) {
    $name = $args['name'];
    $response->getBody()->write("Hello, $name");
    return $response;
});

$app->run();

//ini_set('display_errors', "Off");
//error_reporting(E_ERROR | E_PARSE);

