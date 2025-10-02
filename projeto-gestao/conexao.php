<?php
$servidor = "localhost";
$usuario = "root";
$senha = "";
$banco = "barbearia_db";

$conexao = new mysqli($servidor, $usuario, $senha, $banco);

if ($conexao->connect_error) {
    http_response_code(500);
    die(json_encode(['sucesso' => false, 'mensagem' => 'Falha na conexão com o banco de dados.']));
}

$conexao->set_charset("utf8");
