<?php

ini_set('display_errors', 0);
error_reporting(E_ALL);
header('Content-Type: application/json');
session_start();

function responder($sucesso, $dadosOuMensagem, $httpCode = 200) {
    http_response_code($httpCode);
    $resposta = ['sucesso' => $sucesso];
    if ($sucesso) {
        $resposta['dados'] = $dadosOuMensagem;
    } else {
        $resposta['mensagem'] = $dadosOuMensagem;
    }
    echo json_encode($resposta);
    exit;
}

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    responder(false, "Erro interno no servidor: $errstr", 500);
});


try {
    require_once 'conexao.php';

    $input = json_decode(file_get_contents('php://input'));
    $acao = $_POST['acao'] ?? $input->acao ?? $_GET['acao'] ?? '';

    if ($acao == 'registrar') {
        $nome = $input->nome ?? '';
        $email = $input->email ?? '';
        $senha = $input->senha ?? '';

        if (empty($nome) || empty($email) || empty($senha)) {
            responder(false, 'Todos os campos são obrigatórios.', 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            responder(false, 'Formato de e-mail inválido.', 400);
        }

        $stmt = $conexao->prepare("SELECT id FROM usuarios WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        if ($stmt->get_result()->fetch_assoc()) {
            responder(false, 'Este e-mail já está cadastrado.', 409);
        }

        $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
        $stmt = $conexao->prepare("INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $nome, $email, $senhaHash);
        if ($stmt->execute()) {
            responder(true, ['mensagem' => 'Usuário registrado com sucesso!']);
        } else {
            responder(false, 'Erro ao registrar usuário.', 500);
        }
    }
    elseif ($acao == 'resetSenha') {
        $email = $input->email ?? '';
        $novaSenha = $input->novaSenha ?? '';

        if (empty($email) || empty($novaSenha)) {
            responder(false, 'E-mail e nova senha são obrigatórios.', 400);
        }

        $stmt = $conexao->prepare("SELECT id FROM usuarios WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        if (!$stmt->get_result()->fetch_assoc()) {
            responder(false, 'Nenhum usuário encontrado com este e-mail.', 404);
        }

        $senhaHash = password_hash($novaSenha, PASSWORD_DEFAULT);
        $stmt = $conexao->prepare("UPDATE usuarios SET senha = ? WHERE email = ?");
        $stmt->bind_param("ss", $senhaHash, $email);
        if ($stmt->execute()) {
            responder(true, ['mensagem' => 'Senha redefinida com sucesso.']);
        } else {
            responder(false, 'Erro ao redefinir a senha.', 500);
        }
    }

    elseif ($acao == 'getAllData') {
        $resultClientes = $conexao->query("SELECT * FROM clientes ORDER BY nome");
        $clientes = $resultClientes->fetch_all(MYSQLI_ASSOC);

        $resultAgendamentos = $conexao->query("SELECT * FROM agendamentos ORDER BY data_agendamento, hora_agendamento");
        $agendamentos = $resultAgendamentos->fetch_all(MYSQLI_ASSOC);
        
        responder(true, ['clientes' => $clientes, 'agendamentos' => $agendamentos]);
    }
    elseif ($acao == 'agendar') {
        $conexao->begin_transaction();
        try {
            $clientName = $input->clientName ?? '';
            $phone = $input->phone ?? '';
            $service = $input->service ?? '';
            $price = $input->price ?? 0;
            $date = $input->date ?? '';
            $time = $input->time ?? '';

            if (empty($clientName) || empty($phone) || empty($service) || empty($date) || empty($time)) {
                throw new Exception("Preencha todos os campos obrigatórios.");
            }

            $stmt = $conexao->prepare("SELECT id FROM clientes WHERE telefone = ?");
            $stmt->bind_param("s", $phone); $stmt->execute();
            $cliente = $stmt->get_result()->fetch_assoc();
            $cliente_id = null;

            if ($cliente) {
                $cliente_id = $cliente['id'];
            } else {
                $stmt = $conexao->prepare("INSERT INTO clientes (nome, telefone) VALUES (?, ?)");
                $stmt->bind_param("ss", $clientName, $phone); $stmt->execute();
                $cliente_id = $conexao->insert_id;
            }
            
            $stmt = $conexao->prepare("INSERT INTO agendamentos (cliente_id, servico, valor, data_agendamento, hora_agendamento) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("isdss", $cliente_id, $service, $price, $date, $time);
            $stmt->execute();
            $agendamento_id = $conexao->insert_id;

            $conexao->commit();

            $novoCliente = ['id' => $cliente_id, 'nome' => $clientName, 'telefone' => $phone];
            $novoAgendamento = ['id' => $agendamento_id, 'cliente_id' => $cliente_id, 'servico' => $service, 'valor' => $price, 'data_agendamento' => $date, 'hora_agendamento' => $time];

            responder(true, ['mensagem' => 'Agendamento salvo!', 'novoAgendamento' => $novoAgendamento, 'cliente' => $novoCliente]);

        } catch (Exception $e) {
            $conexao->rollback();
            responder(false, $e->getMessage(), 400);
        }
    }
    elseif ($acao == 'excluirAgendamento') {
         $agendamento_id = $input->agendamento_id ?? 0;
         if(empty($agendamento_id)) responder(false, "ID do agendamento não fornecido.", 400);

         $stmt = $conexao->prepare("DELETE FROM agendamentos WHERE id = ?");
         $stmt->bind_param("i", $agendamento_id);
         if($stmt->execute() && $stmt->affected_rows > 0) {
             responder(true, ['mensagem' => 'Agendamento excluído.']);
         } else {
             responder(false, "Agendamento não encontrado.", 404);
         }
    }
    elseif ($acao == 'getRelatorios') {
        $hoje = date('Y-m-d');
        $inicioSemana = date('Y-m-d', strtotime('-6 days'));
        $inicioMes = date('Y-m-01');

        $stmt = $conexao->prepare("SELECT COUNT(*) as total_agendamentos, SUM(valor) as faturamento_previsto FROM agendamentos WHERE data_agendamento = ?");
        $stmt->bind_param("s", $hoje); $stmt->execute();
        $relatorioHoje = $stmt->get_result()->fetch_assoc();

        $stmt = $conexao->prepare("SELECT COUNT(*) as total_agendamentos, SUM(valor) as faturamento_previsto FROM agendamentos WHERE data_agendamento BETWEEN ? AND ?");
        $stmt->bind_param("ss", $inicioSemana, $hoje); $stmt->execute();
        $relatorioSemana = $stmt->get_result()->fetch_assoc();

        $stmt = $conexao->prepare("SELECT COUNT(*) as total_agendamentos, SUM(valor) as faturamento_previsto FROM agendamentos WHERE data_agendamento >= ?");
        $stmt->bind_param("s", $inicioMes); $stmt->execute();
        $relatorioMes = $stmt->get_result()->fetch_assoc();

        $stmt = $conexao->prepare("SELECT data_agendamento as dia, SUM(valor) as faturamento FROM agendamentos WHERE data_agendamento BETWEEN ? AND ? GROUP BY data_agendamento ORDER BY data_agendamento");
        $stmt->bind_param("ss", $inicioSemana, $hoje); $stmt->execute();
        $grafico = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        responder(true, ['hoje' => $relatorioHoje, 'semana' => $relatorioSemana, 'mes' => $relatorioMes, 'grafico' => $grafico]);
    }
     
    elseif ($acao == 'getHorarios') {
        $data = $_GET['data'] ?? '';
        if (empty($data)) {
            responder(false, "A data não foi fornecida.", 400);
        }
        $stmt = $conexao->prepare("SELECT hora_agendamento FROM agendamentos WHERE data_agendamento = ?");
        $stmt->bind_param("s", $data);
        $stmt->execute();
        $result = $stmt->get_result();
        $horarios = [];
        while($row = $result->fetch_assoc()) {
            $horarios[] = substr($row['hora_agendamento'], 0, 5);
        }
        responder(true, ['horarios' => $horarios]);
    }
    else {
        responder(false, 'Ação não encontrada.', 404);
    }
    
    $conexao->close();

} catch (Throwable $e) {
    responder(false, "Erro crítico no servidor: " . $e->getMessage(), 500);
}
?>
